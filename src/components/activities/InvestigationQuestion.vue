<script setup>
/*
  ==================================================
  INVESTIGATION (TESTABLE) QUESTION BUILDER
  Pick a question structure ("If I change the ___, what happens to the
  ___?"), then fill in its two blanks to build one testable question.

    <InvestigationQuestion
      :variable-options="['ball size', 'drop height', ...]"
      @change="question = $event"
    />

  Props
  - variableOptions: words offered in each blank's dropdown (page-specific).
  - firstOptions / secondOptions: different words for the first ("change")
    and second ("measure") blank; each falls back to variableOptions. A blank
    with only one option is filled in automatically when a starter is chosen.
  - inputType: "text" makes each blank a single-answer <StudentEntry> instead
    (saved on Enter or blur, checked by the classroom language filter, shown
    in place of the box with a × to change it).
  - textInputClass: class for those text fields.
  - steps: lay the builder out as three numbered steps (choose a starter,
    choose the variables, check the question). Step 2 appears once a starter
    is chosen and step 3 once the question is complete (lesson 2).
  - templates: overrides the four structures (what/how/does/if). Each is
      { parts: [before-first, between, after-second],
        firstPlaceholder, secondPlaceholder }

  @change gets { structure, firstAnswer, secondAnswer, text } whenever the
  question changes (including after it's restored). Pass it on to a
  <PredictionTable :context="..."> to fill in its change / measure.

  Complete once a structure is chosen and both blanks are filled.
  Progress is saved and restored through <Activity :state>.
  ==================================================
*/
import { computed, ref, watch } from "vue";
import Activity from "./Activity.vue";
import StudentEntry from "../ui/StudentEntry.vue";
import Button from "../ui/Button.vue";
import Grid from "../Layout/Grid.vue";

const DEFAULT_TEMPLATES = {
  what: {
    parts: ["When I change the ", ", what happens to the ", "?"],
    firstPlaceholder: "What will you change?",
    secondPlaceholder: "What will you measure?",
  },
  how: {
    parts: ["How does changing the ", " affect the ", "?"],
    firstPlaceholder: "What will you change?",
    secondPlaceholder: "What will you measure?",
  },
  does: {
    parts: ["Does changing the ", " affect the ", "?"],
    firstPlaceholder: "What will you change?",
    secondPlaceholder: "What will you measure?",
  },
  if: {
    parts: ["If I change the ", ", what happens to the ", "?"],
    firstPlaceholder: "What will you change?",
    secondPlaceholder: "What will you measure?",
  },
};

const STRUCTURES = [
  {
    key: "what",
    text: "When I change the ______, what happens to the ______?",
  },
  { key: "how", text: "How does changing the ______ affect the ______?" },
  { key: "does", text: "Does changing the ______ affect the ______?" },
  { key: "if", text: "If I change the ______, what happens to the ______?" },
];

const props = defineProps({
  tag: { type: String, default: "div" },
  variableOptions: { type: Array, default: () => [] },
  firstOptions: { type: Array, default: null },
  secondOptions: { type: Array, default: null },
  inputType: { type: String, default: "select" },
  textInputClass: { type: String, default: "question-blank-input" },
  templates: { type: Object, default: null },
  steps: { type: Boolean, default: false },
});

const emit = defineEmits(["change"]);

// Saved progress
const structure = ref("");
const answers = ref({ first: "", second: "" });
const state = { structure, answers };

// What's typed / picked in each blank before it's saved
const drafts = ref({ first: "", second: "" });

const templates = computed(() => props.templates || DEFAULT_TEMPLATES);
const template = computed(() => templates.value[structure.value] || null);

const text = computed(() => {
  const t = template.value;
  if (!t || !answers.value.first || !answers.value.second) return "";
  return (
    t.parts[0] +
    answers.value.first +
    t.parts[1] +
    answers.value.second +
    t.parts[2]
  );
});

const isComplete = computed(() => !!text.value);

const blanks = computed(() =>
  template.value
    ? [
        { name: "first", placeholder: template.value.firstPlaceholder },
        { name: "second", placeholder: template.value.secondPlaceholder },
      ]
    : [],
);

function optionsFor(name) {
  const own = name === "first" ? props.firstOptions : props.secondOptions;
  return own || props.variableOptions;
}

function selectStructure(key) {
  if (!templates.value[key]) return;
  structure.value = key;
  answers.value = { first: "", second: "" };
  drafts.value = { first: "", second: "" };
  // only one possible answer: fill it in
  if (props.inputType !== "text") {
    for (const name of ["first", "second"]) {
      const options = optionsFor(name);
      if (options.length === 1) answers.value[name] = options[0];
    }
  }
}

// dropdown mode only; text mode saves through <StudentEntry>
function saveAnswer(name) {
  const value = drafts.value[name];
  if (!value) return;
  answers.value[name] = value;
  drafts.value[name] = "";
}

function editAnswer(name) {
  answers.value[name] = "";
}

function reset() {
  structure.value = "";
  answers.value = { first: "", second: "" };
  drafts.value = { first: "", second: "" };
}

// <StudentEntry> works with a list; each blank keeps a single string
function entryAnswers(name) {
  return answers.value[name] ? [answers.value[name]] : [];
}

function setEntryAnswers(name, list) {
  answers.value[name] = list[0] ?? "";
}

// Tell the page whenever the question changes, including after a restore.
watch(
  [structure, answers],
  () =>
    emit("change", {
      structure: structure.value,
      firstAnswer: answers.value.first,
      secondAnswer: answers.value.second,
      text: text.value,
    }),
  { deep: true },
);

defineExpose({ reset, isComplete, text });
</script>

<template>
  <Activity
    :tag="tag"
    :complete="isComplete"
    :state="state"
    :class="{ 'question-builder-steps': steps }"
    @reset="reset"
  >
    <div :class="{ 'question-builder-step': steps }">
      <template v-if="steps">
        <h3>Step 1: Choose a question starter</h3>
        <p>Choose one way to begin your fair test question.</p>
      </template>
      <Grid cols="2" gap="md" class="question-structure-grid">
        <Button
          v-for="s in STRUCTURES"
          :key="s.key"
          class="question-structure-card"
          :class="[
            'question-structure-' + s.key,
            { selected: structure === s.key },
          ]"
          :aria-pressed="structure === s.key"
          @click="selectStructure(s.key)"
        >
          {{ s.text }}
        </Button>
      </Grid>
    </div>

    <div v-if="!steps || template" :class="{ 'question-builder-step': steps }">
      <template v-if="steps">
        <h3>Step 2: Choose your variables</h3>
        <p>
          Choose what you will change and what you will measure. You can choose
          either one first.
        </p>
      </template>
      <div
        class="investigation-question-builder"
        :class="{ 'builder-active': template }"
        aria-live="polite"
      >
        <p v-if="!template" class="question-builder-placeholder">
          Select a question structure above to begin.
        </p>

        <template v-else>
          <div class="question-builder-sentence">
            <template v-for="(blank, i) in blanks" :key="blank.name">
              {{ template.parts[i] }}
              <span class="question-blank">
                <StudentEntry
                  v-if="inputType === 'text'"
                  :key="structure + ':' + blank.name"
                  :answers="entryAnswers(blank.name)"
                  :multiple-inputs="false"
                  :maxlength="50"
                  :input-class="textInputClass"
                  :placeholder="blank.placeholder"
                  :aria-label="blank.placeholder"
                  @update:answers="setEntryAnswers(blank.name, $event)"
                />

                <template v-else>
                  <span
                    v-if="!answers[blank.name]"
                    class="question-blank-input-row"
                  >
                    <select
                      v-model="drafts[blank.name]"
                      class="question-blank-input"
                      :aria-label="blank.placeholder"
                      @change="saveAnswer(blank.name)"
                    >
                      <option value="" disabled>{{ blank.placeholder }}</option>
                      <option
                        v-for="option in optionsFor(blank.name)"
                        :key="option"
                        :value="option"
                      >
                        {{ option }}
                      </option>
                    </select>
                  </span>
                  <span v-else class="question-blank-answer visible">
                    <span class="question-blank-answer-text">{{
                      answers[blank.name]
                    }}</span>
                    <Button
                      :is-delete="true"
                      :aria-label="`Edit ${answers[blank.name]}`"
                      @click="editAnswer(blank.name)"
                    />
                  </span>
                </template>
              </span>
            </template>
            {{ template.parts[2] }}
          </div>

          <div v-if="text && !steps" class="completed-investigation-question">
            {{ text }}
          </div>
        </template>
      </div>
    </div>

    <div v-if="steps && text" class="question-builder-step question-review">
      <h3>Step 3: Check your testable question</h3>
      <p>{{ text }}</p>
    </div>

    <slot />
  </Activity>
</template>

<style>
/* ---------- steps layout (lesson 2) ---------- */
.question-builder-step {
  margin-bottom: 16px;
  padding: 20px;
  background: white;
  border: 2px solid var(--line);
  border-radius: 18px;
  animation: pop-fade-in 0.4s ease;
}

.question-builder-step h3 {
  margin: 0 0 6px;
  color: var(--purple);
  font-size: 1.15rem;
}

.question-builder-step > p {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.question-builder-step .question-structure-grid {
  margin-top: 14px;
}

.question-builder-steps .investigation-question-builder {
  margin: 14px 0 0;
}

.question-review {
  background: var(--soft-green);
}

.question-review > p {
  margin-top: 10px;
  color: var(--text);
  font-size: 1.08rem;
  font-weight: 700;
  line-height: 1.55;
}

.question-structure-card {
  margin-bottom: 0;
  padding: 18px;
  min-height: 110px;

  background: var(--paper);
  color: var(--text);
  font: inherit;
  font-weight: 700;

  --background-hover: var(--soft-blue);
  --color-hover: inherit;
  --background-active: var(--soft-yellow);
  --color-active: inherit;
}

/* ==================================================
      DESIGN AN INVESTIGATION QUESTION
      ================================================== */
.question-blank-answer.visible {
  display: flex;
}

.question-structure-card.question-structure-what {
  border-top: 4px solid var(--yellow);
}

.question-structure-card.question-structure-how {
  border-top: 4px solid var(--blue);
  --background-active: var(--soft-blue);
}

.question-structure-card.question-structure-does {
  border-top: 4px solid var(--green);
  --background-active: var(--soft-green);
}

.question-structure-card.question-structure-if {
  border-top: 4px solid var(--purple);
  --background-active: var(--soft-purple);
}

.investigation-question-builder {
  margin: 18px 0 24px;
  padding: 24px;

  background: var(--paper);
  border: 2px dashed var(--line);
  border-radius: 18px;

  color: var(--text);
}

.investigation-question-builder.builder-active {
  border-style: solid;
  background: var(--soft-blue);
}

.question-builder-placeholder {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
  text-align: center;
}

.question-builder-sentence {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 9px;

  margin: 0;

  color: var(--text);
  font-size: 1.08rem;
  font-weight: 700;
  line-height: 1.8;
}

.question-blank {
  display: inline-block;
  min-width: 190px;
  max-width: 100%;
  vertical-align: middle;
}

.question-blank-input-row {
  display: inline-block;
  position: relative;
  width: fit-content;
}

.question-blank-input {
  width: auto;
  min-width: 225px;
  min-height: 44px;
  padding: 9px 12px;

  background: white;
  color: var(--text);

  border: 2px solid var(--line);
  border-radius: 12px;

  font: inherit;
  font-weight: 600;
}

.question-blank-input:focus {
  border: 3px solid rgba(78, 50, 232, 0.18);
  border-color: var(--purple);
}

.question-blank-input-row select {
  box-sizing: border-box;
}

.question-blank-input-row label {
  position: absolute;
  top: 8px;
  left: 10px;
  justify-content: center;
  align-items: center;

  pointer-events: none;
}

.question-blank-answer {
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  width: 100%;
  min-height: 44px;
  padding: 9px 11px;

  background: white;
  border: 2px solid var(--line);
  border-radius: 12px;

  color: var(--text);
  font-weight: 700;
  overflow-wrap: anywhere;
}

.question-blank-answer.visible {
  display: flex;
}

.question-blank-answer-text {
  flex: 1;
  min-width: 0;
}

.completed-investigation-question {
  margin: 20px 0 0;
  padding: 16px 18px;

  background: var(--soft-green);
  border: 2px solid var(--line);
  border-radius: 16px;

  color: var(--text);
  font-weight: 700;
  line-height: 1.55;
  text-align: center;
}

.completed-investigation-question[hidden] {
  display: none;
}

@media (max-width: 650px) {
  .question-builder-sentence {
    align-items: stretch;
    flex-direction: column;
  }

  .question-blank {
    width: 100%;
  }
}

@media (max-width: 650px) {
  .question-structure-grid {
    grid-template-columns: 1fr;
  }
}
</style>
