<script setup>
/*
  VARIABLE SORT
  Pick a role (independent / dependent / controlled), then click the tiles
  that belong to it - either against a fixed answer key, or against an open
  set of valid variables for each role.

    <VariableSort :options="{ answers: { independent: 'bounce-surface',
                                         dependent: 'bounce-height',
                                         controlled: ['ball-size', ...] } }">
      <template #autofillTestableQuestion>How does ...?</template>
    </VariableSort>

  options - exactly one of answers / options:
  - answers: the one right classification (fixed).
  - options: { independent: [...], dependent: [...], controlled: [...] } -
    any tile in a role's list is valid for it (open). Controlled can't be
    chosen until independent and dependent are both done.
  - tiles: the tile names in the order to show them (default: the names in
    answers / options, in that order - which puts the answers first).
  - prompts / messages: override the built-in text (see DEFAULT_* below).

  Tiles are the variables named in answers / options ("ball-size" shows as
  "Ball size"). Independent and dependent are each chosen once; controlled
  stays available until every controlled variable is done.

  Complete once independent, dependent and every controlled variable are
  classified. Progress (which tile has which role) is saved through
  <Activity :state>.
*/
import { computed, nextTick, ref } from "vue";
import Activity from "./Activity.vue";
import Button from "../Button.vue";

const DEFAULT_PROMPTS = {
  independent: "Choose the variable that is changed.",
  dependent: "Choose the variable that is measured.",
  controlled: "Choose all the variables that must be kept the same.",
};

const DEFAULT_MESSAGES = {
  defaultMessage: "Choose a variable type, then select the matching variable.",
  chooseModeFirst:
    "Choose Independent Variable, Dependent Variable or Controlled Variable first.",

  independentWrongType:
    "That is a measurable outcome. Choose a variable that you can change.",
  independentWrong: "Try again. Which variable is changed in the question?",
  independentSuccess: "Independent variable selected.",

  dependentWrongType:
    "That is a variable you can change or keep the same. Choose a measurable result instead.",
  dependentWrong: "Try again. Which result is observed or measured?",
  dependentSuccess: "Dependent variable selected.",

  controlledNeedsBoth:
    "Choose one independent variable and one dependent variable before selecting the controlled variables.",
  controlledWrongType:
    "That is a measurable outcome, not a variable that needs to be kept the same.",
  controlledWrong:
    "Try again. That variable doesn't need to be controlled in this investigation.",
  controlledMore:
    "Controlled variable selected. Choose any other variables that must be kept the same.",
  controlledDone: "All controlled variables have been selected.",

  allDone:
    "You identified the independent, dependent and controlled variables.",
};

const MODES = [
  {
    id: "independent",
    title: "Independent Variable",
    subtitle: "Change",
    label: "Independent variable",
  },
  {
    id: "dependent",
    title: "Dependent Variable",
    subtitle: "Measure",
    label: "Dependent variable",
  },
  {
    id: "controlled",
    title: "Controlled Variable",
    subtitle: "Keep the same",
    label: "Controlled variable",
  },
];
const roleLabel = Object.fromEntries(MODES.map((m) => [m.id, m.label]));

const props = defineProps({
  tag: { type: String, default: "div" },
  options: { type: Object, default: () => ({}) },
});

const fixed = computed(() => props.options.answers || null);
const open = computed(() => props.options.options || null);
const prompts = computed(() => props.options.prompts || DEFAULT_PROMPTS);
const messages = computed(() => ({
  ...DEFAULT_MESSAGES,
  ...(props.options.messages || {}),
}));

const tiles = computed(() => {
  if (props.options.tiles) return props.options.tiles;
  if (open.value) return [...new Set(Object.values(open.value).flat())];
  if (fixed.value) {
    const { independent, dependent, controlled } = fixed.value;
    return [...new Set([independent, dependent, ...controlled])];
  }
  return [];
});

function tileLabel(name) {
  const text = name.replaceAll("-", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Saved progress: { tileName: "independent" | "dependent" | "controlled" }
const roles = ref({});
const saved = { roles }; // the ref itself, so <Activity> can restore it

// Not saved
const mode = ref("");
const feedback = ref({ text: DEFAULT_MESSAGES.defaultMessage, variant: "" });
const buzzing = ref({});

const has = (role) => Object.values(roles.value).includes(role);

const controlledDone = computed(() =>
  fixed.value
    ? fixed.value.controlled.every((name) => roles.value[name] === "controlled")
    : (open.value?.controlled || []).every(
        (name) =>
          roles.value[name] === "independent" ||
          roles.value[name] === "controlled",
      ),
);

const isComplete = computed(
  () =>
    tiles.value.length > 0 &&
    has("independent") &&
    has("dependent") &&
    controlledDone.value,
);

// independent / dependent are chosen once; controlled until all are done
function modeDisabled(id) {
  if (isComplete.value) return true;
  return id === "controlled" ? controlledDone.value : has(id);
}

function show(text, variant = "") {
  feedback.value = { text, variant };
}

function setMode(id) {
  mode.value = id;
  show(prompts.value[id] || messages.value.defaultMessage);
}

async function buzz(name, element, message) {
  show(message, "feedback-try-again");
  // restart the shake animation on repeated wrong clicks
  buzzing.value[name] = false;
  await nextTick();
  void element?.offsetWidth;
  buzzing.value[name] = true;
}

function selectTile(name, event) {
  if (roles.value[name] || isComplete.value) return;

  const m = messages.value;
  const role = mode.value;
  const element = event.currentTarget;

  if (!role) return buzz(name, element, m.chooseModeFirst);

  if (role === "independent" || role === "dependent") {
    if (open.value && !open.value[role].includes(name))
      return buzz(name, element, m[role + "WrongType"]);
    if (fixed.value && name !== fixed.value[role])
      return buzz(name, element, m[role + "Wrong"]);

    roles.value = { ...roles.value, [name]: role };
    mode.value = "";
    show(m[role + "Success"], "feedback-success");
  } else {
    if (open.value && (!has("independent") || !has("dependent")))
      return buzz(name, element, m.controlledNeedsBoth);
    if (open.value && !open.value.controlled.includes(name))
      return buzz(name, element, m.controlledWrongType);
    if (fixed.value && !fixed.value.controlled.includes(name))
      return buzz(name, element, m.controlledWrong);

    roles.value = { ...roles.value, [name]: role };
    if (controlledDone.value) {
      mode.value = "";
      show(m.controlledDone, "feedback-success");
    } else {
      show(m.controlledMore, "feedback-success");
    }
  }

  if (isComplete.value) {
    mode.value = "";
    show(m.allDone, "feedback-success");
  }
}

// after a restore or reset: no mode picked, message to match the progress
function settle() {
  mode.value = "";
  buzzing.value = {};
  if (isComplete.value) show(messages.value.allDone, "feedback-success");
  else show(messages.value.defaultMessage);
}

function reset() {
  roles.value = {};
  settle();
}

defineExpose({ reset, isComplete });
</script>

<template>
  <Activity
    :tag="tag"
    class="variable-activity"
    :complete="isComplete"
    :state="saved"
    @reset="reset"
    @restore="settle"
  >
    <div
      v-if="$slots.autofillTestableQuestion"
      class="variable-question floating-title"
    >
      <slot name="autofillTestableQuestion" />
    </div>

    <div class="variable-selection-toolbar" aria-label="Choose a variable type">
      <button
        v-for="m in MODES"
        :key="m.id"
        type="button"
        class="variable-mode-button"
        :class="[
          m.id + '-mode-button',
          { 'mode-active': mode === m.id, 'mode-complete': has(m.id) },
        ]"
        :aria-pressed="mode === m.id"
        :disabled="modeDisabled(m.id)"
        @click="setMode(m.id)"
      >
        <span class="variable-mode-title">{{ m.title }}</span>
        <span class="variable-mode-subtitle">{{ m.subtitle }}</span>
      </button>
    </div>

    <div class="variable-tile-grid">
      <button
        v-for="name in tiles"
        :key="name"
        type="button"
        class="variable-tile"
        :class="[
          roles[name] ? ['is-' + roles[name], 'is-classified'] : null,
          { buzz: buzzing[name] },
        ]"
        :disabled="!!roles[name] || isComplete"
        @click="selectTile(name, $event)"
        @animationend="buzzing[name] = false"
      >
        <span class="variable-tile-label">{{ tileLabel(name) }}</span>
        <span v-if="roles[name]" class="variable-tile-type"
          >({{ roleLabel[roles[name]] }})</span
        >
      </button>
    </div>

    <div
      class="variable-feedback"
      :class="feedback.variant"
      role="status"
      aria-live="polite"
      v-html="feedback.text"
    ></div>

    <div class="reset-button-container">
      <Button :is-reset="true" @click="reset" />
    </div>
  </Activity>
</template>

<style scoped>
/* Variable activity (shared by lessons 2 and 3). Moved from styles/variable-activity.css.
   Not scoped: it also styles elements in the lesson views. Kept before the scoped block
   below so the cascade order is unchanged. The *-mode-button classes are built in the
   template as `${m.id}-mode-button`. */

.variable-activity {
  padding: 28px;
  border: 3px solid var(--line);
  border-radius: 22px;
  background: linear-gradient(to bottom, white, rgba(117, 221, 232, 0.18));
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.9),
    var(--shadow-small);
}

/* ---------- Testable question ---------- */

.variable-question {
  position: relative;

  margin: 10px 0 18px;
  padding: 28px 20px 16px;

  background: var(--paper);

  border: 2px solid var(--line);
  border-top: 4px solid var(--blue);
  border-radius: 16px;

  color: var(--text);

  font-weight: 700;
  line-height: 1.55;
}

.variable-question::before {
  content: "TESTABLE QUESTION";

  background: var(--blue);
}

/* ---------- Variable type buttons ---------- */

.variable-selection-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;

  gap: 10px;

  margin-top: 12px;
  margin-bottom: 14px;
}

.variable-mode-button {
  padding: 10px 14px;

  background: white;
  color: var(--text);

  border: 2px solid var(--line);
  border-radius: 999px;
  box-shadow: 0 2px 0 var(--charcoal);

  font: inherit;
  font-weight: 700;

  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.variable-mode-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 0 var(--charcoal);
}

.variable-mode-button:active {
  transform: translateY(0);
  box-shadow: none;
}

.variable-mode-button.mode-active {
  box-shadow: none;
}

.variable-mode-button.mode-active:hover {
  transform: translateY(0);
}

.variable-mode-button:disabled,
.variable-mode-button:disabled * {
  cursor: default;
  user-select: none;
}

.variable-mode-button:disabled:hover {
  transform: translateY(0);
  box-shadow: none;
}

.variable-mode-title,
.variable-mode-subtitle {
  display: block;
}

.variable-mode-subtitle {
  margin-top: 2px;

  font-size: 0.78rem;
  font-weight: 600;
}

.independent-mode-button {
  border-top: 6px solid var(--yellow);
}

.dependent-mode-button {
  border-top: 6px solid var(--purple);
}

.controlled-mode-button {
  border-top: 6px solid var(--green);
}

/* ---------- Variable choices ---------- */

.variable-tile-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.variable-tile {
  flex: 0 1 calc(25% - 9px);

  min-height: 82px;
  padding: 14px;

  background: white;
  color: var(--text);

  border: 2px solid var(--line);
  border-radius: 16px;

  font: inherit;
  font-weight: 700;
  text-align: center;

  cursor: pointer;

  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.variable-tile:hover {
  transform: translateY(-3px);
}

.variable-tile.is-classified {
  cursor: default;
}

.variable-tile.is-classified:hover {
  transform: translateY(0);
}

.variable-tile-label {
  display: block;
}

.variable-tile-type {
  display: block;
  margin-top: 5px;

  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.25;
}

/* ---------- Feedback ---------- */

.variable-feedback {
  margin-top: 18px;
  padding: 14px 16px;

  background: rgba(255, 255, 255, 0.72);

  border: 2px dashed var(--line);
  border-radius: 16px;

  color: var(--text);

  font-weight: 700;
  text-align: center;
}

.variable-feedback.feedback-success {
  animation: pop-fade-in 0.5s ease-out;
  background: var(--soft-green);
  border-style: solid;
}

.variable-feedback.feedback-try-again {
  background: var(--soft-orange);
  border-style: solid;
}

/* ---------- Selected / completed colours ---------- */

.independent-mode-button.mode-active,
.independent-mode-button.mode-complete {
  background: var(--soft-yellow);
}

.dependent-mode-button.mode-active,
.dependent-mode-button.mode-complete {
  background: var(--soft-purple);
}

.controlled-mode-button.mode-active,
.controlled-mode-button.mode-complete {
  background: var(--soft-green);
}

.variable-tile.is-independent {
  background: var(--soft-yellow);
  border-top: 6px solid var(--yellow);
}

.variable-tile.is-dependent {
  background: var(--soft-purple);
  border-top: 6px solid var(--purple);
}

.variable-tile.is-controlled {
  background: var(--soft-green);
  border-top: 6px solid var(--green);
}

/* ---------- Incorrect answer animation ---------- */

@keyframes variableTileBuzz {
  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-6px);
  }

  50% {
    transform: translateX(6px);
  }

  75% {
    transform: translateX(-3px);
  }
}

.variable-tile.buzz {
  animation: variableTileBuzz 0.28s ease;
}

/* ---------- Mobile ---------- */

@media (max-width: 700px) {
  .variable-tile {
    flex-basis: calc(50% - 6px);
  }
  .variable-tile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-content: center;
  }
}

@media (max-width: 480px) {
  .variable-tile {
    flex-basis: 100%;
  }
}
</style>
