/* ======================================================================
   PLANT BIG KAHUNA — QUESTION + PREDICTION ACTIVITY ADAPTER (v2.6)

   Reuses the EXACT shared modules used in Lesson 2. No edits to the generic
   scripts/activities/ files are required.

   The main plantkahuna.js owns the experiment. It broadcasts its current
   choice of independent/dependent variables through a custom DOM event.
   This small page-only adapter keeps the writing activities in sync.
   ====================================================================== */

import { InvestigationQuestionActivity } from "../activities/investigation-question-activity.js";
import { PredictionTableActivity } from "../activities/prediction-table-activity.js";

const root = document.getElementById("plantKahuna");
const questionRoot = document.getElementById("plantQuestionActivity");
const predictionRoot = document.getElementById("plantPredictionActivity");

if (root && questionRoot && predictionRoot) {
  const byId = (id) => document.getElementById(id);

  // Wording for the question blanks (not the labels in the scene editor).
  // The two slots use different lists: things students can CHANGE versus
  // things they can MEASURE. The shared module normally offers one list to
  // both dropdowns; filtering is done here, without changing that module.
  const CHANGE_WORDS = {
    potSize: "pot size",
    potMaterial: "pot type",
    soilFill: "soil level",
    soilType: "soil type",
    waterVolume: "amount of water",
    fertiliser: "use of fertiliser",
    wateringFrequency: "watering frequency",
    lightExposure: "light exposure",
    lightColour: "light colour",
    nutrientLevel: "nutrient level",
    temperature: "temperature",
  };
  // The student may measure several outcomes. Their testable question
  // focuses on ONE selected outcome (chosen in the second blank).
  const MEASURE_WORDS = {
    height: "plant height",
    leaves: "number of leaves",
    leafLength: "leaf length",
    wilted: "number of wilting leaves",
    condition: "leaf condition",
  };
  const PREDICTION_MEASURE_WORDS = { ...MEASURE_WORDS };

  const allWords = [...new Set([...Object.values(CHANGE_WORDS), ...Object.values(MEASURE_WORDS)])];
  let currentPlan = null;
  let planSignature = null;
  let lastQuestionValid = false;

  // PredictionTableActivity must be constructed FIRST: the question
  // builder's onChange callback supplies its context.
  const prediction = new PredictionTableActivity(predictionRoot, {
    // These are the same relationship types as Lesson 2, with A/B labels
    // made clearer for this two-plant experiment.
    causeOptions: {
      "increase-decrease": [
        { value: "increase", label: "Increase" },
        { value: "decrease", label: "Decrease" },
      ],
      "with-without": [
        { value: "with", label: "With" },
        { value: "without", label: "Without" },
      ],
      "condition-comparison": [
        { value: "condition-one-to-two", label: "From Plant A to B" },
        { value: "condition-two-to-one", label: "From Plant B to A" },
      ],
    },
  });

  // Leaf condition is descriptive, so its predicted outcome can
  // "improve" or "get worse". Numeric outcomes can increase/decrease.
  const buildDefaultPhrases = prediction._buildPredictionPhrases.bind(prediction);
  prediction._buildPredictionPhrases = function (change, measure) {
    const phrases = buildDefaultPhrases(change, measure);
    if (normalise(measure) === MEASURE_WORDS.condition) {
      const ending = {
        increase: "improve",
        decrease: "get worse",
        "stay-the-same": "stay the same",
      }[prediction.selectedEffect];
      if (ending && phrases.effect) {
        phrases.effect = phrases.effect.replace(/(increase|decrease|stay the same)$/, ending);
      }
    }
    // With / without fertiliser is more natural than
    // "with use of fertiliser", while leaving the question unchanged.
    if (normalise(change) === "use of fertiliser" && phrases.cause) {
      phrases.cause = phrases.cause.replace(/(with|without) use of fertiliser/g, "$1 fertiliser");
    }
    return phrases;
  };

  function updateEffectLabels(measure = "") {
    const descriptive = normalise(measure) === MEASURE_WORDS.condition;
    const labels = descriptive
      ? { increase: "Improve", decrease: "Get worse", "stay-the-same": "Stay the same" }
      : { increase: "Increase", decrease: "Decrease", "stay-the-same": "Stay the same" };
    predictionRoot.querySelectorAll("[data-prediction-effect]").forEach((button) => {
      button.textContent = labels[button.dataset.predictionEffect];
    });
  }

  // When the student chooses to compare the two actual setups, the known
  // A/B conditions can be filled automatically. They still choose the
  // direction and predicted effect themselves.
  predictionRoot.querySelector("[data-prediction-cause-type]")
    .addEventListener("change", (event) => {
      if (event.target.value !== "condition-comparison" || !currentPlan) return;
      const first = predictionRoot.querySelector("[data-prediction-condition-one]");
      const second = predictionRoot.querySelector("[data-prediction-condition-two]");
      first.value = currentPlan.comparisonA;
      second.value = currentPlan.comparisonB;
      first.dispatchEvent(new Event("input", { bubbles: true }));
    });

  function normalise(text) {
    return String(text || "").trim().toLowerCase();
  }

  function planIsReady() {
    return Boolean(currentPlan && currentPlan.changeKey && currentPlan.measureKey);
  }

  function questionMatchesPlan(state) {
    return Boolean(
      planIsReady() && state && state.text &&
      normalise(state.firstAnswer) === CHANGE_WORDS[currentPlan.changeKey] &&
      (currentPlan.measureKeys || []).some((key) =>
        normalise(state.secondAnswer) === MEASURE_WORDS[key])
    );
  }

  function updateQuestionFeedback(state) {
    const preview = byId("pk-written-question");
    const previewBox = byId("pk-question-step-three");
    const feedback = byId("pk-writing-feedback");
    const questionValid = questionMatchesPlan(state);

    byId("pk-question-step-two").hidden = !state.structure;
    previewBox.hidden = !state.text;
    preview.textContent = state.text || "";
    feedback.hidden = !state.text;

    if (state.text) {
      feedback.textContent = questionValid
        ? "Your question matches the variables in your plant experiment."
        : "Check your question. Choose the change and measurement from your experiment plan.";
      feedback.classList.toggle("is-success", questionValid);
    }

    updateEffectLabels(state.secondAnswer);
    const predictionArea = byId("pk-prediction-content");
    const predictionWait = byId("pk-prediction-wait");
    predictionArea.hidden = !questionValid;
    predictionWait.hidden = questionValid;
    if (questionValid) {
      prediction.setContext({
        structure: state.structure,
        change: state.firstAnswer,
        measure: state.secondAnswer,
      });
      predictionWait.textContent = "";
    } else {
      predictionWait.textContent = planIsReady()
        ? "Complete a question that matches your experiment to start your prediction."
        : "Choose what to change above.";
      // If the student revises their question, an old prediction must not
      // remain attached to an unrelated independent/dependent pair.
      if (lastQuestionValid) prediction.reset();
    }
    lastQuestionValid = questionValid;
  }

  const question = new InvestigationQuestionActivity(questionRoot, {
    variableOptions: allWords,
    onChange: updateQuestionFeedback,
  });

  function filterQuestionDropdowns() {
    // Reuses the shared dropdown builder but makes each blank scientifically
    // appropriate. These are native <select> controls, not new widgets.
    const first = questionRoot.querySelector('select[name="firstAnswer"]');
    const second = questionRoot.querySelector('select[name="secondAnswer"]');
    // The plan says which "change" choices exist in the chosen setup
    // (classroom or Tiny Farms).
    const changeAllowed = Object.entries(CHANGE_WORDS)
      .filter(([key]) => (currentPlan?.changeKeys || []).includes(key))
      .map(([, word]) => word);

    const measureAllowed = (currentPlan?.measureKeys || []).map((key) => MEASURE_WORDS[key]).filter(Boolean);
    [[first, changeAllowed], [second, measureAllowed]].forEach(([select, allowed]) => {
      if (!select) return;
      Array.from(select.options).forEach((option) => {
        if (option.value && !allowed.includes(option.value)) option.remove();
      });
    });

    // With a single selected outcome, filling the second blank is simple.
    // With several outcomes, students choose the one their question tests.
    if (second && !second.value && measureAllowed.length === 1) {
      second.value = measureAllowed[0];
      second.dispatchEvent(new Event("change"));
    }
  }

  // The activity constructs the blanks synchronously on a structure click.
  // This listener runs after the module's own click listener, so we can
  // narrow the two dropdowns immediately, with no shared-file edits.
  questionRoot.addEventListener("click", (event) => {
    if (event.target.closest("[data-question-structure]")) filterQuestionDropdowns();
  });

  function clearWriting() {
    lastQuestionValid = false;
    question.reset();
    prediction.reset();
    byId("pk-prediction-content").hidden = true;
    byId("pk-prediction-wait").hidden = false;
    byId("pk-writing-feedback").hidden = true;
  }

  function updatePlan(plan) {
    const nextSignature = [plan.mode, plan.changeKey, plan.comparisonId,
      ...(plan.measureKeys || [])].join("|");
    const didChange = planSignature !== null && nextSignature !== planSignature;
    planSignature = nextSignature;
    currentPlan = plan;

    if (didChange) clearWriting();
    updateEffectLabels(question.getState().secondAnswer);

    const ready = planIsReady();
    byId("pk-question-wait").hidden = ready;
    byId("pk-question-wait").textContent = !plan.changeKey
      ? "Choose what to change above."
      : "Choose at least one thing to measure above.";
    questionRoot.hidden = !ready;
    byId("pk-reset-writing").hidden = !ready;

    // The wait message is visible before a question exists.
    if (!ready) {
      byId("pk-prediction-content").hidden = true;
      byId("pk-prediction-wait").hidden = false;
      byId("pk-prediction-wait").textContent = !plan.changeKey
        ? "Choose what to change above."
        : "Choose what to measure above.";
    } else if (!questionMatchesPlan(question.getState())) {
      byId("pk-prediction-content").hidden = true;
      byId("pk-prediction-wait").hidden = false;
      byId("pk-prediction-wait").textContent = "Write your question first.";
    }

  }

  root.addEventListener("plantkahuna:planchange", (event) => updatePlan(event.detail));
  root.addEventListener("plantkahuna:resetwriting", clearWriting);
  byId("pk-reset-writing").addEventListener("click", clearWriting);

  // The main plant script may have rendered before the ES module loaded.
  // Ask it to broadcast the current plan once we're listening.
  root.dispatchEvent(new Event("plantkahuna:requestplan"));
}
