<script setup>
/*
  Lesson 3 Part A "Build and complete the yeast data table":
    1. drag the labels into the table (<DragDrop>)
    2. watch the three test videos and type in the results (<InputResponse>)
    3. stop and think about unusual results, then calculate each row's average
    4. interpret the results (<PredictionCheck>), then a final stop and think,
       which shows the end-of-lesson card.

    <YeastResultsTable @reset="section.reset()" />

  Each step appears once the one before it is done. Every activity is saved
  through its own <Activity :state>; the watched videos and calculated
  averages are saved here.
*/
import { computed, ref, watch } from "vue";
import Activity from "../../activities/Activity.vue";
import DragDrop from "../../activities/DragDrop.vue";
import DragItem from "../../activities/DragItem.vue";
import DropSlot from "../../activities/DropSlot.vue";
import InputResponse from "../../activities/InputResponse.vue";
import ResponseBox from "../../activities/ResponseBox.vue";
import PredictionCheck from "../../activities/PredictionCheck.vue";
import McQuestion from "../../activities/McQuestion.vue";
import McChoice from "../../activities/McChoice.vue";
import StopAndCheck from "../../content/StopAndCheck.vue";
import Button from "../../ui/Button.vue";
import { openVideo } from "../../../composables/useModal.js";
import LessonEndCard from "../../content/LessonEndCard.vue";

const emit = defineEmits(["reset"]);

/* ---------- content ---------- */

const labels = [
  { name: "yeast-dv", text: "Circumference of balloon (cm)" },
  { name: "yeast-iv", text: "Temperature (°C)" },
  { name: "yeast-test-1", text: "Test 1" },
  { name: "yeast-test-2", text: "Test 2" },
  { name: "yeast-test-3", text: "Test 3" },
  { name: "yeast-temp-2", text: "2" },
  { name: "yeast-temp-22", text: "22" },
  { name: "yeast-temp-37", text: "37" },
  { name: "yeast-temp-80", text: "80" },
];

const videos = [
  { test: 1, src: "../videos/lesson3/Yeast Timelapse.mp4" },
  { test: 2, src: "../videos/lesson3/Yeast Timelapse 2.mp4" },
  { test: 3, src: "../videos/lesson3/Yeast Timelapse 3.mp4" },
];

// One row per temperature; answers are the correct Test 1-3 results (cm).
const rows = [
  { temp: "2", answers: ["0", "0", "0"] },
  { temp: "22", answers: ["15", "16", "17"] },
  { temp: "37", answers: ["19", "17", "19"] },
  { temp: "80", answers: ["3", "0", "17"] },
].map((row, r) => ({
  ...row,
  cells: row.answers.map((answer, t) => ({
    key: `yeast-result-${r * 3 + t + 1}`,
    answer,
    label: `${row.temp}°C test ${t + 1}`,
  })),
}));

const numberInputProps = {
  step: "any",
  inputmode: "decimal",
  autocomplete: "off",
};

/* ---------- saved here: videos watched, averages calculated ---------- */

const watched = ref({}); // test number -> true
const calculated = ref({}); // row index -> true
const progress = { watched, calculated };

function resetProgress() {
  watched.value = {};
  calculated.value = {};
  averageError.value = false;
}

/* ---------- step 1: labels ---------- */

const labelsActivity = ref(null);
const labelsDone = computed(() => labelsActivity.value?.done ?? false);

/* ---------- step 2: results ---------- */

const resultsActivity = ref(null);

function watchVideo(video) {
  watched.value = { ...watched.value, [video.test]: true };
  openVideo(video.src, `Yeast Experiment - Test ${video.test}`);
}

// the numbers typed into one row, NaN where a cell is empty
function rowNumbers(row) {
  const answers = resultsActivity.value?.getAnswers() ?? {};
  return row.cells.map((cell) => {
    const text = answers[cell.key]?.[0] ?? "";
    return text === "" ? NaN : Number(text);
  });
}

const allEntered = computed(() =>
  rows.every((row) => !rowNumbers(row).some(Number.isNaN)),
);
const resultsCorrect = computed(
  () => resultsActivity.value?.isCorrect() ?? false,
);

/* ---------- step 3: averages ---------- */

const unusualCheck = ref(null);
const averagesShown = computed(() => unusualCheck.value?.pressed ?? false);
const averageError = ref(false);

function average(row) {
  const values = rowNumbers(row);
  const mean =
    values.reduce((total, value) => total + value, 0) / values.length;
  return Number.isInteger(mean)
    ? String(mean)
    : mean.toFixed(1).replace(/\.0$/, "");
}

function calculate(index) {
  if (rowNumbers(rows[index]).some(Number.isNaN)) {
    averageError.value = true;
    return;
  }
  averageError.value = false;
  calculated.value = { ...calculated.value, [index]: true };
}

function clearAverage(index) {
  const { [index]: _, ...rest } = calculated.value;
  calculated.value = rest;
}

// an average goes back to a Calculate button once one of its numbers is cleared
watch(
  () => rows.map((row) => rowNumbers(row).some(Number.isNaN)),
  (missing) =>
    missing.forEach((isMissing, index) => {
      if (isMissing && calculated.value[index]) clearAverage(index);
    }),
);

const allCalculated = computed(() =>
  rows.every((_, index) => calculated.value[index]),
);

/* ---------- table feedback ---------- */

const feedback = computed(() => {
  if (averageError.value)
    return {
      variant: "feedback-try-again",
      title: "Add all three results first.",
      text: "The average can be calculated once each test has a number.",
    };
  if (!allEntered.value) return null;
  if (!resultsCorrect.value)
    return {
      variant: "feedback-try-again",
      title: "Check your results.",
      text: "Make sure all your measurements are correct before moving on.",
    };
  if (labelsDone.value)
    return {
      variant: "feedback-success",
      title: "Results recorded!",
      text: "All of your measurements are correct.",
    };
  return null;
});

/* ---------- step 4: interpret the results ---------- */

const interpretActivity = ref(null);
const interpretDone = computed(
  () => interpretActivity.value?.isComplete ?? false,
);
const finalCheck = ref(null);
const finished = computed(() => finalCheck.value?.pressed ?? false);

const choices = [
  { value: "increases", text: "Increases" },
  { value: "decreases", text: "Decreases" },
  { value: "same", text: "Does not change" },
];
</script>

<template>
  <Activity
    name="yeast-table-progress"
    :complete="true"
    :state="progress"
    :class="{ 'labels-complete': labelsDone }"
    @reset="resetProgress"
  >
    <div class="yeast-results-step yeast-results-step--initial">
      <div class="yeast-results-step-heading">
        <span>STEP 1</span>
        <div>
          <p class="yeast-results-eyebrow">
            Make a scientific <strong>table</strong> for the yeast fair test.
          </p>
          <h3>Drag and drop the labels into the correct cells on the table.</h3>
        </div>
      </div>
    </div>

    <div class="yeast-results-step pop-in">
      <div class="yeast-results-step-heading">
        <span>STEP 2</span>
        <div>
          <h3>Record the results</h3>
        </div>
      </div>

      <p class="yeast-results-instruction">
        Watch each video of the fair test. Enter the measured balloon
        circumference into the correct column of your <strong>table</strong>.
      </p>

      <div class="yeast-results-video-grid">
        <Button
          v-for="video in videos"
          :key="video.test"
          class="watch-video-button"
          :class="{ 'video-watched': watched[video.test] }"
          symbol="▶"
          @click="watchVideo(video)"
        >
          Test {{ video.test }}{{ watched[video.test] ? " ✓" : "" }}
        </Button>
      </div>
    </div>

    <div id="labelsCompleteAfterContainer">
      <StopAndCheck
        v-if="labelsDone && allEntered && resultsCorrect"
        ref="unusualCheck"
        id="yeastLabelsStopAndCheck"
        name="unusual-results-check"
      >
        <template #content>
          <p>
            Look at the <strong>data</strong> in the
            <strong>table</strong> below.
          </p>
          <p>
            <strong>
              Compare Test 1, Test 2, and Test 3 at 80°C. Which result is
              different from the others?
            </strong>
          </p>
        </template>
        <template #answer>
          At <strong>80°C</strong>, Test 3 is much higher than Test 1 and Test
          2. This could be due to a mistake made setting up the fair test or
          measuring the result.
        </template>
      </StopAndCheck>

      <div v-if="averagesShown" id="repeat-tests-average-intro" class="pop-in">
        <div class="yeast-results-step-heading">
          <span>3</span>
          <div>
            <p class="yeast-results-eyebrow">
              Why is it important to repeat each test 3 times?
            </p>
            <h3>So we can calculate the average result.</h3>
          </div>
        </div>

        <p>
          You can try working out the averages yourself or click on the
          "<strong>calculate</strong>" buttons in the <strong>table</strong>.
        </p>

        <div class="average-worked-example">
          <p class="average-example-label">Worked example for yeast at 22°C</p>
          <p>
            Calculating the average size of the balloon circumference at 22°C:
          </p>

          <div class="average-example-steps">
            <div class="average-equation">
              <span class="average-equation-left"
                ><strong>Average</strong> =</span
              >
              <span class="math-fraction">
                <span class="math-numerator">Test 1 + Test 2 + Test 3</span>
                <span class="math-denominator">number of tests</span>
              </span>
            </div>
            <div class="average-equation">
              <span class="average-equation-left">=</span>
              <span class="math-fraction">
                <span class="math-numerator">15 cm + 16 cm + 17 cm</span>
                <span class="math-denominator">3</span>
              </span>
            </div>
            <div class="average-equation">
              <span class="average-equation-left">=</span>
              <span class="math-fraction">
                <span class="math-numerator">48 cm</span>
                <span class="math-denominator">3</span>
              </span>
            </div>
            <div class="average-equation average-equation-result">
              <span class="average-equation-left">=</span>
              <strong>16 cm</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <DragDrop
      ref="labelsActivity"
      id="yeastActivity"
      name="yeast-labels"
      class="diagram-activity"
      strict
    >
      <div
        id="yeastLabelBank"
        class="label-bank table-label-bank"
        data-dd-tray
        aria-label="Labels to place in the yeast experiment table"
      >
        <p class="dd-tray-heading">Label Bank</p>
        <DragItem
          v-for="label in labels"
          :key="label.name"
          tag="button"
          class="general-button drag-label"
          :name="label.name"
        >
          {{ label.text }}
        </DragItem>
      </div>

      <div class="data-table-card yeast-table-card">
        <div class="experiment-table-scroll">
          <table
            class="experiment-table yeast-table"
            aria-label="Yeast experiment drag and drop data table"
          >
            <thead>
              <tr>
                <th class="independent-heading" rowspan="2">
                  <DropSlot
                    tag="span"
                    class="label-drop-zone"
                    name="yeast-iv"
                    answer="yeast-iv"
                  >
                    Drop label
                  </DropSlot>
                </th>
                <th class="dependent-heading drop-heading" colspan="4">
                  <DropSlot
                    tag="span"
                    class="label-drop-zone"
                    name="yeast-dv"
                    answer="yeast-dv"
                  >
                    Drop label
                  </DropSlot>
                </th>
              </tr>
              <tr>
                <th v-for="test in 3" :key="test" class="test-heading">
                  <DropSlot
                    tag="span"
                    class="label-drop-zone"
                    :name="`yeast-test-${test}`"
                    :answer="`yeast-test-${test}`"
                  >
                    Drop label
                  </DropSlot>
                </th>
                <th class="average-heading">Average</th>
              </tr>
            </thead>

            <InputResponse
              ref="resultsActivity"
              tag="tbody"
              id="yeastResultsActivity"
              name="yeast-results"
            >
              <tr v-for="(row, index) in rows" :key="row.temp">
                <th class="independent-value">
                  <DropSlot
                    tag="span"
                    class="label-drop-zone"
                    :name="`yeast-temp-${row.temp}`"
                    :answer="`yeast-temp-${row.temp}`"
                  >
                    Drop label
                  </DropSlot>
                </th>
                <ResponseBox
                  v-for="cell in row.cells"
                  :key="cell.key"
                  tag="td"
                  :group-key="cell.key"
                  :min="1"
                  :max="1"
                  :answer="cell.answer"
                  type="number"
                  input-class="table-number-input table-number-control"
                  :input-props="numberInputProps"
                  :aria-label="cell.label"
                  list-class="table-result-list"
                />
                <td
                  class="average-cell"
                  :class="{ 'average-result': calculated[index] }"
                >
                  <div v-if="calculated[index]" class="average-result-wrapper">
                    <span class="average-result-value">{{ average(row) }}</span>
                    <Button
                      :is-delete="true"
                      aria-label="Clear calculated average"
                      @click="clearAverage(index)"
                    />
                  </div>
                  <button
                    v-else-if="averagesShown"
                    type="button"
                    class="average-button general-button"
                    @click="calculate(index)"
                  >
                    Calculate
                  </button>
                </td>
              </tr>
            </InputResponse>
          </table>
        </div>

        <div
          v-if="feedback"
          id="yeastLabelFeedback"
          class="activity-feedback table-activity-feedback"
          :class="feedback.variant"
        >
          <strong>{{ feedback.title }}</strong>
          <span>{{ feedback.text }}</span>
        </div>
      </div>
    </DragDrop>

    <PredictionCheck
      v-if="allCalculated"
      ref="interpretActivity"
      id="yeastPredictionCheck"
      name="yeast-interpretation"
      prediction="As the temperature increases, the amount of gas made by yeast increases. This is because living things need to be warm to survive."
      answer="partly-supported"
    >
      <h3>Use the data to describe the results</h3>

      <McQuestion name="low-temps" answer="increases">
        <p>
          As the temperature increases from <strong>2°C to 37°C</strong>, the
          amount of gas made by yeast:
        </p>
        <div class="prediction-buttons">
          <McChoice
            v-for="choice in choices"
            :key="choice.value"
            :value="choice.value"
            class="prediction-button"
          >
            {{ choice.text }}
          </McChoice>
        </div>
      </McQuestion>

      <McQuestion name="high-temp" answer="decreases">
        <p>
          At <strong>80°C</strong>, the amount of gas made compared with
          <strong>37°C</strong>:
        </p>
        <div class="prediction-buttons">
          <McChoice
            v-for="choice in choices"
            :key="choice.value"
            :value="choice.value"
            class="prediction-button"
          >
            {{ choice.text }}
          </McChoice>
        </div>
      </McQuestion>
    </PredictionCheck>

    <StopAndCheck
      v-if="interpretDone"
      ref="finalCheck"
      id="yeastHotStopAndThink"
      name="hot-yeast-check"
    >
      <template #content>
        <p>
          From <strong>2°C to 37°C</strong>, yeast activity increased and the
          balloons became bigger.
        </p>
        <p>
          <strong>
            Why do you think yeast activity was so low in the test at 80°C?
          </strong>
        </p>
      </template>
      <template #answer>
        Yeast is a living thing. At <strong>80°C</strong>, the temperature is
        too hot for the yeast to survive, so yeast activity slows down and
        stops.
      </template>
    </StopAndCheck>

    <div class="reset-button-container">
      <Button :is-reset="true" @click="emit('reset')" />
    </div>

    <LessonEndCard
      v-if="finished"
      :lesson-number="3"
      :practiced="[
        'Observing and investigating yeast',
        'Recording results and looking for patterns',
        'Using results to check a prediction',
      ]"
    />
  </Activity>
</template>

<style scoped>
/* Step 2 and the number boxes stay hidden until every label is placed */
.labels-complete .yeast-results-step {
  display: block;
}

:deep(.table-number-control) {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.labels-complete :deep(.table-number-control) {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
}
</style>

<style scoped>
.label-bank {
  border-radius: 20px;
  color: var(--muted);
}

.label-bank {
  min-height: 280px;
  background: #ffffff;
  border: 1px solid var(--line);
  padding: 16px;
}

@media (max-width: 960px) {
  .label-bank {
    min-height: 160px;
  }
}

#yeast-labels .average-heading {
  font-size: clamp(0.7rem, 1vw, 0.9rem);
}

/* ==================================================
   LESSON 3 - DRAG AND DROP TABLE ACTIVITY
   ================================================== */

/* ---------- Step 2: watch repeat tests ---------- */

.yeast-results-step {
  display: none;

  margin: 0 0 10px;
  padding: 20px 22px;

  background: var(--soft-blue);

  border: 2px solid var(--charcoal);
  border-radius: 18px;
}

/* step 2 is shown once the labels are placed: see YeastResultsTable.vue */
.yeast-results-step--initial {
  display: block;
}

.yeast-results-step-heading {
  display: flex;
  align-items: center;
  gap: 25px;

  margin-bottom: 8px;
}

.yeast-results-step-heading > :deep(span) {
  display: grid;
  place-items: center;

  flex: 0 0 auto;

  padding: 8px 15px;

  background: var(--blue);

  border: 2px solid var(--charcoal);
  border-radius: 999px;

  font-weight: 700;
}

.yeast-results-eyebrow {
  margin: 0 0 2px;

  color: var(--purple);

  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.yeast-results-step :deep(h3) {
  margin: 0;
}

.yeast-results-instruction {
  margin: 0 0 16px 48px;

  color: var(--muted);
  line-height: 1.5;
}

.yeast-results-video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  gap: 12px;

  margin-left: 48px;
}

.yeast-results-video-grid .watch-video-button {
  justify-content: center;
}

@media (max-width: 700px) {
  .yeast-results-video-grid {
    grid-template-columns: 1fr;
    margin-left: 0;
  }
  .yeast-results-instruction {
    margin-left: 0;
  }
}

#yeastActivity {
  display: grid;
  grid-template-columns: clamp(10rem, 15vw, 15rem) 1fr;
  grid-template-rows: auto auto auto auto;
  gap: 10px;
}

#yeastLabelBank {
  grid-column: 1;
  grid-row: 1;
}

.yeast-table-card {
  grid-column: 2;
  grid-row: 1;
}

#yeastLabelFeedback {
  grid-column: 1 / -1;
  grid-row: 2;
}

#labelsCompleteAfterContainer {
  display: flex;
  gap: 10px;
  grid-column: 1 / -1;
  grid-row: 4;
}

#yeastLabelsStopAndCheck {
  flex: 1;
}

#repeat-tests-average-intro[hidden] {
  display: none;
}

#repeat-tests-average-intro {
  display: flex;
  flex-direction: column;
  flex: 3;

  margin: 10px 0 10px;
  padding: 20px 22px;

  background: var(--soft-blue);

  border: 2px solid var(--charcoal);
  border-radius: 18px;
}

#repeat-tests-average-intro :deep(h3) {
  margin: 0;
}

/* ---------- Label bank ---------- */

#yeast-labels .table-label-bank {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  grid-row: 1;

  gap: 12px;

  min-height: 0;
  height: 100%;
  margin: 0 0 22px;
  padding: 20px;

  box-sizing: border-box;

  background: linear-gradient(
    to bottom,
    var(--paper) 0%,
    var(--paper) 55%,
    var(--soft-blue) 160%
  );

  border: 3px solid var(--line);
  border-radius: 20px;

  box-shadow: var(--shadow-small);
}

/* ---------- Draggable labels ----------
   Behaviour (ghost, hover, reject) comes from DragDrop.vue;
   only the look is set here. */

#yeastActivity {
  --dd-accent: var(--purple);
  --dd-slot-hover-bg: var(--soft-purple);
  --dd-reject: var(--orange);
  --dd-ghost-scale: 1.05;
  --dd-ghost-rotate: 0deg;

  border-radius: 20px;
}

/* The labels are <DragItem>s, which render through a Teleport (and their drag
   ghost lives on <body>), so they can't carry this component's scope. Matched
   on the lesson 3 page instead; :where() keeps the specificity of a single
   class, so .general-button:hover still wins. */
:global(:where([data-page="lesson3"]) .drag-label) {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-height: 48px;
  padding: 10px 18px;

  background: var(--paper);
  color: var(--text);

  border: 2px solid var(--line);
  border-top: 5px solid var(--blue);
  border-radius: 14px;

  box-shadow: 0 3px 0 rgba(48, 51, 47, 0.16);

  font-size: clamp(0.7rem, 1vw, 0.9rem);
  font-weight: 700;
  line-height: 1.25;
  text-align: center;
}

#yeastActivity :deep(.drag-label:hover) {
  background: var(--soft-blue);
}

/* ---------- Drop zones ---------- */

#yeast-labels .label-drop-zone {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  min-height: 54px;
  padding: 8px 10px;
  box-sizing: border-box;

  background: rgba(255, 255, 255, 0.38);
  color: var(--charcoal);

  border: 2px dashed var(--charcoal);
  border-radius: 6px;

  font-size: clamp(0.7rem, 1vw, 0.9rem);
  font-weight: 600;
  line-height: 1.25;

  text-transform: none;

  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

/* ---------- Dependent-variable drop area ---------- */

#yeast-labels .drop-heading {
  padding: 10px 14px;
}

#yeast-labels .dependent-heading .label-drop-zone {
  min-height: 48px;

  background: rgba(255, 255, 255, 0.18);
  color: white;

  border-color: rgba(255, 255, 255, 0.78);
}

/* ---------- Completion feedback ---------- */

#yeast-labels .table-activity-feedback {
  margin-top: 20px;
  padding: 16px 18px;
  text-align: center;
}

#yeast-labels .table-activity-feedback :deep(strong) {
  margin-bottom: 4px;
  font-size: 1.05rem;
}

/* ---------- Responsive ---------- */
@media (max-width: 900px) {
  #yeastActivity {
    grid-template-columns: 1fr;
    grid-template-rows: none;
  }
  #yeastLabelBank,
  .yeast-table-card,
  #yeastLabelFeedback,
  #labelsCompleteAfterContainer {
    grid-column: 1;
    grid-row: auto;
  }
  #yeast-labels .table-label-bank {
    padding: 14px;
    gap: 9px;
    height: auto;
    flex-direction: row;
    flex-wrap: wrap;
  }
  #yeastActivity :deep(.drag-label) {
    padding: 9px 13px;
  }
}

/* ---------- Success ---------- */

.table-activity-feedback.feedback-success {
  background: var(--soft-green);
  border-color: var(--green);
}

.average-worked-example {
  margin-top: 20px;
  padding: 20px 22px;

  background: var(--paper);

  border: 2px solid var(--charcoal);
  border-left: 8px solid var(--blue);
  border-radius: 16px;
}

.average-example-label {
  margin: 0 0 12px;

  color: var(--purple);

  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.average-worked-example > :deep(p:not(.average-example-label)) {
  margin: 0 0 12px;
}

.average-example-steps {
  padding: 16px 18px;

  background: white;

  border: 2px solid var(--charcoal);
  border-radius: 12px;
}

.average-example-steps :deep(p) {
  margin: 0 0 10px;
  line-height: 1.5;
}

.average-example-steps :deep(p:last-child) {
  margin-bottom: 0;
}

/* ---------- Upper-primary fraction notation ---------- */

.average-example-steps {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  gap: 18px;
}

.average-equation {
  display: flex;
  align-items: center;

  gap: 12px;

  min-height: 54px;

  font-size: 1.05rem;
}

.average-equation-left {
  min-width: 92px;

  text-align: right;
}

.math-fraction {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;

  min-width: 220px;

  text-align: center;
  vertical-align: middle;
}

.math-numerator {
  padding: 0 10px 5px;

  border-bottom: 2px solid var(--charcoal);
}

.math-denominator {
  padding: 5px 10px 0;
}

.average-equation-result {
  font-size: 1.15rem;
}

.average-equation-result :deep(strong) {
  padding: 6px 12px;

  background: var(--soft-green);

  border-radius: 8px;
}

@media (max-width: 520px) {
  .average-equation {
    font-size: 0.95rem;
  }
  .average-equation-left {
    min-width: 72px;
  }
  .math-fraction {
    min-width: 180px;
  }
}
</style>
