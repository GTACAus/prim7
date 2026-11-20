<script setup>
/*
  The quadrat photo for one distance on the number line: every animal at that
  distance is hidden in it. Only the selected species can be clicked (the rest
  are distractors); clicking one marks it found (click again to un-find it).

    <NumberLinePanel :distance="10" species="Smooth Limpet" :found="found"
                     :highlighted="highlighted" @find="toggle" @close="close" />

  - found: { [hotspotId]: true } for every found animal.
  - highlighted: hotspot ids suggested by a clue (pulse until found).
  The animals stay hidden until the photo has loaded, so their positions
  can't flash up first.
*/
import { computed, onMounted, ref, watch } from "vue";
import { PANELS, SPECIES } from "./numberLine.js";

const props = defineProps({
  distance: { type: Number, required: true },
  species: { type: String, default: null },
  found: { type: Object, default: () => ({}) },
  highlighted: { type: Array, default: () => [] },
  clueAvailable: { type: Boolean, default: false },
  cluesUsed: { type: Number, default: 0 },
  canRevealAllCounts: { type: Boolean, default: false },
  surveySites: { type: Array, default: () => [] },
  surveyComplete: { type: Boolean, default: false },
  nextSurveyDistance: { type: Number, default: null },
});

const emit = defineEmits([
  "find", "close", "clue", "ready", "reveal-all-counts",
  "go-to-distance", "go-to-graph",
]);

const panel = computed(() => PANELS[props.distance]);
const colourOf = (name) => SPECIES.find((s) => s.name === name)?.colour;

// "<species>: found 2 of 3" for this quadrat
const progress = computed(() => {
  if (!props.species) return null;
  const mine = panel.value.hotspots.filter((h) => h.species === props.species);
  return {
    found: mine.filter((h) => props.found[h.id]).length,
    total: mine.length,
  };
});

// A clue from a different species/distance must not show a false "glowing"
// message when students switch photographs.
const hasGlowingAnimal = computed(() =>
  panel.value.hotspots.some((spot) =>
    spot.species === props.species &&
    !props.found[spot.id] &&
    props.highlighted.includes(spot.id),
  ),
);

// A second, deliberate choice prevents children accidentally revealing the
// entire data set just because a new green button has appeared.
const confirmRecordedCounts = ref(false);
watch(() => props.canRevealAllCounts, (available) => {
  if (!available) confirmRecordedCounts.value = false;
});

/* ---------- reveal the animals once the photo has loaded ---------- */

const background = ref(null);
const ready = ref(false);
const failed = ref(false);

function onLoad() {
  const img = background.value;
  const finish = () => requestAnimationFrame(() => {
    if (!ready.value) {
      ready.value = true;
      emit("ready");
    }
  });
  if (typeof img?.decode === "function")
    img.decode().catch(() => {}).then(finish);
  else finish();
}

onMounted(() => {
  const img = background.value;
  if (img?.complete) img.naturalWidth > 0 ? onLoad() : (failed.value = true);
});

function hotspotStyle(spot) {
  return {
    left: spot.left,
    top: spot.top,
    width: spot.width,
    transform: `translate(-50%, -50%) ${spot.transform}`.trim(),
  };
}

function overlayStyle(spot) {
  return {
    background: colourOf(spot.species),
    maskImage: `url("${spot.image}")`,
    WebkitMaskImage: `url("${spot.image}")`,
  };
}
</script>

<template>
  <div
    class="stage-panel is-open"
    role="region"
    aria-label="Selected distance details"
  >
    <button
      class="panel-close"
      type="button"
      aria-label="Close panel"
      @click="emit('close')"
    >
      ×
    </button>

    <div class="panel-body">
      <div class="survey-panel-heading">
        <h3>{{ distance }} m</h3>
        <p v-if="!species">Choose an animal on the left to start searching.</p>
        <p v-else-if="progress.total === 0">
          None of this animal here — zero is still data!
        </p>
        <p v-else>Find and click each {{ species.toLowerCase() }} you spot.</p>
      </div>
      <!-- At-a-glance progress for this species across the whole survey.
           Click any checkpoint to move there, without scrolling down to
           the rock-platform number line. -->
      <div v-if="species && surveySites.length" class="survey-roadmap">
        <div class="survey-roadmap-heading">
          <strong>{{ species }} · Survey progress</strong>
          <span>{{ surveySites.filter((site) => site.complete).length }} of 5 locations</span>
        </div>
        <div class="survey-roadmap-locations" aria-label="Survey locations and their progress">
          <button
            v-for="site in surveySites"
            :key="site.distance"
            type="button"
            class="survey-location"
            :class="{
              'is-current': site.distance === distance,
              'is-complete': site.complete,
              'is-partial': site.found > 0 && !site.complete,
            }"
            :disabled="site.distance === distance"
            :aria-label="`${site.distance} metres: ${site.total === 0 ? 'zero animals to find' : site.complete ? 'complete' : site.found ? 'partly complete' : 'not yet complete'}. ${site.distance === distance ? 'Current location' : 'Open this photograph'}`"
            :aria-current="site.distance === distance ? 'step' : undefined"
            @click="emit('go-to-distance', site.distance)"
          >
            <span
              class="survey-location-ring"
              :style="{ '--survey-fill': `${site.percent}%` }"
              aria-hidden="true"
            >{{ site.complete ? (site.total === 0 ? '0' : '✓') : '' }}</span>
            <span>{{ site.distance }} m</span>
          </button>
        </div>
        <div v-if="surveyComplete" class="survey-roadmap-feedback" role="status">
          <span><strong>✓ Survey complete!</strong> You're ready to make your line graph.</span>
          <button type="button" class="survey-next-button" @click="emit('go-to-graph')">
            Go to Step 3 ↓
          </button>
        </div>
        <div v-else-if="progress && progress.found === progress.total && nextSurveyDistance !== null"
             class="survey-roadmap-feedback" role="status">
          <span><strong>✓ {{ distance }} m finished.</strong> Another location still needs checking.</span>
          <button type="button" class="survey-next-button" @click="emit('go-to-distance', nextSurveyDistance)">
            Next: {{ nextSurveyDistance }} m →
          </button>
        </div>
      </div>

      <div v-if="species && progress.total > 0" class="survey-progress-row">
        <p class="species-progress">
          <span class="species-progress-title">{{ species }}: found </span>
          <span
            :key="progress.found + '/' + progress.total"
            class="species-progress-count"
            >{{ progress.found }} of {{ progress.total }}</span
          >
        </p>
        <button
          v-if="clueAvailable"
          type="button"
          class="survey-clue-button"
          @click="emit('clue')"
        >
          {{ cluesUsed > 0 ? "Another clue?" : "Need a clue?" }}
        </button>
        <span v-if="hasGlowingAnimal && progress.found < progress.total" class="survey-clue-note">
          Look for the glowing animal.
        </span>
      </div>
      <div v-if="canRevealAllCounts" class="survey-data-option" role="group" aria-label="Optional recorded survey data">
        <template v-if="!confirmRecordedCounts">
          <div class="survey-data-copy">
            <strong>Ready to make your line graph?</strong>
            <small>Keep searching, or use the recorded counts to move on to graphing.</small>
          </div>
          <button type="button" class="survey-data-button" @click="confirmRecordedCounts = true">
            Show all animal counts
          </button>
        </template>
        <template v-else>
          <div class="survey-data-copy">
            <strong>Use the recorded survey counts?</strong>
            <small>This fills in the remaining counts for all three molluscs at all five distances. You will still make the line graph yourself.</small>
          </div>
          <div class="survey-data-actions">
            <button type="button" class="survey-data-cancel" @click="confirmRecordedCounts = false">
              Keep searching
            </button>
            <button type="button" class="survey-data-button" @click="emit('reveal-all-counts')">
              Yes, use recorded counts
            </button>
          </div>
        </template>
      </div>

      <div class="animal-stage-wrap">
        <div
          class="animal-stage"
          :class="{ 'is-ready': ready, 'has-load-error': failed }"
          :aria-busy="ready || failed ? null : 'true'"
        >
          <img
            ref="background"
            class="stage-bg"
            :src="panel.background"
            alt="Survey site backdrop"
            @load="onLoad"
            @error="failed = true"
          />

          <button
            v-for="spot in panel.hotspots"
            :key="spot.id"
            type="button"
            class="animal-hotspot"
            :class="{
              found: found[spot.id],
              highlighted: highlighted.includes(spot.id) && spot.species === species,
              'is-inactive': !species || spot.species !== species,
            }"
            :style="hotspotStyle(spot)"
            :aria-label="spot.species"
            @click="spot.species === species && emit('find', spot.id)"
          >
            <img :src="spot.image" :alt="spot.species" />
            <span
              class="animal-overlay"
              aria-hidden="true"
              :style="overlayStyle(spot)"
            ></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The five survey checkpoints are the main progress indicator. The small
   rings fill as animals are found, with a tick only when a site is finished. */
.survey-roadmap {
  margin: 8px 0 0;
}
.survey-roadmap-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-bottom: 6px;
  color: var(--text);
  font-size: 0.84rem;
  line-height: 1.3;
}
.survey-roadmap-heading > span {
  color: var(--muted);
  font-size: 0.78rem;
}
.survey-roadmap-locations {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}
.survey-location {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  min-height: 37px;
  padding: 5px 4px;
  border: 1.5px solid var(--charcoal);
  border-radius: 10px;
  background: white;
  color: var(--text);
  font: inherit;
  font-size: 0.77rem;
  font-weight: 750;
  white-space: nowrap;
  cursor: pointer;
}
.survey-location.is-current {
  border: 2px solid var(--purple);
  background: var(--soft-blue);
}
.survey-location.is-complete:not(.is-current) {
  background: var(--soft-green);
}
.survey-location:disabled {
  cursor: default;
  opacity: 1;
}
.survey-location:hover:not(:disabled),
.survey-location:focus-visible:not(:disabled) {
  background: var(--soft-yellow);
  outline: 2px solid var(--purple);
  outline-offset: 1px;
}
.survey-location-ring {
  display: grid;
  flex: 0 0 21px;
  place-items: center;
  box-sizing: border-box;
  width: 21px;
  height: 21px;
  border: 1.5px solid var(--charcoal);
  border-radius: 50%;
  background: conic-gradient(
    var(--green) 0 var(--survey-fill),
    var(--paper) var(--survey-fill) 100%
  );
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 900;
}
.survey-location.is-complete .survey-location-ring {
  background: var(--green);
  color: white;
}
.survey-roadmap-feedback {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 10px;
  padding: 7px 1px 0;
  color: var(--text);
  font-size: 0.81rem;
  line-height: 1.4;
}
.survey-next-button {
  flex: 0 0 auto;
  border: 1.5px solid var(--charcoal);
  border-radius: 10px;
  padding: 5px 9px;
  background: var(--soft-green);
  box-shadow: 0 2px 0 var(--charcoal);
  color: var(--text);
  font: inherit;
  font-size: 0.81rem;
  font-weight: 800;
  cursor: pointer;
}
.survey-next-button:hover,
.survey-next-button:focus-visible {
  background: var(--yellow);
  outline: 2px solid var(--purple);
  outline-offset: 1px;
}
@media (max-width: 520px) {
  .survey-roadmap-locations { gap: 3px; }
  .survey-location { flex-direction: column; gap: 1px; min-height: 47px; font-size: 0.72rem; }
  .survey-location-ring { width: 19px; height: 19px; flex-basis: 19px; }
}

/* Keep guidance compact so the survey photo has more of the available space. */
.survey-panel-heading h3 {
  margin: 0 0 3px;
  font-size: 1.12rem;
}
.survey-panel-heading p {
  margin: 0;
  line-height: 1.4;
  color: var(--muted);
}
.survey-progress-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px 12px;
  margin-top: 8px;
}
.survey-progress-row .species-progress {
  margin: 0;
}
.survey-clue-button {
  padding: 6px 11px;
  border: 2px solid var(--charcoal);
  border-radius: 10px;
  background: var(--soft-yellow);
  color: var(--text);
  box-shadow: 0 2px 0 var(--charcoal);
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
}
.survey-clue-button:hover,
.survey-clue-button:focus-visible {
  background: var(--yellow);
  outline: 2px solid var(--purple);
  outline-offset: 1px;
}
.survey-clue-note {
  color: var(--muted);
  font-size: 0.78rem;
}

/* Optional route to graphing: prominent, but never compulsory. */
.survey-data-option {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px 12px;
  margin: 10px 0 0;
  padding: 10px 12px;
  border: 2px solid var(--charcoal);
  border-radius: 12px;
  background: var(--soft-green);
  color: var(--text);
}
.survey-data-copy {
  display: flex;
  flex: 1 1 220px;
  flex-direction: column;
  gap: 2px;
}
.survey-data-copy strong {
  font-size: 0.9rem;
  line-height: 1.3;
}
.survey-data-copy small {
  color: var(--muted);
  font-size: 0.8rem;
  line-height: 1.35;
}
.survey-data-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.survey-data-cancel {
  padding: 8px 11px;
  border: 2px solid var(--charcoal);
  border-radius: 10px;
  background: white;
  color: var(--text);
  box-shadow: 0 2px 0 var(--charcoal);
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
}
.survey-data-cancel:hover,
.survey-data-cancel:focus-visible {
  background: var(--soft-yellow);
  outline: 2px solid var(--purple);
  outline-offset: 1px;
}
.survey-data-button {
  flex: 0 1 auto;
  padding: 8px 11px;
  border: 2px solid var(--charcoal);
  border-radius: 10px;
  background: var(--green);
  color: white;
  box-shadow: 0 2px 0 var(--charcoal);
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
}
.survey-data-button:hover,
.survey-data-button:focus-visible {
  background: var(--purple);
  outline: 2px solid var(--purple);
  outline-offset: 2px;
}

/* The panel sits beside the species picker, above the rock platform. */
.stage-panel {
  position: relative;
  display: block;
  grid-column: 2;
  grid-row: 1;
  width: 100%;
  margin: 0;
  border-radius: 22px;
}

.panel-close {
  position: absolute;
  top: 10px;
  right: 14px;
  padding: 2px 6px;
  color: var(--muted);
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  border: 1px solid var(--charcoal);
  border-radius: 50%;
  background: var(--soft-orange);
  transition:
    color 0.2s ease,
    background 0.2s ease;
}
.panel-close:hover,
.panel-close:focus-visible {
  color: var(--paper);
  background: var(--orange);
  outline: none;
}

/* the count pops each time it changes */
.species-progress-count {
  display: inline-block;
  animation: nl-count-pop 0.5s ease;
}

@keyframes nl-count-pop {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.5);
  }
  33% {
    opacity: 1;
    transform: translateY(-6px);
  }
  66% {
    transform: translateY(2px) scale(1);
  }
  100% {
    transform: translateY(0);
  }
}

.animal-stage-wrap {
  width: 96%;
  margin: 8px auto 0;
  background: black;
  border: 2px solid var(--charcoal);
  border-radius: 14px;
  overflow: hidden;
  justify-self: center;
}

/* =================================================================
    Animals scattered on a backdrop photo, spotlight-style: each is a
    transparent PNG positioned by left/top/width %, with a masked
    overlay behind it that tints on "found" (click).
================================================================= */

.animal-stage {
  position: relative;
  aspect-ratio: 1 / 1;
}

.animal-stage .stage-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
}

/* Prevent hidden animals appearing before the survey backdrop is ready. */
.animal-stage.is-ready .stage-bg {
  opacity: 1;
  transition: opacity 0.16s ease;
}

.animal-stage:not(.is-ready) .animal-hotspot {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.animal-stage:not(.is-ready)::before {
  content: "Loading survey image…";
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  background: var(--paper);
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 700;
}

.animal-stage.has-load-error::before {
  content: "Survey image could not be loaded.";
  background: var(--soft-orange);
  color: var(--text);
}

.animal-hotspot {
  position: absolute;
  padding: 0;
  border: none;
  background: none;
  line-height: 0;
  cursor: pointer;
}

.animal-hotspot img {
  position: static;
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  transition:
    transform 0.15s ease,
    filter 0.3s ease;
}

.animal-hotspot:hover:not(.found) img {
  transform: scale(1.08);
  filter: drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white)
    drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white);
}

.animal-hotspot:focus-visible {
  outline: 3px solid var(--yellow);
  outline-offset: 4px;
  border-radius: 6px;
}

.animal-overlay {
  position: absolute;
  inset: -5%;
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-position: center;
  mix-blend-mode: color;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.animal-hotspot.found .animal-overlay {
  opacity: 1;
}

/* "Find all" hint: points out where a not-yet-found animal is without
    marking it found — the pulse stops as soon as the student actually
    clicks it (the .found tint takes over at that point instead). */
.animal-hotspot.highlighted:not(.found) img {
  animation: nl-highlight-pulse 1.2s ease-in-out infinite;
}

@keyframes nl-highlight-pulse {
  0%,
  100% {
    filter: drop-shadow(0 0 0 var(--yellow));
  }
  50% {
    filter: drop-shadow(0 0 10px var(--yellow))
      drop-shadow(0 0 10px var(--yellow));
  }
}

/* Every animal that isn't the currently-selected species (or none
    selected yet): visible for context, but not clickable. */
.animal-hotspot.is-inactive {
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .animal-hotspot.highlighted:not(.found) img {
    animation: none;
    filter: drop-shadow(0 0 8px var(--yellow));
  }

  .species-progress-count {
    animation: none;
  }
}

@media print {
  .stage-panel {
    display: none;
  }
}

@media (max-width: 900px) {
  .stage-panel {
    grid-column: 1;
    grid-row: 2;
  }

  .animal-stage-wrap {
    width: 100%;
    margin-top: 8px;
  }
}
</style>
