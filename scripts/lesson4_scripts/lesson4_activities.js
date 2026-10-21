/* ==================================================
   LESSON 4 ACTIVITIES (lesson4.html)
   Builds the activity prototypes used on the page. The bespoke stage logic
   in lesson4.js / spotlight_game.js talks to these through DOM events
   (button:press, mc:answer, activity:change) rather than direct calls.
   ================================================== */

import { initSectionActivitiesIn } from "../activities/activity-sections.js";
// Importing button-reveal-activity.js also auto-inits .stop-and-check[data-activity].
import { ButtonActivity } from "../activities/button-reveal-activity.js";
import { DragDropActivity } from "../activities/drag-drop-activity.js";
import { SelectItemsActivity } from "../activities/select-items-activity.js";
import { AdjustSlidersActivity } from "./adjust-sliders-activity.js";
import { PlotPointsActivity } from "./plot-points-activity.js";
import {
  ANALYSIS_CLASSES, PICK_CLASSES, byId, multipleChoice, restoreCompletenessOnLoad, scaleAxisSlotText
} from "./lesson4-activity-helpers.js";

document.addEventListener("DOMContentLoaded", function () {
  scaleAxisSlotText();

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

restoreCompletenessOnLoad();
