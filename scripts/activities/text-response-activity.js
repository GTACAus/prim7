/* ==================================================
   TEXT RESPONSE ACTIVITY
   Covers "type an answer, press Add/Enter, see it appear
   as a removable chip" - used for See/Think/Wonder,
   sticky-note brainstorms, and short written answers.
   Pair with activity-base.js.

   Markup contract (one or more groups per activity; a
   group is anything that holds its own input + list):

     <div id="myActivity" data-activity data-tr-min-total="4">
       <div data-tr-group data-tr-key="see" data-tr-min="1">
         <input data-tr-input type="text" placeholder="...">
         <button data-tr-add>Add</button>      <!-- optional: Enter/blur always works -->
         <ul data-tr-list></ul>                 <!-- <ul>/<ol> -> <li>, anything else -> <div> -->
       </div>
       <div data-tr-group data-tr-key="think" data-tr-min="1">...</div>
     </div>

   Completeness:
     - data-tr-min-total="N" on the root: complete once the
       combined answer count across every group reaches N
       (e.g. "at least 4 of these 8 sticky notes").
     - otherwise, each group needs its own data-tr-min
       answers (default 0, meaning that group has no
       requirement). If no group sets a minimum, the
       activity is always complete (nothing to gate on).
     - data-tr-max="1" on a group caps it at one answer and
       hides the input once that's reached - the pattern a
       single sticky note or short-answer box uses.

   API:
     activity.getAnswers()        -> { groupKey: [answers...] }
     activity.restore(answersMap) -> re-populate from getAnswers() shape
   ================================================== */

(function (global) {
  "use strict";

  function TextResponseActivity(root, options) {
    Activity.call(this, root, options);

    var self = this;

    this.groups = Array.prototype.map.call(root.querySelectorAll("[data-tr-group]"), function (group) {
      var list = group.querySelector("[data-tr-list]");
      return {
        element: group,
        key: group.dataset.trKey || (list && list.id) || null,
        input: group.querySelector("[data-tr-input]"),
        list: list,
        addButton: group.querySelector("[data-tr-add]"),
        min: parseInt(group.dataset.trMin || "0", 10),
        max: group.dataset.trMax ? parseInt(group.dataset.trMax, 10) : Infinity
      };
    });

    this.minTotal = parseInt(root.dataset.trMinTotal || "0", 10);

    this.groups.forEach(function (group) {
      if (group.addButton) {
        group.addButton.addEventListener("click", function () { self._addAnswer(group); });
      }
      if (group.input) {
        connectEnterAndBlurSave(group.input, function () { self._addAnswer(group); });
      }
      self._renderGroup(group);
    });

    this._refresh();
  }

  TextResponseActivity.prototype = Object.create(Activity.prototype);
  TextResponseActivity.prototype.constructor = TextResponseActivity;

  /* ---------- public API ---------- */

  TextResponseActivity.prototype.getAnswers = function () {
    var result = {};
    this.groups.forEach(function (group) {
      if (!group.key || !group.list) return;
      result[group.key] = Array.prototype.map.call(group.list.children, getAnswerText);
    });
    return result;
  };

  TextResponseActivity.prototype.restore = function (savedAnswers) {
    savedAnswers = savedAnswers || {};
    var self = this;
    this.groups.forEach(function (group) {
      var answers = (group.key && savedAnswers[group.key]) || [];
      answers.forEach(function (answer) { self._appendAnswer(group, answer); });
    });
    this._refresh();
  };

  TextResponseActivity.prototype.reset = function () {
    var self = this;
    this.groups.forEach(function (group) {
      if (group.list) group.list.innerHTML = "";
      if (group.input) group.input.value = "";
      self._renderGroup(group);
    });
    this.setComplete(false);
  };

  /* ---------- internals ---------- */

  TextResponseActivity.prototype._answerCount = function (group) {
    return group.list ? group.list.children.length : 0;
  };

  TextResponseActivity.prototype._addAnswer = function (group) {
    if (!group.input || this._answerCount(group) >= group.max) return;

    var answer = getValidStudentInput(group.input);
    if (answer === null) return;

    this._appendAnswer(group, answer);
    group.input.value = "";
  };

  TextResponseActivity.prototype._appendAnswer = function (group, answer) {
    if (!group.list) return;

    var isOrderedList = group.list.tagName === "UL" || group.list.tagName === "OL";
    var row = document.createElement(isOrderedList ? "li" : "div");

    var text = document.createElement("span");
    text.textContent = answer;

    var self = this;
    var deleteButton = createDeleteAnswerButton("Delete this answer", function () {
      row.remove();
      self._renderGroup(group);
      self._refresh();
    });

    row.appendChild(text);
    row.appendChild(deleteButton);
    group.list.appendChild(row);

    this._renderGroup(group);
    this._refresh();
  };

  TextResponseActivity.prototype._renderGroup = function (group) {
    var atMax = this._answerCount(group) >= group.max;

    if (group.input) {
      group.input.hidden = atMax;
      group.input.style.display = atMax ? "none" : "";
    }
    if (group.addButton) group.addButton.hidden = atMax;

    /* A <ul>/<ol> list manages its own display; anything else (e.g. a
       single-slot "sticky note" div) is shown only once it has an answer,
       the pattern .postit-answer .brainstorm-answer's CSS relies on. */
    if (group.list && group.list.tagName !== "UL" && group.list.tagName !== "OL") {
      group.list.style.display = this._answerCount(group) > 0 ? "flex" : "none";
    }
  };

  TextResponseActivity.prototype._refresh = function () {
    this.setComplete(this._isComplete());
  };

  TextResponseActivity.prototype._isComplete = function () {
    var self = this;

    if (this.minTotal > 0) {
      var total = this.groups.reduce(function (sum, group) { return sum + self._answerCount(group); }, 0);
      return total >= this.minTotal;
    }

    var anyMinSet = this.groups.some(function (group) { return group.min > 0; });
    if (!anyMinSet) return true;

    return this.groups.every(function (group) {
      return group.min === 0 || self._answerCount(group) >= group.min;
    });
  };

  global.TextResponseActivity = TextResponseActivity;
})(window);
