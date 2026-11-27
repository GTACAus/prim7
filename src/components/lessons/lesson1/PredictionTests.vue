<script setup>
import { computed, nextTick, ref } from "vue";
import Activity from "@/components/activities/Activity.vue";
import Button from "@/components/ui/Button.vue";
import LessonEndCard from "@/components/content/LessonEndCard.vue";

const props = defineProps({
  tests: { type: Array, required: true },
  completionMode: { type: String, default: "sticky" },
});

const answers = ref({});
const correctEver = ref({});
const completion = ref(null);

const isComplete = computed(
  () =>
    props.tests.length > 0 &&
    props.tests.every((test, i) =>
      props.completionMode === "live"
        ? answers.value[i] === String(test.answer)
        : correctEver.value[i] === true,
    ),
);

const state = { answers, correctEver };

function selectAnswer(index, value) {
  answers.value = { ...answers.value, [index]: value };
  if (value === String(props.tests[index].answer)) {
    correctEver.value = { ...correctEver.value, [index]: true };
  }
  if (isComplete.value) {
    nextTick(() =>
      completion.value?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      }),
    );
  }
}

function selected(index, value) {
  return answers.value[index] === value;
}
function correct(index) {
  return answers.value[index] === String(props.tests[index].answer);
}
function reset() {
  answers.value = {};
  correctEver.value = {};
}

defineExpose({ reset, isComplete });
</script>

<template>
  <Activity
    class="prediction-tests-activity"
    :complete="isComplete"
    :state="state"
    @reset="reset"
  >
    <div class="prediction-test-list">
      <article
        v-for="(test, i) in tests"
        :key="i"
        class="prediction-test-card"
        :class="{ 'prediction-completed': correctEver[i] }"
      >
        <div class="prediction-test-heading">
          <span class="prediction-test-number">Example {{ i + 1 }}</span>
          <h3>{{ test.title }}</h3>
        </div>

        <div class="prediction-statement-grid">
          <div class="prediction-statement">
            <span class="prediction-statement-label">Testable question</span>
            <p v-html="test.question"></p>
          </div>

          <div class="prediction-statement">
            <span class="prediction-statement-label">Reasoned prediction</span>
            <p v-html="test.prediction"></p>
          </div>
        </div>

        <h4 class="prediction-results-heading">Experiment results</h4>

        <div class="prediction-result-image">
          <img :src="test.image" alt="Experiment results" />
        </div>

        <div class="prediction-choice-area">
          <p class="prediction-choice-question">
            Do the results support the reasoned prediction?
          </p>

          <div class="prediction-choice-buttons">
            <Button
              class="prediction-choice-button"
              :class="{
                selected: selected(i, 'true'),
                correct: selected(i, 'true') && correct(i),
                incorrect: selected(i, 'true') && !correct(i),
              }"
              :aria-pressed="selected(i, 'true')"
              @click="selectAnswer(i, 'true')"
            >
              Supported
            </Button>

            <Button
              class="prediction-choice-button"
              :class="{
                selected: selected(i, 'false'),
                correct: selected(i, 'false') && correct(i),
                incorrect: selected(i, 'false') && !correct(i),
              }"
              :aria-pressed="selected(i, 'false')"
              @click="selectAnswer(i, 'false')"
            >
              Not supported
            </Button>
          </div>

          <div
            v-if="answers[i] !== undefined"
            class="prediction-feedback"
            :class="correct(i) ? 'feedback-correct' : 'feedback-incorrect'"
            role="status"
            aria-live="polite"
          >
            {{ correct(i) ? test.correct : test.incorrect }}
          </div>
        </div>
      </article>
    </div>

    <div ref="completion" v-show="isComplete">
      <LessonEndCard :lesson-number="1">
        <template #list>
          <ol>
            <li>Writing a testable question</li>
            <li>'Making a prediction and giving a reason for your choice</li>
          </ol>
        </template>
      </LessonEndCard>
    </div>
    <div class="reset-button-container">
      <Button :is-reset="true" @click="reset">Reset</Button>
    </div>
  </Activity>
</template>

<style scoped>
.prediction-test-list {
  display: grid;
  gap: 28px;
}

.prediction-test-card {
  overflow: hidden;

  background: var(--paper);
  border: 3px solid var(--line);
  border-radius: 22px;

  box-shadow: 0 5px 0 var(--line);

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.prediction-test-card.prediction-completed {
  border-color: var(--green);
  box-shadow: 0 5px 0 var(--green);
}

.prediction-test-heading {
  display: flex;
  align-items: center;
  gap: 14px;

  padding: 18px 20px;

  background: var(--soft-blue);
  border-bottom: 3px solid var(--line);
}

.prediction-test-heading :deep(h3) {
  margin: 0;

  color: var(--text);

  font-size: 1.25rem;
}

.prediction-test-number {
  flex: 0 0 auto;

  padding: 7px 11px;

  background: var(--purple);
  color: white;

  border: 2px solid var(--line);
  border-radius: 10px;

  box-shadow: 0 2px 0 var(--line);

  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.prediction-statement-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  padding: 20px;
}

.prediction-statement {
  padding: 17px;

  background: white;
  border: 2px solid var(--line);
  border-radius: 16px;

  box-shadow: 0 3px 0 rgba(48, 51, 47, 0.18);
}

.prediction-statement:first-child {
  background: var(--soft-yellow);
}

.prediction-statement:last-child {
  background: var(--soft-purple);
}

.prediction-statement-label {
  display: block;

  margin-bottom: 8px;

  color: var(--purple);

  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.prediction-statement :deep(p) {
  margin: 0;

  color: var(--text);

  line-height: 1.6;
}

.prediction-results-heading {
  margin: 22px 20px 10px;

  color: var(--purple);

  font-size: 1rem;
  font-weight: 700;
}

.prediction-result-image {
  width: 100%;
  margin-bottom: 20px;
  padding: 18px;

  background: var(--soft-green);

  border: 2px dashed var(--green);
  border-radius: 18px;
}

.prediction-result-image :deep(img) {
  display: block;

  width: 100%;
  max-width: 850px;
  height: auto;

  margin: 0 auto;

  background: white;

  border: 2px solid var(--line);
  border-radius: 14px;
}

.prediction-choice-area {
  margin: 20px;
  padding: 18px;

  background: white;
  border: 2px solid var(--line);
  border-radius: 18px;
}

.prediction-choice-question {
  margin: 0 0 14px;

  color: var(--text);

  font-size: 1.05rem;
  font-weight: 700;
  text-align: center;
}

.prediction-choice-buttons {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.prediction-choice-button {
  min-width: 150px;
}

.prediction-choice-button.selected {
  transform: translateY(2px);
  --box-shadow: none;
}

.prediction-choice-button.correct {
  --background: var(--mint) !important;
  --color: var(--charcoal);
}

.prediction-choice-button.incorrect {
  background: var(--orange) !important;
}

.prediction-feedback {
  margin-top: 16px;
  padding: 14px 16px;

  border: 2px solid var(--line);
  border-radius: 14px;

  color: var(--text);

  font-weight: 600;
  line-height: 1.55;
}

.prediction-feedback[hidden] {
  display: none;
}

@media (max-width: 800px) {
  .prediction-statement-grid {
    grid-template-columns: 1fr;
  }

  .prediction-test-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .prediction-choice-buttons {
    display: grid;
    grid-template-columns: 1fr;
  }

  .prediction-choice-button {
    width: 100%;
  }
}

.feedback-correct {
  background: var(--soft-green);
}

.feedback-correct::before {
  content: "✓ ";
  font-weight: 700;
}

.feedback-incorrect {
  background: var(--soft-orange);
}

.feedback-incorrect::before {
  content: "↻ ";
  font-weight: 700;
}
</style>
