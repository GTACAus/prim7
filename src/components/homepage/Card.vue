<script setup>
import { computed, ref, watch } from "vue";
import { useTilt } from "@/composables/useTilt.js";

const props = defineProps({
  // position relative to the selected lesson: 0 = current, -1 = previous, 1 = next
  offset: { type: Number, default: 0 },
  // locked lessons look greyed out and are selected rather than opened
  locked: { type: Boolean, default: false },
  // grid mode: every card is shown normally instead of as a carousel
  grid: { type: Boolean, default: false },
  // route to open, e.g. "/lesson1"
  to: { type: String, required: true },
  // Legacy illustration path; kept for compatibility, but no longer displayed.
  img: { type: String, required: true },
  stage: { type: Number, required: true },
  accent: { type: String, default: "var(--purple)" },
  // overview under the title: what the lesson is about and its experiment
  description: { type: String, default: "" },
  experiment: { type: String, default: "" },
  lessonComplete: { type: Boolean, default: false },
});

// Fired on click so the carousel can choose to select the card instead of opening it
// (it calls preventDefault on the event).
const emit = defineEmits(["select"]);

const card = ref(null);

// Only the selected card tilts, and never when locked.
const active = computed(() => props.offset === 0 && !props.grid);
const { reset } = useTilt(card, () => active.value && !props.locked);

// Ease back to rest when another lesson is selected.
watch(active, (isActive) => {
  if (!isActive) reset();
});

// Cards more than one step from the selected one are hidden in the carousel.
const isHidden = computed(() => !props.grid && Math.abs(props.offset) > 1);

function onClick(event, navigate) {
  emit("select", event);
  if (!event.defaultPrevented) navigate(event);
}
</script>

<template>
  <RouterLink :to="to" custom v-slot="{ href, navigate }">
    <a
      ref="card"
      class="lesson-card"
      :class="{
        'is-current': !grid && offset === 0,
        'is-previous': !grid && offset === -1,
        'is-next': !grid && offset === 1,
        'is-hidden': isHidden,
        unavailable: locked,
      }"
      :href="href"
      :tabindex="isHidden ? -1 : 0"
      :aria-hidden="isHidden"
      :aria-current="!grid && offset === 0 ? 'true' : undefined"
      :aria-disabled="locked"
      :style="{ '--accent': accent }"
      :data-stage="stage"
      @click="onClick($event, navigate)"
    >
      <span v-if="lessonComplete" class="lesson-badge lesson-complete"
        >Complete</span
      >
      <span v-if="locked" class="lesson-badge lesson-locked">Locked</span>
      <span class="lesson-number"><slot name="number" /></span>
      <span class="lesson-subtitle"><slot name="subtitle" /></span>
      <div
        v-if="description || experiment"
        class="overview"
        :aria-label="`Overview of lesson ${stage}`"
      >
        <div class="description">
          <p class="description-content">{{ description }}</p>
        </div>
        <div class="experiment">
          <h2 class="experiment-heading">Experiment:</h2>
          <p class="experiment-content">{{ experiment }}</p>
        </div>
      </div>
    </a>
  </RouterLink>
</template>

<style scoped>
.lesson-card {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  box-sizing: border-box;
  /* Grow on large monitors, but stay proportional on narrower screens. */
  width: clamp(320px, 43vw, 660px);
  /* Minimum only: the card can grow if a description needs more lines. */
  min-height: min(clamp(240px, 44vh, 490px), 100%);
  /* Never taller than the carousel; scroll inside if the window is very short */
  max-height: 100%;
  overflow-y: auto;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  gap: clamp(10px, 1.3vh, 18px);
  overflow: hidden;
  padding: clamp(18px, 2.2vw, 36px);
  border: 2px solid var(--line);
  border-top: 8px solid var(--accent);
  border-radius: 28px;
  background: white;
  box-shadow:
    0 16px 36px rgb(0 0 0 / 40%),
    var(--tilt-shadow, 0 0 0 transparent);

  color: var(--text);
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
  transform: translate(-50%, -50%) scale(1);

  rotate: var(--tilt-angle, 0deg);
  scale: var(--tilt-scale, 1);

  transition:
    box-shadow 0.2s ease,
    background 0.45s ease;
  will-change: transform;
}
.lesson-card span {
  position: relative;
}
.lesson-card .lesson-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  padding: 4px 12px;
  border: 2px solid var(--charcoal);
  border-radius: 99px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.04em;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.lesson-card .lesson-complete {
  background: var(--soft-green);
  color: var(--text);
}
.lesson-card .lesson-locked {
  background: var(--orange);
  color: var(--paper);
}
.lesson-card .lesson-complete::before {
  content: "✓ ";
}
.lesson-number {
  color: var(--purple);
  font-size: clamp(1.3rem, 2vw, 2rem);
  font-weight: 700;
  line-height: 1.2;
  transition: transform 0.45s ease;
}
.lesson-subtitle {
  max-width: 40ch;
  overflow-wrap: break-word;
  font-size: clamp(1.15rem, 1.8vw, 1.6rem);
  font-weight: 700;
  line-height: 1.35;
  transition: transform 0.45s ease;
}
.lesson-card.is-current {
  box-shadow:
    0 24px 54px rgb(0 0 0 / 40%),
    var(--tilt-shadow, 0 0 0 transparent);
}
.lesson-card.is-current:not(.unavailable):hover {
  background: color-mix(in srgb, var(--accent) 20%, white 80%);
}
.lesson-card.is-current:not(.unavailable):hover .lesson-complete {
  transform: scale(1.1) translateY(-5px);
  box-shadow: var(--shadow-medium);
}

/* ---------- overview: description + experiment ---------- */
.overview {
  /* Stay underneath the title in normal flow, never on top of it. */
  position: static;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 100%;
  max-width: 700px;
  /* Pinned to the bottom of the card; the card's gap keeps a minimum space
     under the title, and the card's min-height shrinks with window height. */
  margin: auto 0 0;
  padding: clamp(12px, 1.5vw, 20px);
  background: transparent;
  border: 2px solid var(--charcoal);
  border-radius: clamp(12px, 1.7vw, 20px);
  box-shadow: var(--shadow-medium);
  text-align: center;
  text-transform: none;
  transition: background 0.25s ease;
}
.lesson-card:not(.unavailable):hover .overview {
  background: white;
}
.overview h2,
.overview p {
  margin: 0;
  margin-bottom: clamp(5px, 0.85vw, 10px);
}
.overview h2 {
  margin-bottom: clamp(12px, 2.1vw, 25px);
  text-transform: uppercase;
}
.overview .description-content {
  min-height: 0;
  overflow-wrap: break-word;
  font-size: clamp(1rem, 1.35vw, 1.25rem);
  line-height: 1.4;
}
.overview .experiment {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: clamp(6px, 0.85vw, 10px);
  width: 100%;
}
.overview .experiment-heading {
  margin-bottom: 0;
  font-size: clamp(0.9rem, 1.35vw, 1.1rem);
}
.overview .experiment-content {
  max-width: 100%;
  padding: clamp(6px, 0.65vw, 9px) clamp(10px, 1.1vw, 16px);
  overflow-wrap: break-word;
  line-height: 1.3;
  font-size: clamp(0.85rem, 1.1vw, 1rem);
  background: var(--green);
  border: 2px solid var(--charcoal);
  border-radius: 16px;
  box-shadow: 0 5px 5px rgb(0 0 0 / 25%);
  color: var(--paper);
  font-weight: 700;
  margin: 0;
}
.lesson-card.is-previous,
.lesson-card.is-next {
  cursor: pointer;
}
/* Cards round the back of the carousel can't be clicked. */
.lesson-card.is-hidden {
  pointer-events: none;
  opacity: 1;
}

.lesson-card:focus-visible {
  outline: 4px solid var(--purple);
  outline-offset: 5px;
}
@media (max-width: 700px) {
  .lesson-card {
    width: min(78vw, 380px);
    padding: 18px 14px;
    gap: 10px;
  }
  .lesson-subtitle {
    font-size: clamp(1rem, 3.4vw, 1.25rem);
  }
  .overview {
    padding: 10px;
  }
  .overview .description-content {
    font-size: 0.95rem;
  }
  .overview .experiment {
    flex-direction: column;
  }
  .overview .experiment-heading {
    font-size: 0.9rem;
  }
  .overview .experiment-content {
    padding: 6px 10px;
    font-size: 0.85rem;
  }
}

/* Larger screens: scale lesson cards and their contents */
@media (min-width: 1600px) {
  .lesson-card {
    width: max(660px, 28vw);
    min-height: min(max(490px, 50vh), 100%);
    padding: max(28px, 1.5vw);
    gap: max(18px, 1vw);
  }

  .lesson-number {
    font-size: max(2rem, 1.15vw);
  }

  .lesson-subtitle {
    font-size: max(1.6rem, 1vw);
  }

  .overview .description-content {
    font-size: max(1.25rem, 0.9vw);
  }

  .overview .experiment-heading {
    font-size: max(1.1rem, 0.75vw);
  }

  .overview .experiment-content {
    font-size: max(1rem, 0.75vw);
  }
}
</style>
