<script setup>
/*
  "Analyse the graph": multiple-choice questions asked one at a time, with one
  shared feedback box underneath (try-again text after a wrong pick; after a
  right pick the question's correct text, or nothing). Built on
  <MultipleChoice sequence>, which saves the picks.

    <AnalysisQuestions name="partb-analysis" prefix="partb"
                       :questions="questions" :initial-feedback="{ title, text }"
                       @answer="highlight($event)" />

  questions: [{ name, prompt (HTML), answer, choices: [{ value, text }],
                gridClass, incorrectTitle, incorrectText, correctTitle, correctText }]
  prefix: class prefix for the question / progress elements (lesson4.css);
  progress-prefix if the progress label uses a different one.
  Default slot: anything shown above the questions (label, heading).
  Exposes isComplete, solved ({ questionName: true }) and reset;
  @answer gets { question, value, correct }.
*/
import { computed, ref } from "vue";
import MultipleChoice from "@/components/activities/MultipleChoice.vue";
import McQuestion from "@/components/activities/McQuestion.vue";
import McChoice from "@/components/activities/McChoice.vue";
import { CHOICE_CLASSES } from "./barGraph.js";

const props = defineProps({
  questions: { type: Array, required: true },
  prefix: { type: String, default: "partb" },
  progressPrefix: { type: String, default: "" },
  initialFeedback: { type: Object, default: null },
});

const emit = defineEmits(["answer"]);

const mc = ref(null);
const isComplete = computed(() => mc.value?.isComplete ?? false);
const solved = computed(() => mc.value?.solved ?? {});

// shown in the shared box: the initial prompt, then feedback for the last pick
const lastAnswer = ref(null);
const feedback = computed(() => {
  if (!lastAnswer.value) {
    return props.initialFeedback && { variant: "", ...props.initialFeedback };
  }
  const { question, correct } = lastAnswer.value;
  const q = props.questions.find((item) => item.name === question);
  const title = correct ? q?.correctTitle : q?.incorrectTitle;
  const text = correct ? q?.correctText : q?.incorrectText;
  if (!title && !text) return null;
  return { variant: correct ? "success" : "try-again", title, text };
});

function onAnswer(detail) {
  lastAnswer.value = detail;
  emit("answer", detail);
}

function reset() {
  lastAnswer.value = null;
  mc.value?.reset();
}

defineExpose({ isComplete, solved, reset });
</script>

<template>
  <MultipleChoice
    ref="mc"
    sequence
    :classes="CHOICE_CLASSES"
    @answer="onAnswer"
    @reset="lastAnswer = null"
  >
    <slot />

    <McQuestion
      v-for="(q, i) in questions"
      :key="q.name"
      :name="q.name"
      :answer="q.answer"
      :class="`${prefix}-analysis-question`"
    >
      <span :class="`${progressPrefix || prefix}-analysis-progress`">
        Question {{ i + 1 }} of {{ questions.length }}
      </span>
      <p class="challenge-question"><strong v-html="q.prompt"></strong></p>
      <div class="challenge-choice-grid" :class="q.gridClass">
        <McChoice
          v-for="choice in q.choices"
          :key="choice.value"
          :value="choice.value"
          class="challenge-choice"
        >
          {{ choice.text }}
        </McChoice>
      </div>
    </McQuestion>

    <div
      v-if="feedback && !isComplete"
      class="challenge-feedback"
      :class="feedback.variant"
      role="status"
      aria-live="polite"
    >
      <strong v-if="feedback.title">{{ feedback.title }}</strong>
      {{ feedback.text }}
    </div>
  </MultipleChoice>
</template>

<style scoped>

.challenge-question {
  margin: 0 0 12px;
  line-height: 1.5;
}
.challenge-choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

/* The class names are built in the template as `${prefix}-analysis-question` and
   `${progressPrefix || prefix}-analysis-progress` (partb / partc / partd). */
.partb-analysis-progress,
.partc-analysis-progress {
  display: inline-block;
  margin-bottom: 10px;
  padding: 5px 9px;
  background: var(--soft-purple);
  border: 2px solid var(--charcoal);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
}

.partb-analysis-question,
.partc-analysis-question,
.partd-analysis-question {
  margin-top: 10px;
  padding: 14px;
  background: var(--paper);
  border: 2px solid var(--charcoal);
  border-radius: 14px;
}

.partb-analysis-question {
  margin-top: 8px;
}

.partd-analysis-question {
  margin-top: 12px;
}

.partb-analysis-question .challenge-question {
  margin-bottom: 10px;
}
</style>
