<script setup>
/*
  Plant Lab — plan a plant fair test, write a testable question for it and
  make a reasoned prediction. Converted from public/legacy/plantkahuna.

  The planner's choices (what to change, what to measure) decide which words
  the question offers, and the question must match the plan before the
  prediction opens. Changing the plan clears the question and prediction.
*/
import { computed, ref, watch } from "vue";
import Page from "@/components/layout/Page.vue";
import Section from "@/components/layout/Section.vue";
import LessonIntro from "@/components/content/LessonIntro.vue";
import ContentBox from "@/components/ui/ContentBox.vue";
import Button from "@/components/ui/Button.vue";
import Activity from "@/components/activities/Activity.vue";
import InvestigationQuestion from "@/components/activities/InvestigationQuestion.vue";
import PredictionTable from "@/components/activities/PredictionTable.vue";
import PlantPlanner from "@/components/lessons/plantExperiment/PlantPlanner.vue";
import {
  CHANGE_WORDS,
  MEASURE_WORDS,
} from "@/components/lessons/plantExperiment/plantData.js";

const glossary = {
  Variable:
    "An aspect of an investigation that can be different or can change.",
  "Independent variable":
    "The one <strong>variable</strong> changed during a <strong>fair test</strong> experiment.",
  "Dependent variable":
    "The result that is observed or measured during a <strong>fair test</strong> experiment.",
  "Controlled variables":
    "The <strong>variables</strong> kept the same so the experiment is fair.",
  "Fair test Experiment":
    "An experiment where one <strong>variable</strong> is changed, one is measured, and all others are kept the same.",
};

const sections = [
  { id: "plan-experiment", title: "Set up your experiment" },
  { id: "testable-question", title: "Testable question" },
  { id: "reasoned-prediction", title: "Reasoned prediction" },
];

/* ---------- The plan, from <PlantPlanner @change> ---------- */
const plan = ref(null);
const planReady = computed(
  () => !!(plan.value?.changeKey && plan.value.measureKeys.length),
);

// Words for each blank: anything changeable in this growing setup, and only
// the outcomes the student chose to measure.
const changeOptions = computed(() =>
  (plan.value?.changeKeys ?? []).map((key) => CHANGE_WORDS[key]),
);
const measureOptions = computed(() =>
  (plan.value?.measureKeys ?? []).map((key) => MEASURE_WORDS[key]),
);

/* ---------- Testable question ---------- */
const question = ref({
  structure: "",
  firstAnswer: "",
  secondAnswer: "",
  text: "",
});
const normalise = (text) =>
  String(text || "")
    .trim()
    .toLowerCase();

const questionMatchesPlan = computed(
  () =>
    planReady.value &&
    !!question.value.text &&
    normalise(question.value.firstAnswer) ===
      CHANGE_WORDS[plan.value.changeKey] &&
    measureOptions.value.includes(normalise(question.value.secondAnswer)),
);

const waitMessage = computed(() => {
  if (!plan.value?.changeKey)
    return "Choose what to change in your plan above.";
  if (!planReady.value)
    return "Choose at least one thing to measure in your plan above.";
  return "Complete a question that matches your experiment to start your prediction.";
});

/* ---------- Reasoned prediction ---------- */
const predictionContext = computed(() => ({
  structure: question.value.structure,
  change: question.value.firstAnswer,
  measure: question.value.secondAnswer,
}));

// Plant A / Plant B in place of "Condition 1 / 2"
const predictionOptions = {
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
};

// Leaf condition is described, not counted: it can improve or get worse.
const effectWords = computed(() =>
  normalise(question.value.secondAnswer) === MEASURE_WORDS.condition
    ? { increase: "improve", decrease: "get worse" }
    : null,
);
// "with fertiliser" reads better than "with use of fertiliser"
const changePhrase = computed(() =>
  normalise(question.value.firstAnswer) === CHANGE_WORDS.fertiliser
    ? "fertiliser"
    : "",
);
const conditions = computed(() =>
  plan.value ? [plan.value.comparisonA, plan.value.comparisonB] : null,
);

/* ---------- Clearing old writing ---------- */
const questionActivity = ref(null);
const predictionActivity = ref(null);

function clearWriting() {
  questionActivity.value?.reset();
  predictionActivity.value?.reset();
}

// A prediction must not stay attached to a question that no longer matches.
watch(questionMatchesPlan, (valid, wasValid) => {
  if (wasValid && !valid) predictionActivity.value?.reset();
});
</script>

<template>
  <Page
    lessonId="plant-experiment"
    title="Plant Lab - Plan a Plant Experiment"
    :sections="sections"
    :glossary="glossary"
  >
    <template #lesson-intro>
      <LessonIntro label="Plant Lab" title="Plan a plant experiment">
        <template #title>Plan a <strong>plant experiment</strong></template>
        Explore how different conditions affect plants.
      </LessonIntro>
    </template>

    <template #sections>
      <!-- ==================================================
           1. PLAN THE EXPERIMENT
           ================================================== -->
      <Section name="plan-experiment">
        <PlantPlanner
          name="plant-planner"
          @change="plan = $event"
          @edited="clearWriting"
        />
      </Section>

      <!-- ==================================================
           2. TESTABLE QUESTION
           ================================================== -->
      <Section name="testable-question">
        <p v-if="!planReady" class="pk-writing-wait">{{ waitMessage }}</p>
        <div v-show="planReady">
          <InvestigationQuestion
            ref="questionActivity"
            name="investigation-question"
            steps
            :first-options="changeOptions"
            :second-options="measureOptions"
            @change="question = $event"
          />
          <!-- Counts towards the section: the question must match the plan -->
          <Activity name="question-check" :complete="questionMatchesPlan">
            <p
              v-if="question.text"
              class="pk-writing-feedback"
              :class="{ 'is-success': questionMatchesPlan }"
              role="status"
              aria-live="polite"
            >
              {{
                questionMatchesPlan
                  ? "Your question matches the variables in your plant experiment."
                  : "Check your question. Choose the change and measurement from your experiment plan."
              }}
            </p>
          </Activity>
        </div>
      </Section>

      <!-- ==================================================
           3. REASONED PREDICTION
           ================================================== -->
      <Section name="reasoned-prediction">
        <p v-if="!questionMatchesPlan" class="pk-writing-wait">
          {{ waitMessage }}
        </p>
        <div v-show="questionMatchesPlan">
          <PredictionTable
            ref="predictionActivity"
            name="reasoned-prediction"
            :context="predictionContext"
            :options="predictionOptions"
            :effect-words="effectWords"
            :change-phrase="changePhrase"
            :conditions="conditions"
          />
        </div>
        <div class="reset-button-container">
          <Button :is-reset="true" @click="clearWriting" />
        </div>
      </Section>
    </template>
  </Page>
</template>

<style scoped>
.pk-writing-wait {
  padding: 16px 18px;
  background: var(--soft-blue);
  border: 2px dashed var(--line);
  border-radius: 14px;
  color: var(--text);
}

.pk-writing-feedback {
  margin: 0 0 12px;
  padding: 11px 14px;
  background: var(--soft-orange);
  border: 2px solid var(--line);
  border-radius: 12px;
  color: var(--text);
  font-size: 0.88rem;
  font-weight: 700;
}

.pk-writing-feedback.is-success {
  background: var(--soft-green);
}
</style>
