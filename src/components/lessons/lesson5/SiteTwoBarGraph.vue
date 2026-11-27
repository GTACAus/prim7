<script setup>
/*
  Lesson 5 Part C: graph the Site 2 survey (averages already given).
    1. Drag the right labels onto the x- and y-axes; each settles onto the
       graph as soon as it is right.
    2. Unit check - the graph's scale and categories then appear.
    3. Set each bar's height with a slider, then check all five.
    4. Answer three analysis questions; a summary comparing the sites follows.

    <SiteTwoBarGraph ref="partC" @reset="section.reset()" />

  Exposes barsActive (the section gets .partc-bars-active while the sliders
  are in use). Every step is an activity that saves itself.
*/
import { computed, nextTick, ref, watch } from "vue";
import Button from "@/components/ui/Button.vue";
import DragDrop from "@/components/activities/DragDrop.vue";
import DragItem from "@/components/activities/DragItem.vue";
import DropSlot from "@/components/activities/DropSlot.vue";
import MultipleChoice from "@/components/activities/MultipleChoice.vue";
import McQuestion from "@/components/activities/McQuestion.vue";
import McChoice from "@/components/activities/McChoice.vue";
import BarGraphFrame from "./BarGraphFrame.vue";
import BarSliders from "./BarSliders.vue";
import AnalysisQuestions from "./AnalysisQuestions.vue";
import { PLOT, SITE_2, CHOICE_CLASSES, barBox, yOf } from "./barGraph.js";

const emit = defineEmits(["reset"]);

const AXIS_CARDS = [
  { name: "animal", text: "Type of animal" },
  { name: "number", text: "Number of animals" },
  { name: "night", text: "Night number" },
  { name: "average", text: "Average" },
];

const SLIDER_ROWS = SITE_2.map((item) => ({
  label: item.label,
  targets: { default: item.average },
}));

const QUESTIONS = [
  {
    name: "leadbeaters",
    prompt: "How many Leadbeater's Possums were found on average at Site 2?",
    answer: "1",
    choices: [
      { value: "0", text: "0 animals" },
      { value: "1", text: "1 animal" },
      { value: "2", text: "2 animals" },
    ],
    gridClass: "three-choice",
    incorrectTitle: "Look at the Leadbeater's Possum bar.",
    incorrectText: " Read its height using the y-axis.",
  },
  {
    name: "deer",
    prompt: "How many feral deer were found on average at Site 2?",
    answer: "3",
    choices: ["2", "3", "4"].map((v) => ({ value: v, text: v + " animals" })),
    gridClass: "three-choice",
    incorrectTitle: "Look at the feral deer bar.",
    incorrectText: " Read its height using the y-axis.",
  },
  {
    name: "site",
    prompt: "Which site had more Leadbeater's Possums?",
    answer: "site1",
    choices: [
      { value: "site1", text: "Site 1" },
      { value: "site2", text: "Site 2" },
    ],
    incorrectTitle: "Compare the Leadbeater's Possum results.",
    incorrectText: " Site 1 averaged 6 and Site 2 averaged 1.",
  },
];

/* ---------- the steps ---------- */

const axes = ref(null);
const unit = ref(null);
const sliders = ref(null);
const analysis = ref(null);

const placements = computed(() => axes.value?.getPlacements() ?? {});
const xReady = computed(() => placements.value.x === "animal");
const yReady = computed(() => placements.value.y === "number");
const axesDone = computed(() => xReady.value && yReady.value);
const unitDone = computed(
  () => axesDone.value && (unit.value?.isComplete ?? false),
);
const barsDone = computed(
  () => unitDone.value && (sliders.value?.isComplete ?? false),
);
const analysisDone = computed(() => analysis.value?.isComplete ?? false);

const stepLabel = computed(() => {
  if (barsDone.value) return "Bars complete ✓";
  if (unitDone.value) return "Step 3 · Use the slider to build the bars";
  if (axesDone.value) return "Step 2 · Check the units";
  return "Step 1 · Label the axes";
});

/* ---------- bars from the sliders ---------- */

const values = computed(
  () => sliders.value?.values.default ?? SITE_2.map(() => 0),
);
const checked = computed(
  () => sliders.value?.checked.default ?? SITE_2.map(() => null),
);
const correctBars = computed(() =>
  SITE_2.map((_, i) => i).filter((i) => checked.value[i] === true),
);

/* ---------- analysis ---------- */

const highlight = ref([]);
function onAnalysisAnswer({ question }) {
  highlight.value = [question === "deer" ? 4 : 0];
}

const panel = ref(null);
watch(barsDone, async (done) => {
  if (!done) return;
  await nextTick();
  setTimeout(
    () => panel.value?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    200,
  );
});

defineExpose({ barsActive: computed(() => unitDone.value && !barsDone.value) });
</script>

<template>
  <div class="workbench partc-workbench">
    <div class="partc-data-card">
      <span class="challenge-step-label">Site 2 results · Three nights</span>
      <p>
        You counted the number of animals at <strong>Site 2</strong> over three
        nights. The average results are shown in Table 2. Use the
        <strong>Average</strong> column when you build each bar.
      </p>

      <div class="partc-table-wrap">
        <table
          class="practice-table partc-data-table"
          aria-label="Site 2 animal counts across three spotlight survey nights"
        >
          <caption>
            Table 2. Site 2 animal counts across three nights
          </caption>
          <thead>
            <tr>
              <th>Type of animal</th>
              <th>Night 1</th>
              <th>Night 2</th>
              <th>Night 3</th>
              <th>Average</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, i) in SITE_2"
              :key="item.label"
              :class="{ 'partc-complete-row': checked[i] === true }"
            >
              <td>{{ item.label }}</td>
              <td v-for="(n, j) in item.nights" :key="j">{{ n }}</td>
              <td class="partc-average-cell">{{ item.average }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <DragDrop ref="axes" name="partc-axes" class="partc-build-grid" strict>
      <div class="graph-control-card partc-control-card">
        <span class="challenge-step-label">{{ stepLabel }}</span>

        <div
          v-show="!unitDone"
          class="partc-axis-bank"
          data-dd-tray
          aria-label="Axis label cards"
        >
          <DragItem
            v-for="card in AXIS_CARDS"
            :key="card.name"
            tag="button"
            class="axis-card"
            :name="card.name"
          >
            {{ card.text }}
          </DragItem>
        </div>

        <MultipleChoice
          v-if="axesDone"
          v-show="!unitDone"
          ref="unit"
          name="partc-unit"
          class="partc-unit-check"
          completion-mode="live"
          :classes="CHOICE_CLASSES"
        >
          <McQuestion answer="hectare">
            <p>
              <strong>Do these axes need a measurement unit?</strong> Check the
              data before the graph is revealed.
            </p>
            <div class="partc-unit-buttons">
              <McChoice value="none" class="challenge-choice"
                >No unit needed</McChoice
              >
              <McChoice value="hectare" class="challenge-choice"
                >animals per hectare</McChoice
              >
              <McChoice value="seconds" class="challenge-choice"
                >seconds</McChoice
              >
            </div>
          </McQuestion>
        </MultipleChoice>

        <BarSliders
          v-if="unitDone"
          ref="sliders"
          name="partc-sliders"
          class="partc-slider-stage"
          :class="{ 'partc-slider-stage-complete': barsDone }"
          :rows="SLIDER_ROWS"
          id-prefix="partCBarPractice"
          controls-class="partc-bar-builder-controls"
          check-label="Check my bars"
          hide-when-complete
        />
      </div>

      <div class="graph-stage-card partc-graph-card">
        <div class="graph-stage-heading">
          <div>
            <h3>Average animal counts from spotlight surveys at Site 2</h3>
          </div>
        </div>

        <BarGraphFrame
          svg-id="partCGraphSvg"
          aria-label="Student bar graph of average animal counts at Site 2"
          :items="SITE_2"
          x-label="Type of animal"
          y-label="Number of animals"
          :y-unit="unitDone ? ' (per hectare)' : ''"
          label-class="partc-final-axis-label"
          :labels-visible="{ x: xReady, y: yReady }"
          scale-class="partc-scaffold-layer"
          :scale-visible="unitDone"
          category-class="tick-label partc-category-label"
          :complete-x="correctBars"
        >
          <rect
            v-for="(item, i) in SITE_2"
            :key="'bar' + i"
            class="partc-practice-bar"
            :class="{
              preview: checked[i] !== true,
              complete: checked[i] === true,
              'analysis-highlight': highlight.includes(i),
            }"
            :x="PLOT.centres[i] - PLOT.barWidth / 2"
            :y="barBox(values[i]).y"
            :width="PLOT.barWidth"
            :height="barBox(values[i]).height"
            rx="4"
            :fill="item.colour"
          />
          <text
            v-for="(item, i) in SITE_2"
            :key="'value' + i"
            class="partc-value-label"
            :class="{ visible: checked[i] === true }"
            :x="PLOT.centres[i]"
            :y="Math.max(PLOT.top + 16, yOf(item.average) - 10)"
          >
            {{ item.average }}
          </text>

          <template #overlay>
            <DropSlot
              name="x"
              answer="animal"
              class="axis-slot axis-slot-x"
              :class="{ 'axis-complete': xReady }"
              aria-label="Drop the x-axis label here"
            >
              x-axis label
            </DropSlot>
            <DropSlot
              name="y"
              answer="number"
              class="axis-slot axis-slot-y"
              :class="{ 'axis-complete': yReady }"
              aria-label="Drop the y-axis label here"
            >
              y-axis label
            </DropSlot>
          </template>
        </BarGraphFrame>
      </div>
    </DragDrop>
  </div>

  <div v-if="barsDone" ref="panel" class="partc-analysis-panel">
    <AnalysisQuestions
      ref="analysis"
      name="partc-analysis"
      prefix="partc"
      :questions="QUESTIONS"
      :initial-feedback="{
        title: 'Read the Leadbeater\'s Possum bar.',
        text: ' What average value does it reach?',
      }"
      @answer="onAnalysisAnswer"
    >
      <span class="challenge-step-label"
        >Step 4 · Analyse your graph for Site 2</span
      >
    </AnalysisQuestions>

    <div v-if="analysisDone" class="partc-complete-card pop-in">
      <span class="challenge-step-label">Site 2 survey complete</span>
      <h3>You now have results from both sites</h3>
      <p class="partc-result-statement">
        Leadbeater's Possums averaged <strong>6 at Site 1</strong> and
        <strong>1 at Site 2</strong>.
        <strong>Site 1 had more Leadbeater's Possums.</strong>
      </p>
      <p class="partc-next-hook">
        <strong>You have now graphed Site 1 and Site 2.</strong><br />
        Next, you can place the bars for <strong>Site 1</strong> and
        <strong>Site 2</strong> on one bar graph.
        <br />
        This will make it easier to compare data from the two sites.
      </p>
    </div>
  </div>

  <div class="reset-button-container">
    <Button :is-reset="true" @click="emit('reset')" />
  </div>
</template>

<style scoped>

.partc-data-card {
  padding: 18px;
  margin-bottom: 18px;
}

.partc-table-wrap {
  width: 100%;
  margin-top: 14px;
  overflow-x: auto;
}

.partc-average-cell {
  background: var(--soft-purple) !important;
  font-weight: 800;
}

.partc-build-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.82fr) minmax(420px, 1.4fr);
  gap: 18px;
  align-items: start;
}

.partc-control-card,
.partc-graph-card {
  padding: 10px;
}

.partc-axis-bank {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 16px 0;
}

.partc-axis-bank[hidden] {
  display: none !important;
}

:deep(#partCGraphSvg .partc-final-axis-label) {
  opacity: 0;
  transition: opacity 0.25s ease;
}

:deep(#partCGraphSvg .partc-final-axis-label.visible) {
  opacity: 1;
}

:deep(#partCGraphSvg .partc-scaffold-layer) {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
}

:deep(#partCGraphSvg .partc-scaffold-layer.visible) {
  opacity: 1;
}

.partc-unit-check {
  margin: 14px 0;
  padding: 14px;
  background: var(--soft-blue);
  border: 2px solid var(--charcoal);
  border-radius: 14px;
}

.partc-unit-check :deep(p) {
  margin: 0 0 10px;
  line-height: 1.45;
}

.partc-unit-buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.partc-slider-stage {
  margin-top: 10px;
  padding: 10px;
  background: var(--soft-yellow);
  border: 2px solid var(--charcoal);
  border-radius: 15px;
}

.partc-slider-stage[hidden],
.partc-slider-stage.partc-slider-stage-complete {
  /* BarSliders stays mounted so the completed activity and progress persist. */
  display: none !important;
}

.partc-slider-stage :deep(h4) {
  margin: 3px 0 5px;
  font-size: 1.08rem;
}
#partCGraphSvg .partc-practice-bar {
  stroke: var(--charcoal);
  stroke-width: 2.5;
  transition:
    y 0.18s ease,
    height 0.18s ease,
    opacity 0.2s ease;
}

#partCGraphSvg .partc-practice-bar.preview {
  opacity: 0.72;
}

#partCGraphSvg .partc-practice-bar.complete {
  opacity: 1;
}

#partCGraphSvg .partc-value-label {
  opacity: 0;
  font-size: 13px;
  font-weight: 800;
  text-anchor: middle;
  transition: opacity 0.25s ease;
}

#partCGraphSvg .partc-value-label.visible {
  opacity: 1;
}

:deep(#partCGraphSvg .partc-category-label.complete) {
  fill: var(--green);
  font-weight: 800;
}

#partCGraphSvg .partc-practice-bar.analysis-highlight {
  stroke: var(--purple);
  stroke-width: 6;
  filter: drop-shadow(0 3px 0 rgba(48, 51, 47, 0.16));
}

.partc-analysis-panel,
.partc-complete-card {
  margin-top: 18px;
  padding: 18px;
}

:deep(.partc-analysis-question[hidden]),
.partc-complete-card[hidden] {
  display: none !important;
}

/* Keep the Part C completion summary easy to scan. The generic
   .partc-complete-card > p rule above has greater specificity than
   the individual paragraph classes, so set the spacing with the
   parent card rather than relying on paragraph margins. */
.partc-complete-card {
  display: grid;
  gap: 16px;
}

.partc-complete-card :deep(h3) {
  margin: 0;
}

.partc-complete-card .partc-result-statement,
.partc-complete-card .partc-next-hook {
  margin: 0;
}

.partc-result-statement {
  padding: 16px 18px;
  background: var(--soft-green);
  border: 2px solid var(--charcoal);
  border-left: 8px solid var(--green);
  border-radius: 14px;
  line-height: 1.55;
}

.partc-next-hook {
  padding: 16px 18px;
  background: var(--soft-yellow);
  border: 2px solid var(--charcoal);
  border-left: 8px solid var(--yellow);
  border-radius: 14px;
  line-height: 1.55;
}

@media (max-width: 899px) {
  .partc-build-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .partc-unit-buttons {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  #partCGraphSvg .partc-practice-bar,
  :deep(#partCGraphSvg .partc-final-axis-label),
  :deep(#partCGraphSvg .partc-scaffold-layer) {
    transition: none !important;
    animation: none !important;
  }
}

@media (min-width: 900px) {
  /* Part C: full-width Site 2 table, then controls beside the graph. */
  .partc-workbench {
    display: grid;
    grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.1fr);
    gap: 18px;
    align-items: start;
  }
  .partc-workbench > .partc-data-card {
    grid-column: 1 / -1;
    grid-row: 1;
    min-width: 0;
    margin: 0;
  }
  .partc-workbench > .partc-build-grid {
    display: contents;
  }
  .partc-workbench .partc-control-card {
    grid-column: 1;
    grid-row: 2;
    min-width: 0;
    align-self: start;
    order: initial;
  }
  .partc-workbench .partc-graph-card {
    grid-column: 2;
    grid-row: 2;
    min-width: 0;
    align-self: start;
    order: initial;
    position: static;
    padding: 20px 24px 24px;
  }
  .partc-workbench .partc-table-wrap {
    overflow-x: visible;
  }
  .partc-workbench .partc-data-table {
    width: 100%;
    min-width: 0;
    table-layout: fixed;
  }
  .partc-workbench .partc-data-table :deep(th),
  .partc-workbench .partc-data-table :deep(td) {
    padding: 7px 6px;
    font-size: 0.76rem;
    line-height: 1.22;
    overflow-wrap: anywhere;
  }
  .partc-workbench .partc-data-table :deep(th:first-child),
  .partc-workbench .partc-data-table :deep(td:first-child) {
    width: 36%;
  }
}
</style>
