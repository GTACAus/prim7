<script setup>
/*
  Lesson 5 Part A spotlighting survey of Site 1.
    1. "Wait until night" darkens the forest photo; the pointer becomes a torch.
    2. Clicking a hidden animal marks it found and adds it to that animal's
       counter (clicking again un-marks it).
    3. "Check my count" compares each counter with the real number hiding.
       When every count is right the photo returns to day and the counts can
       be shown as stacked counters or laid flat in lines (like a bar graph).

    <SpotlightSurvey ref="survey" name="spotlight-survey" />

  Complete (and exposes countsCorrect) once every count is right. Night, the
  found animals, the check and the stack view are saved through <Activity :state>.
*/
import { computed, nextTick, onMounted, ref } from "vue";
import Activity from "../activities/Activity.vue";
import ContentBox from "../ContentBox.vue";
import Button from "../Button.vue";

const IMG = "../images/lesson5/";

// Hidden animals, positioned over the forest photo.
const hotspots = [
  {
    animal: "Powerful Owl",
    src: "powerful_owl_1.png",
    style: "left: 76%; top: 18%; width: 5%;",
  },
  {
    animal: "Leadbeater's Possum",
    src: "leadbeaters_possum_1.png",
    style: "left: 55%; top: 10%; width: 7%;",
    imgStyle: "transform: scaleX(-1)",
  },
  {
    animal: "Leadbeater's Possum",
    src: "leadbeaters_possum_2.png",
    style: "left: 50.5%; top: 14%; width: 4%;",
  },
  {
    animal: "Leadbeater's Possum",
    src: "leadbeaters_possum_3.png",
    style: "left: 20%; top: 16%; width: 6.5%;",
  },
  {
    animal: "Leadbeater's Possum",
    src: "leadbeaters_possum_4.png",
    style: "left: 26%; top: 14%; width: 4.5%;",
  },
  {
    animal: "Leadbeater's Possum",
    src: "leadbeaters_possum_5.png",
    style: "left: 43%; top: 28%; width: 6%; transform: rotate(-90deg);",
  },
  {
    animal: "Yellow Bellied Glider",
    src: "YBGlider_2.png",
    style: "left: 12%; top: 11%; width: 7%;",
    imgStyle: "transform: scaleX(-1)",
  },
  {
    animal: "Yellow Bellied Glider",
    src: "YBGlider_3.png",
    style: "left: 4%; top: 25%; width: 7%;",
  },
  {
    animal: "Ringtail Possum",
    src: "ringtail_1.png",
    style: "left: 84%; top: 40%; width: 5%; transform: scaleX(-1);",
  },
  {
    animal: "Ringtail Possum",
    src: "ringtail_2.png",
    style: "left: 78%; top: 33%; width: 8%;",
  },
  {
    animal: "Ringtail Possum",
    src: "ringtail_3.png",
    style: "left: 83%; top: 0%; width: 6%; transform: scaleX(-1);",
  },
].map((h) => ({ ...h, src: IMG + h.src }));

// The overlay that colours a found animal is masked to that animal's own sprite.
function overlayStyle(h) {
  const mask = `url("${h.src}")`;
  return {
    maskImage: mask,
    webkitMaskImage: mask,
    transform: h.imgStyle?.replace("transform: ", ""),
  };
}

// One counter per animal type (in the order they appear), plus feral deer,
// which isn't hiding at Site 1 (zero is still data).
const counters = [
  ...new Map(
    hotspots.map((h) => [h.animal, { type: h.animal, src: h.src }]),
  ).values(),
  { type: "Feral Deer", src: IMG + "male_deer_1.png" },
].map((c) => ({
  ...c,
  actual: hotspots.filter((h) => h.animal === c.type).length,
}));

/* ---------- saved state ---------- */

const night = ref(false);
const found = ref([]); // hotspot indexes
const results = ref(null); // { type: correct } from the last check, cleared by a change
const stackMode = ref("bar");
const state = { night, found, results, stackMode };

const counts = computed(() =>
  Object.fromEntries(
    counters.map((c) => [
      c.type,
      found.value.filter((i) => hotspots[i].animal === c.type).length,
    ]),
  ),
);
const countsCorrect = computed(
  () => !!results.value && counters.every((c) => results.value[c.type]),
);

/* ---------- torch ---------- */

const stage = ref(null);
const spot = ref({ x: -50, y: -50 });

function moveTorch(clientX, clientY) {
  const rect = stage.value.getBoundingClientRect();
  spot.value = {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
  };
}

function onTouch(event) {
  const touch = event.touches[0];
  if (!touch) return;
  moveTorch(touch.clientX, touch.clientY);
  event.preventDefault();
}

/* ---------- searching and counting ---------- */

function toggleFound(index) {
  if (countsCorrect.value) return;
  found.value = found.value.includes(index)
    ? found.value.filter((i) => i !== index)
    : [...found.value, index];
  results.value = null;
}

const intro = ref(null);

async function checkCount() {
  results.value = Object.fromEntries(
    counters.map((c) => [c.type, counts.value[c.type] === c.actual]),
  );
  if (countsCorrect.value) {
    night.value = false;
    stackMode.value = "bar";
    await nextTick();
    intro.value?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

const feedback = computed(() => {
  if (!results.value) {
    return {
      variant: "",
      title: "Use the torch to search first.",
      text: " Set each counter to how many of that animal you found hiding in the photo.",
    };
  }
  if (countsCorrect.value) {
    return {
      variant: "success",
      title: "All counts match!",
      text: " You found and counted every animal correctly.",
    };
  }
  const wrong = counters.find((c) => !results.value[c.type]);
  return {
    variant: "try-again",
    title: wrong.type + " needs another look.",
    text: " Move the torch around the whole photo, then adjust the counter to match what you found.",
  };
});

// The counter dots use each animal's colour from the spotlight styles below.
const colours = ref({});
onMounted(() => {
  const result = {};
  for (const c of counters) {
    const el = stage.value?.querySelector(
      `.animal-hotspot[data-animal="${c.type}"]`,
    );
    const colour =
      el && getComputedStyle(el).getPropertyValue("--animal-colour").trim();
    result[c.type] = colour || "var(--orange)";
  }
  colours.value = result;
});

/* ---------- stacked counters ---------- */

const PALETTE = [
  "var(--yellow)",
  "var(--mint)",
  "var(--blue)",
  "var(--lavender)",
  "var(--green)",
  "var(--purple)",
];
const STRIPS = 12;
const DIAMETER = 46;
const HEIGHT = 7;
const RADIUS = DIAMETER / 2;
const STRIP_WIDTH = ((2 * Math.PI * RADIUS) / STRIPS) * 1.12; // slight overlap hides gaps

const strips = Array.from({ length: STRIPS }, (_, i) => {
  const angle = (360 / STRIPS) * i;
  return {
    width: STRIP_WIDTH + "px",
    height: HEIGHT + "px",
    marginLeft: -(STRIP_WIDTH / 2) + "px",
    transform: `rotateY(${angle}deg) translateZ(${RADIUS}px)`,
    filter: `brightness(${0.72 + 0.28 * Math.max(0, Math.cos((angle * Math.PI) / 180))})`,
  };
});

const unitStyle = {
  "--cylinder-diameter": DIAMETER + "px",
  "--cylinder-height": HEIGHT + "px",
};

function reset() {
  night.value = false;
  found.value = [];
  results.value = null;
  stackMode.value = "bar";
}

defineExpose({ countsCorrect, reset });
</script>

<template>
  <Activity :complete="countsCorrect" :state="state" @reset="reset">
    <div class="challenge-spotlight-game noselect">
      <div class="wrap">
        <div
          id="stage"
          ref="stage"
          class="stage"
          :class="{ 'is-night': night }"
          :style="{ '--x': spot.x + '%', '--y': spot.y + '%', '--r': '140px' }"
          @mousemove="moveTorch($event.clientX, $event.clientY)"
          @mouseleave="spot = { x: -50, y: -50 }"
          @touchmove="onTouch"
        >
          <img
            id="photoDay"
            :src="IMG + 'habitat_day.png'"
            alt="Day Time Habitat"
          />
          <img
            id="photo"
            :src="IMG + 'habitat_night.png'"
            alt="Night Time Habitat"
          />
          <div id="animalLayer" class="animal-layer">
            <button
              v-for="(h, i) in hotspots"
              :key="i"
              type="button"
              class="animal-hotspot"
              :class="{ found: found.includes(i) }"
              :data-animal="h.animal"
              :style="h.style"
              :aria-label="h.animal"
              @click="toggleFound(i)"
            >
              <img :src="h.src" :alt="h.animal" :style="h.imgStyle" />
              <span
                class="animal-overlay"
                aria-hidden="true"
                :style="overlayStyle(h)"
              ></span>
            </button>
          </div>
          <div id="glow" class="glow"></div>
          <div class="moon-light"></div>
          <div v-if="!countsCorrect" id="nightPrompt" class="night-prompt">
            <Button
              id="waitForNightButton"
              :disabled="night"
              symbol="🌙"
              @click="night = true"
              >Wait until night</Button
            >
          </div>
        </div>
      </div>
    </div>

    <template v-if="night || countsCorrect">
      <div
        id="animalCounterPanel"
        class="animal-counter-panel pop-in"
        aria-label="Count the hidden animals"
      >
        <div
          v-for="c in counters"
          :key="c.type"
          class="animal-counter"
          :class="
            results
              ? results[c.type]
                ? 'counter-correct'
                : 'counter-incorrect'
              : null
          "
        >
          <p class="animal-counter-label">{{ c.type }}</p>
          <div class="counter-circle" aria-hidden="true">
            <img class="counter-image" :src="c.src" :alt="c.type" />
            <span
              v-for="n in counts[c.type]"
              :key="n"
              class="counter-dot"
              :style="{ backgroundColor: colours[c.type] }"
            ></span>
          </div>
          <p class="counter-value-text">{{ counts[c.type] }}</p>
        </div>
      </div>

      <div class="reset-button-container">
        <Button @click="checkCount"> Check my count </Button>
      </div>
    </template>

    <div
      class="challenge-feedback"
      :class="feedback.variant"
      role="status"
      aria-live="polite"
    >
      <strong>{{ feedback.title }}</strong
      >{{ feedback.text }}
    </div>

    <template v-if="countsCorrect">
      <ContentBox ref="intro">
        <span class="challenge-step-label">Visualise your data</span>
        <p>
          Look at the counters that show how many of each animal you found. Now
          compare three different ways to visualise or view your data:
        </p>
        <ul>
          <li>Look at the counters in the circles first.</li>
          <li>Click <strong>Show counters stacked up</strong>.</li>
          <li>Click <strong>Show counters laid flat in lines</strong>.</li>
        </ul>
      </ContentBox>

      <div class="stack-buttons-row">
        <Button
          class="stack-toggle-button"
          :class="{ 'stack-active': stackMode === 'bar' }"
          @click="stackMode = 'bar'"
        >
          Show Counters Stacked Up
        </Button>
        <Button
          class="stack-toggle-button"
          :class="{ 'stack-active': stackMode === 'circle' }"
          @click="stackMode = 'circle'"
        >
          Show Counters Laid Flat in Lines
        </Button>
      </div>

      <div class="animal-stack-visual">
        <p class="stack-visual-title">Each counter is one animal you found</p>
        <div
          class="bar-stack-row"
          :class="{ 'circle-mode': stackMode === 'circle' }"
        >
          <div v-for="(c, g) in counters" :key="c.type" class="stack-group">
            <div class="bar-stack-column">
              <div
                v-for="n in counts[c.type]"
                :key="n"
                class="stack-unit"
                :style="{ ...unitStyle, animationDelay: (n - 1) * 0.05 + 's' }"
              >
                <div class="cylinder">
                  <div
                    v-for="(strip, s) in strips"
                    :key="s"
                    class="cylinder-strip"
                    :style="{
                      ...strip,
                      backgroundColor: PALETTE[g % PALETTE.length],
                    }"
                  ></div>
                  <div
                    class="cylinder-top"
                    :style="{ backgroundColor: PALETTE[g % PALETTE.length] }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="bar-stack-label">
              {{ c.type }}<span>{{ counts[c.type] }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Activity>
</template>

<style>
/* Moved from styles/lesson4_styles/lesson4.css. Not scoped: some rules style child components' content. */

.challenge-spotlight-game {
  margin: 0 0 20px;
  width: 100%;
  /* height: 100%; */
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--paper);
}

/* ---------- Spotlight game (moved from styles/lesson4_styles/spotlight-game.css) ---------- */

.wrap {
  width: 100%;
  background: black;
  text-align: center;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid var(--charcoal);
}
.stage {
  position: relative;
  aspect-ratio: 1920 / 1080;
  cursor: none; 

  --moon-x: 70%;
  --moon-y: 11%;
  --moon-r: calc(100% * 0.45);

  --x: 50%;
  --y: 50%;
  --r: 300px;

  --torch-mask: radial-gradient(
    circle var(--r) at var(--x) var(--y),
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 0.9) 40%,
    rgba(0, 0, 0, 0.4) 70%,
    rgba(0, 0, 0, 0.05) 100%
  );

  --moon-mask: radial-gradient(
    ellipse 30% 75% at var(--moon-x) var(--moon-y),
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 0.2) 20%,
    rgba(0, 0, 0, 0.05) 50%,
    rgba(0, 0, 0, 0) 100%
  );
}

.stage img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 1.1s ease, mask-image 0.03s linear, -webkit-mask-image 0.03s linear;
}

/* Day image: visible by default, no torch mask needed */
#photoDay {
  opacity: 1;
}

/* Night image: hidden by default, torch-masked once night starts */
#photo {
  opacity: 0;

  -webkit-mask-image:
    var(--torch-mask),
    var(--moon-mask);

  mask-image:
    var(--torch-mask),
    var(--moon-mask);

  -webkit-mask-composite: source-over;
  mask-composite: add;
}

.stage.is-night #photoDay {
  opacity: 0;
}
.stage.is-night #photo {
  opacity: 1;
}

/* ---------- Hidden animals layered on the forest photo ---------- */
/* Same reveal mask as the photo, applied to the whole layer so every
   animal in it is only visible where the torch is shining. Add more
   .animal-hotspot buttons inside #animalLayer for more animals. */
/* Animal layer: only visible (and clickable) once night has fallen */
.animal-layer {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 1.1s ease, mask-image 0.03s linear, -webkit-mask-image 0.03s linear;
  -webkit-mask-image: var(--torch-mask);
  mask-image: var(--torch-mask);
}

.stage.is-night .animal-layer {
  opacity: 1;
}
.stage:not(.is-night) .animal-hotspot {
  pointer-events: none; /* can't "find" animals hiding in daylight */
}
/* "Wait until night" prompt */
.night-prompt {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: opacity 0.5s ease;
}
#waitForNightButton {
  background: rgb(0, 0, 90);
  border: 2px solid var(--paper);
  box-shadow: 0 3px 0 var(--paper);
}
#waitForNightButton:hover {
  background: rgb(0, 0, 119);
  box-shadow: 0 5px var(--paper);
}
#waitForNightButton:active {
  box-shadow: 0 1px var(--paper);
}
.stage.is-night .night-prompt {
  opacity: 0;
  pointer-events: none;
}
.animal-hotspot {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 0;
  border: none;
  background: none;
  line-height: 0;
  cursor: pointer;
  pointer-events: auto;
}

/* At night, unfound animals periodically appear/disappear */
#stage.is-night .animal-hotspot:not(.found) {
  animation: animal-peek 6s ease-in-out infinite;
}

/* Stagger the animations so animals don't all fade together */
#stage.is-night .animal-hotspot:nth-child(2n):not(.found) {
  animation-delay: -2s;
}

#stage.is-night .animal-hotspot:nth-child(3n):not(.found) {
  animation-delay: -4s;
}

#stage.is-night .animal-hotspot:nth-child(5n):not(.found) {
  animation-delay: -1s;
}

/* Once found, keep the animal visible */
.animal-hotspot.found {
  animation: none;
  opacity: 1;
}

@keyframes animal-peek {
  /* Visible for roughly half the cycle */
  0%,
  45% {
    opacity: 1;
  }

  /* Quick fade out */
  50% {
    opacity: 0;
  }

  /* Invisible for roughly half the cycle */
  50%,
  95% {
    opacity: 0;
  }

  /* Quick fade back in */
  100% {
    opacity: 1;
  }
}
.animal-hotspot img {
  /* opt back out of the full-bleed ".stage img" positioning (that rule
     targets the background photo) so this small image sizes itself
     from the button instead of stretching to fill the whole stage */
  position: static;
  inset: auto;
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  mask-image: none;
  -webkit-mask-image: none;
  filter: none;
  transition: transform 0.15s ease, filter 0.3s ease;
}
.animal-hotspot .animal-overlay {
  position: absolute;
  inset: -5%;
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  mix-blend-mode: color; /* or multiply/hue */
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.animal-hotspot:hover:not(.found) img {
  transform: scale(1.08);
  filter:
    drop-shadow(1px 0 0 white)
    drop-shadow(-1px 0 0 white)
    drop-shadow(0 1px 0 white)
    drop-shadow(0 -1px 0 white);

}
.animal-hotspot:focus-visible {
  outline: 3px solid #ffd166;
  outline-offset: 4px;
  border-radius: 6px;
}
/* red overlay shown once the student clicks the animal: a red silhouette
   masked to the owl's own shape, blended with mix-blend-mode so the
   owl's original shading still shows through underneath the tint */
.animal-hotspot.found .animal-overlay {
  opacity: 1;
}

/* One source of truth per animal type */
.animal-hotspot[data-animal="Powerful Owl"] {
  --animal-colour: color-mix(in srgb, var(--yellow) 85%, transparent);
}
.animal-hotspot[data-animal="Yellow Bellied Glider"] {
  --animal-colour: color-mix(in srgb, var(--blue) 85%, transparent);
}
.animal-hotspot[data-animal="Leadbeater's Possum"] {
  --animal-colour: color-mix(in srgb, var(--mint) 85%, transparent);
}
.animal-hotspot[data-animal="Ringtail Possum"] {
  --animal-colour: color-mix(in srgb, var(--lavender) 85%, transparent);
}
.animal-hotspot[data-animal="Feral Cat"] {
  --animal-colour: color-mix(in srgb, var(--green) 85%, transparent);
}

/* Overlays just reference the variable — no repeated color-mix() per type */
.animal-hotspot.found .animal-overlay {
  background: var(--animal-colour);
}

/* mask-image for each overlay is no longer set here: it's assigned per
   hotspot in spotlight_game.js from that hotspot's own <img src>, so it
   automatically matches whichever sprite is used (supports any number of
   different images per animal type instead of one shared silhouette). */

/* soft warm glow that rides along with the torch circle, drawn above the image */
.glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle var(--r) at var(--x) var(--y),
              rgba(255, 220, 150, 0.45) 0%,
              rgba(255, 180, 90, 0.2) 45%,
              rgba(0,0,0,0) 75%);
  mix-blend-mode: screen;

  /* Hidden during the day */
  opacity: 0;
  transition: opacity 1.1s ease;
}

.stage.is-night .glow {
  opacity: 1;
}

.hint {
  margin-top: 14px;
  font-size: 0.85rem;
  color: #667788;
}

/* ---------- Animal counters ---------- */
.animal-counter-panel {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 18px;
  margin-top: 20px;
}

.animal-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 165px;
  padding: 16px 14px;
  background: white;
  border: 2px solid var(--charcoal);
  border-radius: 16px;
  box-shadow: 0 3px 0 rgba(48, 51, 47, 0.2);
  transition: background 0.25s ease, border-color 0.25s ease;
}

.animal-counter-label {
  margin: 0 0 10px;
  font-weight: 700;
  text-align: center;
  font-size: 0.86rem;
}

.counter-circle {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  justify-content: center;
  gap: 4px;
  width: 112px;
  height: 112px;
  padding: 8px;
  background: var(--paper);
  border: 3px solid var(--charcoal);
  border-radius: 50%;
  overflow: hidden;
}

.counter-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.5;
}

.counter-dot {
  position: relative;
  z-index: 1;
  width: 18px;
  height: 18px;
  background: var(--orange);
  border: 2px solid var(--charcoal);
  border-radius: 50%;
  animation: graphPointPop 0.3s ease-out;
}

.counter-value-text {
  margin: 10px 0 0;
  font-weight: 700;
  font-size: 1.35rem;
}

.animal-counter.counter-correct {
  background: var(--soft-green);
  border-color: var(--green);
}

.animal-counter.counter-correct .counter-circle {
  border-color: var(--green);
}

.animal-counter.counter-incorrect {
  background: var(--soft-orange);
  border-color: var(--orange);
  animation: choice-buzz 0.28s ease;
}

@media (max-width: 520px) {
  .animal-counter {
    width: 120px;
  }
  .counter-circle {
    width: 72px;
    height: 72px;
  }
}

/* ==================================================
   STACK VISUALISATION (shape-morphing + rotation)
   Built once when the animal count is confirmed
   correct. The two buttons toggle a single class that
   morphs the same elements between a vertical bar
   chart (rectangles, baseline at bottom) and a
   rotated horizontal layout (circles, baseline at
   left) — nothing is rebuilt between the two states.
   ================================================== */

.stack-buttons-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 4px;
}

.stack-toggle-button {
  flex: 1 1 180px;
  background: var(--soft-purple);
  color: var(--text);
}

.stack-toggle-button.stack-active {
  background: var(--green);
  color: white;
}

.animal-stack-visual {
  margin-top: 18px;
  padding: 20px 16px 16px;
  background: white;
  border: 2px solid var(--charcoal);
  border-radius: 18px;
  box-shadow: var(--shadow-small);
}

.stack-visual-title {
  margin: 0 0 16px;
  text-align: center;
  font-weight: 700;
  color: var(--text);
}

/* ---- Outer row: holds one .stack-group per animal type ---- */
.bar-stack-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  gap: 28px;
  min-height: 220px;
  padding: 0 10px;
  border-bottom: 3px solid var(--charcoal);
  transition:
    flex-direction 0s 0.2s,
    border 0.4s ease,
    padding 0.4s ease,
    min-height 0.4s ease;
}

.bar-stack-row.circle-mode {
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  gap: 16px;
  min-height: 0;
  padding: 14px 10px 14px 18px;
}

/* ---- One group = column/row of units + its label ---- */
.stack-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: flex-direction 0s 0.2s;
}

.bar-stack-row.circle-mode .stack-group {
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

/* ---- Individual unit: cylinder <-> circle ---- */
.bar-stack-column {
  display: flex;
  flex-direction: column;
  align-items: center;

  perspective: 700px;
}

/* Container for each individual cylinder */
.stack-unit {
  position: relative;

  width: var(--cylinder-diameter);
  height: var(--cylinder-height);

  opacity: 0;
  animation: barStackSegmentRise 0.3s ease-out forwards;

  transition:
    height 0.8s cubic-bezier(0.22, 0.8, 0.25, 1);
}


/* The complete 3D cylinder */
.cylinder {
  position: absolute;

  left: 50%;
  top: 50%;

  width: 46px;
  height: 22px;

  transform-style: preserve-3d;

  transform:
    translate(-50%, -50%)
    rotateX(0deg);

  transition:
    transform 0.8s cubic-bezier(0.22, 0.8, 0.25, 1);
}


/* Each small strip forms part of the curved cylinder wall */
.cylinder-strip {
  position: absolute;

  left: 50%;
  top: 50%;

  margin-top: -11px;

  box-sizing: border-box;

  border-top: 2px solid var(--charcoal);
  border-bottom: 2px solid var(--charcoal);

  transform-style: preserve-3d;
  backface-visibility: visible;
}

.cylinder-top {
  position: absolute;

  left: 50%;
  top: 50%;

  width: var(--cylinder-diameter);
  height: var(--cylinder-diameter);

  margin-left: calc(var(--cylinder-diameter) / -2);
  margin-top: calc(var(--cylinder-diameter) / -2);

  box-sizing: border-box;

  border: 2px solid var(--charcoal);
  border-radius: 50%;

  /*
    Cylinder runs along the Y axis, so the cap
    needs to lie in the X/Z plane.
  */
  transform:
    translateY(-11px)
    rotateX(90deg);

  transform-style: preserve-3d;

  background:
    radial-gradient(
      circle at 35% 30%,
      rgba(255,255,255,0.45),
      rgba(255,255,255,0.08) 45%,
      rgba(0,0,0,0.12)
    );

  backface-visibility: visible;
}

.bar-stack-row.circle-mode .cylinder {
  transform:
    translate(-50%, -50%)
    rotateX(-90deg);
}

.bar-stack-row.circle-mode .stack-unit {
  height: var(--cylinder-diameter);
}

@media (prefers-reduced-motion: reduce) {
  .line-point.visible {
    animation: none;
  }
  .stack-unit {
    transition: none;
  }
}

@keyframes barStackSegmentRise {
  from {
    opacity: 0;
    translate: 0 8px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
}

/* ---- Label under (bar mode) / beside (circle mode) each group ---- */
.bar-stack-label {
  width: fit-content;
  text-align: center;
  font-size: 0.82rem;
  font-weight: 700;
  transition: width 0.4s ease, text-align 0s 0.2s;
}

.bar-stack-row.circle-mode .bar-stack-label {
  width: 100%;
}

.bar-stack-label span {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-weight: 500;
  font-size: 0.76rem;
}

@media (max-width: 520px) {
  .bar-stack-row {
    gap: 16px;
  }
  .bar-stack-label {
    width: 36px;
  }
  .bar-stack-row.circle-mode .bar-stack-label {
    width: auto;
  }
}
</style>
