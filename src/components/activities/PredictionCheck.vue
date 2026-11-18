<script setup>
/*
  PREDICTION CHECK
  The "Interpret the results" card used after a fair test: shows the
  student's reasoned prediction, then asks "Do the results support the
  reasoned prediction?". Built on <MultipleChoice>.

    <PredictionCheck
      name="yeast-interpretation"
      prediction="As the temperature increases, the gas made by yeast increases."
      answer="partly-supported"
      incorrect-title="Look at the whole trend again."
      incorrect-text="Is the prediction true across the whole temperature range?"
    >
      <!-- optional: more questions asked first -->
      <h3>Use the data to describe the results</h3>
      <McQuestion name="low-temps" answer="increases">
        <p>As the temperature increases, the gas made:</p>
        <div class="prediction-buttons">
          <McChoice value="increases" class="prediction-button">Increases</McChoice>
          ...
        </div>
      </McQuestion>
    </PredictionCheck>

  Props
  - prediction: the reasoned prediction (HTML). Or use the #prediction slot;
    with neither, the reminder box is left out.
  - answer: the right choice for the final question. Leave it out when there
    is no right answer (the pick is just recorded).
  - choices: the final question's buttons, [{ value, text }]. Defaults to
    Supported / Partly supported / Not supported.
  - incorrectTitle / incorrectText, correctTitle / correctText: feedback shown
    under the final question after a wrong / right pick (optional).
  - label, question: the eyebrow and the final question's heading.
  - classes: passed to <MultipleChoice> to rename the picked classes.

  Questions in the default slot (McQuestion / McChoice, any layout) are asked
  first; the final question appears once they have all been answered right.
  Slot props: { solved, reset }.

  Complete once every question is answered (right, where there is an answer).
  Picks are saved through <MultipleChoice> - give it a `name`.
  Exposes isComplete and reset.
*/
import { computed, ref } from "vue";
import MultipleChoice from "./MultipleChoice.vue";
import McQuestion from "./McQuestion.vue";
import McChoice from "./McChoice.vue";

const FINAL = "support";

const props = defineProps({
  prediction: { type: String, default: "" },
  answer: { type: String, default: "" },
  choices: {
    type: Array,
    default: () => [
      { value: "supported", text: "Supported" },
      { value: "partly-supported", text: "Partly supported" },
      { value: "not-supported", text: "Not supported" },
    ],
  },
  label: { type: String, default: "Interpret the results" },
  question: {
    type: String,
    default: "Do the results support the reasoned prediction?",
  },
  incorrectTitle: { type: String, default: "" },
  incorrectText: { type: String, default: "" },
  correctTitle: { type: String, default: "" },
  correctText: { type: String, default: "" },
  classes: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["answer"]);

const mc = ref(null);
const isComplete = computed(() => mc.value?.isComplete ?? false);

// the final question waits for every other question to be answered right
function finalVisible(questions, solved) {
  return questions.filter((key) => key !== FINAL).every((key) => solved[key]);
}

function feedbackFor(answered, correct) {
  if (!answered || !props.answer) return null;
  if (correct && (props.correctTitle || props.correctText))
    return {
      variant: "success",
      title: props.correctTitle,
      text: props.correctText,
    };
  if (!correct && (props.incorrectTitle || props.incorrectText))
    return {
      variant: "try-again",
      title: props.incorrectTitle,
      text: props.incorrectText,
    };
  return null;
}

defineExpose({ isComplete, reset: () => mc.value?.reset() });
</script>

<template>
  <MultipleChoice
    ref="mc"
    class="prediction-check"
    :classes="classes"
    v-slot="{ solved, questions, reset }"
    @answer="emit('answer', $event)"
  >
    <p class="prediction-label">{{ label }}</p>

    <div v-if="prediction || $slots.prediction" class="prediction-reminder">
      <h3 class="prediction-reminder-label">Reasoned prediction</h3>
      <p>
        <slot name="prediction"><span v-html="prediction"></span></slot>
      </p>
    </div>

    <slot :solved="solved" :reset="reset" />

    <!-- v-show, not v-if: the final question must stay registered so the
         activity isn't complete until it has been answered. (On a wrapper,
         since McQuestion uses v-show on its own root.) -->
    <div v-show="finalVisible(questions, solved)">
      <McQuestion
        :name="FINAL"
        :answer="answer"
        class="prediction-final"
        v-slot="{ answered, correct }"
      >
        <h3>{{ question }}</h3>
        <div class="prediction-buttons">
          <McChoice
            v-for="choice in choices"
            :key="choice.value"
            :value="choice.value"
            class="prediction-button"
          >
            {{ choice.text }}
          </McChoice>
        </div>

        <div
          v-if="feedbackFor(answered, correct)"
          class="challenge-feedback"
          :class="feedbackFor(answered, correct).variant"
          role="status"
          aria-live="polite"
        >
          <strong v-if="feedbackFor(answered, correct).title">
            {{ feedbackFor(answered, correct).title }}
          </strong>
          {{ feedbackFor(answered, correct).text }}
        </div>
      </McQuestion>
    </div>
  </MultipleChoice>
</template>

<style scoped>
/* :deep() so slotted questions from the page get the same look */

.prediction-check {
  display: flex;
  flex-direction: column;
  gap: 10px;

  width: min(700px, 100%);
  margin: 24px auto 0;
  padding: 22px;

  background: white;
  border: 3px solid var(--charcoal);
  border-top: 8px solid var(--purple);
  border-radius: 18px;
  box-shadow: var(--shadow-small);

  text-align: center;
  box-sizing: border-box;

  animation: pop-fade-in 0.5s ease;
}

.prediction-label {
  margin: 0 0 6px;

  color: var(--purple);

  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.prediction-check :deep(h3) {
  margin: 0 0 8px;
}

.prediction-check :deep(p) {
  color: var(--muted);
  line-height: 1.5;
}

.prediction-reminder {
  margin-bottom: 8px;
  padding: 14px 16px;

  background: var(--soft-yellow);
  border: 2px solid var(--line);
  border-radius: 14px;
}

.prediction-reminder p {
  margin: 0;
  color: var(--text);
  font-weight: 600;
}

.prediction-reminder-label {
  color: var(--purple);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.prediction-final {
  margin-top: 8px;
}

.prediction-check :deep(.prediction-buttons) {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.prediction-check :deep(.prediction-button) {
  min-width: 150px;
  padding: 12px 20px;

  background: var(--soft-green);
  color: var(--charcoal);
  border: var(--border-medium);
  border-radius: var(--radius-small);
  box-shadow: var(--shadow-small);

  font: inherit;
  font-weight: 700;
  cursor: pointer;

  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.prediction-check :deep(.prediction-button:hover) {
  background: var(--green);
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.prediction-check :deep(.prediction-button.selected-answer),
.prediction-check :deep(.prediction-button.correct-answer) {
  color: var(--paper);
  background: var(--button-hover);
  box-shadow: none;
  transform: translateY(3px);
  cursor: default;
}

.prediction-check :deep(.prediction-button.incorrect-answer) {
  color: var(--charcoal);
  background: var(--orange);
  box-shadow: none;
  transform: translateY(3px);
  animation: prediction-buzz 0.2s ease;
}

.challenge-feedback {
  margin-top: 4px;
  padding: 12px 14px;

  background: var(--soft-blue);
  border: 2px solid var(--charcoal);
  border-left: 8px solid var(--blue);
  border-radius: 13px;

  text-align: left;
  line-height: 1.45;
}

.challenge-feedback strong {
  display: block;
  margin-bottom: 3px;
}

.challenge-feedback.success {
  background: var(--soft-green);
  border-left-color: var(--green);
}

.challenge-feedback.try-again {
  background: var(--soft-orange);
  border-left-color: var(--orange);
}

@keyframes prediction-buzz {
  0%,
  100% {
    translate: 0;
  }
  25% {
    translate: -4px;
  }
  75% {
    translate: 4px;
  }
}
</style>
