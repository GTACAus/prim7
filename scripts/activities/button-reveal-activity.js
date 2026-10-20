/* ==================================================
   BUTTON REVEAL
   The simplest activity: press a button, something appears (an answer,
   another section, anything) and optionally something else happens too.
   Covers the "stop and check" pattern (and similar "click to reveal")
   generically. Pair with activity-base.js.

   Markup contract:

     <div id="myCheck" data-activity>
       <p>Why does X happen?</p>

       <div data-button-reveal hidden>
         Because of Y.
       </div>

       <button type="button" data-button-trigger>
         Check Your Answer
       </button>
     </div>

   Usage:

     const activity = new ButtonActivity(document.getElementById("myCheck"), {
       hideTrigger: true,     // optional, default true - see below
       onPress: function() { ... }   // do anything else the page needs
     });

   Pressing the trigger reveals every [data-button-reveal] element inside
   the root (clears their hidden attribute), then calls onPress and fires
   "button:press" on the root (bubbles) - use either to do more than the
   built-in reveal, e.g. open a popup or update something elsewhere on the
   page. A section's Next button needs nothing extra: once this activity
   reports data-activity-complete, activity-sections.js shows it on its own.

   options.hideTrigger: true (default) hides the button itself once
   pressed, matching a one-shot "check my answer" button. Pass false to
   leave it visible/clickable (e.g. a button that can be pressed again).

   The activity is data-activity-complete as soon as it's been pressed
   once. A [data-reset-trigger] button inside the root - or calling
   reset() directly - hides the revealed content and brings the trigger
   back.
   ================================================== */

(function (global) {
  "use strict";

  function ButtonActivity(root, options) {
    Activity.call(this, root, options);

    this.hideTrigger = this.options.hideTrigger !== false;
    this.trigger = root.querySelector("[data-button-trigger]");
    this.targets = root.querySelectorAll("[data-button-reveal]");

    var self = this;
    if (this.trigger) {
      this.trigger.addEventListener("click", function () { self._press(); });
    }

    this.setComplete(false);
  }

  ButtonActivity.prototype = Object.create(Activity.prototype);
  ButtonActivity.prototype.constructor = ButtonActivity;

  /* ---------- public API ---------- */

  ButtonActivity.prototype.reset = function () {
    Array.prototype.forEach.call(this.targets, function (target) { target.hidden = true; });
    if (this.trigger) this.trigger.hidden = false;
    this.setComplete(false);
  };

  /* ---------- internals ---------- */

  ButtonActivity.prototype._press = function () {
    Array.prototype.forEach.call(this.targets, function (target) { target.hidden = false; });
    if (this.hideTrigger && this.trigger) this.trigger.hidden = true;

    if (typeof this.options.onPress === "function") this.options.onPress();
    this.root.dispatchEvent(new CustomEvent("button:press", { bubbles: true }));

    this.setComplete(true);
  };

  global.ButtonActivity = ButtonActivity;

  // Initialise all stop and checks
  function initialiseStopAndCheckActivities() {
    Array.prototype.forEach.call(document.querySelectorAll(".stop-and-check[data-activity]"), function(root) {
      new ButtonActivity(root);
    });
    console.log("Stop and Checks Loaded");
  }

  document.addEventListener("DOMContentLoaded", function() {
    initialiseStopAndCheckActivities();
  });
})(window);
