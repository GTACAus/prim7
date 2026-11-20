<script setup>
/*
  Lesson 6: explore the rock platform, then turn the counts into a line graph.
    1. Click a distance on the number line: the person walks there and the
       quadrat photo for that distance opens.
    2. Pick one of the three snails and click every one hidden in the photo.
       Each find adds a counter to that distance's column below.
    3. Once every animal of that snail is found (at all five distances),
       "Show data points" turns the columns into points; click them from left
       to right to draw the line. "Hide counters" then shows the line alone.
  If a student has opened all five quadrats and still hasn't found them all
  two minutes later, "Find all" makes the missing ones pulse.

    <NumberLine />

  Complete (Next shows) once any snail's line is fully connected. Found
  animals, the chosen snail, the graph and the find-all timers are saved
  through <Activity :state>; where the person stands is not.
*/
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import Activity from "../activities/Activity.vue";
import Button from "../ui/Button.vue";
import ContentBox from "../ui/ContentBox.vue";
import NumberLinePanel from "./NumberLinePanel.vue";
import {
  DISTANCES,
  HOTSPOTS,
  PANELS,
  PERSON_IMAGES,
  ROCK_PLATFORM,
  SPECIES,
} from "./numberLine.js";

const UNIT_HEIGHT = 10; // px per counter
const CYLINDER_DIAMETER = 80;
// "Hide counters" stretches the chart this much so the line reads more clearly
const STRETCH_FACTOR = 4;
const FIND_ALL_DELAY_MS = 2 * 60 * 1000;
const CLOSE_MS = 260; // gap between closing one quadrat and opening the next
const STANDING_MS = 1300; // length of person_standing.gif
const INVESTIGATE_MS = 1300; // length of person_investigating.gif

/* ---------- saved state ---------- */

const found = reactive({}); // hotspot id -> true
const highlighted = ref([]); // hotspot ids pointed out by "Find all"
const selectedSpecies = ref(null);
const isGraphMode = ref(false);
const isCountersHidden = ref(false);
const connections = reactive({}); // species -> distances connected, in order
const visited = reactive({}); // species -> distances whose quadrat was opened
const searchStartedAt = reactive({}); // species -> when all five were opened

const state = {
  found,
  highlighted,
  selectedSpecies,
  isGraphMode,
  isCountersHidden,
  connections,
  visited,
  searchStartedAt,
};

/* ---------- counts ---------- */

const colour = computed(
  () => SPECIES.find((s) => s.name === selectedSpecies.value)?.colour,
);

function spotsOf(name, distance) {
  return HOTSPOTS.filter(
    (h) =>
      h.species === name && (distance === undefined || h.distance === distance),
  );
}

// how many of the selected snail have been found at each distance
const counts = computed(() =>
  DISTANCES.map(
    (d) => spotsOf(selectedSpecies.value, d).filter((h) => found[h.id]).length,
  ),
);

const maxUnits = computed(() =>
  Math.max(
    1,
    ...DISTANCES.map((d) => spotsOf(selectedSpecies.value, d).length),
  ),
);

const allFound = computed(() => {
  if (!selectedSpecies.value) return false;
  const spots = spotsOf(selectedSpecies.value);
  return spots.length > 0 && spots.every((h) => found[h.id]);
});

/* ---------- the line graph ---------- */

const connected = computed(() => connections[selectedSpecies.value] ?? []);
const nextDistance = computed(() => DISTANCES[connected.value.length] ?? null);
const graphComplete = computed(
  () => connected.value.length === DISTANCES.length,
);
const complete = computed(() =>
  SPECIES.some((s) => connections[s.name]?.length === DISTANCES.length),
);

function clearConnections() {
  if (selectedSpecies.value) connections[selectedSpecies.value] = [];
}

const unitHeight = computed(() =>
  isGraphMode.value && isCountersHidden.value
    ? UNIT_HEIGHT * STRETCH_FACTOR
    : UNIT_HEIGHT,
);
const rowHeight = computed(() => maxUnits.value * unitHeight.value);

/*
  The column heights glide (a 0.7s CSS ease) when "Hide counters" stretches
  the chart. The points and line are SVG, which CSS can't animate, so the
  unit height they're drawn from follows the same ease frame by frame.
*/
const drawnUnit = ref(unitHeight.value);
let tweenFrame = null;

function ease(t) {
  // cubic-bezier(0.25, 0.1, 0.25, 1), the CSS "ease" curve
  const bezier = (s, p1, p2) =>
    3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s * s * p2 + s ** 3;
  let lo = 0;
  let hi = 1;
  let s = t;
  for (let i = 0; i < 20; i++) {
    s = (lo + hi) / 2;
    if (bezier(s, 0.25, 0.25) < t) lo = s;
    else hi = s;
  }
  return bezier(s, 0.1, 1);
}

watch(unitHeight, (to) => {
  cancelAnimationFrame(tweenFrame);
  const from = drawnUnit.value;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 700);
    drawnUnit.value = from + (to - from) * ease(t);
    if (t < 1) tweenFrame = requestAnimationFrame(step);
  };
  tweenFrame = requestAnimationFrame(step);
});

const ground = computed(() => maxUnits.value * drawnUnit.value);
const points = computed(() =>
  DISTANCES.map((distance, i) => ({
    distance,
    x: (i + 0.5) * (100 / DISTANCES.length) + "%",
    y: ground.value - counts.value[i] * drawnUnit.value,
  })),
);
const segments = computed(() =>
  points.value
    .slice(1)
    .map((p, i) => [points.value[i], p])
    .filter(([a, b]) =>
      [a, b].every((p) => connected.value.includes(p.distance)),
    ),
);

const connectHint = ref(""); // after an out-of-order click
const shaking = ref(null);

function connect(distance) {
  if (!selectedSpecies.value || !isGraphMode.value) return;
  if (connected.value.includes(distance)) return;

  if (distance !== nextDistance.value) {
    shaking.value = null;
    requestAnimationFrame(() => (shaking.value = distance));
    setTimeout(() => (shaking.value = null), 320);
    connectHint.value = `Connect the points from left to right. Click ${nextDistance.value} m next.`;
    return;
  }
  connections[selectedSpecies.value] = [...connected.value, distance];
}

watch(connected, () => (connectHint.value = ""));

const buildInstruction = computed(() => {
  if (!isGraphMode.value)
    return `You found every ${selectedSpecies.value}. Now show those five counts as data points.`;
  if (graphComplete.value)
    return "Great — the counters and the line show the same data. Hide the counters to see the line more clearly.";
  return (
    connectHint.value ||
    `Click the highlighted points from left to right to connect the line. Start with ${nextDistance.value} m.`
  );
});

function showDataPoints() {
  isGraphMode.value = true;
  isCountersHidden.value = false;
  clearConnections();
}

/* ---------- choosing a snail, finding animals ---------- */

function selectSpecies(name) {
  selectedSpecies.value = name;
  isGraphMode.value = false;
  isCountersHidden.value = false;
  clearConnections();
}

// The counts just changed, so any line built from the old counts is gone:
// back to the counters until the snail is complete again.
function toggleFound(id) {
  if (found[id]) delete found[id];
  else found[id] = true;
  isGraphMode.value = false;
  isCountersHidden.value = false;
  clearConnections();
}

/* ---------- "Find all" ---------- */

const now = ref(Date.now());
let clock = null;

const findAllDue = computed(() => {
  const name = selectedSpecies.value;
  if (!name || allFound.value) return false;
  const seen = visited[name] ?? [];
  const startedAt = searchStartedAt[name];
  return (
    DISTANCES.every((d) => seen.includes(d)) &&
    Boolean(startedAt) &&
    now.value - startedAt >= FIND_ALL_DELAY_MS
  );
});

function findAll() {
  const name = selectedSpecies.value;
  const ids = spotsOf(name).map((h) => h.id);
  highlighted.value = [...new Set([...highlighted.value, ...ids])];
  isGraphMode.value = false;
  isCountersHidden.value = false;
  clearConnections();
}

/* ---------- the number line and the quadrat panel ---------- */

const selectedDistance = ref(null); // enables the snail buttons
const activePoint = ref(null); // the point shown as selected
const panelDistance = ref(null); // the open quadrat
let panelTimer = null;

const note = computed(() =>
  activePoint.value === null
    ? "Select a point to look for the animals at that distance."
    : `You selected ${activePoint.value} metres.`,
);

const pointLeft = (distance) =>
  10 + DISTANCES.indexOf(distance) * (80 / (DISTANCES.length - 1));

function openPanel(distance) {
  panelDistance.value = distance;
  const name = selectedSpecies.value;
  if (!name) return;
  if (!visited[name]?.includes(distance))
    visited[name] = [...(visited[name] ?? []), distance];
  // the two-minute wait only starts once every quadrat has been opened
  if (
    DISTANCES.every((d) => visited[name].includes(d)) &&
    !searchStartedAt[name]
  )
    searchStartedAt[name] = Date.now();
}

function showPanel(distance) {
  clearTimeout(panelTimer);
  if (panelDistance.value === null) {
    openPanel(distance);
    return;
  }
  panelDistance.value = null;
  panelTimer = setTimeout(() => openPanel(distance), CLOSE_MS);
}

function closePanel() {
  clearTimeout(panelTimer);
  panelDistance.value = null;
  activePoint.value = null;
}

function moveTo(distance) {
  selectedDistance.value = distance;
  activePoint.value = distance;
  movePerson(distance);
}

/*
  The person on the number line: idle at 0 m to start, then
  standing (its gif plays once) -> walking -> placing (investigating gif,
  then the quadrat opens) for every new point.
    - idle + the point already stood on: straight to placing.
    - placing + the point that is open: nothing to do.
    - idle or mid-walk: (re)walk straight to the new point.
*/
const person = reactive({
  state: "idle",
  left: pointLeft(0),
  direction: 1,
});
let personDistance = 0; // where the person is, or is walking to
let personTimer = null;

function enterStanding(target) {
  clearTimeout(personTimer);
  person.state = "standing";
  personTimer = setTimeout(() => enterWalking(target), STANDING_MS);
}

function enterWalking(target) {
  clearTimeout(personTimer);
  const direction = Math.sign(target - personDistance) || person.direction;
  person.direction = direction;
  personDistance = target;
  if (person.left === pointLeft(target)) {
    // already there, so no transition (and no transitionend) will happen
    enterPlacing(target);
    return;
  }
  person.state = "walking";
  person.left = pointLeft(target);
}

function onPersonArrive(event) {
  if (event.propertyName === "left" && person.state === "walking")
    enterPlacing(personDistance);
}

function enterPlacing(target) {
  clearTimeout(personTimer);
  person.state = "placing";
  personTimer = setTimeout(() => showPanel(target), INVESTIGATE_MS);
}

function movePerson(target) {
  if (person.state === "placing" && target === personDistance) {
    if (panelDistance.value === null) showPanel(target);
    return;
  }
  if (person.state === "idle" && target === personDistance) {
    enterPlacing(target);
    return;
  }
  if (person.state === "idle" || person.state === "walking") {
    enterWalking(target);
    return;
  }
  enterStanding(target);
}

function resetPerson() {
  clearTimeout(personTimer);
  person.state = "idle";
  person.left = pointLeft(0);
  person.direction = 1;
  personDistance = 0;
}

/* ---------- reset ---------- */

function clear(object) {
  for (const key of Object.keys(object)) delete object[key];
}

function reset() {
  clearTimeout(panelTimer);
  panelDistance.value = null;
  activePoint.value = null;
  selectedDistance.value = null;
  clear(found);
  clear(connections);
  clear(visited);
  clear(searchStartedAt);
  highlighted.value = [];
  selectedSpecies.value = null;
  isGraphMode.value = false;
  isCountersHidden.value = false;
  resetPerson();
}

/* ---------- start loading the large images early ---------- */

const preloaded = [];
onMounted(() => {
  const sources = [
    ROCK_PLATFORM,
    ...Object.values(PANELS).map((p) => p.background),
    ...Object.values(PERSON_IMAGES),
  ];
  for (const src of sources) {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    preloaded.push(image);
  }
  clock = setInterval(() => (now.value = Date.now()), 1000);
});

onBeforeUnmount(() => {
  clearTimeout(panelTimer);
  clearTimeout(personTimer);
  clearInterval(clock);
  cancelAnimationFrame(tweenFrame);
});
</script>

<template>
  <Activity :complete="complete" :state="state" @reset="reset">
    <ContentBox
      class="number-line-workspace"
      aria-label="Interactive 0 to 20 metre number line"
    >
      <span class="challenge-step-label">Step 1 · Collect the data</span>
      <p>
        The low water mark is at <strong>0 metres</strong>. Starting there,
        count the number of marine snails inside each square every
        <strong>5 m</strong> along the path
      </p>
      <p class="activity-instruction">
        Select a point on the path, then choose which animal you want to look
        for. The animal stays selected as you move along the rock platform. How
        do the numbers of each animal change as you move further from the low
        tide mark?
      </p>
      <p class="activity-note" role="status" aria-live="polite">{{ note }}</p>

      <div class="line-frame">
        <div class="line-panel-box">
          <div
            id="number-line-animal-buttons"
            class="species-select-row"
            role="radiogroup"
            aria-label="Choose which animal to search for and graph"
          >
            <div
              v-for="snail in SPECIES"
              :key="snail.name"
              class="species-select-button-wrap"
            >
              <button
                type="button"
                class="species-select-button"
                :class="{ 'is-active': selectedSpecies === snail.name }"
                :aria-pressed="selectedSpecies === snail.name"
                :disabled="selectedDistance === null"
                @click="selectSpecies(snail.name)"
              >
                <img class="noselect" :src="snail.image" alt="" />
              </button>
              <span>{{ snail.name }}</span>
            </div>
          </div>

          <NumberLinePanel
            v-if="panelDistance !== null"
            :key="panelDistance"
            :distance="panelDistance"
            :species="selectedSpecies"
            :found="found"
            :highlighted="highlighted"
            @find="toggleFound"
            @close="closePanel"
          />

          <div class="line-stage">
            <img
              class="person-marker noselect"
              :src="PERSON_IMAGES[person.state]"
              :style="{
                left: person.left + '%',
                transform: `translateX(-50%) scaleX(${person.direction})`,
              }"
              alt="Person on the number line"
              @transitionend="onPersonArrive"
            />

            <div class="line-track number-line">
              <button
                v-for="distance in DISTANCES"
                :key="distance"
                type="button"
                class="line-point"
                :class="{ 'is-selected': activePoint === distance }"
                :style="{ left: pointLeft(distance) + '%' }"
                :aria-label="`Open content for ${distance} metres`"
                :aria-expanded="activePoint === distance"
                @click="moveTo(distance)"
              >
                <span class="line-point-label">{{ distance }} m</span>
              </button>
            </div>
          </div>

          <div
            class="number-line-inline-results"
            aria-labelledby="animal-tally-heading"
          >
            <div class="number-line-results-heading">
              <span id="animal-tally-heading" class="challenge-step-label"
                >Step 2 · Count by distance</span
              >
              <p>
                Counts for the selected animal appear under the matching
                distance.
              </p>
            </div>

            <div class="graph-area">
              <div
                class="bar-stack-chart"
                :class="{
                  'is-empty': !selectedSpecies,
                  'is-graph-mode': selectedSpecies && isGraphMode,
                  'counters-hidden':
                    selectedSpecies && isGraphMode && isCountersHidden,
                }"
                :style="
                  selectedSpecies ? { '--row-height': rowHeight + 'px' } : null
                "
              >
                <div class="y-axis">
                  <template v-if="selectedSpecies">
                    <div
                      v-for="value in maxUnits + 1"
                      :key="value"
                      class="y-axis-tick"
                      :style="{ bottom: (value - 1) * unitHeight + 'px' }"
                    >
                      {{ value - 1 }}
                    </div>
                  </template>
                </div>

                <div class="bar-stack-row">
                  <p v-if="!selectedSpecies" class="stack-placeholder">
                    Select a distance, then choose an animal on the left. Its
                    counts will appear here.
                  </p>

                  <template v-else>
                    <!-- keyed by snail: a new snail starts its columns afresh -->
                    <div
                      v-for="(distance, i) in DISTANCES"
                      :key="selectedSpecies + distance"
                      class="stack-group"
                      :class="{
                        'is-current-distance': selectedDistance === distance,
                      }"
                    >
                      <div class="bar-stack-column">
                        <div
                          v-for="n in counts[i]"
                          :key="n"
                          class="stack-unit"
                          :style="{
                            animationDelay: (n - 1) * 0.05 + 's',
                            '--cylinder-diameter': CYLINDER_DIAMETER + 'px',
                            '--cylinder-height': UNIT_HEIGHT + 'px',
                          }"
                        >
                          <div
                            class="cylinder"
                            :style="{ '--colour': colour }"
                          />
                        </div>
                      </div>
                      <div class="bar-stack-label">
                        {{ distance }} m<span>{{ counts[i] }}</span>
                      </div>
                    </div>

                    <svg class="line-graph-overlay">
                      <line
                        v-for="[a, b] in segments"
                        :key="a.distance + '-' + b.distance"
                        class="line-graph-path"
                        :x1="a.x"
                        :y1="a.y"
                        :x2="b.x"
                        :y2="b.y"
                      />
                      <line
                        v-for="point in points"
                        :key="'tick' + point.distance"
                        class="x-axis-tick-mark"
                        :x1="point.x"
                        :x2="point.x"
                        :y1="ground"
                        :y2="ground + 10"
                      />
                      <circle
                        v-for="point in points"
                        :key="'point' + point.distance"
                        class="line-graph-point"
                        :class="{
                          'is-connected': connected.includes(point.distance),
                          'is-next':
                            isGraphMode && point.distance === nextDistance,
                          'is-shake': shaking === point.distance,
                        }"
                        :cx="point.x"
                        :cy="point.y"
                        r="7"
                        tabindex="0"
                        role="button"
                        :aria-label="point.distance + ' metres point'"
                        @click="connect(point.distance)"
                        @keydown.enter.space.prevent="connect(point.distance)"
                      />
                    </svg>
                  </template>
                </div>
              </div>

              <div v-if="allFound" class="graph-build-prompt">
                <span class="challenge-step-label"
                  >Step 3 · Make the line graph</span
                >
                <p class="graph-build-instruction">{{ buildInstruction }}</p>
                <div class="graph-toggle-row">
                  <Button
                    v-if="!isGraphMode"
                    class="graph-toggle-button"
                    @click="showDataPoints"
                  >
                    Show data points
                  </Button>
                  <Button
                    v-if="isGraphMode && graphComplete"
                    class="hide-counters-button"
                    :class="{ 'is-active': isCountersHidden }"
                    @click="isCountersHidden = !isCountersHidden"
                  >
                    {{ isCountersHidden ? "Show counters" : "Hide counters" }}
                  </Button>
                </div>
              </div>

              <div
                v-if="findAllDue"
                class="find-all-prompt"
                role="status"
                aria-live="polite"
              >
                <span class="challenge-step-label">Still searching?</span>
                <p class="find-all-instruction">
                  If you're having trouble finding all the animals, click below
                  to reveal the rest.
                </p>
                <div class="graph-toggle-row">
                  <Button
                    class="find-all-button graph-toggle-button"
                    @click="findAll"
                  >
                    Find all
                  </Button>
                </div>
              </div>
            </div>

            <div
              v-if="graphComplete"
              class="graph-complete-feedback"
              role="status"
              aria-live="polite"
            >
              Line graph complete! You've connected all five data points.
            </div>
          </div>
        </div>
      </div>

      <div class="instruction-card-actions">
        <Button :is-reset="true" @click="reset" />
      </div>
    </ContentBox>
  </Activity>
</template>

<style scoped>
.instruction-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  margin-bottom: 28px;
  background: var(--soft-blue);
}

.instruction-card h2 {
  margin: 0 0 6px;
  font-size: 1.25rem;
}

.instruction-card p {
  margin: 0;
  line-height: 1.55;
}

/* ---- Frame: [left arrow] [line stage] [right arrow] ---- */

.line-frame {
  display: flex;
  align-items: center;
  justify-items: center;
  gap: clamp(8px, 2vw, 20px);
  width: 100%;
}

.line-arrow {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  padding: 0;
  background: var(--green);
  border: 2px solid var(--charcoal);
  border-radius: 50%;
  box-shadow: 0 3px 0 var(--charcoal);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease,
    opacity 0.15s ease;
}

.line-arrow svg {
  width: 22px;
  height: 22px;
  stroke: var(--text);
  stroke-width: 3;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.line-arrow:hover:not(:disabled),
.line-arrow:focus-visible:not(:disabled) {
  background: var(--soft-yellow);
  outline: none;
}

.line-arrow:active:not(:disabled) {
  box-shadow: 0 1px 0 var(--charcoal);
  transform: translateY(2px);
}

.line-arrow:disabled {
  cursor: not-allowed;
  opacity: 0.38;
  box-shadow: 0 3px 0 var(--charcoal);
  transform: none;
}

/*
    This only needs room for the track, labels below it, and the person
    image above it — the big panel is a separate block sitting above this
    in .line-panel-box now, not overlapping it via absolute positioning.
*/
.line-stage {
  position: relative;
  display: grid;
  grid-template-columns: auto;
  grid-template-rows: 5fr 2fr;
  min-width: 0;
  aspect-ratio: 2172 / 724; /* matches Rockplatform.png exactly */
  padding: 0 30px;
  overflow: visible;
  border: 2px solid var(--charcoal);
  border-radius: 16px;
  grid-row: 2;
  grid-column: 2;
  width: 100%;
  background-image: url("/images/lesson6/number_line_activity/Rockplatform.png");
  background-size: cover;
  background-repeat: no-repeat;
}

.line-track {
  position: relative;
  align-self: self-start;
  height: 8px;
  background: var(--yellow);
  border-radius: 999px;
  z-index: 1;
}

.line-track::before,
.line-track::after {
  position: absolute;
  top: 50%;
  width: 0;
  height: 0;
  border-top: 13px solid transparent;
  border-bottom: 13px solid transparent;
  content: "";
  transform: translateY(-50%);
}

.line-track::before {
  left: -2px;
  border-right: 18px solid var(--yellow);
  transform: translate(-100%, -50%);
}

.line-track::after {
  right: -2px;
  border-left: 18px solid var(--yellow);
  transform: translate(100%, -50%);
}

.line-point {
  position: absolute;
  top: 50%;
  width: 22px;
  height: 22px;
  padding: 0;
  background: var(--paper);
  border: 4px solid var(--yellow);
  border-radius: 50%;
  cursor: pointer;
  transform: translate(-50%, -50%);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    text-shadow 0.2s ease;
  z-index: 2;
}

.line-point:hover,
.line-point:focus-visible,
.line-point.is-selected {
  background: var(--yellow);
  border-color: var(--purple);
  outline: none;
  transform: translate(-50%, -50%) scale(1.18);
  text-shadow:
    -2px -2px 0 var(--charcoal),
    2px -2px 0 var(--charcoal),
    -2px 2px 0 var(--charcoal),
    2px 2px 0 var(--charcoal),
    -2px 0px 0 var(--charcoal),
    2px 0px 0 var(--charcoal),
    0px -2px 0 var(--charcoal),
    0px 2px 0 var(--charcoal);
}

.line-point-label {
  position: absolute;
  top: 27px;
  left: 50%;
  width: max-content;
  color: white;

  font-size: 0.88rem;
  font-weight: 700;
  transform: translateX(-50%);
}

.person-marker {
  position: relative;
  align-self: self-end;
  width: 54px;
  height: 72px;
  object-fit: contain;
  object-position: bottom center;
  transform: translateX(-50%);
  transition: left 3s ease;
  z-index: 1;
}

.line-panel-box {
  display: grid;
  grid-template-columns: minmax(140px, 200px) minmax(0, 1fr);
  grid-template-rows: auto auto auto;
  align-items: start;
  justify-items: center;
  gap: 16px;
  width: 100%;
  max-width: 800px; /* optional: caps how wide it gets, tune to taste */
  margin-inline: auto; /* centers the box itself within its parent */
}

.activity-note {
  margin: 22px 0 20px;
  padding: 14px 16px;
  background: var(--soft-yellow);
  border: 2px solid var(--charcoal);
  border-radius: 14px;
  line-height: 1.5;
  text-align: center;
}
.graph-complete-feedback {
  /* display: block; */
  margin: 10px 0 20px;
  padding: 14px 16px;
  background: var(--soft-green);
  border: 3px solid var(--charcoal);
  border-radius: 18px;
  box-shadow: var(--shadow-small);
  color: var(--text);
  font-weight: 700;
  line-height: 1.5;
  text-align: center;
  animation: pop-fade-in 0.5s ease;
}

@media (prefers-reduced-motion: reduce) {
  .graph-complete-feedback {
    animation: none;
  }
}

@media (max-width: 900px) {
  .instruction-card {
    grid-template-columns: 1fr;
  }

  .line-frame {
    gap: 8px;
  }

  .line-arrow {
    width: 42px;
    height: 42px;
  }

  .line-arrow svg {
    width: 18px;
    height: 18px;
  }

  .person-marker {
    width: 46px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .person-marker,
  .line-point,
  .line-arrow {
    transition-duration: 0.01ms !important;
  }
}

/* ---- Reset button, next to the distance badge ---- */
.instruction-card-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.instruction-card-actions > * {
  align-self: center;
  max-width: 200px;
}

/* =================================================================
    Species picker: pick one of 3 animals to search for. Only hotspots
    matching the active species stay clickable everywhere else.
================================================================= */
.species-select-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
  margin-bottom: 20px;
}

.species-select-button-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

#number-line-animal-buttons {
  grid-row: 1 / 3;
  grid-column: 1;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: flex-start;
  justify-self: center;
  align-self: center;
  margin-bottom: 0;
}

.species-select-button-wrap span {
  font-size: 1rem;
  font-weight: 900;
  text-align: center;
}

.species-select-button {
  width: clamp(80px, 9vw, 120px);
  height: clamp(80px, 9vw, 120px);
  padding: clamp(6px, 1.2vw, 10px);
  overflow: hidden;
  background: var(--paper);
  border: 2px solid var(--charcoal);
  border-radius: 50%;
  box-shadow: 0 3px 0 var(--charcoal);
  cursor: pointer;
  font-family: inherit;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.species-select-button img {
  width: 100%;
  object-fit: contain;
  user-select: none;
}

.species-select-button:hover:not(:disabled),
.species-select-button:focus-visible {
  background: var(--soft-yellow);
  outline: none;
}

.species-select-button:active {
  box-shadow: 0 1px 0 var(--charcoal);
  transform: translateY(2px);
}

.species-select-button:disabled {
  cursor: not-allowed;
  opacity: 0.38;
  box-shadow: 0 3px 0 var(--charcoal);
  transform: none;
}

.species-select-button.is-active {
  background: var(--soft-blue);
  border-color: var(--purple);
  box-shadow: none;
  transform: translateY(3px);
  pointer-events: none;
}

/* =================================================================
    Per-distance counters for the selected species: one cylinder-stack
    column per distance (0/5/10/15/20 m), tall as how many of that
    animal were found there. Rebuilt on every click and every species
    switch. Column height and the y-axis both read from the same fixed
    --row-height custom property, and every cylinder "coin" is the
    same --cylinder-height as the JS constant that draws them, so the
    axis and the bars can never fall out of sync with each other.
================================================================= */
.bar-stack-chart {
  display: flex;
  align-items: flex-start;
  gap: 0;
  width: min(900px, 92%);
  padding: 0;
}
.graph-area {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  transition: height 0.7s ease;
}

.bar-stack-row::before {
  position: absolute;
  top: var(--row-height);
  left: 0;
  right: 0;
  height: 4px;
  background: var(--charcoal);
  content: "";
  z-index: 0;
  transition: top 0.7s ease;
}

.bar-stack-row {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  flex: 1 1 auto;
  min-width: 0;
  gap: 0;
}

.bar-stack-row .stack-placeholder {
  margin: 0;
  padding: 40px 0;
  color: var(--muted);
  text-align: center;
}

.stack-group {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  flex: 1;
  min-width: 0;
}

.bar-stack-column {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;

  width: 100%;
  height: var(--row-height, 200px);
  transition: height 0.7s ease;

  perspective: 700px;
}

/* ---- y-axis: sits to the left of the bars, close in, its line
    running flush down into the chart's bottom border so the two form
    one continuous corner, the way a plotted axis normally looks. One
    tick per whole animal, spaced exactly --cylinder-height apart. ---- */
.y-axis {
  position: relative;
  flex: 0 0 auto;
  width: 0;
  height: var(--row-height, 200px);
  margin-right: 4px;
  opacity: 0;
  overflow: visible;
  transition:
    opacity 0.2s ease,
    width 0.2s ease,
    margin-right 0.2s ease,
    height 0.7s ease;
}

.bar-stack-chart.is-graph-mode .y-axis {
  width: 44px;
  margin-right: 0;
  opacity: 1;
}

.y-axis::after {
  position: absolute;
  top: 0;
  right: 0;
  bottom: -4px;
  width: 4px;
  background: var(--charcoal);
  content: "";
}

.y-axis-tick {
  position: absolute;
  right: 12px;
  left: 0;
  height: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 700;
  transition: bottom 0.7s ease;
}

.y-axis-tick::after {
  position: absolute;
  top: 0;
  right: -12px;
  width: 9px;
  height: 3px;
  background: var(--charcoal);
  content: "";
  transform: translateY(-50%);
}

/* ---- Line-graph overlay: shown instead of the cylinders once toggled.
    "Hide Counters" reuses this same rule (cylinders are already hidden)
    and just gives the chart more vertical room via a taller
    --row-height, computed in JS, so the line reads more clearly. The
    distance labels stay visible underneath for reference. ---- */
.bar-stack-chart.counters-hidden .bar-stack-column {
  opacity: 0;
}

/* The exact count under each column is redundant once the line graph
    (with its own y-axis) is showing, so hide it and keep just the
    distance label. */
.bar-stack-chart.is-graph-mode .bar-stack-label span {
  display: none;
}

.x-axis-tick-mark {
  stroke: var(--charcoal);
  stroke-width: 3;
}

.line-graph-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;

  opacity: 0;
  pointer-events: none;
  overflow: visible;
  transition:
    opacity 0.2s ease,
    top 0.7s ease;
}

.bar-stack-chart.is-graph-mode .line-graph-overlay {
  opacity: 1;
  /* The overlay itself stays click-through (pointer-events: none above)
        so it never blocks the cylinders/labels underneath; only the
        plotted points opt back in below. */
  pointer-events: auto;
}

.line-graph-path {
  fill: none;
  stroke: var(--purple);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  /* x1/y1/x2/y2 aren't real CSS properties on <line>, so a CSS
       transition here would be silently ignored — the endpoints are
       animated by hand in JS instead (see animateSvgAttrs). */
}

/* Every distance's point is plotted and clickable from the start;
    clicking one connects it into the line in the order points are
    clicked. Unclicked points are hollow so it's clear which ones
    still need connecting. */
.line-graph-point {
  fill: white;
  stroke: var(--purple);
  stroke-width: 3;
  cursor: pointer;
  /* No cx/cy transition here on purpose: this point's position gets
       re-measured and re-drawn every animation frame while the chart's
       own height transition runs (see trackOverlayDuringTransition in
       JS), which is what actually produces its smooth motion. A CSS
       transition restarted by each of those frame-by-frame updates
       fights that instead of helping — it's how the point ended up
       lagging behind the axis. */
  transition:
    fill 0.15s ease,
    stroke-width 0.15s ease;
}

.line-graph-point:hover,
.line-graph-point:focus-visible {
  stroke-width: 4;
  outline: none;
}

.line-graph-point.is-connected {
  fill: var(--purple);
}

.line-graph-point.is-shake {
  animation: nlGraphPointShake 0.3s ease;
}

@keyframes nlGraphPointShake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .line-graph-point.is-shake {
    animation: none;
  }
}

.graph-toggle-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.graph-toggle-button,
.hide-counters-button {
  padding: 10px 16px;
  background: white;
  border: 2px solid var(--charcoal);
  border-radius: 14px;
  box-shadow: 0 3px 0 var(--charcoal);
  --color: var(--text);
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
  z-index: 1;
}

.graph-toggle-button:hover:not(:disabled),
.graph-toggle-button:focus-visible:not(:disabled),
.hide-counters-button:hover:not(:disabled),
.hide-counters-button:focus-visible:not(:disabled) {
  background: var(--soft-blue);
  outline: none;
}

.graph-toggle-button:active:not(:disabled),
.hide-counters-button:active:not(:disabled) {
  box-shadow: 0 1px 0 var(--charcoal);
  transform: translateY(2px);
}

.graph-toggle-button:disabled,
.hide-counters-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.hide-counters-button.is-active {
  background: var(--soft-blue);
  border-color: var(--purple);
  box-shadow: 0 3px 0 var(--purple);
}

.stack-unit {
  position: relative;
  width: var(--cylinder-diameter);
  height: var(--cylinder-height);
  opacity: 0;
  animation: nlBarStackSegmentRise 0.3s ease-out forwards;
}

.cylinder {
  --colour: white;

  position: absolute;
  left: 50%;
  top: 50%;

  width: var(--cylinder-diameter);
  height: var(--cylinder-height);

  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--colour) 20%, transparent) 0%,
    var(--colour) 35%,
    var(--colour) 80%,
    rgba(0, 0, 0, 0.8) 100%
  );

  box-sizing: border-box;
  border: 2px solid var(--charcoal);
  border-radius: 3px;
  transform: translate(-50%, -50%);
}

.bar-stack-label {
  width: fit-content;
  text-align: center;
  font-size: 0.82rem;
  font-weight: 700;
  transition: top 0.7s ease;
}

.bar-stack-label span {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-weight: 500;
  font-size: 0.76rem;
}

@keyframes nlBarStackSegmentRise {
  from {
    opacity: 0;
    translate: 0 8px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stack-unit {
    animation: none;
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .bar-stack-row {
    gap: 16px;
  }

  .bar-stack-label {
    width: 60px;
  }
}

/* =================================================================
   NUMBER LINE ACTIVITY - COMPACT INTEGRATED LAYOUT
   Keeps the original activity logic/visual language, but uses one
   species picker and aligns the 5 distance points with the 5 graph
   columns beneath them.
   ================================================================= */

.number-line-workspace .line-frame {
  align-items: flex-start;
}

.number-line-workspace .line-panel-box {
  grid-template-columns: minmax(120px, 170px) minmax(0, 1fr);
  grid-template-rows: auto auto auto;
  gap: 14px 18px;
  width: 100%;
  max-width: 920px;
}

/* The same three buttons control both searching and graphing. */
.number-line-workspace #number-line-animal-buttons {
  grid-column: 1;
  grid-row: 1 / 4;
  align-self: start;
  padding-top: 2px;
}

.number-line-workspace #number-line-animal-buttons .species-select-button {
  width: clamp(68px, 7vw, 84px);
  height: clamp(68px, 7vw, 84px);
  padding: 6px;
}

.number-line-workspace #number-line-animal-buttons .species-select-button-wrap {
  gap: 6px;
}

.number-line-workspace
  #number-line-animal-buttons
  .species-select-button-wrap
  span {
  max-width: 135px;
  font-size: 0.86rem;
  line-height: 1.2;
}

/* The number-line track uses the full right-column width. The 10/30/50/70/90
   point positions therefore match the centres of five equal graph columns. */
.number-line-workspace .line-stage {
  grid-column: 2;
  grid-row: 2;
  width: 100%;
  padding-inline: 0;
}

.number-line-workspace .line-track {
  width: 100%;
}

/* Step 2 stays directly under the walking track instead of becoming a
   second full-width card with another set of animal buttons. */
.number-line-workspace .number-line-inline-results {
  grid-column: 2;
  grid-row: 3;
  width: 100%;
  min-width: 0;
  margin-top: 2px;
  padding-top: 14px;
  border-top: 2px dashed rgba(48, 51, 47, 0.35);
}

.number-line-results-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.number-line-results-heading .challenge-step-label {
  flex: 0 0 auto;
  margin: 0;
}

.number-line-results-heading p {
  margin: 0;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.35;
  text-align: right;
}

.number-line-workspace .graph-area,
.number-line-workspace .bar-stack-chart {
  width: 100%;
}

.number-line-workspace .bar-stack-chart {
  position: relative;
  max-width: none;
}

.number-line-workspace .bar-stack-row {
  width: 100%;
  gap: 0;
}

/* Keep the y-axis out of the flex layout so switching to line-graph mode
   does not shift the five x positions sideways. */
.number-line-workspace .y-axis {
  position: absolute;
  top: 0;
  left: -42px;
  z-index: 4;
  width: 38px;
  margin-right: 0;
  opacity: 0;
  pointer-events: none;
}

.number-line-workspace .bar-stack-chart.is-graph-mode .y-axis {
  width: 38px;
  margin-right: 0;
  opacity: 1;
}

/* Visually connect the person's current distance with the matching count. */
.number-line-workspace .stack-group {
  border-radius: 10px;
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.number-line-workspace .stack-group.is-current-distance {
  background: rgba(255, 240, 168, 0.58);
  box-shadow: inset 0 0 0 2px rgba(255, 205, 29, 0.7);
}

.number-line-workspace .bar-stack-row .stack-placeholder {
  width: 100%;
  padding: 26px 10px;
}

@media (max-width: 900px) {
  .number-line-workspace .line-panel-box {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto auto auto;
    gap: 12px;
  }

  .number-line-workspace #number-line-animal-buttons {
    grid-column: 1;
    grid-row: 1;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: center;
    padding-top: 0;
  }

  .number-line-workspace .line-stage {
    grid-column: 1;
    grid-row: 3;
  }

  .number-line-workspace .number-line-inline-results {
    grid-column: 1;
    grid-row: 4;
  }

  .number-line-results-heading {
    display: block;
  }

  .number-line-results-heading p {
    margin-top: 7px;
    text-align: left;
  }

  .number-line-workspace .y-axis {
    left: 0;
  }
}

/* =================================================================
   NUMBER LINE ACTIVITY - V3 POLISH
   Clear empty/reset state, a simple reveal-points -> connect-points
   flow, more breathing room around controls, and better alignment of
   the species picker while a quadrat is open.
   ================================================================= */

/* The empty/reset state is a prompt, not a half-built graph. */
.number-line-workspace .bar-stack-chart.is-empty .bar-stack-row::before {
  display: none;
}

.number-line-workspace .bar-stack-chart.is-empty {
  min-height: 58px;
}

/* Step 3 appears only after every animal of the selected species has
   been found, so students do not see a disabled graph button early. */
.number-line-workspace .graph-build-prompt {
  width: min(680px, 100%);
  margin: 20px auto 4px;
  padding: 14px 16px;
  background: var(--soft-blue);
  border: 2px solid var(--charcoal);
  border-radius: 16px;
  text-align: center;
}

.number-line-workspace .graph-build-prompt[hidden] {
  display: none !important;
}

.number-line-workspace .graph-build-prompt .challenge-step-label {
  margin-bottom: 8px;
}

.number-line-workspace .graph-build-instruction {
  margin: 0;
  color: var(--text);
  line-height: 1.45;
}

.number-line-workspace .graph-build-prompt .graph-toggle-row {
  margin-top: 12px;
}

/* Only offered once a student has checked every quadrat and spent long
   enough searching without finding every animal of the selected type. */
.number-line-workspace .find-all-prompt {
  width: min(680px, 100%);
  margin: 20px auto 4px;
  padding: 14px 16px;
  background: var(--soft-yellow);
  border: 2px solid var(--charcoal);
  border-radius: 16px;
  text-align: center;
}

.number-line-workspace .find-all-prompt[hidden] {
  display: none !important;
}

.number-line-workspace .find-all-prompt .challenge-step-label {
  margin-bottom: 8px;
}

.number-line-workspace .find-all-instruction {
  margin: 0;
  color: var(--text);
  line-height: 1.45;
}

.number-line-workspace .find-all-prompt .graph-toggle-row {
  margin-top: 12px;
}

/* Give the graph controls their own space instead of visually merging
   with the reset control below the activity. */
.number-line-workspace .number-line-inline-results {
  padding-bottom: 10px;
}

.number-line-workspace .instruction-card-actions {
  margin-top: 28px;
}

/* Make the next point visually obvious during the connect-the-points
   step. The JS also rejects out-of-order clicks with a short shake. */
.number-line-workspace .line-graph-point.is-next:not(.is-connected) {
  fill: var(--soft-yellow);
  stroke-width: 5;
  filter: drop-shadow(0 0 3px var(--yellow));
}

/* While a quadrat is open, centre the animal selector beside it rather
   than leaving it pinned to the panel's top. */
@media (min-width: 901px) {
  .number-line-workspace
    .line-panel-box:has(.stage-panel)
    #number-line-animal-buttons {
    grid-row: 1;
    align-self: center;
  }
}
</style>
