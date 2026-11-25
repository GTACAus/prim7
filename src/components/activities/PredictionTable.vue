<script setup>
import { computed, reactive, ref, watch } from "vue";
import Activity from "./Activity.vue";
import Button from "../ui/Button.vue";

const props = defineProps({
  tag: { type: String, default: "div" },
  options: { type: Object, default: () => ({}) },
  changeOptions: { type: Array, default: null },
  measureOptions: { type: Array, default: null },
  showReset: { type: Boolean, default: false },
  context: { type: Object, default: null },
  // column headings above the change / measure cells
  changeLabel: { type: String, default: "Change this" },
  measureLabel: { type: String, default: "Measure this" },
  // words for the three effects, e.g. { increase: "improve",
  // decrease: "get worse" } for something described rather than counted
  effectWords: { type: Object, default: null },
  // wording of the change inside the prediction, when it reads better than
  // the question's (e.g. "fertiliser" for "use of fertiliser")
  changePhrase: { type: String, default: "" },
  // [condition 1, condition 2] filled in when "Condition 1 versus
  // condition 2" is chosen (the student can still change them)
  conditions: { type: Array, default: null },
});
const emit = defineEmits(["update:context"]);
const defaults = {
  "increase-decrease": [
    { value: "increase", label: "Increase" },
    { value: "decrease", label: "Decrease" },
  ],
  "with-without": [
    { value: "with", label: "With" },
    { value: "without", label: "Without" },
  ],
  "condition-comparison": [
    { value: "condition-one-to-two", label: "Condition 1" },
    { value: "condition-two-to-one", label: "Condition 2" },
  ],
};
const effectPhrases = {
  increase: "increase",
  decrease: "decrease",
  "stay-the-same": "stay the same",
};
const causeOptions = computed(() => props.options.causeOptions || defaults);
const effects = computed(() => ({ ...effectPhrases, ...props.effectWords }));
const changeSelection = ref("");
const measureSelection = ref("");
const externalContext = ref({ structure: "", change: "", measure: "" });
watch(
  () => props.context,
  (value) => {
    externalContext.value = {
      structure: value?.structure || "",
      change: value?.change || "",
      measure: value?.measure || "",
    };
  },
  { immediate: true, deep: true },
);
function setContext(value = {}) {
  externalContext.value = {
    structure: value.structure || "if",
    change: value.change || "",
    measure: value.measure || "",
  };
}
const structure = computed(() =>
  props.changeOptions || props.measureOptions
    ? "if"
    : externalContext.value.structure,
);
const change = computed(() =>
  props.changeOptions ? changeSelection.value : externalContext.value.change,
);
const measure = computed(() =>
  props.measureOptions ? measureSelection.value : externalContext.value.measure,
);
const causeType = ref("");
const selectedCause = ref("");
const selectedEffect = ref("");
const entries = reactive({
  conditionOne: { draft: "", saved: "" },
  conditionTwo: { draft: "", saved: "" },
  reason: { draft: "", saved: "" },
});
const choices = computed(() => causeOptions.value[causeType.value] || []);

// Saved by <Activity> and restored when the page loads. The context from
// another activity (props.context / setContext) isn't saved here: that
// activity restores itself and passes it back in.
const state = {
  changeSelection,
  measureSelection,
  causeType,
  selectedCause,
  selectedEffect,
  entries,
};

// Only when the student picks a different relationship type (not a watcher,
// so restoring causeType doesn't wipe the restored cause and conditions).
function changeCauseType() {
  selectedCause.value = "";
  clearEntry("conditionOne");
  clearEntry("conditionTwo");
  if (causeType.value === "condition-comparison" && props.conditions) {
    entries.conditionOne.saved = props.conditions[0] || "";
    entries.conditionTwo.saved = props.conditions[1] || "";
  }
}
function submitEntry(name) {
  const entry = entries[name];
  const value = entry.draft.trim();
  if (value) {
    entry.saved = value;
    entry.draft = "";
  }
}
function clearEntry(name) {
  entries[name].saved = "";
  entries[name].draft = "";
}
function optionLabel(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}
function causeAction() {
  if (!change.value || !selectedCause.value) return null;
  const one = entries.conditionOne.saved || "condition 1";
  const two = entries.conditionTwo.saved || "condition 2";
  const phrase = props.changePhrase || change.value;
  switch (selectedCause.value) {
    case "increase":
      return { verb: "increase " + phrase, gerund: "increasing " + phrase };
    case "decrease":
      return { verb: "decrease " + phrase, gerund: "decreasing " + phrase };
    case "with":
      return {
        verb: "conduct the experiment with " + phrase,
        gerund: "conducting the experiment with " + phrase,
      };
    case "without":
      return {
        verb: "conduct the experiment without " + phrase,
        gerund: "conducting the experiment without " + phrase,
      };
    case "condition-one-to-two":
      return {
        verb: `change ${phrase} from ${one} to ${two}`,
        gerund: `changing ${phrase} from ${one} to ${two}`,
      };
    case "condition-two-to-one":
      return {
        verb: `change ${phrase} from ${two} to ${one}`,
        gerund: `changing ${phrase} from ${two} to ${one}`,
      };
    default:
      return null;
  }
}
const phrases = computed(() => {
  const action = causeAction();
  const effect = effects.value[selectedEffect.value];
  if (!structure.value || !measure.value || !action || !effect)
    return { cause: "", effect: "" };
  switch (structure.value.toLowerCase()) {
    case "what":
      return {
        cause: "When I " + action.verb,
        effect: `${measure.value} will ${effect}`,
      };
    case "how":
    case "does":
      return {
        cause: optionLabel(action.gerund),
        effect: `will cause ${measure.value} to ${effect}`,
      };
    case "if":
      return {
        cause: "If I " + action.verb,
        effect: `then ${measure.value} will ${effect}`,
      };
    default:
      return { cause: "", effect: "" };
  }
});
const fullPrediction = computed(() => {
  if (!phrases.value.cause || !phrases.value.effect) return "";
  const separator = ["how", "does"].includes(structure.value?.toLowerCase())
    ? " "
    : ", ";
  const sentence = phrases.value.cause + separator + phrases.value.effect + ".";
  return entries.reason.saved
    ? sentence + " This is because " + entries.reason.saved + "."
    : sentence;
});
const isComplete = computed(
  () =>
    !!phrases.value.cause && !!phrases.value.effect && !!entries.reason.saved,
);
function reset() {
  changeSelection.value = "";
  measureSelection.value = "";
  externalContext.value = { structure: "", change: "", measure: "" };
  causeType.value = "";
  selectedCause.value = "";
  selectedEffect.value = "";
  for (const name of Object.keys(entries)) clearEntry(name);
}
defineExpose({ reset, setContext, isComplete });
</script>

<template>
  <Activity :tag="tag" :complete="isComplete" :state="state" @reset="reset">
    <!-- anything that sits above the organiser, e.g. a heading -->
    <slot name="before" />

    <div class="reasoned-builder">
      <div
        class="prediction-organiser"
        aria-label="Reasoned prediction graphic organiser"
      >
        <div class="prediction-organiser-row row-header">
          <div class="prediction-organiser-cell">
            <span class="cell-sublabel"></span>
          </div>
          <div class="prediction-organiser-cell">
            <span class="cell-sublabel">{{ changeLabel }}</span>
          </div>
          <div class="prediction-organiser-cell">
            <span class="cell-sublabel">{{ measureLabel }}</span>
          </div>
        </div>

        <div class="prediction-organiser-row row-variables">
          <div class="prediction-organiser-cell cell-label">
            <span class="cell-sublabel">Testable Question</span>
            <span class="cell-helper"
              >Identify the two things in your testable question</span
            >
          </div>

          <div class="prediction-organiser-cell">
            <label class="cell-sublabel">The thing I am changing</label>

            <select
              v-if="changeOptions"
              v-model="changeSelection"
              class="prediction-select"
            >
              <option value="">Choose what you are changing</option>
              <option
                v-for="option in changeOptions"
                :key="option"
                :value="option"
              >
                {{ optionLabel(option) }}
              </option>
            </select>
            <div
              v-else
              class="generated-text"
              :class="{ placeholder: !change }"
            >
              {{ change || "The thing I am changing" }}
            </div>
          </div>

          <div class="prediction-organiser-cell">
            <label class="cell-sublabel">The thing I am measuring</label>

            <select
              v-if="measureOptions"
              v-model="measureSelection"
              class="prediction-select"
            >
              <option value="">Choose what you are measuring</option>
              <option
                v-for="option in measureOptions"
                :key="option"
                :value="option"
              >
                {{ optionLabel(option) }}
              </option>
            </select>
            <div
              v-else
              class="generated-text"
              :class="{ placeholder: !measure }"
            >
              {{ measure || "The thing I am measuring" }}
            </div>
          </div>
        </div>

        <div class="prediction-organiser-row row-relationship">
          <div class="prediction-organiser-cell cell-label">
            <span class="cell-sublabel">Relationship</span>
            <span class="cell-helper"
              >Choose what you will change and what you think will happen</span
            >
          </div>
          <div class="prediction-organiser-cell">
            <label class="cell-sublabel">Cause</label>
            <div class="relationship-area">
              <select
                v-model="causeType"
                class="prediction-select"
                @change="changeCauseType"
              >
                <option value="">Choose a relationship type</option>
                <option value="increase-decrease">Increase / decrease</option>
                <option value="with-without">With / without</option>
                <option value="condition-comparison">
                  Condition 1 versus condition 2
                </option>
              </select>
              <div class="relationship-buttons">
                <button
                  v-for="choice in choices"
                  :key="choice.value"
                  type="button"
                  class="relationship-option"
                  :class="{ selected: selectedCause === choice.value }"
                  @click="selectedCause = choice.value"
                >
                  {{ choice.label }}
                </button>
              </div>
              <div
                v-show="causeType === 'condition-comparison'"
                class="condition-comparison-inputs visible"
              >
                <div
                  v-for="name in ['conditionOne', 'conditionTwo']"
                  :key="name"
                >
                  <div
                    v-if="entries[name].saved"
                    class="submitted-answer visible"
                  >
                    {{ entries[name].saved }}
                    <button
                      type="button"
                      class="delete-answer"
                      @click="clearEntry(name)"
                    >
                      ×
                    </button>
                  </div>
                  <input
                    v-else
                    v-model="entries[name].draft"
                    class="condition-input"
                    type="text"
                    :placeholder="
                      name === 'conditionOne'
                        ? 'Starting condition, e.g. blue'
                        : 'New condition, e.g. red'
                    "
                    @keydown.enter.prevent="submitEntry(name)"
                    @blur="submitEntry(name)"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="prediction-organiser-cell">
            <span class="cell-sublabel">Effect or result</span>
            <div class="relationship-buttons three-options">
              <button
                v-for="(word, value) in effects"
                :key="value"
                type="button"
                class="relationship-option"
                :class="{ selected: selectedEffect === value }"
                @click="selectedEffect = value"
              >
                {{ optionLabel(word) }}
              </button>
            </div>
          </div>
        </div>

        <div class="prediction-organiser-row row-prediction">
          <div class="prediction-organiser-cell cell-label">
            <span class="cell-sublabel">Prediction</span>
          </div>
          <div class="prediction-organiser-cell">
            <div
              class="generated-text"
              :class="{ placeholder: !phrases.cause }"
            >
              {{ phrases.cause || "Choose a cause relationship." }}
            </div>
          </div>
          <div class="prediction-organiser-cell">
            <div
              class="generated-text"
              :class="{ placeholder: !phrases.effect }"
            >
              {{ phrases.effect || "Choose an effect or result." }}
            </div>
          </div>
        </div>

        <div class="prediction-organiser-row row-reason">
          <div class="prediction-organiser-cell cell-label">
            <span class="cell-sublabel">Reason</span>
          </div>
          <div class="prediction-organiser-cell span-2 reason-inline">
            <label class="cell-helper">This is because...</label>
            <div v-if="entries.reason.saved" class="submitted-answer visible">
              {{ entries.reason.saved }}
              <Button :is-delete="true" @click="clearEntry('reason')" />
            </div>
            <input
              v-else
              v-model="entries.reason.draft"
              type="text"
              class="prediction-input"
              placeholder="Explain why you expect this result"
              @keydown.enter.prevent="submitEntry('reason')"
              @blur="submitEntry('reason')"
            />
          </div>
        </div>

        <div class="prediction-organiser-row row-full">
          <div class="prediction-organiser-cell cell-label">
            <span class="cell-sublabel">Reasoned prediction</span>
          </div>
          <div class="prediction-organiser-cell span-2">
            <div
              class="generated-text final-prediction"
              :class="{ placeholder: !fullPrediction }"
              aria-live="polite"
            >
              {{
                fullPrediction ||
                "Complete the organiser to build your reasoned prediction."
              }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="showReset" class="reset-button-container">
        <Button :is-reset="true" @click="reset">Reset</Button>
      </div>
    </div>

    <!-- anything that sits below the organiser -->
    <slot />
  </Activity>
</template>

<style scoped>
/* ==================================================
   REASONED PREDICTION BUILDER
   
   The prediction organiser table, embedded directly in
   lesson1.html, lesson2.html and lesson3.html.
   ================================================== */

.reasoned-builder {
  width: min(1080px, 100%);
  margin: 0 auto;
}

.prediction-organiser {
  overflow: hidden;
  border: 3px solid var(--line);
  border-radius: 20px;
  box-shadow: 0 5px 0 var(--line);
}

.prediction-organiser-row {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) minmax(0, 1fr);
  border-bottom: 2px solid var(--line);
}

.prediction-organiser-row:last-child {
  border-bottom: none;
}

.prediction-organiser-cell {
  min-width: 0;
  padding: 14px 18px;
  border-right: 2px solid var(--line);
  font-size: 0.95rem;
  line-height: 1.55;
}

.prediction-organiser-cell:last-child {
  border-right: none;
}

.prediction-organiser-cell.span-2 {
  grid-column: span 2;
  border-right: none;
}

.row-header {
  background: var(--purple);
}

.row-header .prediction-organiser-cell {
  color: var(--paper);
  font-size: 1rem;
  font-weight: 700;
}

.row-variables {
  background: var(--soft-blue);
}

.row-relationship {
  background: var(--soft-yellow);
}

.row-prediction {
  background: var(--soft-green);
}

.row-reason {
  background: var(--soft-purple);
}

.row-full {
  background: var(--card);
}

.cell-label {
  background: rgba(0, 0, 0, 0.04);
  font-weight: 700;
}

.cell-sublabel {
  display: block;
  margin-bottom: 5px;
  color: var(--purple);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.row-header .cell-sublabel {
  color: var(--cream);
}

.cell-helper {
  display: block;
  color: var(--muted);
  font-size: 0.88rem;
  font-style: italic;
  line-height: 1.5;
}

.prediction-input,
.prediction-select,
.condition-input {
  width: 100%;
  min-height: 44px;
  padding: 9px 11px;
  box-sizing: border-box;
  background: white;
  color: var(--text);
  border: 2px solid var(--line);
  border-radius: 10px;
  font: inherit;
}

.prediction-input:focus,
.prediction-select:focus,
.condition-input:focus {
  outline: 3px solid rgba(78, 50, 232, 0.18);
  border-color: var(--purple);
}

.submitted-answer {
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 9px 11px;
  box-sizing: border-box;
  background: var(--soft-green);
  color: var(--text);
  border: 2px solid var(--line);
  border-radius: 10px;
  font-weight: 700;
}

.submitted-answer.visible {
  display: flex;
}

.submitted-answer :deep(.delete-answer) {
  flex: 0 0 auto;
}

.relationship-area {
  display: grid;
  gap: 10px;
}

.relationship-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.relationship-buttons.three-options {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.relationship-option {
  min-height: 42px;
  padding: 8px 10px;
  background: white;
  color: var(--text);
  border: 2px solid var(--line);
  border-radius: 10px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.relationship-option:hover {
  background: var(--soft-purple);
  cursor: pointer;
}

.prediction-select:hover {
  cursor: pointer;
}

.relationship-option.selected {
  background: var(--purple);
  color: white;
}

.condition-comparison-inputs {
  display: none;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.condition-comparison-inputs.visible {
  display: grid;
}

.generated-text {
  min-height: 48px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.55);
  border: 2px solid var(--line);
  border-radius: 10px;
  font-weight: 700;
  line-height: 1.5;
}

.generated-text.placeholder {
  color: var(--muted);
  font-weight: 500;
}

.reason-inline {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.reason-inline .cell-helper {
  flex: 0 0 auto;
  margin: 0;
  white-space: nowrap;

  color: var(--purple);
  font-size: 0.82rem;
  font-weight: 700;
  font-style: normal;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.reason-inline .prediction-input {
  width: 100%;
}

.reason-inline .submitted-answer {
  flex: 1;
  min-width: 0;
}

.prediction-select {
  max-width: 100%;
  text-overflow: ellipsis;
}

.prediction-organiser-cell {
  overflow-wrap: anywhere;
}

.final-prediction {
  background: var(--soft-green);
  font-size: inherit;
}

.reset-button-container {
  display: flex;
  justify-content: center;
  margin-top: 18px;
}

@media (max-width: 1050px) {
  .prediction-organiser-row {
    grid-template-columns: 155px minmax(0, 1fr) minmax(0, 1fr);
  }

  .prediction-organiser-cell {
    padding: 12px 14px;
    font-size: 0.9rem;
  }

  .cell-sublabel {
    font-size: 0.76rem;
  }
}

@media (max-width: 820px) {
  .reasoned-builder {
    width: 100%;
  }

  .prediction-organiser-row {
    grid-template-columns: 118px minmax(0, 1fr) minmax(0, 1fr);
  }

  .prediction-organiser-cell {
    padding: 9px 10px;
    font-size: 0.78rem;
    line-height: 1.35;
  }

  .cell-sublabel {
    margin-bottom: 4px;
    font-size: 0.67rem;
    letter-spacing: 0.025em;
  }

  .cell-helper {
    font-size: 0.72rem;
    line-height: 1.35;
  }

  .prediction-input,
  .prediction-select,
  .condition-input {
    min-height: 38px;
    padding: 7px 8px;
    font-size: 0.78rem;
  }

  .relationship-option {
    min-height: 38px;
    padding: 6px 5px;
    font-size: 0.76rem;
  }

  .generated-text {
    min-height: 42px;
    padding: 8px 9px;
    font-size: 0.76rem;
    line-height: 1.35;
  }

  .reason-inline {
    gap: 8px;
  }

  .reason-inline .cell-helper {
    font-size: 0.66rem;
    white-space: nowrap;
  }

  .final-prediction {
    font-size: 0.8rem;
  }

  .reset-button-container {
    margin-top: 14px;
  }

  :deep(.reset-btn) {
    padding: 9px 16px;
    font-size: 0.8rem;
  }
}

@media (max-width: 600px) {
  .prediction-organiser-row {
    grid-template-columns: 92px minmax(0, 1fr) minmax(0, 1fr);
  }

  .prediction-organiser-cell {
    padding: 7px 6px;
    font-size: 0.67rem;
  }

  .cell-sublabel {
    font-size: 0.58rem;
  }

  .cell-helper {
    font-size: 0.62rem;
  }

  .prediction-input,
  .prediction-select,
  .condition-input {
    min-height: 34px;
    padding: 5px 6px;
    font-size: 0.68rem;
  }

  .relationship-buttons,
  .relationship-buttons.three-options,
  .condition-comparison-inputs {
    gap: 4px;
    grid-template-columns: 1fr;
  }

  .relationship-option {
    min-height: 34px;
    padding: 4px 3px;
    font-size: 0.64rem;
  }

  .generated-text {
    min-height: 36px;
    padding: 6px;
    font-size: 0.65rem;
  }

  .reason-inline {
    gap: 5px;
  }

  .reason-inline .cell-helper {
    font-size: 0.56rem;
  }

  .final-prediction {
    font-size: 0.68rem;
  }
}

</style>
