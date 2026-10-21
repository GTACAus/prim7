/* ==================================================
   LESSON 4 ACTIVITY HELPERS
   Shared by lesson4_activities.js (lesson4.html) and lesson4-2_activities.js
   (lesson4-2.html): the class names lesson 4's choice buttons use, small
   constructors, and the page-load clean-ups every lesson 4 page needs.
   ================================================== */

import { Activity } from "../activities/activity-base.js";
import { ButtonActivity } from "../activities/button-reveal-activity.js";
import { MultipleChoiceActivity } from "../activities/multiple-choice-activity.js";

// Reuse lesson 4's existing choice button styling.
export const CHOICE_CLASSES = { correct: "correct-choice", incorrect: "try-again-choice" };

// Analysis questions report into a shared .challenge-feedback box (see data-mc-feedback-target).
export const ANALYSIS_CLASSES = Object.assign({}, CHOICE_CLASSES, { feedbackCorrect: "success", feedbackIncorrect: "try-again" });

// The prediction and more/less buttons only keep the "selected" look for a correct pick.
export const PICK_CLASSES = { selected: "mc-picked", correct: "selected-answer", incorrect: "try-again-choice" };

// A prediction check: picked buttons as above, plus the shared feedback box.
export const PREDICTION_CLASSES = Object.assign({}, PICK_CLASSES, { feedbackCorrect: "success", feedbackIncorrect: "try-again" });

export function byId(id) {
  return document.getElementById(id);
}

export function multipleChoice(id, options) {
  const root = byId(id);
  if (!root) return null;
  return new MultipleChoiceActivity(root, Object.assign({ classes: CHOICE_CLASSES }, options));
}

// Scales a graph's HTML axis-slot text with the graph (the SVG scales with its width).
export function scaleAxisSlotText() {
  if (typeof ResizeObserver !== "function") return;

  document.querySelectorAll(".graph-svg-wrap").forEach(function (wrap) {
    if (!wrap.querySelector(".axis-slot")) return;

    new ResizeObserver(function () {
      wrap.style.fontSize = Math.max(9, Math.min(14, wrap.clientWidth * 0.021)) + "px";
    }).observe(wrap);
  });
}

/* lesson_progress.js puts back which elements were hidden and which choices
   were picked, but an activity's own completeness is not saved. Work it out
   from that restored page, so things that depend on an activity (and each
   section's Next button) are right again after a reload. */
function restoreCompleteness() {
  const activities = Activity.all();

  // Work everything out quietly first so no activity reacts to a half-restored page.
  activities.forEach(function (activity) {
    if (activity instanceof MultipleChoiceActivity) {
      activity.questions.forEach(function (question) {
        const answered = Array.prototype.some.call(question.choices, function (choice) {
          return choice.classList.contains(activity.classes.correct);
        });
        if (answered) {
          question.element.dataset.mcCorrect = "true";
          question.element.dataset.mcLastCorrect = "true";
        }
      });
    } else if (activity instanceof ButtonActivity) {
      if (activity.trigger && (activity.trigger.hidden || activity.trigger.disabled)) {
        activity.root.dataset.activityComplete = "true";
      }
    }
  });

  activities.forEach(function (activity) {
    activity.setComplete(activity.isComplete());
  });
}

export function restoreCompletenessOnLoad() {
  window.addEventListener("load", function () {
    window.setTimeout(restoreCompleteness, 0);
  });
}
