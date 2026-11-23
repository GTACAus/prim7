<script setup>
/*
  ==================================================
  PLANT EXPERIMENT PLANNER (fair test builder)
  CHANGE one thing -> MEASURE a result -> KEEP everything else the same.

    <PlantPlanner @change="plan = $event" @edited="clearWriting" />

  @change gets the current plan whenever it changes (including after a
  restore):
    { mode, changeKey, comparisonId, comparisonA, comparisonB,
      measureKeys, changeKeys }
  @edited fires only when the STUDENT changes what is changed / measured
  (or resets), so the page can clear a question written for the old plan.

  Plant A and Plant B are built from ONE shared set of controls, so a second
  variable can never change by accident.

  Complete once the plan has been checked with something to change and
  something to measure. Progress is saved through <Activity :state>.
  ==================================================
*/
import { computed, nextTick, ref, watch } from "vue";
import Activity from "../../activities/Activity.vue";
import Button from "../../ui/Button.vue";
import Grid from "../../layout/Grid.vue";
import PlantScene from "./PlantScene.vue";
import { openImage } from "../../../composables/useModal.js";
import {
  GROWING_MODES,
  MATERIAL_KEYS,
  MEASUREMENTS,
  STARTING_CONTROLS,
  STEPS,
  VARIABLES,
  VISUAL_ASSETS,
  labelFor,
  variablesFor,
} from "./plantData.js";

const emit = defineEmits(["change", "edited"]);

// Saved progress
const mode = ref("classroom");
const step = ref("change");
const changeVariable = ref("");
const comparisonId = ref("");
const selectedMeasures = ref([]);
const measureFocus = ref("");
const controls = ref({ ...STARTING_CONTROLS });
const checked = ref(false);
const state = {
  mode,
  step,
  changeVariable,
  comparisonId,
  selectedMeasures,
  measureFocus,
  controls,
  checked,
};

/* ---------- Derived plan ---------- */
const availableKeys = computed(() => variablesFor(mode.value));
const controlKeys = computed(() =>
  availableKeys.value.filter((key) => key !== changeVariable.value),
);

const comparison = computed(() => {
  const variable = VARIABLES[changeVariable.value];
  if (!variable) return null;
  return (
    variable.comparisons.find((item) => item.id === comparisonId.value) ||
    variable.comparisons[0]
  );
});

const setups = computed(() => {
  const a = { ...controls.value };
  const b = { ...controls.value };
  if (comparison.value) {
    a[changeVariable.value] = comparison.value.a;
    b[changeVariable.value] = comparison.value.b;
  }
  // Tiny Farms always uses grow lamps (only the colour can change)
  if (mode.value === "tinyFarms") a.lightExposure = b.lightExposure = "lamp";
  return { A: a, B: b };
});

const missing = computed(() => {
  const list = [];
  if (!changeVariable.value) list.push("choose one thing to change (Step 1)");
  if (!selectedMeasures.value.length)
    list.push("choose at least one thing to measure (Step 2)");
  return list;
});
const isComplete = computed(() => checked.value && !missing.value.length);

const plan = computed(() => ({
  mode: mode.value,
  changeKey: changeVariable.value,
  comparisonId: comparison.value?.id || "",
  comparisonA: comparison.value
    ? labelFor(changeVariable.value, comparison.value.a)
    : "",
  comparisonB: comparison.value
    ? labelFor(changeVariable.value, comparison.value.b)
    : "",
  measureKeys: [...selectedMeasures.value],
  changeKeys: availableKeys.value,
}));
watch(plan, (value) => emit("change", value), { immediate: true });

/* ---------- Student actions ---------- */
const signature = () =>
  [
    mode.value,
    changeVariable.value,
    comparison.value?.id,
    ...selectedMeasures.value,
  ].join("|");

// Run a change; un-check the plan, and tell the page if the plan itself moved.
function edit(action) {
  const before = signature();
  action();
  checked.value = false;
  if (signature() !== before) emit("edited");
}

function chooseMode(value) {
  if (value === mode.value) return;
  edit(() => {
    mode.value = value;
    if (!availableKeys.value.includes(changeVariable.value)) {
      changeVariable.value = "";
      comparisonId.value = "";
    }
  });
}

function chooseChange(key) {
  edit(() => {
    changeVariable.value = key;
    comparisonId.value = VARIABLES[key].comparisons[0].id;
  });
}

// Watering frequency: Plant A and B are picked separately, never the same.
function chooseFrequency(letter, value) {
  const current = comparison.value;
  const a = letter === "A" ? value : current.a;
  const b = letter === "B" ? value : current.b;
  if (a === b) return;
  edit(() => (comparisonId.value = `${a}-${b}`));
}

function toggleMeasure(key) {
  edit(() => {
    const already = selectedMeasures.value.includes(key);
    selectedMeasures.value = already
      ? selectedMeasures.value.filter((chosen) => chosen !== key)
      : [...selectedMeasures.value, key];
    if (!already) measureFocus.value = key;
    else if (measureFocus.value === key)
      measureFocus.value = selectedMeasures.value.at(-1) || "";
  });
}

function setControl(key, value) {
  edit(() => (controls.value = { ...controls.value, [key]: value }));
}

const feedback = ref(null);
async function checkPlan() {
  checked.value = true;
  await nextTick();
  feedback.value?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function reset() {
  mode.value = "classroom";
  step.value = "change";
  changeVariable.value = "";
  comparisonId.value = "";
  selectedMeasures.value = [];
  measureFocus.value = "";
  controls.value = { ...STARTING_CONTROLS };
  checked.value = false;
}

function resetPlan() {
  reset();
  emit("edited");
}

/* ---------- Measure step: one "how to measure" guide ---------- */
const focusedMeasure = computed(() =>
  selectedMeasures.value.includes(measureFocus.value)
    ? measureFocus.value
    : selectedMeasures.value.at(-1) || "",
);
const focusedImage = computed(
  () => VISUAL_ASSETS.measureReferences[focusedMeasure.value] || "",
);

// Enlarged measuring guide belongs to this activity, so its size can be
// changed without affecting the shared site's image modal.
const measureDialog = ref(null);
function showMeasureGuide() {
  if (focusedImage.value && !measureDialog.value?.open) {
    measureDialog.value?.showModal();
  }
}
function closeMeasureGuide() {
  measureDialog.value?.close();
}

/* ---------- Material references, integrated within each plant card ---------- */
function materialImage(key, value) {
  return VISUAL_ASSETS.materials[key]?.[value] || "";
}

/* ---------- Plan summary ---------- */
const measureSummary = computed(() => {
  const chosen = Object.keys(MEASUREMENTS)
    .filter((key) => selectedMeasures.value.includes(key))
    .map((key) => MEASUREMENTS[key].label);
  return chosen.length ? chosen.join(", ") : "Choose what you will measure.";
});
const modeLabel = computed(
  () => GROWING_MODES.find((item) => item.value === mode.value)?.label,
);

defineExpose({ reset, isComplete });
</script>

<template>
  <Activity
    class="pk"
    :class="`pk--${step}`"
    :complete="isComplete"
    :state="state"
    @reset="reset"
  >
    <!-- Growing equipment first: it decides which variables are offered -->
    <div class="pk-growing-setup">
      <strong>Growing setup</strong>
      <Grid
        :cols="2"
        gap="sm"
        class="pk-switch"
        role="group"
        aria-label="Where will you grow the plants?"
      >
        <Button
          v-for="item in GROWING_MODES"
          :key="item.value"
          class="pk-switch-choice"
          :class="{ selected: mode === item.value }"
          :aria-pressed="mode === item.value"
          @click="chooseMode(item.value)"
        >
          {{ item.label }}
        </Button>
      </Grid>
    </div>

    <nav class="pk-steps" aria-label="Experiment planning steps">
      <Button
        v-for="s in STEPS"
        :key="s.key"
        class="pk-step"
        :class="[`pk-step--${s.key}`, { selected: step === s.key }]"
        :aria-current="step === s.key ? 'step' : undefined"
        @click="step = s.key"
      >
        <span class="pk-step-number">{{ s.number }}</span>
        <span
          ><strong>{{ s.title }}</strong
          ><small>{{ s.subtitle }}</small></span
        >
      </Button>
    </nav>

    <!-- Full-width controls: one clear task at a time, no wasted sidebar. -->
    <div class="pk-workspace">
      <section class="pk-card pk-editor" aria-labelledby="pk-editor-heading">
        <div class="pk-editor-head">
          <p class="pk-kicker">
            Step {{ STEPS.findIndex((s) => s.key === step) + 1 }} of 3
          </p>
          <h3 id="pk-editor-heading">
            {{
              step === "change"
                ? "What will you change?"
                : step === "measure"
                  ? "What will you measure?"
                  : "Keep the same"
            }}
          </h3>
          <p v-if="step === 'measure'" class="pk-help">
            Choose one or more. Select again to remove.
          </p>
        </div>

        <!-- CHANGE: use the available width rather than a tall 2-column menu. -->
        <template v-if="step === 'change'">
          <div
            class="pk-options"
            role="group"
            aria-label="Choose one variable to change"
          >
            <Button
              v-for="key in availableKeys"
              :key="key"
              class="pk-option"
              :class="{ selected: changeVariable === key }"
              :aria-pressed="changeVariable === key"
              @click="chooseChange(key)"
            >
              {{ VARIABLES[key].label }}
            </Button>
          </div>
          <div
            v-if="comparison"
            class="pk-change-summary"
            aria-label="Current comparison"
          >
            <span class="pk-change-summary-title"
              >Comparing {{ VARIABLES[changeVariable].label }}</span
            >
            <div class="pk-change-summary-pair">
              <template v-for="(letter, i) in ['A', 'B']" :key="letter">
                <span v-if="i" class="pk-change-summary-vs">vs</span>
                <label
                  v-if="VARIABLES[changeVariable].pickEachPlant"
                  class="pk-change-summary-value pk-frequency-field"
                >
                  <span>Plant {{ letter }}</span>
                  <select
                    :value="letter === 'A' ? comparison.a : comparison.b"
                    :aria-label="`How often to water Plant ${letter}`"
                    @change="chooseFrequency(letter, $event.target.value)"
                  >
                    <option
                      v-for="option in VARIABLES[changeVariable].options"
                      :key="option.value"
                      :value="option.value"
                      :disabled="
                        option.value ===
                        (letter === 'A' ? comparison.b : comparison.a)
                      "
                    >
                      {{ option.value }}x/week
                    </option>
                  </select>
                </label>
                <strong v-else class="pk-change-summary-value">
                  <small>Plant {{ letter }}</small>
                  {{ letter === "A" ? plan.comparisonA : plan.comparisonB }}
                </strong>
              </template>
            </div>
          </div>
        </template>

        <!-- MEASURE: multi-select and one contextual guide, as before. -->
        <template v-else-if="step === 'measure'">
          <div
            class="pk-measure-buttons"
            role="group"
            aria-label="Measurements for both plants"
          >
            <Button
              v-for="(item, key) in MEASUREMENTS"
              :key="key"
              class="pk-measure-btn"
              :class="{ selected: selectedMeasures.includes(key) }"
              :aria-pressed="selectedMeasures.includes(key)"
              @click="toggleMeasure(key)"
              >{{ item.label }}</Button
            >
          </div>
          <section
            v-if="focusedMeasure"
            class="pk-measure-preview"
            aria-label="Measuring guide"
            aria-live="polite"
          >
            <div class="pk-measure-preview-copy">
              <strong
                >How to measure:
                {{ MEASUREMENTS[focusedMeasure].label }}</strong
              >
              <p>{{ MEASUREMENTS[focusedMeasure].how }}</p>
            </div>
            <button
              v-if="focusedImage"
              type="button"
              class="pk-measure-preview-image"
              :aria-label="`Enlarge ${MEASUREMENTS[focusedMeasure].label} measuring illustration`"
              @click="showMeasureGuide"
            >
              <img
                class="pk-measure-thumb"
                :src="focusedImage"
                :alt="`Measuring illustration for ${MEASUREMENTS[focusedMeasure].label}`"
                loading="lazy"
              />
              <span>View larger</span>
            </button>
          </section>
        </template>

        <!-- KEEP THE SAME: compact grid of shared controls, not a tall sidebar. -->
        <template v-else>
          <p class="pk-control-note">
            These settings apply to both plants. The variable you chose to
            change is left out of this list.
          </p>
          <div class="pk-control-list">
            <div v-for="key in controlKeys" :key="key" class="pk-control-row">
              <label :for="`pk-control-${key}`">{{
                VARIABLES[key].label
              }}</label>
              <select
                :id="`pk-control-${key}`"
                :value="controls[key]"
                @change="setControl(key, $event.target.value)"
              >
                <option
                  v-for="option in VARIABLES[key].options"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </template>
      </section>

      <!-- LARGE SIDE-BY-SIDE SCENES with material illustrations attached
           to their own plant. No separate Materials & care panel. -->
      <section class="pk-card pk-experiments" aria-label="Your plants">
        <div class="pk-card-heading">
          <div>
            <h3>Your plants</h3>
            <p class="pk-scene-intro">
              The illustrations show the setup, not the results.
            </p>
          </div>
          <button type="button" class="pk-text-button" @click="resetPlan">
            ↺ Reset
          </button>
        </div>
        <div class="pk-scene-grid" aria-live="polite">
          <article
            v-for="(values, letter) in setups"
            :key="letter"
            class="pk-scene-card"
            :class="`pk-scene-card--${letter.toLowerCase()}`"
          >
            <div class="pk-scene-card-heading">
              <strong class="pk-plant-name">Plant {{ letter }}</strong>
              <span class="pk-scene-difference">
                <template v-if="changeVariable">
                  {{ VARIABLES[changeVariable].label }}:
                  {{ labelFor(changeVariable, values[changeVariable]) }}
                </template>
                <template v-else>Same settings</template>
              </span>
            </div>
            <!-- The classroom wall has no material panel or ribbon.
                 Four independent, unboxed references sit on the right,
                 with the plant directly beneath the window/cupboard on the left.
                 Every setting remains visible on all three steps. -->
            <div
              class="pk-scene-stage"
              :class="{ 'pk-scene-stage--classroom': mode === 'classroom' }"
            >
              <PlantScene
                :letter="letter"
                :mode="mode"
                :values="values"
                :wall-layout="mode === 'classroom'"
              />
              <aside
                v-if="mode === 'classroom'"
                class="pk-wall-references"
                :aria-label="`Plant ${letter}: material settings`"
              >
                <div
                  v-for="key in MATERIAL_KEYS"
                  :key="key"
                  class="pk-wall-reference"
                  :class="{ 'is-different': key === changeVariable }"
                >
                  <button
                    v-if="materialImage(key, values[key])"
                    type="button"
                    class="pk-wall-reference-image"
                    :aria-label="`Enlarge ${VARIABLES[key].label} for Plant ${letter}: ${labelFor(key, values[key])}`"
                    @click="
                      openImage(
                        materialImage(key, values[key]),
                        `${VARIABLES[key].label}: ${labelFor(key, values[key])}`,
                      )
                    "
                  >
                    <img
                      :src="materialImage(key, values[key])"
                      alt=""
                      loading="lazy"
                    />
                  </button>
                  <span
                    v-else
                    class="pk-wall-reference-empty"
                    aria-hidden="true"
                    >—</span
                  >
                  <!-- One clear value, rather than a tiny heading plus a value.
                       The full variable name is retained in the accessible label. -->
                  <div
                    class="pk-wall-reference-copy"
                    :aria-label="`${VARIABLES[key].label}: ${labelFor(key, values[key])}`"
                  >
                    <strong>{{ labelFor(key, values[key]) }}</strong>
                  </div>
                </div>
              </aside>
            </div>
            <p v-if="mode !== 'classroom'" class="pk-scene-tiny-note">
              {{ labelFor("lightColour", values.lightColour) }} ·
              {{ labelFor("nutrientLevel", values.nutrientLevel) }}
            </p>
          </article>
        </div>
      </section>
    </div>

    <!-- THE definitive A/B record: permanently visible, no accordion or
         repeated summary cards. Changed variable highlighted in yellow. -->
    <section class="pk-card pk-plan" aria-label="Your plan">
      <div class="pk-plan-heading">
        <h3>Your plan</h3>
        <p>
          The highlighted row shows what you are changing. Every other setting
          stays the same for both plants.
        </p>
      </div>
      <div class="pk-table-scroll">
        <table class="pk-settings-table">
          <thead>
            <tr>
              <th scope="col">Setting</th>
              <th scope="col">Plant A</th>
              <th scope="col">Plant B</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Growing setup</th>
              <td>{{ modeLabel }}</td>
              <td>{{ modeLabel }}</td>
            </tr>
            <tr v-if="mode === 'tinyFarms'">
              <th scope="row">Light source</th>
              <td>Grow lamp</td>
              <td>Grow lamp</td>
            </tr>
            <tr
              v-for="key in availableKeys"
              :key="key"
              :class="{ 'pk-table-changed': key === changeVariable }"
            >
              <th scope="row">
                {{ VARIABLES[key].label
                }}{{ key === changeVariable ? " (changing)" : "" }}
              </th>
              <td>{{ labelFor(key, setups.A[key]) }}</td>
              <td>{{ labelFor(key, setups.B[key]) }}</td>
            </tr>
            <tr class="pk-table-measures">
              <th scope="row">What to measure</th>
              <td colspan="2">
                {{ measureSummary }}
                <span v-if="selectedMeasures.length">(for both plants)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pk-check-row">
        <Button class="pk-check-button" @click="checkPlan">Check plan</Button>
        <div
          v-if="checked"
          ref="feedback"
          class="pk-feedback"
          :class="{ 'is-success': !missing.length }"
          role="status"
          aria-live="polite"
        >
          {{
            missing.length
              ? `Almost there! Please ${missing.join("; ")}.`
              : "Your fair test plan is ready."
          }}
        </div>
      </div>
    </section>

    <!-- A local, large version of the measuring guide. Native dialog
         supports Escape and keeps the shared site modal unchanged. -->
    <dialog
      ref="measureDialog"
      class="pk-measure-dialog"
      aria-label="Enlarged measuring guide"
    >
      <div class="pk-measure-dialog-top">
        <h3 v-if="focusedMeasure">{{ MEASUREMENTS[focusedMeasure].label }}</h3>
        <button
          type="button"
          class="pk-dialog-close"
          @click="closeMeasureGuide"
        >
          Close ×
        </button>
      </div>
      <img
        v-if="focusedImage"
        :src="focusedImage"
        :alt="`How to measure ${MEASUREMENTS[focusedMeasure]?.label || 'plant growth'}`"
      />
      <p v-if="focusedMeasure">{{ MEASUREMENTS[focusedMeasure].how }}</p>
    </dialog>
  </Activity>
</template>

<style scoped>
/* Change / Measure / Keep the same each have an accent colour */
.pk {
  --pk-accent: var(--yellow);
  --pk-soft: var(--soft-yellow);
  color: var(--text);
  line-height: 1.5;
}
.pk--measure {
  --pk-accent: var(--purple);
  --pk-soft: var(--soft-purple);
}
.pk--control {
  --pk-accent: var(--green);
  --pk-soft: var(--soft-green);
}

.pk button,
.pk select {
  font-family: inherit;
}
.pk button {
  cursor: pointer;
}
.pk :is(button, select, summary):focus-visible {
  outline: 3px solid var(--purple);
  outline-offset: 3px;
}

/* ---------- Growing setup ---------- */
.pk-growing-setup {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin: 0 0 20px;
  padding: 15px 18px;
  background: var(--soft-blue);
  border: 2px solid var(--line);
  border-radius: 17px;
  box-shadow: 0 4px 0 var(--line);
}
.pk-switch {
  padding: 4px;
  background: white;
  border: 2px solid var(--line);
  border-radius: 13px;
}
.pk-switch-choice {
  /* fill the grid cell and centre the label both ways */
  --display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
  text-align: center;
  /* no pressed-in shift, so both options stay level inside the switch */
  --translate-amount-active: 0;
  padding: 9px 17px;
  border: 2px solid transparent;
  box-shadow: none;
  border-radius: 9px;
  background: transparent;
  --color: var(--text);
  font-size: 0.89rem;
  font-weight: 700;

  --background-hover: var(--soft-blue);
  --background-active: var(--purple);
  --color-active: white;

  --translate-amount-hover: -5px;
  --border-color-hover: var(--line);
}

/* ---------- Step tabs ---------- */
.pk-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;
  margin-bottom: 21px;
}
.pk-step {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  padding: 13px 16px 14px;
  background: white;
  color: var(--text);
  text-align: left;
  border: 3px solid var(--line);
  border-top-width: 7px;
  border-radius: 17px;

  --background-hover: var(--soft-yellow);
}
.pk-step--change {
  border-top-color: var(--yellow);
  --background-active: var(--soft-yellow);
}
.pk-step--measure {
  border-top-color: var(--purple);
  --background-active: var(--soft-purple);
}
.pk-step--control {
  border-top-color: var(--green);
  --background-active: var(--soft-green);
}
.pk-step-number {
  display: grid;
  place-items: center;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  background: white;
  border: 2px solid var(--line);
  border-radius: 11px;
  font-weight: 800;
}
.pk-step strong,
.pk-step small {
  display: block;
  line-height: 1.24;
}
.pk-step strong {
  font-size: 0.96rem;
}
.pk-step small {
  margin-top: 3px;
  font-size: 0.78rem;
  color: var(--muted);
}

/* ---------- Cards ---------- */
.pk-workspace {
  display: grid;
  grid-template-columns: minmax(315px, 0.82fr) minmax(0, 1.75fr);
  align-items: start;
  gap: 18px;
}
.pk-full-row {
  grid-column: 1 / -1;
  min-width: 0;
}
.pk-card {
  min-width: 0;
  padding: 22px;
  background: var(--paper);
  border: 3px solid var(--line);
  border-radius: 24px;
  box-shadow: var(--shadow-medium);
}
.pk-card h3 {
  margin: 0;
  color: var(--text);
  font-size: clamp(1.2rem, 1.6vw, 1.55rem);
  letter-spacing: -0.025em;
}
.pk-card-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 12px;
}
.pk-editor {
  border-top: 8px solid var(--pk-accent);
}
.pk-editor h3 {
  margin-bottom: 14px;
}
.pk-kicker {
  margin: 0 0 7px;
  color: var(--purple);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.76rem;
}
.pk-help {
  margin: -6px 0 12px;
  color: var(--muted);
  font-size: 0.9rem;
}
.pk-text-button {
  padding: 8px;
  border: 0;
  background: transparent;
  color: var(--purple);
  font-weight: 700;
  white-space: nowrap;
}
.pk-text-button:hover {
  text-decoration: underline;
}

/* ---------- Step 1: change ---------- */
.pk-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.pk-option {
  display: flex;
  align-items: center;
  min-height: 65px;
  padding: 12px 14px;
  text-align: left;
  color: var(--text);
  background: white;
  border: 3px solid var(--line);
  border-radius: 15px;

  --background-hover: var(--soft-blue);

  --background-active: var(--pk-soft);
}
.pk-option.selected {
  outline: 3px solid var(--pk-accent);
  outline-offset: -3px;
}
.pk-change-summary {
  margin-top: 21px;
  padding: 15px 14px;
  background: var(--soft-yellow);
  border: 2px solid var(--line);
  border-top: 6px solid var(--yellow);
  border-radius: 16px;
}
.pk-change-summary-title {
  display: block;
  margin-bottom: 10px;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.pk-change-summary-pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 9px;
  align-items: center;
}
.pk-change-summary-value {
  min-width: 0;
  padding: 9px 8px;
  background: white;
  border: 2px solid var(--line);
  border-radius: 11px;
  text-align: center;
  font-size: 0.87rem;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.pk-change-summary-vs {
  font-weight: 800;
  font-size: 0.82rem;
}
.pk-frequency-field {
  display: grid;
  gap: 5px;
  text-align: left;
  font-size: 0.78rem;
}
.pk-frequency-field select,
.pk-control-row select {
  width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: 7px 9px;
  color: var(--text);
  background: white;
  border: 2px solid var(--line);
  border-radius: 9px;
  font-size: 0.85rem;
  cursor: pointer;
}

/* ---------- Step 2: measure ---------- */
.pk-measure-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 12px;
  background: #fffdf7;
  border: 2px solid var(--line);
  border-radius: 15px;
}
.pk-measure-btn {
  position: relative;
  min-height: 59px;
  padding: 10px 29px 10px 12px;
  text-align: left;
  --color: var(--text);
  background: white;
  border-radius: 14px;
  font-size: 0.88rem;
  font-weight: 700;

  --color-hover: white;
  --background-active: var(--purple);
  --color-active: white;
}
.pk-measure-btn.selected::after {
  content: "\2713";
  position: absolute;
  right: 11px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  font-weight: 800;
}
.pk-measure-preview {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 13px;
  padding: 12px;
  background: var(--paper);
  border: 2px solid var(--line);
  border-radius: 13px;
}
.pk-measure-preview-copy {
  flex: 1 1 0;
  min-width: 0;
}
.pk-measure-preview-copy strong {
  display: block;
  font-size: 0.94rem;
}
.pk-measure-preview-copy p {
  margin: 6px 0 0;
  font-size: 0.87rem;
  line-height: 1.45;
}
.pk-measure-preview-image {
  display: flex;
  flex: 0 0 118px;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px;
  background: white;
  border: 1px solid #b7b9b4;
  border-radius: 9px;
  color: var(--purple);
  cursor: zoom-in;
}
.pk-measure-preview-image:hover {
  border-color: var(--purple);
}
.pk-measure-preview-image .media > img {
  max-height: 110px;
  object-fit: contain;
}
.pk-measure-preview-image span {
  font-size: 0.7rem;
  font-weight: 700;
}

/* ---------- Step 3: keep the same ---------- */
.pk-control-list {
  display: grid;
  gap: 10px;
}
.pk-control-row {
  display: grid;
  grid-template-columns: minmax(95px, 1fr) minmax(110px, 1.2fr);
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: white;
  border: 2px solid var(--line);
  border-radius: 13px;
}
.pk-control-row label {
  font-size: 0.86rem;
  font-weight: 700;
}

/* ---------- The two plants ---------- */
.pk-scene-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
}
.pk-scene-card {
  min-width: 0;
  overflow: hidden;
  background: white;
  border: 3px solid var(--line);
  border-radius: 18px;
  box-shadow: 0 4px 0 var(--line);
}
.pk-scene-card--a {
  border-top: 5px solid var(--orange);
}
.pk-scene-card--b {
  border-top: 5px solid var(--purple);
}
.pk-plant-name {
  display: block;
  padding: 12px 15px;
  font-weight: 800;
  font-size: 1.08rem;
}
.pk-scene-difference {
  margin: 12px 13px;
  padding: 10px 12px;
  background: var(--paper);
  border: 2px solid var(--line);
  border-radius: 11px;
  font-size: 0.87rem;
  font-weight: 700;
}
.pk-scene-note {
  margin: 12px 0 0;
  font-size: 0.79rem;
  line-height: 1.5;
  color: var(--muted);
}

/* ---------- Materials & care ---------- */
.pk-materials {
  padding: 13px 15px 14px;
  background: white;
  border: 2px solid var(--line);
  border-radius: 16px;
}
.pk-materials-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 3px 11px;
  margin-bottom: 10px;
}
.pk-materials-heading span {
  color: var(--muted);
  font-size: 0.81rem;
  line-height: 1.45;
}
.pk-materials-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.pk-material-item {
  min-width: 0;
  padding: 10px;
  background: var(--paper);
  border: 1.5px solid #d7d9d0;
  border-radius: 13px;
}
.pk-material-item.is-different {
  border: 2px solid var(--line);
  border-top: 5px solid var(--yellow);
}
.pk-material-label {
  display: block;
  margin-bottom: 7px;
  font-weight: 800;
  font-size: 0.84rem;
}
.pk-material-values {
  display: grid;
  gap: 8px;
}
.pk-material-values.has-two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}
.pk-material-choice {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}
.pk-material-values.has-two .pk-material-choice {
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
}
.pk-material-art {
  display: grid;
  place-items: center;
  flex: 0 0 108px;
  width: 108px;
  height: 105px;
  overflow: hidden;
  border: 1px solid #dfe5d9;
  border-radius: 11px;
  background: #f1f5ec;
}
.pk-material-values.has-two .pk-material-art {
  flex-basis: auto;
  width: 100%;
  height: 82px;
}
.pk-material-zoom {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  background: transparent;
  border: 0;
  cursor: zoom-in;
}
.pk-material-zoom:hover {
  background: #e7f0e4;
}
.pk-material-thumb {
  position: absolute;
  inset: 5px;
  width: calc(100% - 10px);
  height: calc(100% - 10px);
  object-fit: contain;
}
.pk-material-zoom-icon {
  position: absolute;
  right: 3px;
  bottom: 3px;
  display: grid;
  place-items: center;
  width: 21px;
  height: 21px;
  border: 1px solid #cbd2c8;
  border-radius: 6px;
  background: #fffdf4e8;
  color: var(--text);
  font-weight: 800;
  line-height: 1;
}
.pk-material-none {
  font-size: 1.65rem;
  color: var(--muted);
}
.pk-material-copy {
  min-width: 0;
}
.pk-material-which {
  display: block;
  margin-bottom: 3px;
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 650;
}
.pk-material-copy strong {
  display: block;
  font-size: 0.86rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.pk-material-values.has-two .pk-material-copy strong {
  font-size: 0.8rem;
}

/* ---------- Your plan ---------- */
.pk-plan {
  margin-top: 24px;
}
.pk-plan h3 {
  margin-bottom: 14px;
}
.pk-blueprint-card {
  min-height: 137px;
  padding: 15px 16px;
  background: white;
  border: 3px solid var(--line);
  border-top-width: 8px;
  border-radius: 17px;
  box-shadow: 0 4px 0 var(--line);
}
.pk-blueprint-card.change {
  border-top-color: var(--yellow);
}
.pk-blueprint-card.measure {
  border-top-color: var(--purple);
}
.pk-blueprint-card.control {
  border-top-color: var(--green);
}
.pk-blueprint-card h4 {
  margin: 0 0 9px;
  font-size: 1.06rem;
}
.pk-blueprint-card p {
  margin: 0;
  font-size: 0.91rem;
}
.pk-settings-details {
  margin-top: 23px;
  overflow: hidden;
  background: white;
  border: 2px solid var(--line);
  border-radius: 14px;
}
.pk-settings-details summary {
  padding: 13px 16px;
  background: var(--paper);
  font-weight: 700;
  cursor: pointer;
}
.pk-settings-details[open] summary {
  border-bottom: 2px solid var(--line);
}
.pk-table-scroll {
  overflow-x: auto;
}
.pk-settings-table {
  width: 100%;
  min-width: 420px;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.pk-settings-table :is(th, td) {
  padding: 10px 13px;
  text-align: left;
  border-bottom: 1px solid #d7dad5;
}
.pk-settings-table th {
  background: var(--purple);
  color: white;
}
.pk-settings-table tr:last-child td {
  border-bottom: none;
}
.pk-table-changed {
  background: var(--soft-yellow);
  font-weight: 700;
}
.pk-check-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 20px;
}
.pk-check-button {
  min-width: 210px;
  --background-active: var(--purple);
}
.pk-feedback {
  flex: 1 1 300px;
  padding: 12px 15px;
  background: var(--soft-orange);
  border: 2px solid var(--line);
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
}
.pk-feedback.is-success {
  background: var(--soft-green);
}

/* ---------- Smaller screens ---------- */
@media (max-width: 1180px) {
  .pk-workspace {
    grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.2fr);
  }
  .pk-scene-grid {
    gap: 10px;
  }
  .pk-card {
    padding: 18px;
  }
}
@media (max-width: 990px) {
  .pk-material-art {
    flex-basis: 88px;
    width: 88px;
    height: 94px;
  }
}
@media (max-width: 900px) {
  .pk-workspace {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 760px) {
  .pk-materials-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 560px) {
  .pk-switch {
    display: flex;
    width: 100%;
  }
  .pk-switch-choice {
    flex: 1;
    padding: 9px 8px;
  }
  .pk-steps {
    gap: 6px;
    margin-bottom: 15px;
  }
  .pk-step {
    justify-content: center;
    gap: 6px;
    padding: 11px 6px 12px;
    border-radius: 13px;
  }
  .pk-step-number {
    flex-basis: 26px;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    font-size: 0.83rem;
  }
  .pk-step strong {
    font-size: 0.73rem;
  }
  .pk-step small {
    display: none;
  }
  .pk-scene-grid {
    grid-template-columns: 1fr;
  }
  .pk-card {
    padding: 15px;
    border-radius: 19px;
  }
  .pk-option {
    min-height: 62px;
    padding: 10px 11px;
    font-size: 0.91rem;
  }
  .pk-check-button {
    width: 100%;
  }
}
@media (max-width: 430px) {
  .pk-measure-buttons {
    grid-template-columns: 1fr;
  }
  .pk-measure-preview {
    flex-wrap: wrap;
  }
  .pk-measure-preview-image {
    flex: 0 0 100%;
  }
  .pk-materials-grid {
    gap: 8px;
  }
  .pk-material-choice {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  .pk-material-art {
    flex-basis: auto;
    width: 100%;
    height: 84px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .pk * {
    transition-duration: 0.01ms !important;
  }
}

/* ================================================================
   LAYOUT TRIAL: horizontal planner, larger scenes, permanent A/B table
   The existing GTAC palette, buttons and experiment logic are unchanged.
   ================================================================ */
.pk-workspace {
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}
.pk-editor {
  display: block;
  padding: 19px 21px;
}
.pk-editor-head {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 16px;
  align-items: baseline;
  margin-bottom: 13px;
}
.pk-editor-head .pk-kicker {
  margin: 0;
}
.pk-editor-head h3 {
  margin: 0;
}
.pk-editor-head .pk-help {
  margin: 0;
}
.pk-options {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
}
.pk-option {
  min-height: 47px;
  padding: 9px 13px;
  font-size: 0.88rem;
}
.pk-change-summary {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px 18px;
  flex-wrap: wrap;
  padding: 11px 14px;
}
.pk-change-summary-title {
  margin: 0;
}
.pk-change-summary-pair {
  flex: 1 1 380px;
  max-width: 730px;
}
.pk-change-summary-value {
  padding: 7px 10px;
}
.pk-change-summary-value small {
  display: block;
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 700;
  margin-bottom: 2px;
}
.pk-measure-buttons {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  padding: 0;
  background: transparent;
  border: 0;
}
.pk-measure-btn {
  min-height: 48px;
  padding: 9px 27px 9px 11px;
}
.pk-measure-preview {
  max-width: none;
  padding: 10px 14px;
}
.pk-measure-preview-image {
  flex-basis: 185px;
  padding: 5px;
}
.pk-measure-preview-image .media > img {
  max-height: 148px;
}
.pk-control-note {
  margin: 0 0 10px;
  font-size: 0.86rem;
  color: var(--muted);
}
.pk-control-list {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
}
.pk-control-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 9px 11px;
  gap: 5px;
}
.pk-control-row select {
  width: 100%;
}
.pk-card-heading {
  align-items: center;
}
.pk-scene-intro {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 0.84rem;
}
.pk-scene-grid {
  gap: 17px;
}
.pk-scene-card-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 5px 12px;
  padding: 10px 14px;
}
.pk-plant-name {
  padding: 0;
  font-size: 1.06rem;
}
.pk-scene-difference {
  display: inline-flex;
  margin: 0;
  padding: 5px 9px;
  border-width: 1.5px;
  border-radius: 9px;
  font-size: 0.78rem;
  max-width: 100%;
}
.pk-scene-materials {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px;
  padding: 8px 10px 10px;
  border-top: 1px solid #d7dad5;
  background: #fffefa;
}
.pk-scene-material {
  min-width: 0;
  min-height: 68px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 4px 5px;
  border-radius: 10px;
  border: 1px solid transparent;
}
.pk-scene-material.is-different {
  background: var(--soft-yellow);
  border-color: var(--yellow);
}
.pk-scene-material-art,
.pk-scene-material-empty {
  flex: 0 0 48px;
  width: 48px;
  height: 54px;
  border-radius: 8px;
  border: 1px solid #d7ded2;
  background: #f1f5ec;
  display: grid;
  place-items: center;
  padding: 2px;
}
.pk-scene-material-art {
  cursor: zoom-in;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}
.pk-scene-material-art:hover {
  outline: 2px solid var(--purple);
}
.pk-scene-material-art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.pk-scene-material-empty {
  color: var(--muted);
  font-size: 1.35rem;
}
.pk-scene-material-copy {
  min-width: 0;
  line-height: 1.28;
}
.pk-scene-material-copy span {
  display: block;
  color: var(--muted);
  font-size: 0.68rem;
}
.pk-scene-material-copy strong {
  display: block;
  font-size: 0.76rem;
  overflow-wrap: anywhere;
}
.pk-scene-tiny-note {
  margin: 0;
  padding: 10px 14px;
  color: var(--muted);
  font-size: 0.84rem;
}
.pk-plan {
  margin-top: 18px;
}
.pk-plan-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 5px 14px;
  margin-bottom: 12px;
}
.pk-plan-heading h3 {
  margin: 0;
}
.pk-plan-heading p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
}
.pk-table-scroll {
  border: 2px solid var(--line);
  border-radius: 13px;
  overflow-x: auto;
}
.pk-settings-table {
  min-width: 470px;
}
.pk-settings-table :is(th, td) {
  padding: 8px 13px;
}
.pk-settings-table tbody th {
  text-align: left;
  font-weight: 650;
}
.pk-table-measures {
  background: var(--soft-purple);
}
.pk-table-measures th {
  color: #fff;
}
.pk-check-row {
  margin-top: 14px;
}
.pk-check-button {
  min-width: 175px;
}

/* Enlarged measuring illustrations only. Material thumbnails still use
   the project's shared modal as before. */
.pk-measure-dialog {
  position: fixed;
  width: min(1040px, 94vw);
  max-width: 94vw;
  max-height: 90vh;
  margin: auto;
  overflow: auto;
  padding: 17px 19px 20px;
  border: 3px solid var(--line);
  border-radius: 19px;
  background: white;
  color: var(--text);
  box-shadow: 0 18px 65px #0005;
}
.pk-measure-dialog::backdrop {
  background: #171d1cb8;
}
.pk-measure-dialog-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.pk-measure-dialog-top h3 {
  margin: 0;
}
.pk-dialog-close {
  flex: 0 0 auto;
  padding: 9px 14px;
  background: white;
  border: 2px solid var(--line);
  border-radius: 10px;
  font-weight: 750;
}
.pk-measure-dialog > img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 69vh;
  margin: 0 auto;
  object-fit: contain;
}
.pk-measure-dialog > p {
  margin: 12px 0 0;
  font-size: 0.95rem;
}
@media (max-width: 980px) {
  .pk-options,
  .pk-control-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .pk-measure-buttons {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 780px) {
  .pk-options,
  .pk-control-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pk-measure-buttons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pk-scene-grid {
    grid-template-columns: 1fr;
  }
  .pk-scene-material {
    flex-direction: row;
    align-items: center;
  }
  .pk-scene-material-art,
  .pk-scene-material-empty {
    width: 48px;
    flex-basis: 48px;
    height: 54px;
  }
}
@media (max-width: 560px) {
  .pk-settings-table {
    min-width: 0;
    width: 100%;
    font-size: 0.76rem;
    table-layout: fixed;
  }
  .pk-settings-table :is(th, td) {
    padding: 7px 6px;
    overflow-wrap: anywhere;
  }
  .pk-settings-table :is(th, td):first-child {
    width: 38%;
  }
}
@media (max-width: 490px) {
  .pk-editor {
    padding: 14px;
  }
  .pk-option {
    min-height: 50px;
    padding: 8px 10px;
  }
  .pk-measure-buttons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pk-measure-preview-image {
    flex: 0 0 100%;
  }
  .pk-scene-materials {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pk-scene-material {
    padding: 4px;
  }
  .pk-scene-material-art,
  .pk-scene-material-empty {
    width: 42px;
    flex-basis: 42px;
    height: 44px;
  }
  .pk-scene-card-heading {
    align-items: start;
  }
  .pk-scene-difference {
    font-size: 0.75rem;
  }
  .pk-plan-heading p {
    font-size: 0.8rem;
  }
}

/* === Trial UX correction: prevent tall measurement graphics from growing the editor === */
.pk-measure-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 0;
}
.pk-measure-preview-copy {
  flex: 1 1 auto;
  min-width: 0;
}
.pk-measure-preview-image {
  flex: 0 0 112px;
  width: 112px;
  min-width: 0;
  height: auto;
  align-self: center;
  padding: 6px;
  justify-content: center;
  overflow: hidden;
}
.pk-measure-thumb {
  display: block;
  width: 100%;
  height: 106px;
  max-height: 106px;
  object-fit: contain;
}
.pk-measure-preview-image span {
  display: block;
  text-align: center;
  margin-top: 2px;
}
@media (max-width: 490px) {
  .pk-measure-preview {
    flex-direction: row;
    flex-wrap: nowrap;
  }
  .pk-measure-preview-image {
    flex: 0 0 96px;
    width: 96px;
  }
  .pk-measure-thumb {
    height: 85px;
    max-height: 85px;
  }
}

/* === OPTION A: controls alongside plants (recommended for classroom screens) === */
@media (min-width: 1051px) {
  .pk-workspace {
    grid-template-columns: minmax(312px, 0.82fr) minmax(0, 1.9fr);
    align-items: start;
    gap: 15px;
  }
  .pk-editor {
    padding: 17px 18px;
  }
  .pk-editor-head {
    display: block;
    margin-bottom: 13px;
  }
  .pk-editor-head .pk-kicker {
    margin: 0 0 4px;
  }
  .pk-editor-head h3 {
    font-size: clamp(1.2rem, 1.8vw, 1.45rem);
    line-height: 1.25;
  }
  .pk-editor-head .pk-help {
    display: block;
    margin: 6px 0 0;
    font-size: 0.81rem;
  }
  .pk-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }
  .pk-option {
    min-height: 53px;
    padding: 9px 11px;
    font-size: 0.82rem;
  }
  .pk-change-summary {
    display: block;
    padding: 11px 12px;
    margin-top: 13px;
  }
  .pk-change-summary-title {
    margin: 0 0 7px;
  }
  .pk-change-summary-pair {
    max-width: none;
    gap: 6px;
  }
  .pk-change-summary-value {
    padding: 7px 5px;
    font-size: 0.79rem;
  }
  .pk-measure-buttons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }
  .pk-measure-btn {
    min-height: 49px;
    padding: 8px 26px 8px 10px;
    font-size: 0.82rem;
  }
  .pk-measure-preview {
    gap: 9px;
    padding: 10px;
  }
  .pk-measure-preview-copy strong {
    font-size: 0.84rem;
  }
  .pk-measure-preview-copy p {
    font-size: 0.78rem;
    line-height: 1.4;
  }
  .pk-measure-preview-image {
    flex: 0 0 96px;
    width: 96px;
  }
  .pk-measure-thumb {
    height: 90px;
    max-height: 90px;
  }
  .pk-control-list {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .pk-control-note {
    font-size: 0.8rem;
    line-height: 1.4;
  }
  .pk-control-row {
    display: grid;
    grid-template-columns: minmax(85px, 1fr) minmax(140px, 1.18fr);
    gap: 10px;
    align-items: center;
    padding: 8px 10px;
  }
  .pk-control-row label {
    font-size: 0.82rem;
  }
  .pk-control-row select {
    min-height: 38px;
    font-size: 0.82rem;
  }
  .pk-experiments {
    padding: 17px;
  }
  .pk-scene-grid {
    gap: 10px;
  }
  .pk-scene-materials {
    padding: 7px 8px 8px;
    gap: 4px;
  }
  .pk-scene-material {
    gap: 4px;
    padding: 3px;
  }
  .pk-scene-material-art,
  .pk-scene-material-empty {
    flex: 0 0 41px;
    width: 41px;
    height: 48px;
  }
  .pk-scene-material-copy span {
    font-size: 0.63rem;
  }
  .pk-scene-material-copy strong {
    font-size: 0.7rem;
  }
}
/* On tablets / phones, restore full-width choices followed by plant cards. */
@media (max-width: 1050px) {
  .pk-workspace {
    grid-template-columns: 1fr;
  }
  .pk-editor {
    padding: 15px;
  }
  .pk-editor-head {
    display: flex;
    flex-wrap: wrap;
  }
  .pk-options {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .pk-measure-buttons {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .pk-control-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .pk-options,
  .pk-control-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pk-measure-buttons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 490px) {
  .pk-scene-grid {
    grid-template-columns: 1fr;
  }
  .pk-scene-materials {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* =========================================================
   COMPACT WALL KEY — v3 experiment layout trial

   A single calm column of four material references on the right.
   This is NOT a second panel: the image and one legible value are
   placed directly over the wall. Every setting stays visible when
   students change steps. The A/B table remains the source of truth.
   ========================================================= */
.pk-scene-stage {
  position: relative;
  min-width: 0;
  background: #eef6e9;
}
.pk-scene-stage > .pk-scene-picture {
  display: block;
  width: 100%;
  height: auto;
}
.pk-wall-references {
  position: absolute;
  top: 8%;
  bottom: 16%; /* leave the bench clear */
  left: 52.5%;
  right: 2.5%;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: repeat(4, minmax(0, 1fr));
  row-gap: 1.5%;
  pointer-events: none;
}
.pk-wall-reference {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-height: 0;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  pointer-events: auto;
}
.pk-wall-reference-image,
.pk-wall-reference-empty {
  display: grid;
  place-items: center;
  flex: 0 0 clamp(33px, 3.1vw, 43px);
  width: clamp(33px, 3.1vw, 43px);
  height: clamp(34px, 3.2vw, 45px);
  min-width: 0;
  min-height: 0;
  padding: 0;
  border: none;
  border-radius: 2px;
  background: transparent;
  box-shadow: none;
  color: #66786d;
}
button.pk-wall-reference-image {
  cursor: zoom-in;
}
button.pk-wall-reference-image:hover {
  filter: drop-shadow(0 1px 2px #4c479b77);
}
button.pk-wall-reference-image:focus-visible {
  outline: 3px solid var(--purple);
  outline-offset: 2px;
}
.pk-wall-reference-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.pk-wall-reference-empty {
  font-size: 1.15rem;
}
.pk-wall-reference-copy {
  flex: 1 1 auto;
  min-width: 0;
}
.pk-wall-reference-copy strong {
  display: block;
  color: #283c30;
  font-size: clamp(0.69rem, 0.88vw, 0.82rem);
  font-weight: 750;
  line-height: 1.22;
  overflow-wrap: normal;
}
/* The selected change remains identifiable without new cards or badges. */
.pk-wall-reference.is-different .pk-wall-reference-copy strong {
  text-decoration: underline;
  text-decoration-color: var(--yellow);
  text-decoration-thickness: 3px;
  text-underline-offset: 3px;
}
/* Keep the Measure row heading white, including on legacy theme overrides. */
.pk .pk-settings-table tbody tr.pk-table-measures > th {
  background: var(--purple);
  color: #fff !important;
}
@media (max-width: 1050px) {
  .pk-wall-reference-image,
  .pk-wall-reference-empty {
    flex-basis: clamp(38px, 5.2vw, 48px);
    width: clamp(38px, 5.2vw, 48px);
    height: clamp(38px, 5.2vw, 48px);
  }
  .pk-wall-reference-copy strong {
    font-size: 0.81rem;
  }
}
@media (max-width: 650px) {
  .pk-wall-references {
    top: 7%;
    bottom: 17%;
    left: 52%;
    right: 2%;
  }
  .pk-wall-reference {
    gap: 6px;
  }
  .pk-wall-reference-image,
  .pk-wall-reference-empty {
    flex-basis: clamp(31px, 10vw, 43px);
    width: clamp(31px, 10vw, 43px);
    height: clamp(33px, 10vw, 43px);
  }
  .pk-wall-reference-copy strong {
    font-size: clamp(0.7rem, 3vw, 0.8rem);
  }
}
@media (max-width: 380px) {
  .pk-wall-reference {
    gap: 5px;
  }
  .pk-wall-reference-copy strong {
    font-size: 0.7rem;
  }
}
</style>
