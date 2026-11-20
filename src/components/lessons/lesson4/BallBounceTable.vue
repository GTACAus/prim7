<script setup>
/*
  Lesson 4 "Observe the experiment and complete the table":
    - two video cards (hard / soft surface); Watch opens the video in a panel
      under the cards
    - a scientific table the student builds themselves: headings, units, test
      headings, row labels and three numbers per row (each a <StudentEntry>)
    - Calculate buttons for each row's average
    - once both averages are calculated, <PredictionCheck>: type the two
      averages and say whether the prediction was supported (no right answer)
    - Reset (table + interpretation) and the end-of-lesson card

    <BallBounceTable />

  Everything typed and the calculated averages are saved through
  <Activity :state>; the interpretation saves itself.
*/
import { computed, nextTick, reactive, ref, watch } from "vue";
import Activity from "../../activities/Activity.vue";
import PredictionCheck from "../../activities/PredictionCheck.vue";
import StudentEntry from "../../ui/StudentEntry.vue";
import Button from "../../ui/Button.vue";
import LessonEndCard from "../../content/LessonEndCard.vue";
import { openVideo } from "../../../composables/useModal.js";

/* ---------- videos ---------- */

const videos = [
  {
    label: "Condition 1",
    title: "Hard surface",
    src: "../videos/lesson3/Hard Trial 2.mp4",
    videoTitle: "Ball Bounce Experiment - Hard Surface",
  },
  {
    label: "Condition 2",
    title: "Soft surface",
    src: "../videos/lesson3/Soft Trial 2.mp4",
    videoTitle: "Ball Bounce Experiment - Soft Surface",
  },
];

const playing = ref(null); // the video shown in the panel, or null
const panel = ref(null);

async function watchVideo(video) {
  playing.value = video;
  await nextTick();
  panel.value?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ---------- the table ---------- */

const ROWS = 2;
const TESTS = 3;

// one array of answers per box (StudentEntry v-model); max one answer each
const entries = reactive({
  iv: [],
  dv: [],
  avgHard: [],
  avgSoft: [],
});
for (let t = 0; t < TESTS; t++) entries[`test${t}`] = [];
for (let r = 0; r < ROWS; r++) {
  entries[`row${r}`] = [];
  for (let t = 0; t < TESTS; t++) entries[`r${r}t${t}`] = [];
}

const ordinal = ["First", "Second", "Third"];

const calculated = ref({}); // row index -> true
const averageError = ref(false);
const state = { entries, calculated };

// the numbers typed into one row, NaN where a box is empty
function rowNumbers(r) {
  return Array.from({ length: TESTS }, (_, t) => {
    const text = entries[`r${r}t${t}`][0] ?? "";
    return text === "" ? NaN : Number(text);
  });
}

function average(r) {
  const values = rowNumbers(r);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Number.isInteger(mean)
    ? String(mean)
    : mean.toFixed(1).replace(/\.0$/, "");
}

function calculate(r) {
  if (rowNumbers(r).some(Number.isNaN)) {
    averageError.value = true;
    return;
  }
  averageError.value = false;
  calculated.value = { ...calculated.value, [r]: true };
}

function clearAverage(r) {
  const { [r]: _, ...rest } = calculated.value;
  calculated.value = rest;
}

// an average goes back to a Calculate button once one of its numbers is cleared
watch(
  () =>
    Array.from({ length: ROWS }, (_, r) => rowNumbers(r).some(Number.isNaN)),
  (missing) =>
    missing.forEach((isMissing, r) => {
      if (isMissing && calculated.value[r]) clearAverage(r);
    }),
);

const allCalculated = computed(() =>
  Array.from({ length: ROWS }, (_, r) => r).every((r) => calculated.value[r]),
);

/* ---------- interpret the results ---------- */

const interpretation = ref(null);
const choices = [
  { value: "supported", text: "Supported" },
  { value: "unsupported", text: "Not supported" },
];

const numberProps = { step: "any", inputmode: "decimal", autocomplete: "off" };

/* ---------- reset ---------- */

function reset() {
  for (const key of Object.keys(entries)) entries[key] = [];
  calculated.value = {};
  averageError.value = false;
  interpretation.value?.reset();
}

defineExpose({ reset });
</script>

<template>
  <Activity
    name="ball-bounce-table"
    :complete="allCalculated"
    :state="state"
    @reset="reset"
  >
    <slot />

    <div class="ball-bounce-video-grid">
      <div
        v-for="video in videos"
        :key="video.title"
        class="ball-bounce-video-card"
      >
        <p class="ball-bounce-video-label">{{ video.label }}</p>
        <h3>{{ video.title }}</h3>
        <p>Watch all three tests and record the number of bounces.</p>
        <Button
          class="watch-video-button"
          symbol="▶"
          @click="openVideo(video.src, video.title)"
        >
          Watch
        </Button>
      </div>
    </div>

    <div v-if="playing" ref="panel" class="video-dropdown-panel">
      <div class="video-dropdown-header">
        <h2>{{ playing.videoTitle }}</h2>
        <Button
          :is-delete="true"
          aria-label="Close video"
          @click="playing = null"
        />
      </div>
      <video
        :key="playing.src"
        class="video-modal-player"
        :src="playing.src"
        controls
        preload="metadata"
      >
        Your browser does not support video playback.
      </video>
    </div>

    <div class="data-table-card bounce-table-card">
      <div class="custom-table-note">
        <p>How to fill in the table</p>
        <p class="custom-table-note-detail">
          1. Type the <strong>independent variable</strong> (what is being
          changed) in the left box.
        </p>
        <p class="custom-table-note-detail">
          2. Type the <strong>dependent variable</strong> (what is being
          measured) in the top box.
        </p>
        <p class="custom-table-note-detail">
          3. Write what you changed in each row. Then type the results from each
          test. The number boxes only take numbers.
        </p>
      </div>

      <div class="experiment-table-scroll">
        <table
          class="experiment-table experiment-table-average custom-table"
          aria-label="Student-built experiment table"
        >
          <thead>
            <tr>
              <th class="independent-heading" rowspan="2">
                <div class="table-heading-fields">
                  <StudentEntry
                    v-model:answers="entries.iv"
                    :max="1"
                    :maxlength="50"
                    placeholder="Independent variable"
                    aria-label="Independent variable"
                    input-class="table-text-input axis-text-input"
                    list-class="table-result-list"
                  />
                  <span
                    class="no-units-box"
                    aria-label="Units: no units required"
                    >(No units)</span
                  >
                </div>
              </th>

              <th class="dependent-heading bounce-dependent" colspan="4">
                <div class="table-heading-fields">
                  <StudentEntry
                    v-model:answers="entries.dv"
                    :max="1"
                    :maxlength="70"
                    placeholder="Dependent variable"
                    aria-label="Dependent variable"
                    input-class="table-text-input table-heading-input"
                    list-class="table-result-list"
                  />
                  <span
                    class="no-units-box"
                    aria-label="Units: no units required"
                    >(No units)</span
                  >
                </div>
              </th>
            </tr>

            <tr>
              <th
                v-for="t in TESTS"
                :key="t"
                class="test-heading bounce-heading"
              >
                <StudentEntry
                  v-model:answers="entries[`test${t - 1}`]"
                  :max="1"
                  :maxlength="30"
                  :placeholder="`Test ${t}`"
                  :aria-label="`${ordinal[t - 1]} test heading`"
                  input-class="table-text-input"
                  list-class="table-result-list"
                />
              </th>
              <th class="average-heading">Average</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="r in ROWS" :key="r">
              <th class="independent-value bounce-value">
                <StudentEntry
                  v-model:answers="entries[`row${r - 1}`]"
                  :max="1"
                  :maxlength="35"
                  placeholder="Row label"
                  :aria-label="`${ordinal[r - 1]} row label`"
                  input-class="table-text-input"
                  list-class="table-result-list"
                />
              </th>
              <td v-for="t in TESTS" :key="t">
                <StudentEntry
                  v-model:answers="entries[`r${r - 1}t${t - 1}`]"
                  type="number"
                  :max="1"
                  :input-props="numberProps"
                  :aria-label="`${ordinal[r - 1]} row test ${t}`"
                  input-class="table-number-input"
                  list-class="table-result-list"
                />
              </td>
              <td
                class="average-cell"
                :class="{ 'average-result': calculated[r - 1] }"
              >
                <div v-if="calculated[r - 1]" class="average-result-wrapper">
                  <span class="average-result-value">{{ average(r - 1) }}</span>
                  <Button
                    :is-delete="true"
                    aria-label="Clear calculated average"
                    @click="clearAverage(r - 1)"
                  />
                </div>
                <Button v-else class="average-button" @click="calculate(r - 1)">
                  Calculate
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="reset-button-container">
        <Button :is-reset="true" @click="reset" />
      </div>
    </div>

    <div
      v-if="averageError"
      class="activity-feedback table-activity-feedback feedback-try-again"
    >
      <strong>Add all three results first.</strong>
      <span>The average can be calculated once each test has a number.</span>
    </div>

    <PredictionCheck
      v-if="allCalculated"
      ref="interpretation"
      name="ball-bounce-interpretation"
      :choices="choices"
      question="My reasoned prediction was"
    >
      <h3>Use your averages to interpret the results</h3>

      <div class="ball-bounce-interpretation">
        <div class="ball-bounce-interpretation-row">
          <span
            >The average number of bounces on a
            <strong>hard surface</strong> was</span
          >
          <StudentEntry
            v-model:answers="entries.avgHard"
            type="number"
            :max="1"
            :input-props="numberProps"
            aria-label="Average number of bounces on the hard surface"
            input-class="table-number-input result-average-input"
            list-class="table-result-list"
          />
          <span>bounces.</span>
        </div>

        <div class="ball-bounce-interpretation-row">
          <span
            >The average number of bounces on a
            <strong>soft surface</strong> was</span
          >
          <StudentEntry
            v-model:answers="entries.avgSoft"
            type="number"
            :max="1"
            :input-props="numberProps"
            aria-label="Average number of bounces on the soft surface"
            input-class="table-number-input result-average-input"
            list-class="table-result-list"
          />
          <span>bounces.</span>
        </div>
      </div>
    </PredictionCheck>

    <LessonEndCard
      v-if="interpretation?.isComplete"
      :lesson-number="4"
      :practiced="[
        'Planning a fair test for a ball-bounce experiment',
        'Recording repeated results in a table',
        'Using results to check a prediction',
      ]"
    />
  </Activity>
</template>

<style scoped>
/* ---------- Videos ---------- */

.ball-bounce-video-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 16px 0 30px;
}

.ball-bounce-video-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 22px;

  background: white;
  border: 2px solid var(--charcoal);
  border-radius: 18px;

  text-align: center;
}

.ball-bounce-video-card:first-child {
  border-top: 8px solid var(--orange);
}

.ball-bounce-video-card:last-child {
  border-top: 8px solid var(--green);
}

.ball-bounce-video-card h3 {
  margin: 0;
}

.ball-bounce-video-card > p:not(.ball-bounce-video-label) {
  margin: 0 0 8px;
  color: var(--muted);
  line-height: 1.45;
}

.ball-bounce-video-label {
  margin: 0;
  color: var(--purple);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.video-dropdown-panel {
  width: 100%;
  margin: 0 0 24px;
  padding: 18px;

  background: var(--paper);
  border: 3px solid var(--charcoal);
  border-radius: 18px;
  box-shadow: var(--shadow-small);

  box-sizing: border-box;
  animation: pop-fade-in 0.3s ease;
}

.video-dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.video-dropdown-header h2 {
  margin: 0;
}

.video-modal-player {
  display: block;
  width: 100%;
  border-radius: 12px;
}

/* ---------- Table ---------- */

.bounce-table-card .experiment-table th,
.bounce-table-card .experiment-table td {
  padding: 9px;
}

.bounce-table-card .independent-value {
  width: 125px;
}

/* long headings wrap rather than force the table wider */
.bounce-table-card :deep(.ir-answer span) {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.bounce-table-card :deep(.table-number-input) {
  height: 54px;
}

.bounce-table-card .independent-value :deep(.table-text-input),
.bounce-table-card :deep(.axis-text-input) {
  min-height: 52px;
}

/* units box: fixed text, nothing to type (these variables have no units) */
.no-units-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 9px 11px;
  box-sizing: border-box;

  background: var(--paper);
  border: 2px dashed var(--line);
  border-radius: 12px;

  color: var(--muted);
  font-weight: 600;
  cursor: default;
  user-select: none;
}

/* dependent variable: smaller units box to the side of the heading box */
.bounce-dependent .table-heading-fields {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.bounce-dependent .table-heading-fields > :first-child {
  flex: 0 1 430px;
  min-width: 0;
  margin-inline: 0;
}

.bounce-dependent .no-units-box {
  flex: 0 0 auto;
  min-height: 40px;
  padding: 6px 10px;
  font-size: 0.8rem;
  white-space: nowrap;
}

.bounce-table-card .custom-table-note {
  background-color: var(--paper);
}

.bounce-table-card .reset-button-container {
  margin-top: 16px;
}

/* ---------- Interpretation ---------- */

.ball-bounce-interpretation {
  display: grid;
  gap: 14px;
  width: 100%;
  margin-top: 10px;
}

.ball-bounce-interpretation-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px 16px;

  background: var(--soft-blue);
  border: 2px solid var(--charcoal);
  border-radius: 14px;

  line-height: 1.5;
}

.ball-bounce-interpretation-row :deep(.table-number-input),
.ball-bounce-interpretation-row :deep(.table-result-list) {
  width: 90px;
  height: 44px;
}

@media (max-width: 800px) {
  .bounce-table-card .experiment-table th,
  .bounce-table-card .experiment-table td {
    height: 82px;
    padding: 7px;
  }

  .bounce-table-card :deep(.table-text-input),
  .bounce-table-card :deep(.table-number-input) {
    font-size: 0.9rem;
  }

  .bounce-table-card .average-button {
    min-width: 0;
    width: 100%;
    padding: 9px 8px;
    font-size: 0.86rem;
  }
}

@media (max-width: 700px) {
  .ball-bounce-video-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
/* Moved from styles/lesson3_styles/lesson3.css. Not scoped: some rules style child components' content. */

.custom-table-note {
  margin: 0 0 7px !important;
  padding: 0 12px;
  align-self: flex-end;

  color: var(--charcoal);
  background-color: var(--soft-orange);
  border: 2px solid var(--orange);
  border-left: 7px solid var(--orange);
  border-radius: 10px;

  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/*
  A full sentence inside the note box. The label above it
  is short enough to read in capitals; this is not, so it
  keeps normal sentence case.
*/
.custom-table-note-detail {
  margin-top: 4px;

  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
}

/* ---------- Student heading / label text fields ---------- */

.table-text-input {
  min-height: 46px;
  padding: 9px 11px;

  font-weight: 600;
}

.table-text-input::placeholder {
  color: var(--muted);
  opacity: 0.75;
}

/* Dependent-variable heading */
.table-heading-input {
  max-width: 430px;
  margin-inline: auto;

  background: var(--paper);
}
</style>
