<script setup>
/*
  Range sliders the student sets to match target values (the averages in a
  table), then checks. Builds the Part C and Part D bar graphs.

    <BarSliders ref="sliders" name="partc-sliders" id-prefix="partCBarPractice"
                :rows="[{ label: 'Leadbeater\'s Possum', targets: { default: 1 } }, ...]"
                check-label="Check my bars" @check="..." />

  Several sets of the same sliders (Part D: one per site) - each row has a
  target per set; the site buttons switch which set the sliders show:

    <BarSliders :sets="['site1', 'site2']" :set-labels="{ site1: 'Site 1', site2: 'Site 2' }" ... />

  Check compares every slider in every set with its target: rows of the shown
  set get "correct-bar" / "needs-fix", set buttons "needs-fix" / "site-complete",
  and the first set with a wrong slider is shown. Moving a slider clears its
  result. Complete once the last check found everything right.

  Exposes values ({ set: [numbers] }), checked ({ set: [true|false|null] }),
  activeSet and isComplete, so the page can draw the bars from them. Events:
  check({ results, allCorrect, firstWrong }), setchange(set).
  Saved through <Activity :state>. hide-when-complete hides the controls once done.
  Slots: #header (always shown, above everything), default (between the site
  buttons and the sliders), #complete (shown once complete).
*/
import { computed, ref } from "vue";
import Activity from "../activities/Activity.vue";

const props = defineProps({
  rows: { type: Array, required: true },
  sets: { type: Array, default: () => ["default"] },
  setLabels: { type: Object, default: () => ({}) },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 10 },
  idPrefix: { type: String, default: "barSlider" },
  controlsClass: { type: String, default: "" },
  checkLabel: { type: String, default: "Check" },
  hideWhenComplete: { type: Boolean, default: false },
});

const emit = defineEmits(["check", "setchange"]);

function blank(fill) {
  return Object.fromEntries(props.sets.map((set) => [set, props.rows.map(() => fill)]));
}

const values = ref(blank(props.min));
const checked = ref(blank(null));
const activeSet = ref(props.sets[0]);
const state = { values, checked, activeSet };

const isComplete = computed(() =>
  props.sets.every((set) => checked.value[set]?.every((c) => c === true)),
);

function setActive(set) {
  if (set === activeSet.value) return;
  activeSet.value = set;
  emit("setchange", set);
}

function onInput(index, event) {
  const set = activeSet.value;
  values.value = {
    ...values.value,
    [set]: values.value[set].map((v, i) => (i === index ? Number(event.target.value) : v)),
  };
  checked.value = {
    ...checked.value,
    [set]: checked.value[set].map((c, i) => (i === index ? null : c)),
  };
}

function check() {
  let firstWrong = null;
  const results = {};
  for (const set of props.sets) {
    results[set] = props.rows.map((row, i) => {
      const correct = values.value[set][i] === row.targets[set];
      if (!correct && !firstWrong) firstWrong = { set, index: i };
      return correct;
    });
  }
  checked.value = results;
  if (firstWrong) setActive(firstWrong.set);
  emit("check", { results, allCorrect: !firstWrong, firstWrong });
}

function setState(set) {
  const states = checked.value[set] || [];
  return {
    "needs-fix": states.some((s) => s === false),
    "site-complete": states.length > 0 && states.every((s) => s === true),
  };
}

function fill(value) {
  return ((value - props.min) / (props.max - props.min)) * 100 + "%";
}

function reset() {
  values.value = blank(props.min);
  checked.value = blank(null);
  setActive(props.sets[0]);
}

defineExpose({ values, checked, activeSet, isComplete, reset });
</script>

<template>
  <Activity :complete="isComplete" :state="state" @reset="reset">
    <slot name="header" />

    <template v-if="!(hideWhenComplete && isComplete)">
      <div
        v-if="sets.length > 1"
        class="partd-site-switcher"
        aria-label="Choose which site to edit"
      >
        <button
          v-for="set in sets"
          :key="set"
          type="button"
          class="partd-site-toggle"
          :class="[{ selected: activeSet === set }, setState(set)]"
          :data-partd-site="set"
          :aria-pressed="activeSet === set"
          @click="setActive(set)"
        >
          {{ setLabels[set] || set }}
        </button>
      </div>

      <slot />

      <div class="bar-builder-controls" :class="controlsClass">
        <div
          v-for="(row, i) in rows"
          :key="row.label"
          class="bar-builder-row"
          :class="{
            'correct-bar': checked[activeSet][i] === true,
            'needs-fix': checked[activeSet][i] === false,
          }"
        >
          <label :for="idPrefix + i">{{ row.label }}</label>
          <input
            :id="idPrefix + i"
            type="range"
            :min="min"
            :max="max"
            step="1"
            :value="values[activeSet][i]"
            :style="{ '--partd-fill': fill(values[activeSet][i]) }"
            @input="onInput(i, $event)"
          />
        </div>
      </div>

      <button
        type="button"
        class="general-button lesson4-check-button"
        @click="check"
      >
        {{ checkLabel }}
      </button>
    </template>

    <slot name="complete" v-if="isComplete" />
  </Activity>
</template>

<style>
/* Moved from styles/lesson4_styles/lesson4.css. Not scoped: some rules style child components' content. */

/* ---------- Bar graph practice ---------- */
.bar-builder-controls {
  display: grid;
  gap: 5px;
  margin-top: 14px;
}
.bar-builder-row {
  display: grid;
  grid-template-rows: 0.6fr 1fr;
  grid-template-columns: 1fr auto;
  align-items: center;
  text-align: center;
  gap: 5px;
  padding: 8px 8px;
  background: var(--paper);
  border: 2px solid var(--charcoal);
  border-radius: 13px;
}
.bar-builder-row label {
  grid-column: 1 / -1;
  grid-row: 1;
  font-weight: 700;
  font-size: 15px;
}
.bar-builder-row output {
  grid-row: 2;
  grid-column: 2;
  width: 42px;
  display: grid;
  place-items: center;
  min-height: 36px;
  background: var(--soft-blue);
  border: 2px solid var(--charcoal);
  border-radius: 10px;
  font-weight: 700;
}
.bar-builder-row input[type="range"] {
  grid-row: 2;
  grid-column: 1;
  width: 100%;
  accent-color: var(--purple);
}
.bar-builder-row.needs-fix {
  background: var(--soft-orange);
}
.bar-builder-row.correct-bar {
  background: var(--soft-green);
}

.partd-site-switcher {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0 10px;
}

.partd-site-toggle {
  min-height: 54px;
  padding: 9px 12px;
  background: white;
  color: var(--text);
  border: 2px solid var(--charcoal);
  border-radius: 13px;
  box-shadow: 0 3px 0 var(--charcoal);
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  outline: none;
}

.partd-site-toggle[data-partd-site="site1"] {
  border-top: 7px solid var(--lavender);
}

.partd-site-toggle[data-partd-site="site2"] {
  border-top: 7px solid var(--green);
}

.partd-site-toggle.selected {
  transform: translateY(4px);
  box-shadow: none;
  background: color-mix(in srgb, var(--yellow) 50%, transparent);
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.partd-site-toggle.site-complete::after {
  content: " ✓";
  color: var(--green);
}

.partd-site-toggle.needs-fix {
  background: var(--soft-orange);
}

@media (max-width: 620px) {
  .partd-site-switcher {
    grid-template-columns: 1fr 1fr;
  }
}

.lesson4-check-button {
  display: block;
  margin: 14px auto 0;
}
</style>
