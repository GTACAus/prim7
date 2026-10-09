/* ==================================================
   GENERIC ITEM MATCH ACTIVITY
   Pair with styles/lesson5_styles/drag_and_drop.css (.item-match-* rules)

   Shows one item at a time (its reference image) and asks the learner to
   pick the matching option from a fixed set of buttons.

   Markup contract (everything is found by data attribute, so the layout
   around it is entirely up to the page):

     <div id="myActivity">
       <div data-im-reference>                       <!-- optional, for layout/captions only -->
         <span data-im-round-label></span>            <!-- optional, filled with "1 of 3" -->
         <span data-im-item-label></span>              <!-- optional, filled with the round's label -->
         <img data-im-image alt="" hidden>             <!-- shown once the current round has an image -->
         <div data-im-placeholder hidden>
           <span data-im-placeholder-text></span>
         </div>
       </div>
       <div data-im-options>
         <button data-im-option data-im-value="jug">...any content...</button>
         <button data-im-option data-im-value="bottle">...any content...</button>
       </div>
     </div>

   Usage:

     const activity = new ItemMatchActivity(document.getElementById("myActivity"), {
       items: [
         { id: "jug", label: "Jug", image: "../images/jug.png", alt: "Jug" },
         { id: "bottle", label: "Bottle", image: "../images/bottle.png" }
       ],
       sequenceLength: 3,    // how many rounds to play; defaults to items.length
       randomise: true,      // true = a random subset in random order each play-through
                              // false = items in the order given, up to sequenceLength
       onChange: function(state) { ... },   // state = { index, total, currentId, complete, roundIds }
       onComplete: function() { ... }
     });

   API:
     activity.getState()        -> { index, total, currentId, complete, roundIds }
     activity.isComplete()      -> every round has been matched correctly
     activity.check(itemId)     -> true/false; advances to the next round on a correct match
     activity.reset()           -> re-rolls (if randomise) and restarts from round 1
     activity.restore(state)    -> resume a saved { rounds: [ids], index } without re-rolling
     root event "im:change"     -> same as onChange (detail.state)
     root event "im:complete"   -> fired once, when the final round is matched

   Interaction: click/tap the option that matches the item currently shown. A
   correct match marks the button .correct and moves on after a short delay;
   an incorrect one flashes .incorrect and the round stays the same.
   ================================================== */

(function (global) {
  "use strict";

  var ADVANCE_DELAY = 450; /* ms before the next round replaces a correct match */
  var INCORRECT_FLASH = 600; /* ms the .incorrect flash stays on a wrong click */

  function ItemMatchActivity(root, options) {
    if (!root) throw new Error("ItemMatchActivity: root element is required.");

    this.root = root;
    this.options = options || {};
    this.items = this.options.items || [];
    this.randomise = Boolean(this.options.randomise);
    this.sequenceLength = this.options.sequenceLength || this.items.length;

    this.referenceImage = root.querySelector("[data-im-image]");
    this.placeholder = root.querySelector("[data-im-placeholder]");
    this.placeholderText = root.querySelector("[data-im-placeholder-text]");
    this.roundLabel = root.querySelector("[data-im-round-label]");
    this.itemLabel = root.querySelector("[data-im-item-label]");
    this.buttons = Array.prototype.slice.call(root.querySelectorAll("[data-im-option]"));

    this.rounds = [];
    this.index = 0;
    this.completed = false;

    var self = this;
    this.buttons.forEach(function (button) {
      button.addEventListener("click", function () { self._onOptionClick(button); });
    });

    /* Picks an initial round order and renders it, but doesn't fire onChange: the
       caller may immediately follow construction with restore() to resume saved
       progress instead, and that shouldn't race against a save of this throwaway pick. */
    this.rounds = this._pickRounds();
    this.index = 0;
    this.completed = false;
    this._render();
  }

  /* ---------- public API ---------- */

  ItemMatchActivity.prototype.getState = function () {
    return {
      index: this.index,
      total: this.rounds.length,
      currentId: this.rounds[this.index] ? this.rounds[this.index].id : null,
      complete: this.isComplete(),
      roundIds: this.rounds.map(function (item) { return item.id; })
    };
  };

  ItemMatchActivity.prototype.isComplete = function () {
    return this.rounds.length > 0 && this.index >= this.rounds.length;
  };

  ItemMatchActivity.prototype.reset = function () {
    this.rounds = this._pickRounds();
    this.index = 0;
    this.completed = false;
    this._render();
    this._changed();
  };

  /* Resumes a previously saved { rounds: [itemId...], index } instead of re-rolling. */
  ItemMatchActivity.prototype.restore = function (state) {
    state = state || {};
    var self = this;
    var savedIds = Array.isArray(state.rounds) ? state.rounds : null;
    var resolved = savedIds && savedIds.length === this.sequenceLength
      ? savedIds.map(function (id) { return self._itemById(id); })
      : null;

    this.rounds = resolved && resolved.every(Boolean) ? resolved : this._pickRounds();
    this.index = Math.min(Math.max(state.index || 0, 0), this.rounds.length);
    this.completed = this.isComplete();
    this._render();
    this._changed();
  };

  /* Checks itemId against the current round's answer and advances on a match. */
  ItemMatchActivity.prototype.check = function (itemId) {
    if (this.isComplete()) return false;

    var correct = this.rounds[this.index].id === itemId;
    if (correct) {
      this.index += 1;
      this._render();
      this._changed();
      if (this.isComplete() && !this.completed) {
        this.completed = true;
        this._fireComplete();
      }
    }
    return correct;
  };

  /* ---------- internals ---------- */

  /* Sets the hidden attribute and an inline display override together, so visibility
     doesn't depend on a page's own CSS never giving these elements a `display`. */
  function setHidden(element, hidden) {
    if (!element) return;
    element.hidden = hidden;
    element.style.display = hidden ? "none" : "";
  }

  ItemMatchActivity.prototype._itemById = function (id) {
    var items = this.items;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  };

  ItemMatchActivity.prototype._pickRounds = function () {
    var pool = this.items.slice();
    var length = Math.min(this.sequenceLength, pool.length);

    if (!this.randomise) return pool.slice(0, length);

    var rounds = [];
    while (rounds.length < length && pool.length) {
      var index = Math.floor(Math.random() * pool.length);
      rounds.push(pool.splice(index, 1)[0]);
    }
    return rounds;
  };

  ItemMatchActivity.prototype._onOptionClick = function (button) {
    if (this.isComplete()) return;

    if (this.check(button.dataset.imValue)) {
      button.classList.remove("incorrect");
      button.classList.add("correct");
      window.setTimeout(function () { button.classList.remove("correct"); }, ADVANCE_DELAY);
    } else {
      button.classList.remove("incorrect");
      void button.offsetWidth; /* restarts the shake animation on repeated wrong clicks */
      button.classList.add("incorrect");
      window.setTimeout(function () { button.classList.remove("incorrect"); }, INCORRECT_FLASH);
      if (typeof this.options.onIncorrect === "function") this.options.onIncorrect(button.dataset.imValue);
    }
  };

  ItemMatchActivity.prototype._render = function () {
    var self = this;
    var complete = this.isComplete();

    this.buttons.forEach(function (button) {
      button.classList.remove("correct", "incorrect");
      button.disabled = complete;
    });

    if (complete) {
      if (this.roundLabel) this.roundLabel.textContent = this.rounds.length + " of " + this.rounds.length + " · complete";
      if (this.itemLabel) this.itemLabel.textContent = this.options.completeLabel || "All matched";
      setHidden(this.referenceImage, true);
      if (this.placeholder) {
        setHidden(this.placeholder, false);
        if (this.placeholderText) this.placeholderText.textContent = this.options.completeMessage || "All items matched. Press CHECK to continue.";
      }
      return;
    }

    var round = this.rounds[this.index];
    var label = round.label || round.id;

    if (this.roundLabel) this.roundLabel.textContent = (this.index + 1) + " of " + this.rounds.length;
    if (this.itemLabel) this.itemLabel.textContent = label;

    var src = round.image || (typeof this.options.getImageSrc === "function" ? this.options.getImageSrc(round) : null);

    if (!this.referenceImage) return;

    if (!src) {
      setHidden(this.referenceImage, true);
      setHidden(this.placeholder, false);
      return;
    }

    var img = this.referenceImage;
    var placeholder = this.placeholder;
    var placeholderText = this.placeholderText;

    setHidden(img, true);
    img.alt = round.alt || label;

    img.onload = function () {
      setHidden(img, false);
      setHidden(placeholder, true);
    };
    img.onerror = function () {
      setHidden(img, true);
      if (placeholder) {
        setHidden(placeholder, false);
        if (placeholderText) placeholderText.textContent = "Unable to load image of " + label.toLowerCase();
      }
    };
    img.src = src;
  };

  ItemMatchActivity.prototype._changed = function () {
    var state = this.getState();
    if (typeof this.options.onChange === "function") this.options.onChange(state);
    this.root.dispatchEvent(new CustomEvent("im:change", { detail: { state: state }, bubbles: true }));
  };

  ItemMatchActivity.prototype._fireComplete = function () {
    if (typeof this.options.onComplete === "function") this.options.onComplete();
    this.root.dispatchEvent(new CustomEvent("im:complete", { bubbles: true }));
  };

  global.ItemMatchActivity = ItemMatchActivity;
})(window);
