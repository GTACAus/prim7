<script setup>
/*
  Lesson 5 Part D: put Site 1 and Site 2 on one paired bar graph.
    1. Set both sites' bars with sliders (switching between the sites), then
       check both.
    2. Answer three analysis questions about the paired bars.
    3. Do the results support the reasoned prediction? (<PredictionCheck>)
    4. Stop and think: a recap graph, four more / less questions and the two
       site photos. The end-of-lesson card follows.

    <CompareSites ref="partD" @reset="section.reset()" />

  Exposes sectionClass: the section gets .partd-edit-site1 / .partd-edit-site2
  while building and .partd-analysis-mode afterwards (lesson4.css highlights
  the matching table column and bars). Every step saves itself.
*/
import { computed, nextTick, ref, watch } from "vue";
import MultipleChoice from "../activities/MultipleChoice.vue";
import McQuestion from "../activities/McQuestion.vue";
import McChoice from "../activities/McChoice.vue";
import PredictionCheck from "../activities/PredictionCheck.vue";
import StopAndCheck from "../StopAndCheck.vue";
import Button from "../Button.vue";
import LessonEndCard from "../LessonEndCard.vue";
import BarSliders from "./BarSliders.vue";
import PairedBarGraph from "./PairedBarGraph.vue";
import AnalysisQuestions from "./AnalysisQuestions.vue";
import { BOTH_SITES, formatNumber } from "./barGraph.js";
import { openPDF } from "../../composables/useModal.js";

const emit = defineEmits(["reset"]);

const IMG = "../images/lesson5/";

const SLIDER_ROWS = BOTH_SITES.map((item) => ({
  label: item.label,
  targets: { site1: item.site1, site2: item.site2 },
}));

const QUESTIONS = [
  {
    name: "lead",
    prompt: "Which site had the higher average number of Leadbeater's Possums?",
    answer: "site1",
    choices: [
      { value: "site1", text: "Site 1" },
      { value: "site2", text: "Site 2" },
      { value: "same", text: "They were the same" },
    ],
    gridClass: "three-choice",
    incorrectTitle: "Compare the two Leadbeater's Possum bars.",
    incorrectText: " Which site's bar is taller?",
  },
  {
    name: "difference",
    prompt:
      "What is the difference between the Site 1 and Site 2 Leadbeater's Possum averages?",
    answer: "5",
    choices: ["4", "5", "6"].map((v) => ({ value: v, text: v + " animals" })),
    gridClass: "three-choice",
    correctTitle: "Correct: the difference is 5 animals.",
    correctText: " Now scan all five pairs and look for equal-height bars.",
  },
  {
    name: "deer",
    prompt: "How many feral deer were found at site 1 compared to site 2?",
    answer: "zero-three",
    choices: [
      { value: "three-zero", text: "3 at site 1 and 0 at site 2" },
      { value: "equal", text: "Equal number at site 1 and site 2" },
      { value: "zero-three", text: "0 at site 1 and 3 at site 2" },
    ],
    gridClass: "three-choice",
    incorrectTitle: "Look at the feral deer bars.",
    incorrectText: " Compare the Site 1 and Site 2 values for feral deer.",
  },
];

// The more / less questions in the stop-and-think recap, in two groups with
// the site photos between them.
const MORE_LESS = [
  [
    {
      name: "possums",
      answer: "less",
      text: "Were the <strong>more</strong> or <strong>less</strong> Leadbeater's possums found at site 2?",
      image: IMG + "leadbeaters_possum_1.png",
      alt: "Leadbeater's possum",
    },
    {
      name: "deer",
      answer: "more",
      text: "Were there <strong>more</strong> or <strong>less</strong> feral deer found at site 2?",
      image: IMG + "male_deer_1.png",
      alt: "Feral deer",
    },
  ],
  [
    {
      name: "undergrowth",
      answer: "less",
      text: "Were there <strong>more</strong> or <strong>less</strong> plants in the undergrowth at site 2?",
      image: IMG + "undergrowth.png",
      alt: "Undergrowth",
    },
    {
      name: "trees",
      answer: "less",
      text: "Were there <strong>more</strong> or <strong>less</strong> old hollow-bearing trees at site 2?",
      image: IMG + "tree.png",
      alt: "Old hollow-bearing tree",
    },
  ],
];

// The more / less buttons only keep the "selected" look for a right pick.
const PICK_CLASSES = {
  selected: "mc-picked",
  correct: "selected-answer",
  incorrect: "try-again-choice",
};

const FINAL_VALUES = {
  site1: BOTH_SITES.map((item) => item.site1),
  site2: BOTH_SITES.map((item) => item.site2),
};

/* ---------- the steps ---------- */

const sliders = ref(null);
const checkMessage = ref("");
function onCheck({ allCorrect, firstWrong }) {
  if (allCorrect) {
    checkMessage.value = "";
    return;
  }
  const site = firstWrong?.set === "site2" ? "Site 2" : "Site 1";
  const animal = SLIDER_ROWS[firstWrong?.index ?? 0]?.label ?? "an animal";
  checkMessage.value = `Not quite. Check the ${site} bar for ${animal}. Compare its height with the average in the table, then press "Check both sites" again.`;
}
const analysis = ref(null);
const prediction = ref(null);
const stopCheck = ref(null);
const moreLess = ref(null);

const barsDone = computed(() => sliders.value?.isComplete ?? false);
const analysisDone = computed(
  () => barsDone.value && (analysis.value?.isComplete ?? false),
);
const predictionDone = computed(
  () => analysisDone.value && (prediction.value?.isComplete ?? false),
);
const finished = computed(
  () =>
    predictionDone.value &&
    (stopCheck.value?.pressed ?? false) &&
    (moreLess.value?.isComplete ?? false),
);

const values = computed(
  () =>
    sliders.value?.values ?? {
      site1: BOTH_SITES.map(() => 0),
      site2: BOTH_SITES.map(() => 0),
    },
);

// the gap marker appears once the "difference" question is answered right
const showDifference = computed(
  () => analysisDone.value || !!analysis.value?.solved.difference,
);

const sectionClass = computed(() =>
  barsDone.value
    ? "partd-analysis-mode"
    : `partd-edit-${sliders.value?.activeSet ?? "site1"}`,
);

/* ---------- scroll each new step into view ---------- */

const analysisPanel = ref(null);
watch(barsDone, async (done) => {
  if (!done) return;
  await nextTick();
  setTimeout(
    () =>
      analysisPanel.value?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      }),
    200,
  );
});
watch(analysisDone, async (done) => {
  if (!done) return;
  await nextTick();
  setTimeout(
    () =>
      prediction.value?.$el?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      }),
    180,
  );
});

defineExpose({ sectionClass });
</script>

<template>
  <div class="workbench partd-workbench">
    <div class="partd-data-card">
      <p>
        The average results for site 1 and site 2 are shown in the table below.
      </p>

      <div class="partd-table-wrap">
        <table
          class="practice-table partd-data-table"
          aria-label="Comparison of average animal counts at Site 1 and Site 2"
        >
          <caption>
            Table 3. Comparing number of animals at Site 1 and Site 2
          </caption>
          <thead>
            <tr>
              <th class="partd-blank-heading"></th>
              <th class="partd-unit-heading" colspan="2">
                Number of animals per hectare
              </th>
            </tr>
            <tr>
              <th>Type of animal</th>
              <th>Site 1</th>
              <th>Site 2</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in BOTH_SITES" :key="item.label">
              <td>{{ item.label }}</td>
              <td>{{ formatNumber(item.site1) }}</td>
              <td>{{ formatNumber(item.site2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BarSliders
      ref="sliders"
      name="partd-sliders"
      class="graph-control-card partd-builder-card"
      :rows="SLIDER_ROWS"
      :sets="['site1', 'site2']"
      :set-labels="{ site1: 'Site 1', site2: 'Site 2' }"
      id-prefix="partDBar"
      controls-class="partd-builder-controls"
      check-label="Check both sites"
      hide-when-complete
      @check="onCheck"
    >
      <template #header>
        <h3>Build the bars for each animal in both sites</h3>
      </template>
      <div v-if="checkMessage && !barsDone" class="challenge-feedback try-again" role="status">
        {{ checkMessage }}
      </div>
      <template #complete>
        <div class="partd-builder-complete">
          <strong>Both sites are on the graph.</strong><br />
          Each animal now has a Site 1 bar and a Site 2 bar, so you can compare
          the sites directly.
        </div>
      </template>
    </BarSliders>

    <div class="graph-stage-card partd-graph-card">
      <div class="graph-stage-heading">
        <div>
          <h3>
            Average animal counts from spotlight surveys at Site 1 and Site 2
          </h3>
        </div>
      </div>

      <div class="partd-legend" aria-label="Graph key">
        <span class="partd-legend-item"
          ><span class="partd-swatch site1" aria-hidden="true"></span>Site
          1</span
        >
        <span class="partd-legend-item"
          ><span class="partd-swatch site2" aria-hidden="true"></span>Site
          2</span
        >
      </div>

      <PairedBarGraph
        svg-id="partDGraphSvg"
        :values="values"
        :show-difference="showDifference"
      />
    </div>
  </div>

  <div
    v-if="barsDone"
    v-show="!analysisDone"
    ref="analysisPanel"
    class="partd-analysis-panel"
  >
    <AnalysisQuestions
      ref="analysis"
      name="partd-analysis"
      prefix="partd"
      progress-prefix="partc"
      :questions="QUESTIONS"
      :initial-feedback="{
        title: 'Start with the Leadbeater\'s Possum pair.',
        text: ' Which of its two bars is taller?',
      }"
    >
      <span class="challenge-step-label">Analyse the bar graph</span>
    </AnalysisQuestions>
  </div>

  <PredictionCheck
    v-if="analysisDone"
    ref="prediction"
    name="partd-prediction"
    prediction="When there is more forest <strong>understory</strong> the number of Leadbeater's possums will increase."
    answer="supported"
    :choices="[
      { value: 'supported', text: 'Supported' },
      { value: 'unsupported', text: 'Not supported' },
    ]"
    incorrect-title="Look at the evidence again."
    incorrect-text=" Site 1 had more understory and more Leadbeater's Possums than Site 2. Does that match the reasoned prediction?"
  />

  <StopAndCheck v-if="predictionDone" ref="stopCheck" name="partd-stop-check">
    <template #content>
      <p>
        Look at the pictures of each forest site. Then look at your bar graph
        showing numbers of each animal at each site.
      </p>
      <p>
        <strong>
          What might be causing the drop in Leadbeater's possum numbers between
          Site 1 and Site 2?
        </strong>
      </p>
    </template>

    <template #answer>
      <div
        class="graph-stage-card partd-graph-card stop-and-check-graph"
        aria-hidden="true"
      >
        <div class="graph-stage-heading">
          <div>
            <h3>
              Average animal counts from spotlight surveys at Site 1 and Site 2
            </h3>
          </div>
        </div>
        <div class="partd-legend" aria-label="Graph key">
          <span class="partd-legend-item"
            ><span class="partd-swatch site1" aria-hidden="true"></span>Site
            1</span
          >
          <span class="partd-legend-item"
            ><span class="partd-swatch site2" aria-hidden="true"></span>Site
            2</span
          >
        </div>
        <PairedBarGraph :values="FINAL_VALUES" />
      </div>

      <MultipleChoice
        ref="moreLess"
        name="partd-more-less"
        :classes="PICK_CLASSES"
      >
        <template v-for="(group, g) in MORE_LESS" :key="g">
          <div class="more-less-question">
            <div class="more-less-items">
              <McQuestion
                v-for="q in group"
                :key="q.name"
                :name="q.name"
                :answer="q.answer"
                class="more-less-item"
              >
                <p class="more-less-question-text" v-html="q.text"></p>
                <div class="circle-image-placeholder">
                  <img :src="q.image" :alt="q.alt" />
                </div>
                <div class="more-less-buttons">
                  <McChoice value="more" class="general-button more-less-button"
                    >More</McChoice
                  >
                  <McChoice value="less" class="general-button more-less-button"
                    >Less</McChoice
                  >
                </div>
              </McQuestion>
            </div>
          </div>

          <div
            v-if="g === 0"
            class="more-less-site-images"
            aria-label="Site 1 and Site 2"
          >
            <div v-for="site in [1, 2]" :key="site" class="more-less-site-card">
              <h4>Site {{ site }}</h4>
              <div class="more-less-site-photo">
                <img
                  :src="`${IMG}site_${site}_day.png`"
                  :alt="`Daytime image of Site ${site}`"
                />
              </div>
            </div>
          </div>
        </template>
      </MultipleChoice>

      <div class="project-learn-block more-less-protect-block">
        <h4>
          What can we do to protect Leadbeater's Possum? Open the protection
          guide to learn more.
        </h4>
        <Button
          class="project-resource-button"
          symbol="📄"
          @click="
            openPDF(
              '../downloads/lesson5/protect-leadbeaters-possum.pdf',
              'Protecting Leadbeater\'s Possum',
            )
          "
        >
          Open Protection Guide
        </Button>
      </div>
    </template>
  </StopAndCheck>

  <LessonEndCard
    v-if="finished"
    :lesson-number="5"
    :practiced="[
      'Collecting and displaying data in bar graphs',
      'Reading graphs to compare results between two sites',
    ]"
  />

  <div class="reset-button-container">
    <Button :is-reset="true" @click="emit('reset')" />
  </div>
</template>

<style scoped>
.partd-blank-heading {
  opacity: 0;
  border: none;
}

.partd-unit-heading {
  background: var(--soft-blue);
}
</style>

<style>
/* Moved from styles/lesson4_styles/lesson4.css. Not scoped: some rules style child components' content. */

.partd-data-card {
  margin-bottom: 18px;
}

.partd-table-wrap {
  width: 100%;
  margin-top: 12px;
  overflow-x: auto;
}

.partd-data-table {
  width: 100%;
  min-width: 0;
  margin: 0;
  table-layout: fixed;
}

.partd-data-table th:first-child,
.partd-data-table td:first-child {
  width: 48%;
  text-align: left;
  font-weight: 700;
}

.partd-data-table th:nth-child(2),
.partd-data-table td:nth-child(2) {
  background: rgba(192, 173, 255, 0.18);
}

.partd-data-table th:nth-child(3),
.partd-data-table td:nth-child(3) {
  background: rgba(215, 245, 233, 0.62);
}

.partd-builder-complete {
  margin-top: 14px;
  padding: 14px 16px;
  background: var(--soft-green);
  border: 2px solid var(--charcoal);
  border-left: 8px solid var(--green);
  border-radius: 14px;
  line-height: 1.5;
}

.partd-builder-complete[hidden] {
  display: none !important;
}

.partd-graph-card {
  padding: 18px;
  overflow: hidden;
  margin-top: 18px;
}

.partd-swatch.site1 {
  background: var(--lavender);
}

.partd-swatch.site2 {
  background: var(--mint);
}

.partd-analysis-panel {
  margin-top: 18px;
  background: linear-gradient(to bottom, white, var(--soft-blue) 220%);
}

.partd-analysis-panel[hidden],
.partd-analysis-question[hidden],
.partd-complete-card[hidden] {
  display: none !important;
}

@media (min-width: 900px) {
  /* Part D: full-width comparison table, then controls beside the graph. */
  .partd-workbench {
    display: grid;
    grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.1fr);
    gap: 18px;
    align-items: start;
  }
  .partd-workbench > .partd-data-card {
    grid-column: 1 / -1;
    grid-row: 1;
    min-width: 0;
    margin: 0;
  }
  .partd-workbench > .partd-builder-card {
    grid-column: 1;
    grid-row: 2;
    min-width: 0;
    align-self: start;
  }
  .partd-workbench > .partd-graph-card {
    grid-column: 2;
    grid-row: 2;
    min-width: 0;
    align-self: start;
    padding: 20px 24px 24px;
  }
}

@media (max-width: 899px) {
  .partd-graph-card {
    margin-top: 18px;
  }
}

/* ==================================================
   PART D - STOP AND CHECK RECAP (graph reproduction,
   more/less questions, site image comparison)
   ================================================== */

.stop-and-check-graph {
  width: min(760px, 100%);
  margin: 0 auto 24px;
}

/*
  partDRenderStopAndCheckGraph() clones #partDGraphSvg and strips its id
  (so there's never a duplicate id in the page), but that means the
  colour/opacity rules above that are scoped to "#partDGraphSvg ..." or
  to "#bar-compare.partd-analysis-mode #partDGraphSvg ..." don't reach
  the clone - without these, its bars fall back to the SVG default
  (black) fill. This recap graph only ever shows the finished
  comparison, so these just hard-code that end state rather than
  reproducing every interactive mode.
*/
.stop-and-check-graph .partd-site1-bar,
.stop-and-check-graph .partd-site2-bar {
  stroke: var(--charcoal);
  stroke-width: 3.5;
  opacity: 1;
}

.stop-and-check-graph .partd-site1-bar {
  fill: var(--lavender);
}

.stop-and-check-graph .partd-site2-bar {
  fill: var(--mint);
}

.stop-and-check-graph .partd-value-label {
  font-size: 12px;
  font-weight: 800;
  text-anchor: middle;
  opacity: 1;
}

.more-less-question {
  margin: 0 0 20px;
  text-align: center;
}

.more-less-question-text {
  margin: 0 0 14px;
  font-weight: 600;
}

.more-less-items {
  display: flex;
  justify-content: center;
  gap: 28px;

  margin-bottom: 4px;
  padding: 10px;

  background: white;
  border: 2px solid var(--charcoal);
  border-top: 6px solid var(--green);
  box-shadow: 0 6px 0 var(--charcoal);
  border-radius: 10px;
}

.more-less-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.circle-image-placeholder {
  width: 96px;
  height: 96px;
  overflow: hidden;

  border: 2px solid var(--charcoal);
  border-radius: 50%;

  background: rgba(255, 255, 255, 0.72);
}

.circle-image-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-less-buttons {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.more-less-button {
  color: var(--charcoal);
  background: var(--soft-green);
  min-width: 110px;
}

.more-less-button:hover {
  background: var(--soft-purple);
}

.more-less-button.selected-answer {
  color: var(--paper);
  background: var(--button-hover);
  box-shadow: none;
  transform: translateY(3px);
}

.more-less-button.selected-answer:hover {
  cursor: default;
}

.more-less-site-images {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 20px;
}

.more-less-site-card {
  flex: 1 1 0;
  min-width: 0;
  max-width: 400px;
  text-align: center;
}

.more-less-site-card h4 {
  margin: 0 0 8px;
  font-size: 1rem;
}

.more-less-site-photo {
  overflow: hidden;

  width: 100%;
  height: 200px;

  border: 2px solid var(--charcoal);
  border-radius: 12px;
}

.more-less-site-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 500px) {
  .more-less-site-photo img {
    height: 100px;
  }
}

@media (max-width: 500px) {
  .more-less-items {
    gap: 16px;
  }
  .circle-image-placeholder {
    width: 76px;
    height: 76px;
  }
}

.more-less-protect-block {
  margin-top: 22px;
  text-align: center;
}

.more-less-protect-block .project-resource-button {
  justify-content: center;
}
</style>
