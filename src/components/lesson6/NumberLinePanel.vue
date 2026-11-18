<script setup>
/*
  The quadrat photo for one distance on the number line: every animal at that
  distance is hidden in it. Only the selected species can be clicked (the rest
  are distractors); clicking one marks it found (click again to un-find it).

    <NumberLinePanel :distance="10" species="Smooth Limpet" :found="found"
                     :highlighted="highlighted" @find="toggle" @close="close" />

  - found: { [hotspotId]: true } for every found animal.
  - highlighted: hotspot ids pointed out by "Find all" (pulse until found).
  The animals stay hidden until the photo has loaded, so their positions
  can't flash up first.
*/
import { computed, onMounted, ref } from "vue";
import { PANELS, SPECIES } from "./numberLine.js";

const props = defineProps({
  distance: { type: Number, required: true },
  species: { type: String, default: null },
  found: { type: Object, default: () => ({}) },
  highlighted: { type: Array, default: () => [] },
});

const emit = defineEmits(["find", "close"]);

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

/* ---------- reveal the animals once the photo has loaded ---------- */

const background = ref(null);
const ready = ref(false);
const failed = ref(false);

function onLoad() {
  const img = background.value;
  const finish = () => requestAnimationFrame(() => (ready.value = true));
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
      <h3>{{ distance }} metres</h3>
      <p>{{ panel.intro }}</p>
      <p v-if="progress" class="species-progress">
        <span class="species-progress-title">{{ species }}: found </span>
        <span
          :key="progress.found + '/' + progress.total"
          class="species-progress-count"
          >{{ progress.found }} of {{ progress.total }}</span
        >
      </p>

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
              highlighted: highlighted.includes(spot.id),
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
