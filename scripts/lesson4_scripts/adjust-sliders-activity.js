/* ==================================================
   ADJUST SLIDERS (lesson 4)
   Range sliders the student sets to match target values (the averages in a
   table), then checks. Used for building the Part C and Part D bar graphs.
   Pair with scripts/activities/activity-base.js.

   Markup contract (one set of sliders):

     <div id="partCSliders" data-activity>
       <div data-slider-row data-slider-target="1">
         <label for="s0">Leadbeater's Possum</label>
         <input id="s0" type="range" min="0" max="10" step="1" value="0" data-slider />
         <output for="s0"></output>                 <!-- optional: shows the value -->
       </div>
       ... more rows ...
       <button type="button" data-slider-check>Check my bars</button>
     </div>

   Several sets of the same sliders (each row has a target per set) - the
   sliders show one set at a time and keep every set's values:

     <div id="partDSliders" data-activity>
       <button type="button" data-slider-set="site1">Site 1</button>
       <button type="button" data-slider-set="site2">Site 2</button>

       <div data-slider-row data-slider-target-site1="6" data-slider-target-site2="1">...</div>
       ...
       <button type="button" data-slider-check>Check both sites</button>
     </div>

   Usage:

     const sliders = new AdjustSlidersActivity(document.getElementById("partDSliders"), {
       sets: ["site1", "site2"]   // omit for a single set (named "default")
     });

   The page reacts through bubbling events on the root:

     "sliders:input"     detail = { set, index, value }       a slider moved
     "sliders:check"     detail = { results, allCorrect, firstWrong }
                           results    = { setName: [true | false | null, ...] }
                           firstWrong = { set, index } or null
     "sliders:setchange" detail = { set }                     another set is now shown

   Pressing [data-slider-check] compares every slider in every set with its
   target. Rows of the shown set get "correct-bar" / "needs-fix"; set buttons
   get "needs-fix" while one of their sliders is wrong and "site-complete"
   once all are right. If anything is wrong the first wrong set is shown.
   Moving a slider clears that slider's checked result.

   The activity is data-activity-complete once the last check found every
   slider in every set correct (and no slider has moved since).

   API: getValues(set), getSet(), setActiveSet(name), check(). reset() puts
   every slider back to its starting value and shows the first set again.
   ================================================== */

import { Activity } from "../activities/activity-base.js";

var DEFAULT_SET = "default";

function AdjustSlidersActivity(root, options) {
  Activity.call(this, root, options);

  var self = this;
  this.sets = (this.options.sets && this.options.sets.length) ? this.options.sets.slice() : [DEFAULT_SET];
  this.rows = Array.prototype.slice.call(root.querySelectorAll("[data-slider-row]"));
  this.inputs = this.rows.map(function (row) { return row.querySelector("[data-slider]"); });
  this.setButtons = Array.prototype.slice.call(root.querySelectorAll("[data-slider-set]"));
  this.initialValues = this.inputs.map(function (input) { return Number(input.defaultValue) || 0; });

  this.activeSet = this.sets[0];
  this.values = {};
  this.checked = {};
  this._clearState();

  this.inputs.forEach(function (input, index) {
    input.addEventListener("input", function () { self._onInput(index); });
  });

  this.setButtons.forEach(function (button) {
    button.addEventListener("click", function () { self.setActiveSet(button.dataset.sliderSet); });
  });

  var checkButton = root.querySelector("[data-slider-check]");
  if (checkButton) checkButton.addEventListener("click", function () { self.check(); });

  this._render();
  this.setComplete(false);
}

AdjustSlidersActivity.prototype = Object.create(Activity.prototype);
AdjustSlidersActivity.prototype.constructor = AdjustSlidersActivity;

/* ---------- public API ---------- */

AdjustSlidersActivity.prototype.getSet = function () {
  return this.activeSet;
};

AdjustSlidersActivity.prototype.getValues = function (set) {
  return this.values[set || this.activeSet].slice();
};

AdjustSlidersActivity.prototype.setActiveSet = function (set) {
  if (this.sets.indexOf(set) === -1 || set === this.activeSet) return;
  this.activeSet = set;
  this._render();
  this.root.dispatchEvent(new CustomEvent("sliders:setchange", { detail: { set: set }, bubbles: true }));
};

AdjustSlidersActivity.prototype.check = function () {
  var self = this;
  var results = {};
  var firstWrong = null;

  this.sets.forEach(function (set) {
    results[set] = self.rows.map(function (row, index) {
      var correct = self.values[set][index] === self._targetOf(row, set);
      self.checked[set][index] = correct;
      if (!correct && !firstWrong) firstWrong = { set: set, index: index };
      return correct;
    });
  });

  if (firstWrong) this.activeSet = firstWrong.set;
  this._render();

  var allCorrect = !firstWrong;
  this.root.dispatchEvent(new CustomEvent("sliders:check", {
    detail: { results: results, allCorrect: allCorrect, firstWrong: firstWrong },
    bubbles: true
  }));
  if (firstWrong) {
    this.root.dispatchEvent(new CustomEvent("sliders:setchange", { detail: { set: this.activeSet }, bubbles: true }));
  }

  this.setComplete(this.isComplete());
};

AdjustSlidersActivity.prototype.isComplete = function () {
  /* Called by the base constructor (depends-on check) before this.checked exists. */
  if (!this.checked) return false;
  var self = this;
  return this.sets.every(function (set) {
    return self.checked[set].length > 0 && self.checked[set].every(function (state) { return state === true; });
  });
};

AdjustSlidersActivity.prototype.reset = function () {
  var shownSet = this.activeSet;
  this._clearState();
  this.activeSet = this.sets[0];
  this._render();
  if (shownSet !== this.activeSet) {
    this.root.dispatchEvent(new CustomEvent("sliders:setchange", { detail: { set: this.activeSet }, bubbles: true }));
  }
  this.setComplete(false);
};

/* ---------- internals ---------- */

AdjustSlidersActivity.prototype._clearState = function () {
  var self = this;
  this.sets.forEach(function (set) {
    self.values[set] = self.initialValues.slice();
    self.checked[set] = self.rows.map(function () { return null; });
  });
};

/* data-slider-target (single set) or data-slider-target-<set> on the row. */
AdjustSlidersActivity.prototype._targetOf = function (row, set) {
  var key = set === DEFAULT_SET
    ? "sliderTarget"
    : "sliderTarget" + set.charAt(0).toUpperCase() + set.slice(1);
  return Number(row.dataset[key]);
};

AdjustSlidersActivity.prototype._onInput = function (index) {
  var value = Number(this.inputs[index].value);
  this.values[this.activeSet][index] = value;
  this.checked[this.activeSet][index] = null;

  this._renderRow(index);
  this._renderSetButtons();

  this.root.dispatchEvent(new CustomEvent("sliders:input", {
    detail: { set: this.activeSet, index: index, value: value },
    bubbles: true
  }));

  this.setComplete(this.isComplete());
};

/* Shows the active set: slider positions, readouts, row and button states. */
AdjustSlidersActivity.prototype._render = function () {
  var self = this;
  this.inputs.forEach(function (input, index) {
    input.value = String(self.values[self.activeSet][index]);
    self._renderRow(index);
  });

  this.setButtons.forEach(function (button) {
    var selected = button.dataset.sliderSet === self.activeSet;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  this._renderSetButtons();
};

AdjustSlidersActivity.prototype._renderRow = function (index) {
  var input = this.inputs[index];
  var row = this.rows[index];
  var value = this.values[this.activeSet][index];
  var state = this.checked[this.activeSet][index];

  var min = Number(input.min) || 0;
  var max = Number(input.max) || 100;
  var percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
  input.style.setProperty("--partd-fill", percent + "%"); /* the slider track colours itself from this */

  row.classList.toggle("correct-bar", state === true);
  row.classList.toggle("needs-fix", state === false);

  var output = row.querySelector("output");
  if (output) {
    output.value = String(value);
    output.textContent = String(value);
  }
};

AdjustSlidersActivity.prototype._renderSetButtons = function () {
  var self = this;
  this.setButtons.forEach(function (button) {
    var states = self.checked[button.dataset.sliderSet] || [];
    button.classList.toggle("needs-fix", states.some(function (state) { return state === false; }));
    button.classList.toggle("site-complete", states.length > 0 && states.every(function (state) { return state === true; }));
  });
};


export { AdjustSlidersActivity };
