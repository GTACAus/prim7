/* ==================================================
   LESSON 4 ACTIVITIES (lesson4.html)
   Builds the activity prototypes used on the page. The bespoke stage logic
   in lesson4.js / spotlight_game.js talks to these through DOM events
   (button:press, mc:answer, activity:change) rather than direct calls.
   ================================================== */

import { Activity } from "../activities/activity-base.js";
import { initSectionActivitiesIn } from "../activities/activity-sections.js";
// Importing button-reveal-activity.js also auto-inits .stop-and-check[data-activity].
import { ButtonActivity } from "../activities/button-reveal-activity.js";
import { DragDropActivity } from "../activities/drag-drop-activity.js";
import { MultipleChoiceActivity } from "../activities/multiple-choice-activity.js";
import { SelectItemsActivity } from "../activities/select-items-activity.js";
import { AdjustSlidersActivity } from "./adjust-sliders-activity.js";
import { PlotPointsActivity } from "./plot-points-activity.js";

// Reuse lesson 4's existing choice button styling.
const CHOICE_CLASSES = { correct: "correct-choice", incorrect: "try-again-choice" };

// Analysis questions report into a shared .challenge-feedback box (see data-mc-feedback-target).
const ANALYSIS_CLASSES = Object.assign({}, CHOICE_CLASSES, { feedbackCorrect: "success", feedbackIncorrect: "try-again" });

// The prediction and more/less buttons only keep the "selected" look for a correct pick.
const PICK_CLASSES = { selected: "mc-picked", correct: "selected-answer", incorrect: "try-again-choice" };

function byId(id) {
  return document.getElementById(id);
}

function multipleChoice(id, options) {
  const root = byId(id);
  if (!root) return null;
  return new MultipleChoiceActivity(root, Object.assign({ classes: CHOICE_CLASSES }, options));
}

// Scales a graph's HTML axis-slot text with the graph (the SVG scales with its width).
function scaleAxisSlotText(wrap) {
  if (typeof ResizeObserver !== "function") return;
  new ResizeObserver(function () {
    const size = Math.max(9, Math.min(14, wrap.clientWidth * 0.021));
    wrap.style.fontSize = size + "px";
  }).observe(wrap);
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".graph-svg-wrap").forEach(function (wrap) {
    if (wrap.querySelector(".axis-slot")) scaleAxisSlotText(wrap);
  });

  /* ---------- Part A ---------- */
  // "Wait until night" keeps its button visible (spotlight_game.js disables it).
  new ButtonActivity(byId("nightPrompt"), { hideTrigger: false });

  /* ---------- Part B ---------- */
  new ButtonActivity(byId("partBAveragesActivity"), { hideTrigger: false });
  new DragDropActivity(byId("partBAxisActivity"), { strictSlots: true });
  multipleChoice("partBUnitCheck", { completionMode: "live" });
  new PlotPointsActivity(byId("partBPlotActivity"), Object.assign({
    prefix: "partb",
    idPrefix: "partB",
    feedbackId: "partBFeedback",
    prompt: { title: byId("partBBuilderPromptTitle"), text: byId("partBBuilderPromptText") }
  }, window.partBPlotConfig));
  new SelectItemsActivity(byId("partBGraphCheck")); // every box in the construction checklist
  multipleChoice("partBAnalysisPanel", { classes: ANALYSIS_CLASSES });

  /* ---------- Part C ---------- */
  new DragDropActivity(byId("partCAxisActivity"), { strictSlots: true });
  multipleChoice("partCUnitCheck", { completionMode: "live" });
  new AdjustSlidersActivity(byId("partCSliderStage"));
  multipleChoice("partCAnalysisPanel", { classes: ANALYSIS_CLASSES });

  /* ---------- Part D ---------- */
  new AdjustSlidersActivity(byId("partDSliders"), { sets: ["site1", "site2"] });
  multipleChoice("partDAnalysisPanel", { classes: ANALYSIS_CLASSES });
  multipleChoice("partDCompleteCard", { classes: PICK_CLASSES });
  // #partDStopAndCheck is built by button-reveal-activity.js; its more/less questions sit inside it.
  multipleChoice("partDMoreLess", { classes: PICK_CLASSES });

  initSectionActivitiesIn(document);
});

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

window.addEventListener("load", function () {
  window.setTimeout(restoreCompleteness, 0);
});
