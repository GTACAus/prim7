/* ==================================================
   MULTIPLE CHOICE
   One or more questions, each with its own set of choice buttons. Pair
   with activity-base.js.

   Markup contract:

     <div id="myQuiz" data-activity>
       <div data-mc-question data-mc-answer="basketballs">
         <p>Which pair could be used for a fair test?</p>

         <div data-mc-choices>
           <button type="button" data-mc-choice="basketballs">
             ...
             <div data-mc-choice-feedback
                  data-feedback-title="Yes - this pair can be used"
                  data-feedback="Same shape and material, only size differs."></div>
           </button>

           <button type="button" data-mc-choice="basketball-tennis">
             ...
             <div data-mc-choice-feedback
                  data-feedback-title="Not quite"
                  data-feedback="Two variables are changed, not just size."></div>
           </button>
         </div>

         <!-- or, for a question whose choices all share the same two
              feedback messages instead of one each: -->
         <div data-mc-feedback
              data-correct-text="Yes - the results show..."
              data-incorrect-text="Not quite - look again at..."
              hidden></div>
       </div>

       <div data-mc-question data-mc-answer="...">...another question...</div>
     </div>

   Usage:

     const activity = new MultipleChoiceActivity(document.getElementById("myQuiz"), {
       completionMode: "live",   // optional, see below
       classes: {...},           // optional, see below
       onAnswer: function(detail) {
         // detail = { question, choice, value, correct }
         if (detail.correct) openCorrectPopup(); else openTryAgainPopup();
       }
     });

   Correctness: a choice's data-mc-choice is matched against its question's
   data-mc-answer - works just as well for "exactly one right answer among
   several options" (give every choice a distinct id, point data-mc-answer
   at the right one) as for a shared yes/no pair reused across questions.

   Feedback: a choice's own [data-mc-choice-feedback] descendant (filled
   from the choice's data-feedback-title/data-feedback) takes priority -
   use it when each choice needs its own explanation. Otherwise the
   question's [data-mc-feedback] is shown/hidden and filled from
   data-correct-text/data-incorrect-text - use it when every choice in a
   question shares the same two messages. Either way the activity only
   toggles classes/hidden and sets text - all the actual look is your CSS.

   options.completionMode: "sticky" (default) - once a question has been
   answered correctly it stays complete even if answered wrong again later
   (matches a classic "get everything right eventually" quiz). "live" -
   completeness always reflects the most recent click (matches a single
   "pick the right option" question where picking wrong should visibly
   un-complete it).

   options.classes overrides any of the class names the activity toggles -
   defaults: { selected: "selected-answer", correct: "correct-answer",
   incorrect: "incorrect-answer", feedbackCorrect: "feedback-correct",
   feedbackIncorrect: "feedback-incorrect", feedbackTitle: "mc-feedback-title",
   feedbackText: "mc-feedback-text" }.

   root event "mc:answer" (detail = { value, correct }, fired on the
   question element) is the same information as onAnswer, for code that
   would rather listen than pass a callback in.

   The activity is data-activity-complete once every question satisfies
   completionMode. A [data-reset-trigger] button inside the root clears
   every question back to unanswered.
   ================================================== */

(function (global) {
  "use strict";

  var DEFAULT_CLASSES = {
    selected: "selected-answer",
    correct: "correct-answer",
    incorrect: "incorrect-answer",
    feedbackCorrect: "feedback-correct",
    feedbackIncorrect: "feedback-incorrect",
    feedbackTitle: "mc-feedback-title",
    feedbackText: "mc-feedback-text"
  };

  function MultipleChoiceActivity(root, options) {
    Activity.call(this, root, options);

    var self = this;
    this.classes = Object.assign({}, DEFAULT_CLASSES, this.options.classes || {});

    this.questions = Array.prototype.map.call(root.querySelectorAll("[data-mc-question]"), function (element) {
      return {
        element: element,
        answer: element.dataset.mcAnswer,
        choices: element.querySelectorAll("[data-mc-choice]"),
        feedback: element.querySelector("[data-mc-feedback]")
      };
    });

    this.questions.forEach(function (question) {
      Array.prototype.forEach.call(question.choices, function (choice) {
        choice.setAttribute("aria-pressed", "false");
        choice.addEventListener("click", function () { self._selectChoice(question, choice); });
      });
    });

    this.setComplete(this.isComplete());
  }

  MultipleChoiceActivity.prototype = Object.create(Activity.prototype);
  MultipleChoiceActivity.prototype.constructor = MultipleChoiceActivity;

  /* ---------- public API ---------- */

  MultipleChoiceActivity.prototype.isComplete = function () {
    if (!this.questions.length) return false;
    var live = this.options.completionMode === "live";
    return this.questions.every(function (question) {
      return live ? question.element.dataset.mcLastCorrect === "true" : question.element.dataset.mcCorrect === "true";
    });
  };

  MultipleChoiceActivity.prototype.reset = function () {
    var self = this;

    this.questions.forEach(function (question) {
      delete question.element.dataset.mcCorrect;
      delete question.element.dataset.mcLastCorrect;

      Array.prototype.forEach.call(question.choices, function (choice) { self._clearChoiceVisuals(choice); });

      if (question.feedback) {
        question.feedback.hidden = true;
        question.feedback.textContent = "";
        question.feedback.classList.remove(self.classes.feedbackCorrect, self.classes.feedbackIncorrect);
      }
    });

    this.setComplete(false);
  };

  /* ---------- internals ---------- */

  MultipleChoiceActivity.prototype._clearChoiceVisuals = function (choice) {
    var c = this.classes;
    choice.classList.remove(c.selected, c.correct, c.incorrect);
    choice.setAttribute("aria-pressed", "false");

    var ownFeedback = choice.querySelector("[data-mc-choice-feedback]");
    if (ownFeedback) {
      ownFeedback.innerHTML = "";
      ownFeedback.classList.remove(c.feedbackCorrect, c.feedbackIncorrect);
    }
  };

  MultipleChoiceActivity.prototype._showFeedback = function (question, choice, isCorrect) {
    var c = this.classes;
    var ownFeedback = choice.querySelector("[data-mc-choice-feedback]");

    if (ownFeedback) {
      var title = choice.dataset.feedbackTitle;
      var body = choice.dataset.feedback || "";

      ownFeedback.innerHTML =
        (title ? '<strong class="' + c.feedbackTitle + '">' + title + "</strong>" : "") +
        '<span class="' + c.feedbackText + '">' + body + "</span>";

      ownFeedback.classList.add(isCorrect ? c.feedbackCorrect : c.feedbackIncorrect);
      return;
    }

    if (!question.feedback) return;

    question.feedback.hidden = false;
    question.feedback.classList.remove(c.feedbackCorrect, c.feedbackIncorrect);
    question.feedback.classList.add(isCorrect ? c.feedbackCorrect : c.feedbackIncorrect);
    question.feedback.textContent = isCorrect
      ? (question.feedback.dataset.correctText || "")
      : (question.feedback.dataset.incorrectText || "");
  };

  MultipleChoiceActivity.prototype._selectChoice = function (question, choice) {
    var self = this;
    var isCorrect = choice.dataset.mcChoice === question.answer;

    Array.prototype.forEach.call(question.choices, function (other) { self._clearChoiceVisuals(other); });

    choice.classList.add(this.classes.selected, isCorrect ? this.classes.correct : this.classes.incorrect);
    choice.setAttribute("aria-pressed", "true");

    this._showFeedback(question, choice, isCorrect);

    if (isCorrect) question.element.dataset.mcCorrect = "true";
    question.element.dataset.mcLastCorrect = String(isCorrect);

    var detail = { question: question.element, choice: choice, value: choice.dataset.mcChoice, correct: isCorrect };
    if (typeof this.options.onAnswer === "function") this.options.onAnswer(detail);
    question.element.dispatchEvent(new CustomEvent("mc:answer", { detail: detail, bubbles: true }));

    this.setComplete(this.isComplete());
  };

  global.MultipleChoiceActivity = MultipleChoiceActivity;
})(window);
