/* ==================================================
   ACTIVITY BASE
   Shared by every activity prototype (drag-drop-activity.js,
   text-response-activity.js, item-match.js, ...). Pair with
   activity-sections.js, which watches data-activity-complete
   to decide when a section's Next button appears.

   Markup contract:

     <div id="myActivity" data-activity
          data-activity-depends-on="otherActivityId">
       ...
       <button data-reset-trigger>Start over</button>
     </div>

   - data-activity marks the root of one activity.
   - data-activity-depends-on names another activity's id;
     this activity is unavailable (.activity-unavailable,
     [inert]) until that one reports isComplete() === true.
     Leave it out for an activity that's available from the
     start.
   - data-activity-complete="true"/"false" is stamped on the
     root by setComplete() and is what a section watches.
   - [data-reset-trigger] buttons inside the root are wired
     automatically to call reset().

   Subclasses call Activity.call(this, root, options) first,
   finish their own setup, then call this.setComplete(...) once
   they can compute it. They call this.setComplete(...) again
   any time completeness changes.
   ================================================== */

(function (global) {
  "use strict";

  var registry = {};

  function Activity(root, options) {
    if (!root) throw new Error("Activity: root element is required.");
    if (!root.hasAttribute("data-activity")) {
      console.warn("Activity: root is missing the data-activity attribute.", root);
    }

    this.root = root;
    this.options = options || {};
    this.id = root.id || null;

    if (this.id) registry[this.id] = this;

    this._bindResetButtons();
    this._initAvailability();
  }

  /* ---------- availability ---------- */

  Activity.prototype._initAvailability = function () {
    var self = this;
    var dependsOn = this.root.dataset.activityDependsOn;

    if (!dependsOn) {
      this.setAvailable(true);
      return;
    }

    function recheck() {
      var dependency = registry[dependsOn];
      var available = Boolean(dependency && dependency.isComplete());

      self.setAvailable(available);

      // Reset the dependent activity when its prerequisite is reset
      if (!available && self.isComplete()) {
        self.reset();
      }
    }

    document.addEventListener("activity:change", recheck);
    recheck();
  };

  Activity.prototype.setAvailable = function (isAvailable) {
    this.root.classList.toggle("activity-unavailable", !isAvailable);
    this.root.toggleAttribute("inert", !isAvailable);

    if (this.root.hasAttribute("data-activity-depends-on")) {
      this.root.hidden = !isAvailable;
    }
  };

  Activity.prototype.isAvailable = function () {
    return !this.root.classList.contains("activity-unavailable");
  };

  /* ---------- completion ---------- */

  Activity.prototype.setComplete = function (isComplete) {
    this.root.dataset.activityComplete = isComplete ? "true" : "false";

    var detail = { id: this.id, complete: Boolean(isComplete) };
    this.root.dispatchEvent(new CustomEvent("activity:change", { bubbles: true, detail: detail }));
    document.dispatchEvent(new CustomEvent("activity:change", { detail: detail }));
  };

  Activity.prototype.isComplete = function () {
    return this.root.dataset.activityComplete === "true";
  };

  /* ---------- reset ---------- */

  Activity.prototype._bindResetButtons = function () {
    var self = this;
    Array.prototype.forEach.call(this.root.querySelectorAll("[data-reset-trigger]"), function (button) {
      button.addEventListener("click", function () { self.reset(); });
    });
  };

  /* Default reset: clear every [data-reset] element inside the root (see
     resetField below), then mark the activity incomplete. Prototypes whose
     own API already has a natural "put everything back" operation (e.g.
     DragDropActivity returning items to the tray) override this instead. */
  Activity.prototype.reset = function () {
    Activity.resetFieldsIn(this.root);
    this.setComplete(false);
  };

  Activity.resetFieldsIn = function (scope) {
    Array.prototype.forEach.call(scope.querySelectorAll("[data-reset]"), Activity.resetField);
  };

  /* How a single data-reset element is cleared, based on what kind of
     element it is. Add data-reset-list to a container whose entire content
     an activity builds up (an answer list) to have it emptied outright. */
  Activity.resetField = function (element) {
    if (element.matches("input, textarea")) {
      element.value = "";
      element.hidden = false;
      element.disabled = false;
      element.style.display = "";
      return;
    }

    if (element.hasAttribute("data-reset-list")) {
      element.innerHTML = "";
      return;
    }

    element.classList.remove("filled", "placed", "visible", "selected", "correct", "incorrect");
  };

  global.Activity = Activity;
})(window);
