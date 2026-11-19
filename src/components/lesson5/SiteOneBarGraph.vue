<script setup>
/*
  Lesson 5 Part B: build the Site 1 bar graph step by step.
    1. Calculate the three-night averages in the table.
    2. Drag the right labels onto the x- and y-axes (<DragDrop strict>).
    3. Unit check: which unit does "Number of animals" need?
    4. Construct each bar from a plotted point: pick the category (vertical
       guide), pick its average on the y-axis (horizontal guide), click where
       the guides cross - the bar is then drawn up from zero.
    5. Tick the construction checklist, then answer three analysis questions.
       A summary of the Site 1 results finishes the part.

    <SiteOneBarGraph ref="partB" @reset="section.reset()" />

  Exposes buildActive (the section gets .partb-build-active while building).
  The averages, built bars and analysis start are saved through
  <Activity :state>; the other steps are activities that save themselves.
*/
import { computed, nextTick, ref } from "vue";
import Activity from "../activities/Activity.vue";
import DragDrop from "../activities/DragDrop.vue";
import DragItem from "../activities/DragItem.vue";
import DropSlot from "../activities/DropSlot.vue";
import MultipleChoice from "../activities/MultipleChoice.vue";
import McQuestion from "../activities/McQuestion.vue";
import McChoice from "../activities/McChoice.vue";
import SelectItems from "../activities/SelectItems.vue";
import Button from "../Button.vue";
import BarGraphFrame from "./BarGraphFrame.vue";
import AnalysisQuestions from "./AnalysisQuestions.vue";
import {
  PLOT,
  SITE_1,
  CHOICE_CLASSES,
  barBox,
  formatNumber,
  yOf,
} from "./barGraph.js";

const emit = defineEmits(["reset"]);

const AXIS_CARDS = [
  { name: "animal", text: "Type of animal" },
  { name: "number", text: "Number of animals" },
  { name: "night", text: "Night number" },
  { name: "temperature", text: "Temperature" },
];
const cardText = (name) =>
  AXIS_CARDS.find((c) => c.name === name)?.text ?? name;

const CHECKLIST = [
  { id: "zero", label: "Every bar starts at <strong>zero</strong>." },
  { id: "width", label: "Every bar has the <strong>same width</strong>." },
  { id: "gaps", label: "The gaps between bars are <strong>equal</strong>." },
  {
    id: "heights",
    label:
      "Each bar height matches the <strong>average</strong> in the table, including a zero-height bar for <strong>feral deer</strong>.",
  },
];

const animalChoices = SITE_1.map((item, i) => ({
  value: String(i),
  text: item.label,
}));
const QUESTIONS = [
  {
    name: "highest",
    prompt: "Which animal was found in the highest average number?",
    answer: "0",
    choices: animalChoices,
    gridClass: "partb-analysis-animal-grid",
    incorrectTitle: "Look for the tallest bar.",
    incorrectText: " Compare the heights of all five bars, then try again.",
  },
  {
    name: "leadbeaters",
    prompt: "On average, how many Leadbeater's Possums were observed?",
    answer: "6",
    choices: ["5", "6", "7"].map((v) => ({ value: v, text: v })),
    gridClass: "three-choice",
    incorrectTitle: "Read the top of the Leadbeater's Possum bar.",
    incorrectText: " Use the y-axis scale or the value above the bar.",
  },
  {
    name: "lowest",
    prompt: "Which animal was found in the lowest average number?",
    answer: "4",
    choices: animalChoices,
    gridClass: "partb-analysis-animal-grid",
    incorrectTitle: "Look for the lowest value.",
    incorrectText:
      " A value of 0 has a zero-height bar, so there may be no coloured bar above the baseline.",
  },
];

/* ---------- saved state ---------- */

const calculated = ref(false); // averages shown, construction stage open
const built = ref([]); // indexes of finished bars
const analysisStarted = ref(false);
const state = { calculated, built, analysisStarted };

const plotDone = computed(() => built.value.length === SITE_1.length);

/* ---------- the activities around it ---------- */

const axes = ref(null);
const unit = ref(null);
const analysis = ref(null);
const axesDone = computed(() => axes.value?.done ?? false);
const unitDone = computed(
  () => axesDone.value && (unit.value?.isComplete ?? false),
);
const analysisDone = computed(() => analysis.value?.isComplete ?? false);

const stepLabel = computed(() => {
  if (unitDone.value) return "Step 4 · Construct the bars";
  if (axesDone.value) return "Step 3 · Check the units";
  return "Step 2 · Label the graph axes";
});

/* ---------- feedback ---------- */

const message = ref(null); // the latest { variant, title, text }
const feedback = computed(
  () =>
    message.value ?? {
      variant: "",
      title: "Start with the axes.",
      text: " A bar graph needs clear labels before any bars are drawn.",
    },
);
function say(variant, title, text) {
  message.value = { variant, title, text };
}

const prompt = ref({
  title: "Choose an animal category.",
  text: "Click one of the animal names on the x-axis to start.",
});

/* ---------- step 1: averages ---------- */

const stage = ref(null);
async function calculate() {
  calculated.value = true;
  await nextTick();
  setTimeout(
    () => stage.value?.scrollIntoView({ behavior: "smooth", block: "start" }),
    120,
  );
}

/* ---------- steps 2-3: axes and units ---------- */

function onAxisIncorrect({ slot }) {
  say(
    "try-again",
    "That label does not belong on this axis.",
    slot === "x"
      ? " The x-axis holds the animal categories."
      : " The y-axis shows how many animals were counted.",
  );
}

function onAxisChange(placements) {
  const ready = placements.x === "animal" && placements.y === "number";
  if (ready) {
    say(
      "success",
      "Both variables are on the correct axes.",
      " Now check whether a measurement unit is needed.",
    );
  } else if (placements.x || placements.y) {
    say(
      "success",
      cardText(placements.x || placements.y) + " is in the right place.",
      " Finish the other axis label.",
    );
  }
}

function onUnitAnswer({ correct }) {
  if (!correct) {
    say(
      "try-again",
      "Not this time.",
      " We are counting how many animals were seen for a fixed area of forest, so the count needs a unit that shows what area it is measured over.",
    );
    return;
  }
  say(
    "success",
    "The unit is ‘animals per hectare’.",
    " Remember each site was the size of the MCG, which is one hectare. So the number of animals counted is how many you found per hectare. Now draw the bars: click one of the animal names on the x-axis to start.",
  );
}

/* ---------- step 4: build each bar from a plotted point ---------- */

const MOVE_TOLERANCE = 30; // SVG units the click may be from the crossing point
const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const plotStage = ref("category"); // category -> y -> intersection -> animating
const selectedIndex = ref(null);
const selectedY = ref(null);
const flashY = ref(null);
const pointShown = ref(false);
const animating = ref(null); // { index, phase: "top" | "sides" | "fill" | "zero" }

function chooseCategory(index) {
  if (!unitDone.value || plotDone.value || plotStage.value === "animating")
    return;
  if (built.value.includes(index)) {
    say(
      "try-again",
      "That bar is already complete.",
      " Choose one of the remaining animal categories.",
    );
    return;
  }
  selectedIndex.value = index;
  selectedY.value = null;
  pointShown.value = false;
  plotStage.value = "y";
  prompt.value = {
    title: SITE_1[index].label + " selected.",
    text: "Now click the y-axis value that represents this animal's average count.",
  };
  say(
    "",
    "Follow the category upwards.",
    " The vertical dotted line keeps going through the plotting area so you can line it up with a y-value.",
  );
}

function chooseY(value) {
  if (plotStage.value !== "y" && plotStage.value !== "intersection") return;
  if (selectedIndex.value === null) return;

  // a wrong value never creates the horizontal guide
  if (Math.abs(value - SITE_1[selectedIndex.value].average) > 0.001) {
    flashY.value = value;
    setTimeout(() => (flashY.value = null), 550);
    selectedY.value = null;
    pointShown.value = false;
    plotStage.value = "y";
    say(
      "try-again",
      "Check the average in the table.",
      " That y-axis value does not match the average for " +
        SITE_1[selectedIndex.value].label +
        ". Check the table and try again.",
    );
    return;
  }

  selectedY.value = value;
  plotStage.value = "intersection";
  prompt.value = {
    title: "Where do the two dotted lines meet?",
    text: "Click the intersection to mark the data point before the bar is drawn.",
  };
  say(
    "success",
    "Correct y-value.",
    " Now use the vertical and horizontal guides together and mark where they intersect.",
  );
}

function onGraphClick({ x, y }) {
  if (plotStage.value !== "intersection") return;
  const index = selectedIndex.value;
  const targetX = PLOT.centres[index];
  const targetY = yOf(selectedY.value);
  if (Math.hypot(x - targetX, y - targetY) > MOVE_TOLERANCE) {
    say(
      "try-again",
      "Find the crossing point.",
      " Place the point where the vertical and horizontal dotted guides intersect.",
    );
    return;
  }

  pointShown.value = true;
  plotStage.value = "animating";
  const value = SITE_1[index].average;
  const isZero = Math.abs(value) < 0.001;
  say(
    "success",
    "Correct data point.",
    isZero
      ? " This value is 0, so its bar has zero height and stays on the baseline. Watch how the graph records it."
      : " Watch how that point becomes the top of a bar that starts at zero.",
  );
  animateBar(index, isZero);
}

// Zero is still data: a zero bar briefly draws along the baseline and shows
// its 0 label. A positive bar draws its top, then its sides, then fills.
function animateBar(index, isZero) {
  const wait = (ms) => (reduceMotion ? 0 : ms);
  if (isZero) {
    animating.value = { index, phase: "zero" };
    setTimeout(() => finishBar(index, true), wait(900));
    return;
  }
  animating.value = { index, phase: "top" };
  setTimeout(() => (animating.value = { index, phase: "sides" }), wait(750));
  setTimeout(() => (animating.value = { index, phase: "fill" }), wait(1750));
  setTimeout(() => finishBar(index, false), wait(2200));
}

async function finishBar(index, isZero) {
  animating.value = null;
  built.value = [...built.value, index];
  selectedIndex.value = null;
  selectedY.value = null;
  pointShown.value = false;

  if (plotDone.value) {
    plotStage.value = "category";
    prompt.value = {
      title: "All five categories are complete.",
      text: "You used the same process for every category: x-value, y-value, intersection, then bar height.",
    };
    say(
      "success",
      "You constructed the bar graph correctly.",
      " Before analysing the data, check the construction rules you just used.",
    );
    await nextTick();
    setTimeout(
      () =>
        graphCheck.value?.$el?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      350,
    );
    return;
  }

  plotStage.value = "category";
  prompt.value = {
    title: isZero ? "Zero-height bar complete." : "Bar complete.",
    text: "Choose another animal category on the x-axis.",
  };
  say(
    "success",
    SITE_1[index].label + " is complete.",
    isZero
      ? " Its average is 0, so there is no coloured bar above the baseline. The 0 label records the result. Choose another category."
      : " Its value is shown above the bar. Notice that the bar begins at zero and its top reaches the plotted point. Choose another category.",
  );
}

/* what the graph shows for each bar */
function barShown(index) {
  return (
    built.value.includes(index) ||
    (animating.value?.index === index && animating.value.phase === "fill")
  );
}

// the outline of a bar: top (from the centre outwards), then both sides down to zero
function outlines(index) {
  const centre = PLOT.centres[index];
  const top = yOf(SITE_1[index].average);
  const left = centre - PLOT.barWidth / 2;
  const right = centre + PLOT.barWidth / 2;
  return [
    {
      key: "tr",
      x1: centre,
      y1: top,
      x2: right,
      y2: top,
      delay: 0,
      seconds: 0.75,
      part: "top",
    },
    {
      key: "tl",
      x1: centre,
      y1: top,
      x2: left,
      y2: top,
      delay: 0,
      seconds: 0.75,
      part: "top",
    },
    {
      key: "l",
      x1: left,
      y1: top,
      x2: left,
      y2: PLOT.bottom,
      delay: 0.75,
      seconds: 1,
      part: "sides",
    },
    {
      key: "r",
      x1: right,
      y1: top,
      x2: right,
      y2: PLOT.bottom,
      delay: 0.75,
      seconds: 1,
      part: "sides",
    },
  ].map((line) => ({
    ...line,
    length: Math.hypot(line.x2 - line.x1, line.y2 - line.y1),
  }));
}

const outlinedBars = computed(() => {
  const indexes = built.value.filter((i) => SITE_1[i].average > 0);
  const a = animating.value;
  if (a && a.phase !== "zero") indexes.push(a.index);
  return indexes;
});

/* ---------- step 5: check and analyse ---------- */

const graphCheck = ref(null);
const highlight = ref([]);
const panel = ref(null);

async function startAnalysis() {
  analysisStarted.value = true;
  await nextTick();
  setTimeout(
    () => panel.value?.scrollIntoView({ behavior: "smooth", block: "start" }),
    120,
  );
}

function onAnalysisAnswer({ question, value, correct }) {
  if (question === "leadbeaters") highlight.value = [0];
  else if (correct) highlight.value = [Number(value)];
}

const summary = [
  { title: "Highest average", value: SITE_1[0].label },
  {
    title: "Number of Leadbeater's Possums",
    value: formatNumber(SITE_1[0].average),
  },
  { title: "Lowest average", value: "Feral Deer" },
  { title: "Number of Feral Deers", value: formatNumber(SITE_1[4].average) },
];

/* ---------- reset ---------- */

function reset() {
  calculated.value = false;
  built.value = [];
  analysisStarted.value = false;
  plotStage.value = "category";
  selectedIndex.value = null;
  selectedY.value = null;
  pointShown.value = false;
  animating.value = null;
  highlight.value = [];
  message.value = null;
  prompt.value = {
    title: "Choose an animal category.",
    text: "Click one of the animal names on the x-axis to start.",
  };
}

defineExpose({ buildActive: calculated, reset });
</script>

<template>
  <Activity
    name="partb-progress"
    :complete="plotDone && analysisStarted"
    :state="state"
    @reset="reset"
  >
    <div id="partBWorkbench" class="lesson4-workbench partb-workbench">
      <div class="partb-data-card">
        <span class="challenge-step-label"
          >Step 1 · Get the average values</span
        >
        <p>
          Your team counted the number of animals at <strong>Site 1</strong>
          on three different nights: Night 1, Night 2 and Night 3. Use the
          button to calculate the average for each animal. Use these average
          values to draw your bar graph.
        </p>

        <div class="partb-table-wrap">
          <table
            class="practice-table partb-data-table"
            aria-label="Animal counts across three spotlight survey nights at Site 1"
          >
            <caption>
              Table 1. Site 1 animal counts across three nights
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
              <tr v-for="item in SITE_1" :key="item.label">
                <td>{{ item.label }}</td>
                <td v-for="(n, i) in item.nights" :key="i">{{ n }}</td>
                <td class="partb-average-cell" :class="{ calculated }">
                  <span>{{
                    calculated ? formatNumber(item.average) : "—"
                  }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="partb-table-actions">
          <Button :disabled="calculated" @click="calculate">
            Calculate averages
          </Button>
        </div>
      </div>

      <div v-if="calculated" ref="stage" class="partb-construction-stage">
        <DragDrop
          ref="axes"
          name="partb-axes"
          class="partb-construction-grid"
          strict
          @incorrect="onAxisIncorrect"
          @change="onAxisChange"
        >
          <div class="graph-control-card partb-control-panel">
            <span class="challenge-step-label">{{ stepLabel }}</span>

            <div
              v-show="!unitDone"
              class="partb-label-bank"
              data-dd-tray
              aria-label="Bar graph axis label cards"
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
              name="partb-unit"
              class="partb-unit-check"
              completion-mode="live"
              :classes="CHOICE_CLASSES"
              @answer="onUnitAnswer"
            >
              <McQuestion answer="hectare">
                <p>
                  <strong>Unit check:</strong> Does the 'Number of animals' axis
                  label need a measurement unit, and if so, which one?
                </p>
                <div class="partb-unit-buttons">
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

            <div v-if="unitDone" class="partb-builder-instructions">
              <strong>Now it's time to draw a bar for each animal.</strong>
              <ol>
                <li>Click an animal name on the <strong>x-axis</strong>.</li>
                <li>Find its <strong>average</strong> in Table 1.</li>
                <li>Click that number on the <strong>y-axis</strong>.</li>
                <li>Click where the dotted lines meet. The bar draws automatically.</li>
                <li>Repeat for all five animals.</li>
              </ol>
            </div>
            <div v-if="unitDone" class="partb-builder-prompt">
              <strong>{{ prompt.title }}</strong>
              <span>{{ prompt.text }}</span>
            </div>

            <div
              id="partBFeedback"
              class="challenge-feedback"
              :class="feedback.variant"
              role="status"
              aria-live="polite"
            >
              <strong>{{ feedback.title }}</strong
              >{{ feedback.text }}
            </div>
          </div>

          <div class="graph-stage-card partb-graph-card pop-in">
            <div class="graph-stage-heading">
              <div>
                <h3>Average animal counts from spotlight surveys at Site 1</h3>
              </div>
            </div>

            <BarGraphFrame
              svg-id="partBGraphSvg"
              aria-label="Interactive bar graph of average animal counts at Site 1"
              :items="SITE_1"
              x-label="Type of animal"
              y-label="Number of animals"
              :y-unit="unitDone ? ' (per hectare)' : ''"
              label-class="partb-final-axis-label"
              :labels-visible="unitDone"
              choices="partb"
              :active-x="selectedIndex"
              :active-y="selectedY"
              :flash-y="flashY"
              :complete-x="built"
              :highlight-x="highlight"
              @choose-x="chooseCategory"
              @choose-y="chooseY"
              @svg-click="onGraphClick"
            >
              <!-- guides -->
              <line
                class="partb-guide"
                :class="{ visible: selectedIndex !== null }"
                :x1="PLOT.centres[selectedIndex ?? 0]"
                :x2="PLOT.centres[selectedIndex ?? 0]"
                y1="40"
                y2="370"
              />
              <line
                class="partb-guide"
                :class="{ visible: selectedY !== null }"
                x1="120"
                x2="710"
                :y1="yOf(selectedY ?? 0)"
                :y2="yOf(selectedY ?? 0)"
              />

              <!-- bars -->
              <rect
                v-for="(item, i) in SITE_1"
                :key="'bar' + i"
                class="partb-bar-fill"
                :class="{
                  visible: barShown(i),
                  'analysis-highlight': highlight.includes(i),
                }"
                :x="PLOT.centres[i] - PLOT.barWidth / 2"
                :y="barShown(i) ? barBox(item.average).y : PLOT.bottom"
                :width="PLOT.barWidth"
                :height="barShown(i) ? barBox(item.average).height : 0"
                rx="4"
                :fill="item.colour"
              />

              <!-- outlines: drawn while a bar is built, then kept -->
              <g>
                <template v-for="i in outlinedBars" :key="'outline' + i">
                  <template v-for="line in outlines(i)" :key="line.key">
                    <line
                      v-if="
                        built.includes(i) ||
                        line.part === 'top' ||
                        animating?.phase !== 'top'
                      "
                      class="partb-bar-outline"
                      :class="{ drawing: !built.includes(i) }"
                      :x1="line.x1"
                      :y1="line.y1"
                      :x2="line.x2"
                      :y2="line.y2"
                      :style="
                        built.includes(i)
                          ? null
                          : {
                              strokeDasharray: line.length,
                              '--length': line.length,
                              '--seconds': line.seconds + 's',
                            }
                      "
                    />
                  </template>
                </template>
                <line
                  v-if="animating?.phase === 'zero'"
                  class="partb-zero-bar-marker visible drawing"
                  :x1="PLOT.centres[animating.index] - PLOT.barWidth / 2"
                  :x2="PLOT.centres[animating.index] + PLOT.barWidth / 2"
                  :y1="PLOT.bottom"
                  :y2="PLOT.bottom"
                  :style="{
                    strokeDasharray: PLOT.barWidth,
                    '--length': PLOT.barWidth,
                    '--seconds': '0.65s',
                  }"
                />
              </g>

              <circle
                class="partb-intersection-point"
                :class="{ visible: pointShown }"
                :cx="PLOT.centres[selectedIndex ?? animating?.index ?? 0]"
                :cy="yOf(selectedY ?? 0)"
                r="8"
              />

              <!-- value labels -->
              <text
                v-for="(item, i) in SITE_1"
                :key="'value' + i"
                class="partb-value-label"
                :class="{
                  visible: built.includes(i),
                  'analysis-highlight': highlight.includes(i),
                }"
                :x="PLOT.centres[i]"
                :y="Math.max(PLOT.top + 16, yOf(item.average) - 10)"
              >
                {{ formatNumber(item.average) }}
              </text>

              <template #overlay>
                <DropSlot
                  name="x"
                  answer="animal"
                  class="axis-slot axis-slot-x"
                  :class="{ 'axis-complete': unitDone }"
                  aria-label="Drop the x-axis label here"
                >
                  x-axis label
                </DropSlot>
                <DropSlot
                  name="y"
                  answer="number"
                  class="axis-slot axis-slot-y"
                  :class="{ 'axis-complete': unitDone }"
                  aria-label="Drop the y-axis label here"
                >
                  y-axis label
                </DropSlot>
              </template>
            </BarGraphFrame>
          </div>
        </DragDrop>

        <SelectItems
          v-if="plotDone && !analysisStarted"
          ref="graphCheck"
          name="partb-graph-check"
          class="partb-graph-check"
          :items="CHECKLIST"
          list-class="partb-check-grid"
          item-class="partb-check-item"
        >
          <h3>Quick bar-graph check</h3>

          <template #item="{ item }">
            <span v-html="item.label"></span>
          </template>

          <template #complete>
            <Button @click="startAnalysis">Analyse the graph</Button>
          </template>
        </SelectItems>

        <div v-if="analysisStarted" ref="panel" class="partb-analysis-panel">
          <AnalysisQuestions
            ref="analysis"
            name="partb-analysis"
            prefix="partb"
            :questions="QUESTIONS"
            :initial-feedback="{
              title: 'Read the bar heights.',
              text: ' Start by finding the tallest bar.',
            }"
            @answer="onAnalysisAnswer"
          >
            <span class="challenge-step-label">Step 5 · Analyse the graph</span>
          </AnalysisQuestions>

          <div v-if="analysisDone" class="partb-baseline-summary pop-in">
            <span class="challenge-step-label">Site 1 survey complete</span>
            <h3>These are your Site 1 results</h3>
            <div class="partb-baseline-facts">
              <div
                v-for="fact in summary"
                :key="fact.title"
                class="partb-baseline-fact"
              >
                <strong>{{ fact.title }}</strong
                ><span>{{ fact.value }}</span>
              </div>
            </div>
            <p class="partb-story-hook">
              <strong>Keep this result in mind.</strong> These averages describe
              <strong>Site 1</strong>. Later, you will survey
              <strong>Site 2</strong> and compare its results with Site 1.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="reset-button-container">
      <Button :is-reset="true" @click="emit('reset')" />
    </div>
  </Activity>
</template>

<style scoped>
/* Persistent plotting instructions: the live prompt underneath changes with each click. */
.partb-builder-instructions {
  padding: 12px 14px;
  background: var(--soft-yellow);
  border: 2px solid var(--charcoal);
  border-radius: 14px;
  line-height: 1.45;
}
.partb-builder-instructions > strong {
  display: block;
  margin-bottom: 6px;
}
.partb-builder-instructions ol {
  margin: 0;
  padding-left: 22px;
}
.partb-builder-instructions li + li {
  margin-top: 5px;
}

/* outline lines draw themselves along their length */
.drawing {
  stroke-dashoffset: var(--length);
  animation: draw-line var(--seconds) ease forwards;
}

@keyframes draw-line {
  to {
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .drawing {
    animation: none;
    stroke-dashoffset: 0;
  }
}
</style>

<style>
/* Moved from styles/lesson4_styles/lesson4.css. Not scoped: some rules style child components' content. */

.partb-table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
}

.partb-table-actions .challenge-feedback {
  flex: 1 1 320px;
  margin: 0;
}

.partb-unit-check {
  margin-top: 16px;
  padding: 14px;
  background: var(--soft-yellow);
  border: 2px solid var(--charcoal);
  border-radius: 14px;
}

.partb-unit-check p {
  margin: 0 0 10px;
  line-height: 1.45;
}

.partb-unit-buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

#partBGraphSvg .partb-bar-fill {
  opacity: 0;
  transition: opacity 0.35s ease;
}

#partBGraphSvg .partb-bar-fill.visible {
  opacity: 1;
}

#partBGraphSvg .partb-bar-outline {
  fill: none;
  stroke: var(--charcoal);
  stroke-width: 3;
  stroke-linejoin: round;
  stroke-linecap: round;
  pointer-events: none;
}

#partBGraphSvg .partb-value-label {
  opacity: 0;
  font-size: 12px;
  font-weight: 800;
  text-anchor: middle;
  transition: opacity 0.25s ease;
}

#partBGraphSvg .partb-value-label.visible {
  opacity: 1;
}

#partBGraphSvg .partb-zero-bar-marker {
  stroke: var(--orange);
  stroke-width: 7;
  stroke-linecap: round;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

#partBGraphSvg .partb-zero-bar-marker.visible {
  opacity: 1;
}

#partBGraphSvg .partb-zero-bar-marker.fade-out {
  opacity: 0;
}

#partBGraphSvg .partb-value-label.analysis-highlight {
  fill: var(--purple);
  font-size: 15px;
}

.partb-graph-check,
.partb-analysis-panel {
  margin-top: 18px;
  padding: 18px;
  background: white;
  border: 3px solid var(--charcoal);
  border-radius: 18px;
  box-shadow: var(--shadow-small);
}

.partb-graph-check h3,
.partb-analysis-panel h3 {
  margin: 4px 0 8px;
}

.partb-graph-check > p,
.partb-analysis-panel > p {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.partb-check-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 16px 0;
}

.partb-check-item {
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 10px;
  align-items: start;
  padding: 11px 12px;
  background: var(--soft-green);
  border: 2px solid var(--charcoal);
  border-radius: 13px;
  line-height: 1.35;
  cursor: pointer;
}

.partb-check-item input[type="checkbox"] {
  margin: 2px 0 0;
}

.partb-analysis-question[hidden],
.partb-baseline-summary[hidden] {
  display: none !important;
}

.partb-analysis-animal-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.partb-baseline-summary {
  margin-top: 16px;
  padding: 18px;
  background: linear-gradient(to bottom, var(--soft-green), var(--paper) 185%);
  border: 3px solid var(--charcoal);
  border-radius: 18px;
}

.partb-baseline-summary h3 {
  margin: 4px 0 8px;
}

.partb-baseline-facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0;
}

.partb-baseline-fact {
  padding: 12px;
  background: white;
  border: 2px solid var(--charcoal);
  border-radius: 13px;
  text-align: center;
}

.partb-baseline-fact strong {
  display: block;
  margin-bottom: 4px;
  color: var(--purple);
}

.partb-story-hook {
  margin: 14px 0 0;
  padding: 14px 16px;
  background: var(--soft-yellow);
  border: 2px solid var(--charcoal);
  border-left: 8px solid var(--yellow);
  border-radius: 14px;
  line-height: 1.5;
}

#partBGraphSvg .partb-bar-fill.analysis-highlight {
  stroke: var(--purple);
  stroke-width: 5;
  filter: drop-shadow(0 3px 0 rgba(48, 51, 47, 0.18));
}

@media (max-width: 699px) {
  .partb-baseline-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1000px) {
  .partb-unit-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
