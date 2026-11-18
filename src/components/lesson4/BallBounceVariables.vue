<script setup>
/*
  Lesson 4 "Identify the variables in the fair test": pick the independent and
  dependent variables from dropdowns, tick the controlled variables, then
  Check Answers. Complete once checked and right; the answers are then locked.

    <BallBounceVariables name="ball-bounce-variables" />

  Saved through <Activity :state>.
*/
import { computed, ref } from "vue";
import Activity from "../activities/Activity.vue";
import Button from "../Button.vue";

const independentOptions = [
  { value: "surface", text: "Type of surface" },
  { value: "bounces", text: "Number of bounces" },
  { value: "ball", text: "Type of ball" },
];
const dependentOptions = [
  { value: "surface", text: "Type of surface" },
  { value: "bounces", text: "Number of bounces" },
  { value: "height", text: "Drop height" },
];
const controlOptions = [
  { value: "same-ball", text: "Same table tennis ball" },
  { value: "same-height", text: "Same drop height" },
  { value: "same-method", text: "Same dropping method" },
  { value: "same-surface", text: "Same surface" },
];
const ANSWER = {
  independent: "surface",
  dependent: "bounces",
  controls: ["same-ball", "same-height", "same-method"],
};

const independent = ref("");
const dependent = ref("");
const controls = ref([]);
const checked = ref(false); // Check Answers pressed since the last change
const state = { independent, dependent, controls, checked };

const correct = computed(
  () =>
    independent.value === ANSWER.independent &&
    dependent.value === ANSWER.dependent &&
    controls.value.length === ANSWER.controls.length &&
    ANSWER.controls.every((c) => controls.value.includes(c)),
);
const solved = computed(() => checked.value && correct.value);

// changing an answer after a wrong check hides the old feedback
function changed() {
  checked.value = false;
}

function reset() {
  independent.value = "";
  dependent.value = "";
  controls.value = [];
  checked.value = false;
}

defineExpose({ reset, solved });
</script>

<template>
  <Activity
    class="ball-bounce-variables"
    :complete="solved"
    :state="state"
    @reset="reset"
  >
    <slot />

    <div class="ball-bounce-variables-table">
      <div class="ball-bounce-variable-row">
        <div class="ball-bounce-variable-label">
          <strong>Independent variable</strong>
          <span>What is changed?</span>
        </div>
        <div class="ball-bounce-variable-answer">
          <select v-model="independent" :disabled="solved" @change="changed" aria-label="Independent variable">
            <option value="">Choose...</option>
            <option v-for="o in independentOptions" :key="o.value" :value="o.value">
              {{ o.text }}
            </option>
          </select>
        </div>
      </div>

      <div class="ball-bounce-variable-row">
        <div class="ball-bounce-variable-label">
          <strong>Dependent variable</strong>
          <span>What is measured?</span>
        </div>
        <div class="ball-bounce-variable-answer">
          <select v-model="dependent" :disabled="solved" @change="changed" aria-label="Dependent variable">
            <option value="">Choose...</option>
            <option v-for="o in dependentOptions" :key="o.value" :value="o.value">
              {{ o.text }}
            </option>
          </select>
        </div>
      </div>

      <div class="ball-bounce-variable-row">
        <div class="ball-bounce-variable-label">
          <strong>Controlled variables</strong>
          <span>What must stay the same?</span>
        </div>
        <div class="ball-bounce-variable-answer ball-bounce-controlled-options">
          <label v-for="o in controlOptions" :key="o.value">
            <input v-model="controls" type="checkbox" :value="o.value" :disabled="solved" @change="changed" />
            {{ o.text }}
          </label>
        </div>
      </div>
    </div>

    <div
      v-if="checked"
      class="variable-feedback ball-bounce-variables-feedback"
      :class="correct ? 'feedback-success' : 'feedback-try-again'"
      role="status"
      aria-live="polite"
    >
      {{
        correct
          ? "Correct! You identified the variables in the ball-bounce fair test."
          : "Not quite. Check what is changed, what is measured, and what needs to stay the same."
      }}
    </div>

    <div class="reset-button-container">
      <Button v-if="!solved" @click="checked = true">Check Answers</Button>
      <Button :is-reset="true" @click="reset" />
    </div>
  </Activity>
</template>

<style scoped>
.ball-bounce-variables-table {
  display: grid;
  gap: 12px;

  margin-top: 18px;
}

.ball-bounce-variable-row {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
  align-items: center;

  padding: 16px;

  background: white;

  border: 2px solid var(--line);
  border-radius: 14px;
}

.ball-bounce-variable-label {
  display: grid;
  gap: 3px;
}

.ball-bounce-variable-label span {
  color: var(--muted);
  font-size: 0.9rem;
}

.ball-bounce-variable-answer select {
  width: 100%;
  min-height: 46px;
  padding: 9px 12px;

  background: var(--paper);
  color: var(--text);

  border: 2px solid var(--charcoal);
  border-radius: 10px;

  font: inherit;
}

.ball-bounce-controlled-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.ball-bounce-controlled-options label {
  flex: 0 1 calc(50% - 5px);
  box-sizing: border-box;

  display: flex;
  align-items: center;
  gap: 9px;

  padding: 10px 12px;

  background: var(--soft-yellow);

  border: 2px solid var(--line);
  border-radius: 10px;

  cursor: pointer;
}

.ball-bounce-variables-feedback {
  margin-top: 18px;
  padding: 14px 16px;

  border: 2px solid var(--line);
  border-radius: 14px;

  background: var(--soft-blue);
}

.reset-button-container {
  display: flex;
  justify-content: center;
  gap: 12px;
}

@media (max-width: 700px) {
  .ball-bounce-variable-row {
    grid-template-columns: 1fr;
  }

  .ball-bounce-controlled-options label {
    flex-basis: 100%;
  }
}
</style>
