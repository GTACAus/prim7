<script setup>
/*
  Lesson 2 "build your fair test plan": pick what to change, measure and keep
  the same, and watch two experiments (A and B) update as a diagram and a
  blueprint.

    <FairTestBuilder />

  Every choice is a button (no dropdowns). Changing a variable shows an
  "Experiment A vs Experiment B" strip; ball material also asks which pair to
  compare. Choosing an outcome to measure offers only the methods that suit it.

  "Check my fair test plan" lists anything still missing (and keeps the list
  up to date after that). Complete once checked with nothing missing, which
  shows the end-of-lesson card. The choices are saved through <Activity :state>.
*/
import { computed, reactive, ref } from "vue";
import Activity from "../../activities/Activity.vue";
import Button from "../../ui/Button.vue";
import LessonEndCard from "../../content/LessonEndCard.vue";
import ContentBox from "../../ui/ContentBox.vue";

const variableConfig = {
  size: {
    label: "Ball size",
    changeOptions: [
      {
        value: "small-large",
        label: "Small ball vs large ball",
        pair: ["small", "large"],
      },
    ],
    controlOptions: [
      { value: "large", label: "Large ball" },
      { value: "small", label: "Small ball" },
    ],
  },
  material: {
    label: "Ball material",
    changeOptions: [
      {
        value: "basketball-pingpong",
        label: "Rubber vs plastic",
        pair: ["basketball", "pingpong"],
      },
      {
        value: "basketball-tennis",
        label: "Rubber vs furry",
        pair: ["basketball", "tennis"],
      },
      {
        value: "tennis-pingpong",
        label: "Furry vs plastic",
        pair: ["tennis", "pingpong"],
      },
    ],
    controlOptions: [
      { value: "basketball", label: "Rubber" },
      { value: "pingpong", label: "Plastic" },
      { value: "tennis", label: "Furry" },
    ],
  },
  height: {
    label: "Drop height",
    changeOptions: [
      { value: "1-1.5", label: "1 m vs 1.5 m", pair: ["1", "1.5"] },
    ],
    controlOptions: [
      { value: "1", label: "1 m" },
      { value: "1.5", label: "1.5 m" },
    ],
  },
  firmness: {
    label: "Squashiness",
    changeOptions: [
      {
        value: "firm-soft",
        label: "Firm ball vs soft ball",
        pair: ["firm", "soft"],
      },
    ],
    controlOptions: [
      { value: "firm", label: "Firm ball" },
      { value: "soft", label: "Soft ball" },
    ],
  },
  surface: {
    label: "Bounce surface",
    changeOptions: [
      {
        value: "hard-soft",
        label: "Hard surface vs soft surface",
        pair: ["hard-surface", "soft-surface"],
      },
    ],
    controlOptions: [
      { value: "hard-surface", label: "Hard surface" },
      { value: "soft-surface", label: "Soft surface" },
    ],
  },
};

const measureOutcomes = [
  { value: "bounceHeight", label: "Bounce height" },
  { value: "bounceCount", label: "Number of bounces" },
  { value: "bounceTime", label: "Time spent bouncing" },
];
const measureTools = [
  { value: "measuringTape", label: "Use measuring tape" },
  { value: "ruler", label: "Use ruler" },
  { value: "stopwatch", label: "Use stopwatch" },
  { value: "count", label: "Count the bounces" },
  { value: "video", label: "Record a video" },
  { value: "estimate", label: "Estimate by eye" },
];

// Only the measuring methods that make sense for each outcome
const toolsByOutcome = {
  bounceHeight: ["measuringTape", "ruler", "video", "estimate"],
  bounceCount: ["count", "video"],
  bounceTime: ["stopwatch", "video"],
};
const toolChoicesFor = (outcome) =>
  measureTools.filter((tool) => toolsByOutcome[outcome]?.includes(tool.value));

const stages = [
  { id: "change", label: "1. Change" },
  { id: "measure", label: "2. Measure" },
  { id: "control", label: "3. Keep the same" },
];

const variables = Object.entries(variableConfig).map(([value, config]) => ({
  value,
  label: config.label,
}));

function initialControls() {
  return {
    size: "large",
    material: "basketball",
    height: "1.5",
    firmness: "firm",
    surface: "hard-surface",
  };
}

const state = reactive({
  stage: "change",
  changeVariable: null,
  changeSelections: {},
  measureOutcome: null,
  measureTool: null,
  selectedControlVariable: null,
  controls: initialControls(),
});
const checked = ref(false); // "Check" pressed at least once

// What <Activity> saves and restores (the refs themselves, so restoring works)
const saved = { plan: state, checked };

const getOptionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || "Not selected";

/* ---------- controls ---------- */

const changeConfig = computed(() =>
  state.changeVariable ? variableConfig[state.changeVariable] : null,
);
const changeSelected = computed(() =>
  changeConfig.value
    ? state.changeSelections[state.changeVariable] ||
      changeConfig.value.changeOptions[0].value
    : null,
);
const changeOption = computed(
  () =>
    changeConfig.value?.changeOptions.find(
      (option) => option.value === changeSelected.value,
    ) || changeConfig.value?.changeOptions[0],
);
// the two conditions shown in the "Experiment A vs Experiment B" strip
const comparison = computed(() =>
  changeOption.value
    ? changeOption.value.pair.map((value) =>
        getOptionLabel(changeConfig.value.controlOptions, value),
      )
    : [],
);

const outcomeLabel = computed(() =>
  getOptionLabel(measureOutcomes, state.measureOutcome),
);
const toolLabel = computed(() =>
  getOptionLabel(measureTools, state.measureTool),
);
const toolChoices = computed(() => toolChoicesFor(state.measureOutcome));

const controlConfig = computed(() =>
  state.selectedControlVariable &&
  state.selectedControlVariable !== state.changeVariable
    ? variableConfig[state.selectedControlVariable]
    : null,
);

function chooseChange(value) {
  state.changeVariable = value;
  state.selectedControlVariable = null;
  if (!state.changeSelections[value])
    state.changeSelections[value] =
      variableConfig[value].changeOptions[0].value;
}

function chooseMeasure(value) {
  if (state.measureOutcome === value) return;
  state.measureOutcome = value;
  state.measureTool = toolChoicesFor(value)[0].value;
}

/* ---------- diagram ---------- */

const experiments = computed(() => {
  const a = { ...state.controls };
  const b = { ...state.controls };
  if (changeOption.value) {
    a[state.changeVariable] = changeOption.value.pair[0];
    b[state.changeVariable] = changeOption.value.pair[1];
  }
  return { a, b };
});

function ballProps(values) {
  return {
    class: [values.material, { soft: values.firmness === "soft" }],
    style: {
      // large and small stay distinct without colliding on narrow screens
      "--size":
        values.size === "small"
          ? "clamp(44px, 7vw, 82px)"
          : "clamp(62px, 10vw, 120px)",
      top: values.height === "1" ? "47%" : "29%",
    },
  };
}

const surfaceLabel = (type) =>
  getOptionLabel(variableConfig.surface.controlOptions, type);

/* ---------- blueprint ---------- */

const blueprintChange = computed(() =>
  state.changeVariable
    ? `${changeConfig.value.label}: ${getOptionLabel(changeConfig.value.changeOptions, changeSelected.value)}`
    : "Not selected yet",
);
const blueprintMeasure = computed(() =>
  state.measureOutcome
    ? `${outcomeLabel.value}: ${toolLabel.value}`
    : "Not selected yet",
);
const blueprintControl = computed(() =>
  Object.keys(variableConfig)
    .filter((key) => key !== state.changeVariable)
    .map(
      (key) =>
        `${variableConfig[key].label}: ${getOptionLabel(variableConfig[key].controlOptions, state.controls[key])}`,
    )
    .join("; "),
);

/* ---------- check and reset ---------- */

const missing = computed(() => {
  const found = [];
  if (!state.changeVariable) found.push("a Change variable");
  if (!state.measureOutcome) found.push("a Measure outcome");
  if (!state.measureTool) found.push("a Measurement tool");
  if (!state.selectedControlVariable) found.push("a Control variable");
  return found;
});

const isComplete = computed(() => checked.value && missing.value.length === 0);

function check() {
  checked.value = true;
}

function reset() {
  state.stage = "change";
  state.changeVariable = null;
  state.changeSelections = {};
  state.measureOutcome = null;
  state.measureTool = null;
  state.selectedControlVariable = null;
  state.controls = initialControls();
  checked.value = false;
}

defineExpose({ reset, isComplete });
</script>

<template>
  <Activity
    class="bk-area"
    :complete="isComplete"
    :state="saved"
    @reset="reset"
  >
    <div class="bk3-page">
      <nav class="bk3-progress" aria-label="Investigation sections">
        <button
          v-for="stage in stages"
          :key="stage.id"
          type="button"
          class="bk3-progress-step"
          :class="['stage-' + stage.id, { active: state.stage === stage.id }]"
          @click="state.stage = stage.id"
        >
          {{ stage.label }}
        </button>
      </nav>

      <section class="bk3-top-controls" aria-label="Experiment choices">
        <!-- 1. CHANGE -->
        <template v-if="state.stage === 'change'">
          <p class="control-instruction">What will you change?</p>
          <div class="choice-buttons">
            <Button
              v-for="item in variables"
              :key="item.value"
              class="choice-button"
              :class="{ selected: state.changeVariable === item.value }"
              :aria-pressed="state.changeVariable === item.value"
              @click="chooseChange(item.value)"
            >
              {{ item.label }}
            </Button>
          </div>

          <div v-if="changeConfig" class="bk3-choice-panel">
            <p class="bk3-panel-heading">CHANGING · {{ changeConfig.label }}</p>
            <template v-if="changeConfig.changeOptions.length > 1">
              <p class="bk3-panel-prompt">Which pair will you compare?</p>
              <div class="choice-buttons">
                <Button
                  v-for="option in changeConfig.changeOptions"
                  :key="option.value"
                  class="choice-button"
                  :class="{ selected: changeSelected === option.value }"
                  :aria-pressed="changeSelected === option.value"
                  @click="
                    state.changeSelections[state.changeVariable] = option.value
                  "
                >
                  {{ option.label }}
                </Button>
              </div>
            </template>
            <div class="bk3-comparison" aria-label="Experiment comparison">
              <div class="bk3-comparison-condition">
                <small>Experiment A</small><strong>{{ comparison[0] }}</strong>
              </div>
              <span class="bk3-versus" aria-hidden="true">vs</span>
              <div class="bk3-comparison-condition">
                <small>Experiment B</small><strong>{{ comparison[1] }}</strong>
              </div>
            </div>
          </div>
        </template>

        <!-- 2. MEASURE -->
        <template v-else-if="state.stage === 'measure'">
          <p class="control-instruction">What will you measure?</p>
          <div class="choice-buttons">
            <Button
              v-for="item in measureOutcomes"
              :key="item.value"
              class="choice-button"
              :class="{ selected: state.measureOutcome === item.value }"
              :aria-pressed="state.measureOutcome === item.value"
              @click="chooseMeasure(item.value)"
            >
              {{ item.label }}
            </Button>
          </div>

          <div v-if="state.measureOutcome" class="bk3-choice-panel">
            <p class="bk3-panel-heading">MEASURING · {{ outcomeLabel }}</p>
            <p class="bk3-panel-prompt">
              How will you measure it? Choose a method:
            </p>
            <div class="choice-buttons">
              <Button
                v-for="tool in toolChoices"
                :key="tool.value"
                class="choice-button"
                :class="{ selected: state.measureTool === tool.value }"
                :aria-pressed="state.measureTool === tool.value"
                @click="state.measureTool = tool.value"
              >
                {{ tool.label }}
              </Button>
            </div>
          </div>
        </template>

        <!-- 3. KEEP THE SAME -->
        <template v-else>
          <p class="control-instruction">What will you keep the same?</p>
          <div class="choice-buttons">
            <Button
              v-for="item in variables"
              :key="item.value"
              class="choice-button"
              :class="{
                selected: state.selectedControlVariable === item.value,
              }"
              :aria-pressed="state.selectedControlVariable === item.value"
              :disabled="state.changeVariable === item.value"
              @click="state.selectedControlVariable = item.value"
            >
              {{ item.label }}
            </Button>
          </div>
          <p v-if="state.changeVariable" class="bk3-hint">
            {{ changeConfig.label }} is being changed, so it cannot be a shared
            setting.
          </p>

          <div v-if="controlConfig" class="bk3-choice-panel">
            <p class="bk3-panel-heading">
              KEEP THE SAME · {{ controlConfig.label }}
            </p>
            <p class="bk3-panel-prompt">Both experiments will use:</p>
            <div class="choice-buttons">
              <Button
                v-for="option in controlConfig.controlOptions"
                :key="option.value"
                class="choice-button"
                :class="{
                  selected:
                    state.controls[state.selectedControlVariable] ===
                    option.value,
                }"
                :aria-pressed="
                  state.controls[state.selectedControlVariable] === option.value
                "
                @click="
                  state.controls[state.selectedControlVariable] = option.value
                "
              >
                {{ option.label }}
              </Button>
            </div>
          </div>
          <p v-else class="control-editor-empty">
            Choose a setting to review what both experiments will share.
          </p>
        </template>
      </section>

      <section class="bk3-main-card">
        <div class="bk3-canvas" aria-label="Visual experiment builder">
          <div class="ruler" aria-hidden="true">
            <span class="ruler-caption">Drop height</span>
          </div>
          <div class="lane-label a">Experiment A</div>
          <div class="lane-label b">Experiment B</div>
          <div class="drop-line a"></div>
          <div class="drop-line b"></div>
          <div
            id="ballA"
            class="ball a"
            v-bind="ballProps(experiments.a)"
          ></div>
          <div
            id="ballB"
            class="ball b"
            v-bind="ballProps(experiments.b)"
          ></div>
          <div id="surfaceA" class="surface a" :class="experiments.a.surface">
            <span>{{ surfaceLabel(experiments.a.surface) }}</span>
          </div>
          <div id="surfaceB" class="surface b" :class="experiments.b.surface">
            <span>{{ surfaceLabel(experiments.b.surface) }}</span>
          </div>
        </div>
      </section>

      <section class="bk3-blueprint">
        <h2>Fair test experiment design</h2>
        <div class="blueprint-grid">
          <article class="blueprint-card independent-card">
            <strong>Change</strong><span>{{ blueprintChange }}</span>
          </article>
          <article class="blueprint-card dependent-card">
            <strong>Measure</strong><span>{{ blueprintMeasure }}</span>
          </article>
          <article class="blueprint-card control-card">
            <strong>Keep the same</strong><span>{{ blueprintControl }}</span>
          </article>
        </div>

        <LessonEndCard
          v-if="isComplete"
          :lesson-number="2"
          :practiced="[
            'Identifying the variables in a fair test',
            'Planning a fair test experiment',
          ]"
        />
        <ContentBox
          v-else-if="checked"
          class="blueprint-message blueprint-warning"
        >
          <ul>
            <li v-for="item in missing" :key="item">{{ item }}</li>
          </ul>
        </ContentBox>

        <div class="bk3-actions">
          <Button :is-reset="true" @click="reset" />
          <Button class="primary" @click="check"
            >Check my fair test plan</Button
          >
        </div>
      </section>
    </div>
  </Activity>
</template>

<style scoped>
/* Scoped: the plain p / h2 rules below only touch this builder. */
.bk-area {
  margin-bottom: 10px;
}

.bk3-page {
  width: min(1440px, calc(100% - 32px));
  margin: 24px auto;
}

h2,
p {
  margin: 0;
}
h2 {
  font-size: 1.15rem;
}

/* ---------- stage tabs ---------- */

.bk3-progress {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}
.bk3-progress-step {
  padding: 12px 16px;
  border: 2px solid var(--charcoal);
  border-radius: 14px;
  background: #fff;
  color: var(--charcoal);
  font: inherit;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 4px 0 var(--charcoal);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}
.bk3-progress-step:not(.active):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 var(--charcoal);
}
.bk3-progress-step.active {
  color: #fff;
  background: var(--purple);
  border-color: var(--purple);
  box-shadow: none;
  transform: translateY(2px);
}
.bk3-progress-step.stage-change {
  border-top: 6px solid var(--yellow);
}
.bk3-progress-step.stage-measure {
  border-top: 6px solid var(--purple);
}
.bk3-progress-step.stage-control {
  border-top: 6px solid var(--green);
}
.bk3-progress-step.active.stage-change {
  background: var(--soft-yellow);
  border-color: var(--charcoal);
  color: var(--charcoal);
}
.bk3-progress-step.active.stage-control {
  background: var(--soft-green);
  border-color: var(--charcoal);
  color: var(--charcoal);
}

/* ---------- choices ---------- */

.bk3-top-controls {
  margin-bottom: 14px;
  padding: 18px;
  background: var(--paper);
  border: 3px solid var(--charcoal);
  border-radius: 18px;
  box-shadow: 0 5px 0 var(--charcoal);
}
.control-instruction {
  margin: 0 0 10px;
  font-weight: 700;
}
.choice-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.choice-button {
  --padding: 8px 13px;
  --background: #fff;
  --color: var(--charcoal);
  --border-radius: 11px;
  --font-weight: 700;

  --background-hover: var(--soft-purple);
  --color-hover: var(--charcoal);
  --translate-amount-hover: -2px;

  --background-active: var(--purple);
  --color-active: #fff;
  --border-color-active: var(--purple);
  --translate-amount-active: 4px;

  min-height: 42px;
}

/* Always-visible choices instead of dropdown menus */
.bk3-choice-panel {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding: 15px 17px;
  background: var(--soft-blue);
  border: 2px solid var(--charcoal);
  border-radius: 16px;
}
.bk3-panel-heading {
  color: var(--purple);
  font-size: 0.79rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.bk3-panel-prompt {
  font-weight: 700;
}

.bk3-comparison {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bk3-comparison-condition {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 3px;
  padding: 10px 14px;
  background: white;
  border: 2px solid var(--charcoal);
  border-radius: 12px;
  text-align: center;
}
.bk3-comparison-condition small {
  color: var(--muted);
  font-size: 0.77rem;
  font-weight: 600;
}
.bk3-comparison-condition strong {
  font-size: 1rem;
}
.bk3-versus {
  flex: 0 0 auto;
  color: var(--purple);
  font-weight: 800;
}

.bk3-hint,
.control-editor-empty {
  margin-top: 12px;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

/* ---------- diagram ---------- */

.bk3-main-card,
.bk3-blueprint {
  background: linear-gradient(to bottom, white, var(--soft-blue));
  border: 3px solid var(--charcoal);
  border-radius: 20px;
  box-shadow: 0 5px 0 var(--charcoal);
}
.bk3-main-card {
  padding: 16px;
}

.bk3-canvas {
  position: relative;
  min-height: 480px;
  overflow: hidden;
  border: 2px solid var(--charcoal);
  border-radius: 18px;
  background: linear-gradient(to bottom, #fffdf4 0 88%, #eee7d6 88% 100%);
}

/* The drop-height guide (never a measuring tool) */
.ruler {
  position: absolute;
  left: 4.5%;
  top: 8%;
  width: 78px;
  height: 70%;
  background: #fff8c9;
  border: 4px solid var(--charcoal);
  border-radius: 10px;
}
.ruler::before,
.ruler::after {
  position: absolute;
  left: 88px;
  width: 72px;
  padding-top: 7px;
  border-top: 3px solid var(--purple);
  color: var(--purple);
  font-size: 1rem;
  font-weight: 700;
}
/* below the bottom of a ball dropped from 1.5 m (top: 29%) */
.ruler::before {
  content: "1.5 m";
  top: 43%;
}
/* below the bottom of a ball dropped from 1 m (top: 47%) */
.ruler::after {
  content: "1 m";
  top: 69%;
}
.ruler-caption {
  position: absolute;
  top: -27px;
  left: -8px;
  color: var(--charcoal);
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.lane-label {
  position: absolute;
  top: 18px;
  transform: translateX(-50%);
  padding: 6px 12px;
  background: #fff;
  border: 2px solid var(--charcoal);
  border-radius: 999px;
  font-weight: 700;
}
.drop-line {
  position: absolute;
  top: 17%;
  bottom: 18%;
  border-left: 3px dashed #888;
  opacity: 0.65;
}
.lane-label.a,
.drop-line.a,
.ball.a {
  left: 43%;
}
.lane-label.b,
.drop-line.b,
.ball.b {
  left: 72%;
}

.ball {
  --size: 110px;
  position: absolute;
  top: 20%;
  z-index: 3;
  width: var(--size);
  height: var(--size);
  transform: translate(-50%, -50%);
  border: 4px solid var(--charcoal);
  border-radius: 50%;
  box-shadow: 0 8px 0 rgba(48, 51, 47, 0.14);
  transition:
    width 0.25s,
    height 0.25s,
    top 0.25s,
    background 0.25s,
    border-radius 0.25s,
    transform 0.25s;
}
.ball.basketball {
  background:
    linear-gradient(
      -70deg,
      transparent 48%,
      var(--charcoal) 52.5% 53.5%,
      transparent 50%
    ),
    radial-gradient(
      circle at 2% 160%,
      transparent 56%,
      var(--charcoal) 57% 58%,
      transparent 60%
    ),
    radial-gradient(
      circle at 88% -60%,
      transparent 56%,
      var(--charcoal) 57% 58%,
      transparent 60%
    ),
    linear-gradient(
      20deg,
      transparent 46%,
      var(--charcoal) 49.5% 51.5%,
      transparent 50%
    ),
    #e88d25;
}
.ball.tennis {
  background:
    radial-gradient(
      circle at 50% -5%,
      transparent 54%,
      #fff 55% 59%,
      transparent 60%
    ),
    radial-gradient(
      circle at 50% 105%,
      transparent 54%,
      #fff 55% 59%,
      transparent 60%
    ),
    #cbe934;
}
.ball.pingpong {
  background: radial-gradient(circle at 32% 28%, #fff 0 12%, #f2f2f2 13% 100%);
}
.ball.soft {
  border-radius: 48% 52% 45% 55% / 56% 44% 58% 42%;
  transform: translate(-50%, -50%) scaleY(0.82);
}

.surface {
  position: absolute;
  bottom: 8%;
  display: grid;
  place-items: center;
  width: 28%;
  height: 58px;
  border: 4px solid var(--charcoal);
  border-radius: 10px 10px 4px 4px;
  font-weight: 700;
  transition: background 0.25s;
}
.surface.a {
  left: 29%;
}
.surface.b {
  left: 58%;
}
.surface.hard-surface {
  background: repeating-linear-gradient(
    90deg,
    #d5a56e 0 42px,
    #c08d55 42px 45px
  );
}
.surface.soft-surface {
  background: repeating-linear-gradient(0deg, #ded7ff 0 7px, #c7b9fa 7px 10px);
}

/* ---------- blueprint ---------- */

.bk3-blueprint {
  margin-top: 14px;
  padding: 16px;
}
.blueprint-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
}
.blueprint-card {
  min-height: 108px;
  padding: 12px;
  background: #fff;
  border: 2px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 4px 0 var(--charcoal);
}
.blueprint-card strong {
  display: block;
  margin-bottom: 6px;
}
.independent-card {
  border-top: 4px solid var(--yellow);
}
.dependent-card {
  border-top: 4px solid var(--purple);
}
.control-card {
  border-top: 4px solid var(--green);
}

.blueprint-message {
  position: relative;
  margin-top: 20px;
  color: var(--charcoal);
  font-weight: 800;
}
.blueprint-warning {
  background: var(--soft-orange);
  border-top: 4px solid var(--orange);
}
.blueprint-warning::before {
  content: "YOU STILL NEED TO SELECT";
  position: absolute;
  top: -16px;
  left: 18px;
  padding: 4px 12px;
  background: var(--orange);
  border: 2px solid var(--line);
  border-radius: 999px;
  color: var(--paper);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.bk3-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
}
.bk3-actions .primary {
  --background: var(--purple);
  --color: #fff;
  margin-left: auto;
}

/* ---------- smaller screens ---------- */

@media (max-width: 760px) {
  .bk3-page {
    width: min(100% - 18px, 1440px);
  }
  .bk3-progress,
  .blueprint-grid {
    grid-template-columns: 1fr;
  }

  /* compact drop-height guide, with room for it on the left */
  .bk3-canvas {
    min-height: 410px;
  }
  .ruler {
    left: 1%;
    top: 9%;
    width: 27px;
    border-width: 2px;
  }
  .ruler::before,
  .ruler::after {
    left: 27px;
    width: 30px;
    padding-top: 3px;
    border-top-width: 2px;
    font-size: 0.67rem;
  }
  .ruler-caption {
    left: 0;
    font-size: 0.65rem;
  }
  .lane-label {
    top: 15px;
    padding: 4px 6px;
    font-size: 0.68rem;
    white-space: nowrap;
  }
  .lane-label.a,
  .drop-line.a,
  .ball.a {
    left: 43%;
  }
  .lane-label.b,
  .drop-line.b,
  .ball.b {
    left: 78%;
  }
  .surface {
    height: 49px;
    border-width: 3px;
    font-size: 0.68rem;
    line-height: 1.25;
    text-align: center;
  }
  .surface.a {
    left: 29%;
  }
  .surface.b {
    left: 64%;
  }
}

@media (max-width: 460px) {
  .bk3-comparison {
    gap: 7px;
  }
  .bk3-comparison-condition {
    padding: 9px 6px;
  }
  .bk3-comparison-condition small {
    font-size: 0.65rem;
    white-space: nowrap;
  }
  .bk3-comparison-condition strong {
    font-size: 0.87rem;
  }
  .bk3-choice-panel {
    padding: 12px;
  }
}
</style>
