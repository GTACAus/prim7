/* ==================================================
   GENERIC DRAG AND DROP ACTIVITY
   Pair with styles/lesson5_styles/drag_and_drop.css

   Markup contract (everything is found by data attribute, so the layout
   around it is entirely up to the page):

     <div id="myActivity">
       <div data-dd-slot="slot-a" data-dd-answer="beaker"></div>   <!-- drop target; data-dd-answer is optional -->
       <div data-dd-slot="slot-b"></div>
       <div data-dd-tray>                                           <!-- where unplaced items live -->
         <div data-dd-item="beaker">...any content...</div>
         <div data-dd-item="flask">...any content...</div>
       </div>
     </div>

   Usage:

     const activity = new DragDropActivity(document.getElementById("myActivity"), {
       onChange: function(placements) { ... }   // placements = { slotId: itemId }
     });

   API:
     activity.getPlacements()      -> { slotId: itemId }
     activity.setPlacements(map)   -> restore a saved layout
     activity.reset()              -> return every item to the tray
     activity.isComplete()         -> every slot is filled
     activity.isCorrect()          -> every slot that has data-dd-answer holds that item
     root event "dd:change"        -> same as onChange (detail.placements)

   Interaction: drag with mouse/touch/pen (pointer events), or click/tap an
   item then click/tap a slot, or use the keyboard (Enter/Space to pick up
   an item and again on a slot to drop it, Delete/Backspace to send a placed
   item back to the tray). Dropping on an occupied slot swaps the items;
   dropping anywhere else returns the item to the tray.
   ================================================== */

(function (global) {
  "use strict";

  var DRAG_THRESHOLD = 5; /* px of movement before a press becomes a drag */

  function DragDropActivity(root, options) {
    if (!root) throw new Error("DragDropActivity: root element is required.");

    this.root = root;
    this.options = options || {};
    this.tray = root.querySelector("[data-dd-tray]");
    this.slots = Array.prototype.slice.call(root.querySelectorAll("[data-dd-slot]"));
    this.items = {};
    this.selectedItem = null;
    this.drag = null;

    var self = this;

    Array.prototype.forEach.call(root.querySelectorAll("[data-dd-item]"), function (item) {
      self.items[item.dataset.ddItem] = item;
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-pressed", "false");
      item.addEventListener("pointerdown", function (event) { self._onPointerDown(event, item); });
      item.addEventListener("keydown", function (event) { self._onItemKey(event, item); });
    });

    this.slots.forEach(function (slot) {
      slot.tabIndex = 0;
      slot.addEventListener("click", function () { self._onSlotActivate(slot); });
      slot.addEventListener("keydown", function (event) {
        if (event.target !== slot) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          self._onSlotActivate(slot);
        }
      });
    });
  }

  /* ---------- public API ---------- */

  DragDropActivity.prototype.getPlacements = function () {
    var result = {};
    this.slots.forEach(function (slot) {
      var item = slot.querySelector("[data-dd-item]");
      if (item) result[slot.dataset.ddSlot] = item.dataset.ddItem;
    });
    return result;
  };

  DragDropActivity.prototype.setPlacements = function (placements) {
    var self = this;
    this._returnAllToTray();
    Object.keys(placements || {}).forEach(function (slotId) {
      var slot = self._slotById(slotId);
      var item = self.items[placements[slotId]];
      if (slot && item && !self._itemIn(slot)) self._put(item, slot);
    });
    this._clearSelection();
  };

  DragDropActivity.prototype.reset = function () {
    this._returnAllToTray();
    this._clearSelection();
    this._changed();
  };

  DragDropActivity.prototype.isComplete = function () {
    var self = this;
    return this.slots.every(function (slot) { return Boolean(self._itemIn(slot)); });
  };

  DragDropActivity.prototype.isCorrect = function () {
    var self = this;
    return this.slots.every(function (slot) {
      var answer = slot.dataset.ddAnswer;
      if (!answer) return true;
      var item = self._itemIn(slot);
      return Boolean(item) && item.dataset.ddItem === answer;
    });
  };

  /* ---------- internals ---------- */

  DragDropActivity.prototype._slotById = function (id) {
    return this.slots.filter(function (slot) { return slot.dataset.ddSlot === id; })[0] || null;
  };

  DragDropActivity.prototype._itemIn = function (slot) {
    return slot.querySelector("[data-dd-item]");
  };

  DragDropActivity.prototype._slotOf = function (item) {
    var parent = item.parentElement;
    return parent && parent.hasAttribute("data-dd-slot") ? parent : null;
  };

  DragDropActivity.prototype._put = function (item, slot) {
    (slot || this.tray).appendChild(item);
    item.classList.toggle("dd-placed", Boolean(slot));
    if (slot) slot.classList.add("dd-filled");
    this.slots.forEach(function (s) {
      if (!s.querySelector("[data-dd-item]")) s.classList.remove("dd-filled");
    });
  };

  DragDropActivity.prototype._returnAllToTray = function () {
    var self = this;
    Object.keys(this.items).forEach(function (id) { self._put(self.items[id], null); });
  };

  /* Place item in slot (null = tray). An occupied target swaps with the item's old slot, or sends the occupant to the tray. */
  DragDropActivity.prototype._place = function (item, slot) {
    var previousSlot = this._slotOf(item);
    if (slot === previousSlot) return;

    var occupant = slot ? this._itemIn(slot) : null;
    if (occupant) this._put(occupant, previousSlot);
    this._put(item, slot);
    this._changed();
  };

  DragDropActivity.prototype._changed = function () {
    var placements = this.getPlacements();
    if (typeof this.options.onChange === "function") this.options.onChange(placements);
    this.root.dispatchEvent(new CustomEvent("dd:change", { detail: { placements: placements }, bubbles: true }));
  };

  /* ----- click / keyboard pick-up-and-drop ----- */

  DragDropActivity.prototype._select = function (item) {
    this._clearSelection();
    this.selectedItem = item;
    item.classList.add("dd-selected");
    item.setAttribute("aria-pressed", "true");
    this.root.classList.add("dd-has-selection");
  };

  DragDropActivity.prototype._clearSelection = function () {
    if (this.selectedItem) {
      this.selectedItem.classList.remove("dd-selected");
      this.selectedItem.setAttribute("aria-pressed", "false");
    }
    this.selectedItem = null;
    this.root.classList.remove("dd-has-selection");
  };

  DragDropActivity.prototype._toggleSelect = function (item) {
    if (this.selectedItem === item) this._clearSelection();
    else this._select(item);
  };

  DragDropActivity.prototype._onSlotActivate = function (slot) {
    if (!this.selectedItem) return;
    var item = this.selectedItem;
    this._clearSelection();
    this._place(item, slot);
  };

  DragDropActivity.prototype._onItemKey = function (event, item) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this._toggleSelect(item);
    } else if ((event.key === "Delete" || event.key === "Backspace") && this._slotOf(item)) {
      event.preventDefault();
      this._clearSelection();
      this._place(item, null);
    } else if (event.key === "Escape") {
      this._clearSelection();
    }
  };

  /* ----- pointer dragging ----- */

  DragDropActivity.prototype._onPointerDown = function (event, item) {
    if (event.button !== undefined && event.button !== 0) return;
    if (this.drag) return;

    var rect = item.getBoundingClientRect();
    this.drag = {
      item: item,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      moved: false,
      ghost: null,
      hoverSlot: null
    };

    var self = this;
    this._move = function (e) { self._onPointerMove(e); };
    this._up = function (e) { self._onPointerUp(e); };
    document.addEventListener("pointermove", this._move);
    document.addEventListener("pointerup", this._up);
    document.addEventListener("pointercancel", this._up);
  };

  DragDropActivity.prototype._onPointerMove = function (event) {
    var drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;

    if (!drag.moved) {
      if (Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) < DRAG_THRESHOLD) return;
      drag.moved = true;
      this._clearSelection();
      this._startGhost(drag);
    }

    event.preventDefault();
    drag.ghost.style.left = (event.clientX - drag.offsetX) + "px";
    drag.ghost.style.top = (event.clientY - drag.offsetY) + "px";
    this._setHoverSlot(this._slotAt(event.clientX, event.clientY));
  };

  DragDropActivity.prototype._onPointerUp = function (event) {
    var drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;

    document.removeEventListener("pointermove", this._move);
    document.removeEventListener("pointerup", this._up);
    document.removeEventListener("pointercancel", this._up);
    this.drag = null;

    if (!drag.moved) {
      this._toggleSelect(drag.item); /* plain click / tap */
      return;
    }

    var cancelled = event.type === "pointercancel";
    var target = cancelled ? null : this._slotAt(event.clientX, event.clientY);

    drag.ghost.remove();
    drag.item.classList.remove("dd-dragging");
    this.root.classList.remove("dd-is-dragging");
    this._setHoverSlot(null, drag);

    this._place(drag.item, target);
  };

  DragDropActivity.prototype._startGhost = function (drag) {
    var ghost = drag.item.cloneNode(true);
    ghost.removeAttribute("tabindex"); /* keeps data-dd-item so item styling applies; it lives on <body>, outside the root, so lookups never see it */
    ghost.classList.remove("dd-selected", "dd-placed");
    ghost.classList.add("dd-ghost");
    ghost.style.width = drag.width + "px";
    ghost.style.height = drag.height + "px";
    document.body.appendChild(ghost);

    drag.ghost = ghost;
    drag.item.classList.add("dd-dragging");
    this.root.classList.add("dd-is-dragging");
  };

  /* Slot under the pointer (the ghost has pointer-events: none so it never blocks this). */
  DragDropActivity.prototype._slotAt = function (x, y) {
    var el = document.elementFromPoint(x, y);
    var slot = el && el.closest("[data-dd-slot]");
    return slot && this.root.contains(slot) ? slot : null;
  };

  DragDropActivity.prototype._setHoverSlot = function (slot, dragOverride) {
    var drag = dragOverride || this.drag;
    if (!drag || drag.hoverSlot === slot) return;
    if (drag.hoverSlot) drag.hoverSlot.classList.remove("dd-hover");
    if (slot) slot.classList.add("dd-hover");
    drag.hoverSlot = slot;
  };

  global.DragDropActivity = DragDropActivity;
})(window);
