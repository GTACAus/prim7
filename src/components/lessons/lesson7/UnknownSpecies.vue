<script setup>
/*
  Mission 4 finale: sonar -> tracking -> observe -> capture -> drawing.
    sonar     pick one of five contacts; an animal is chosen (once - it
              stays assigned through reloads and resets)
    tracking  a short lock-on
    observe   the animal's gif plays for a few seconds; capture it before
              it swims away, or go back to the sonar for another animal
    capture   "writing the frame..."
    drawing   the camera fails, so students draw it and tick when finished

    <UnknownSpecies :m5="state.mission5" @find-another="..." />

  m5 is the saved mission-5 state (reactive); this component updates it.
*/
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import {
  MISSION5_OBSERVE_SECONDS,
  gifSrc,
  mission5SpeciesPool,
  staticSrc,
} from "./expedition.js";

const props = defineProps({
  m5: { type: Object, required: true },
});
const emit = defineEmits(["find-another"]);

const SONAR_SWEEP_SECONDS = 5;
const SWIM_AWAY_SECONDS = 1; // --swim-away-duration in the styles below
const TRACKING_MS = 1150;
const CAPTURE_MS = 900;

const species = computed(
  () => mission5SpeciesPool.find((s) => s.id === props.m5.speciesId) ?? null,
);

/* ---------- sonar ---------- */

const CONTACTS = ["A", "B", "C", "D", "E"];
// safe spots inside the radar, shuffled rather than fully random so the
// dots never overlap badly or sit outside the circle
const SAFE_POSITIONS = [
  [26, 28], [43, 20], [67, 27], [77, 43], [73, 67],
  [55, 77], [34, 74], [22, 55], [40, 42], [62, 52],
];
const positions = ref([
  [28, 37], [69, 26], [76, 67], [41, 76], [55, 49],
]);
const sonarActive = ref(true);

// each contact lights up as the sweep (clockwise from the top) passes it
function revealDelay([x, y]) {
  let angle = Math.atan2(x - 50, -(y - 50)) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  return ((angle / 360) * SONAR_SWEEP_SECONDS).toFixed(3) + "s";
}

async function restartSweep() {
  sonarActive.value = false;
  await nextTick();
  requestAnimationFrame(() => (sonarActive.value = true));
}

function randomiseContacts() {
  const shuffled = [...SAFE_POSITIONS].sort(() => Math.random() - 0.5);
  positions.value = CONTACTS.map((_, i) => shuffled[i]);
  restartSweep();
}

/* ---------- choosing the animal ---------- */

function chooseSpeciesOnce() {
  if (species.value) return;
  // avoid animals already watched swimming away, unless none are left
  let candidates = mission5SpeciesPool.filter(
    (s) => !props.m5.skippedSpeciesIds.includes(s.id),
  );
  if (!candidates.length) {
    props.m5.skippedSpeciesIds = [];
    candidates = mission5SpeciesPool;
  }
  props.m5.speciesId =
    candidates[Math.floor(Math.random() * candidates.length)].id;
  props.m5.optionIds = [];
}

let trackingTimer = null;
function selectContact(contactId) {
  if (props.m5.phase !== "sonar") return;
  chooseSpeciesOnce();
  props.m5.contactId = contactId;
  props.m5.observeEnded = false;
  props.m5.phase = "tracking";
  randomiseContacts();
  trackingTimer = setTimeout(() => {
    if (props.m5.phase === "tracking" && props.m5.contactId === contactId)
      props.m5.phase = "observe";
  }, TRACKING_MS);
}

/* ---------- observation window ---------- */

const liveGif = ref("");
const swimming = ref(false);
let observeTimer = null;
let swimTimer = null;

function clearTimers() {
  clearTimeout(observeTimer);
  clearTimeout(swimTimer);
  observeTimer = null;
  swimTimer = null;
  swimming.value = false;
}

// restart the gif from its first frame and start the observation window
function startObservation() {
  clearTimers();
  if (!species.value) return;
  liveGif.value = gifSrc(species.value) + "?t=" + Date.now();
  observeTimer = setTimeout(endObservation, MISSION5_OBSERVE_SECONDS * 1000);
}

function endObservation() {
  observeTimer = null;
  if (props.m5.phase !== "observe") return;
  props.m5.observeEnded = true;
  swimming.value = true;
  swimTimer = setTimeout(() => {
    swimTimer = null;
    swimming.value = false;
  }, SWIM_AWAY_SECONDS * 1000);
}

watch(
  () => [props.m5.phase, props.m5.speciesId],
  ([phase]) => {
    if (phase !== "observe") {
      clearTimers();
      return;
    }
    if (!props.m5.observeEnded && observeTimer === null) startObservation();
  },
  { immediate: true },
);

const lost = computed(() => props.m5.observeEnded && !swimming.value);

function findAnother() {
  if (props.m5.phase !== "observe") return;
  clearTimers();
  if (props.m5.speciesId && !props.m5.skippedSpeciesIds.includes(props.m5.speciesId))
    props.m5.skippedSpeciesIds.push(props.m5.speciesId);
  Object.assign(props.m5, {
    speciesId: "",
    optionIds: [],
    contactId: "",
    observeEnded: false,
    phase: "sonar",
  });
  emit("find-another");
}

/* ---------- capture -> drawing ---------- */

const drawingCheck = ref(null);
let captureTimer = null;

function takePhoto() {
  if (props.m5.phase !== "observe" || props.m5.observeEnded) return;
  clearTimers();
  props.m5.phase = "capture";
  props.m5.drawingFinished = false;
  captureTimer = setTimeout(async () => {
    if (props.m5.phase !== "capture") return;
    props.m5.phase = "drawing";
    await nextTick();
    drawingCheck.value?.focus({ preventScroll: true });
  }, CAPTURE_MS);
}

onBeforeUnmount(() => {
  clearTimers();
  clearTimeout(trackingTimer);
  clearTimeout(captureTimer);
});

defineExpose({ clearTimers });
</script>

<template>
  <!-- SONAR PHASE: the CSS radar can later be swapped for artwork; the
       contacts stay clickable buttons laid over it. -->
  <div v-if="m5.phase === 'sonar'" class="m5-phase">
    <div class="m5-panel">
      <div class="m5-status-strip">
        <span><span class="m5-status-light"></span>Sonar array online</span>
        <span>Scan sector 05</span>
      </div>
      <div class="sonar-layout">
        <div
          class="sonar-radar"
          :class="{ 'sonar-active': sonarActive }"
          aria-label="Sonar display with several detected contacts"
        >
          <span class="sonar-crosshair-x" aria-hidden="true"></span>
          <span class="sonar-crosshair-y" aria-hidden="true"></span>
          <span class="sonar-sweep" aria-hidden="true"></span>
          <span class="sonar-centre" aria-hidden="true"></span>
          <button
            v-for="(contact, i) in CONTACTS"
            :key="contact"
            type="button"
            class="sonar-contact"
            :class="{ selected: m5.contactId === contact }"
            :style="{
              '--contact-x': positions[i][0] + '%',
              '--contact-y': positions[i][1] + '%',
              '--contact-reveal-delay': revealDelay(positions[i]),
            }"
            :aria-label="'Investigate sonar contact ' + contact"
            @click="selectContact(contact)"
          ></button>
        </div>
        <article class="sonar-instructions">
          <h4>Multiple contacts detected</h4>
          <p>
            The sonar cannot identify what is moving through the water. Choose
            one contact to investigate.
          </p>
          <p>
            Once a contact is acquired, that organism stays assigned to your
            expedition even if the page is refreshed or the mission is reset.
          </p>
          <div class="sonar-legend">
            <span>● Yellow pulse = possible biological contact</span>
            <span>◎ Sweep = active sonar scan</span>
          </div>
        </article>
      </div>
    </div>
  </div>

  <div v-else-if="m5.phase === 'tracking'" class="m5-phase">
    <div class="m5-panel tracking-card">
      <div class="tracking-spinner" aria-hidden="true"></div>
      <h4>Tracking selected contact...</h4>
      <p>Matching sonar movement with the live observation feed.</p>
    </div>
  </div>

  <div v-else-if="m5.phase === 'observe'" class="m5-phase">
    <div class="m5-panel">
      <div class="m5-status-strip">
        <span><span class="m5-status-light"></span>Live observation feed</span>
        <span>{{
          m5.contactId ? `Contact ${m5.contactId} acquired` : "Contact acquired"
        }}</span>
      </div>
      <div class="creature-console">
        <div class="creature-feed">
          <span class="live-badge">Live feed</span>
          <img
            :src="liveGif || null"
            :class="{ 'swim-away': swimming, gone: lost }"
            alt="Deep-sea organism selected for observation"
          />
        </div>
        <article v-if="!lost" class="camera-side-card">
          <h4>Visual contact acquired</h4>
          <p>
            Observe the organism carefully. Try to capture a photograph for the
            expedition record before it moves away.
          </p>
          <button
            type="button"
            class="expedition-button capture-button"
            :disabled="m5.observeEnded"
            @click="takePhoto"
          >
            <span>Capture image</span>
          </button>
        </article>
        <article v-else class="camera-side-card">
          <h4>Contact lost</h4>
          <p>
            The organism swam out of range before an image could be captured.
            Return to the sonar to find another animal.
          </p>
          <button
            type="button"
            class="expedition-button capture-button"
            @click="findAnother"
          >
            <span>Find another animal</span>
          </button>
        </article>
      </div>
    </div>
  </div>

  <div v-else-if="m5.phase === 'capture'" class="m5-phase">
    <div class="m5-panel tracking-card">
      <div style="font-size: 4rem" aria-hidden="true">📷</div>
      <h4>Capturing image...</h4>
      <p>Writing observation frame to the expedition record.</p>
    </div>
  </div>

  <div v-else-if="m5.phase === 'drawing'" class="m5-phase">
    <div class="drawing-mission-grid">
      <div class="creature-feed">
        <span class="image-captured-badge">Image Captured</span>
        <img
          :src="species ? staticSrc(species) : null"
          alt="Static image of the deep-sea organism for scientific drawing"
        />
      </div>
      <article class="drawing-instructions-card">
        <h4>Create the expedition record</h4>
        <p>
          Draw the organism from observation. Use the
          <strong>Science Check</strong> panel to review the same
          scientific-drawing rules.
        </p>
        <p>
          The computer is not judging your drawing. The checklist is your
          self-assessment before you complete the expedition.
        </p>
        <label class="drawing-finish-check">
          <input
            ref="drawingCheck"
            v-model="m5.drawingFinished"
            type="checkbox"
          />
          <span>I have finished my scientific drawing.</span>
        </label>
      </article>
    </div>
  </div>
</template>

<style scoped>
/* Lesson 7 (Expedition Log). Colours come from the "dark" theme in
   src/styles/themes.css (--exp-* variables). */

/* ---------- Mission 5: unknown-species finale ---------- */

.m5-phase[hidden] {
  display: none !important;
}

.m5-panel {
  margin-top: 18px;
  padding: 18px;
  border: 3px solid var(--mission-border);
  border-radius: 20px;
  background: var(--mission-bg-alt);
  box-shadow: 0 5px 0 var(--mission-shadow);
}

.m5-status-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding: 10px 12px;
  border: 2px solid var(--charcoal);
  border-radius: 12px;
  background: var(--soft-blue);
  color: var(--charcoal);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.m5-status-light {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0 4px rgba(0, 199, 122, 0.14);
  vertical-align: -1px;
}

.sonar-layout {
  display: grid;
  grid-template-columns: minmax(350px, 1.15fr) minmax(230px, 0.85fr);
  gap: 18px;
  align-items: center;
}

.sonar-radar {
  position: relative;
  width: min(520px, 100%);
  aspect-ratio: 1;
  margin: 0 auto;
  overflow: hidden;
  border: 4px solid var(--exp-cyan);
  border-radius: 50%;
  background:
    linear-gradient(rgba(57, 211, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(57, 211, 255, 0.08) 1px, transparent 1px),
    radial-gradient(circle, rgba(57, 211, 255, 0.14) 0 2px, transparent 3px),
    radial-gradient(circle at center, #073f52 0%, #04273a 48%, #021421 100%);
  background-size:
    36px 36px,
    36px 36px,
    100% 100%,
    100% 100%;
  box-shadow:
    inset 0 0 40px rgba(57, 211, 255, 0.2),
    0 0 0 5px rgba(57, 211, 255, 0.08);
}

.sonar-radar::before,
.sonar-radar::after {
  content: "";
  position: absolute;
  inset: 16.66%;
  border: 1px solid rgba(117, 221, 232, 0.38);
  border-radius: 50%;
  pointer-events: none;
}

.sonar-radar::after {
  inset: 33.33%;
}

.sonar-crosshair-x,
.sonar-crosshair-y {
  position: absolute;
  z-index: 1;
  background: rgba(117, 221, 232, 0.26);
  pointer-events: none;
}

.sonar-crosshair-x {
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
}

.sonar-crosshair-y {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
}

.sonar-sweep {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg 314deg,
    rgba(69, 244, 211, 0.03) 318deg,
    rgba(69, 244, 211, 0.36) 352deg,
    rgba(117, 221, 232, 0.75) 359deg,
    transparent 360deg
  );
  animation: sonar-sweep 3.4s linear infinite;
  pointer-events: none;
}

.sonar-centre {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 3;
  width: 10px;
  height: 10px;
  translate: -50% -50%;
  border-radius: 50%;
  background: var(--exp-cyan);
  box-shadow: 0 0 16px var(--exp-cyan);
  pointer-events: none;
}

.sonar-contact {
  position: absolute;
  left: var(--contact-x);
  top: var(--contact-y);
  z-index: 5;
  width: 28px;
  height: 28px;
  translate: -50% -50%;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.sonar-contact::before {
  content: "";
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: var(--soft-yellow);
  box-shadow:
    0 0 8px var(--yellow),
    0 0 18px rgba(255, 205, 29, 0.85);
  animation: sonar-contact-pulse 1.7s ease-in-out infinite;
  animation-delay: var(--contact-delay, 0s);
}

.sonar-contact::after {
  content: "";
  position: absolute;
  inset: 2px;
  border: 1px solid rgba(255, 240, 168, 0.5);
  border-radius: 50%;
  animation: sonar-ring-pulse 1.7s ease-out infinite;
  animation-delay: var(--contact-delay, 0s);
}

.sonar-contact:hover::before,
.sonar-contact:focus-visible::before {
  inset: 5px;
  background: white;
}

.sonar-instructions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 18px;
  border: 3px solid var(--charcoal);
  border-radius: 18px;
  background: var(--soft-blue);
  color: var(--charcoal);
}

.sonar-instructions :deep(h4) {
  margin: 0 0 8px;
  font-size: 1.15rem;
}

.sonar-instructions :deep(p) {
  margin: 0 0 12px;
  color: var(--muted);
  line-height: 1.55;
}

.sonar-legend {
  display: grid;
  gap: 8px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 2px dashed rgba(48, 51, 47, 0.26);
  color: var(--charcoal);
  font-size: 0.82rem;
  font-weight: 700;
}

/* Sonar sweep + contact reveal */
.sonar-sweep,
.sonar-contact::before,
.sonar-contact::after {
  animation: none;
}

.sonar-contact::before,
.sonar-contact::after {
  opacity: 0;
}

/* Restarted together by JS so contacts stay synchronised with the sweep */
.sonar-radar.sonar-active .sonar-sweep {
  animation: sonar-sweep 5s linear infinite;
}

.sonar-radar.sonar-active .sonar-contact::before {
  animation: sonar-contact-hit 5s linear infinite;
  animation-delay: var(--contact-reveal-delay, 0s);
}

.sonar-radar.sonar-active .sonar-contact::after {
  animation: sonar-ring-hit 5s linear infinite;
  animation-delay: var(--contact-reveal-delay, 0s);
}

.tracking-card {
  min-height: 420px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 16px;
  text-align: center;
  background:
    radial-gradient(
      circle at center,
      rgba(57, 211, 255, 0.16),
      transparent 14rem
    ),
    #031827;
  color: white;
}

.tracking-spinner {
  width: 92px;
  height: 92px;
  border: 8px solid rgba(117, 221, 232, 0.16);
  border-top-color: var(--exp-cyan);
  border-radius: 50%;
  animation: mission5-spin 0.85s linear infinite;
}

.tracking-card :deep(h4),
.tracking-card :deep(p) {
  margin: 0;
}

.tracking-card :deep(p) {
  color: var(--exp-muted);
}

.creature-console {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(240px, 0.75fr);
  gap: 18px;
  align-items: stretch;
}

.creature-feed {
  position: relative;
  min-height: 390px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 4px solid var(--exp-cyan);
  border-radius: 20px;
  background:
    radial-gradient(
      circle at 50% 36%,
      rgba(57, 211, 255, 0.18),
      transparent 12rem
    ),
    linear-gradient(180deg, #082d48, #020b14);
  box-shadow: inset 0 0 38px rgba(0, 0, 0, 0.38);
}

.creature-feed::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    180deg,
    transparent 0 5px,
    rgba(255, 255, 255, 0.025) 6px
  );
}

.creature-feed :deep(img) {
  --swim-away-duration: 1s;

  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 390px;
  object-fit: contain;
  padding: 14px;
  filter: saturate(0.92) contrast(1.04);
  animation: creature-feed-in 0.55s ease-out;
}

.live-badge,
.image-captured-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 3;
  padding: 7px 10px;
  border: 2px solid white;
  border-radius: 999px;
  background: rgba(0, 199, 122, 0.88);
  color: white;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.image-captured-badge {
  background: rgba(255, 109, 58, 0.94);
}

.camera-side-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
  border: 3px solid var(--mission-border);
  border-radius: 18px;
  background: var(--mission-bg-alt);
  color: var(--mission-text);
}

/* Observation GIF swims off to the left when the 10 second window ends */
.creature-feed img.swim-away {
  animation: creature-swim-away var(--swim-away-duration) ease-in forwards;
}

.creature-feed img.gone {
  visibility: hidden;
}

.camera-side-card :deep(h4) {
  margin: 0 0 8px;
  font-size: 1.2rem;
}

.camera-side-card :deep(p) {
  margin: 0 0 14px;
  color: var(--mission-muted);
  line-height: 1.55;
}

.capture-button {
  width: 100%;
  --background-colour: var(--blue);
  color: var(--charcoal) !important;
  font-size: 1rem;
}

.capture-button::before {
  content: "📷";
}

.drawing-mission-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(260px, 0.82fr);
  gap: 18px;
  align-items: stretch;
}

.drawing-instructions-card {
  padding: 20px;
  border: 3px solid var(--charcoal);
  border-radius: 18px;
  background: var(--soft-yellow);
  color: var(--charcoal);
}

.drawing-instructions-card :deep(h4) {
  margin: 0 0 8px;
  font-size: 1.22rem;
}

.drawing-instructions-card :deep(p) {
  margin: 0 0 12px;
  color: var(--charcoal);
  line-height: 1.55;
}

.drawing-finish-check {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: center;
  margin-top: 16px;
  padding: 13px 14px;
  border: 2px solid var(--mission-border);
  border-radius: 14px;
  background: var(--mission-bg-alt);
  color: var(--mission-text);
  font-weight: 700;
  cursor: pointer;
}
@media (max-width: 1280px) {
  .creature-feed :deep(img) {
    height: 330px;
  }
}

@media (max-width: 1280px) and (min-width: 1100px) {
  .sonar-layout {
    grid-template-columns: 1fr;
  }
}
</style>
