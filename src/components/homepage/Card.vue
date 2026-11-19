<script setup>
import { ref, watch } from "vue";
import { useTilt } from "../../composables/useTilt.js";

const props = defineProps({
  // true for the lesson currently selected in the carousel; only that card tilts
  active: { type: Boolean, default: false },
  href: { type: String, required: true },
  // Legacy illustration path; kept for compatibility, but no longer displayed.
  img: { type: String, required: true },
  stage: { type: Number, required: true },
  accent: { type: String, default: "var(--purple)" },
  // overview under the title: what the lesson is about and its experiment
  description: { type: String, default: "" },
  experiment: { type: String, default: "" },
  lessonComplete: { type: Boolean, default: false },
});

const card = ref(null);

// Locked lessons (class set by the carousel) never tilt.
const { reset } = useTilt(
  card,
  () => props.active && !card.value.classList.contains("unavailable"),
);

// Ease back to rest when another lesson is selected.
watch(
  () => props.active,
  (active) => {
    if (!active) reset();
  },
);
</script>

<template>
  <a
    ref="card"
    class="lesson-card"
    :href="href"
    :style="{ '--accent': accent }"
    :data-stage="stage"
  >
    <span v-if="lessonComplete" class="lesson-complete">Complete</span>
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
  min-height: clamp(360px, 48vh, 490px);
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
    left 0.45s ease,
    opacity 0.45s ease,
    transform 0.45s ease,
    box-shadow 0.2s ease,
    background 0.45s ease,
    width 0.45s ease;
  will-change: left, transform, width;
}
.lesson-card span {
  position: relative;
}
.lesson-card .lesson-complete {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  padding: 4px 12px;
  background: var(--soft-green);
  border: 2px solid var(--charcoal);
  border-radius: 99px;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.04em;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
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
  z-index: 2;
  opacity: 1;
  box-shadow:
    0 24px 54px rgb(0 0 0 / 40%),
    var(--tilt-shadow, 0 0 0 transparent);
  transform: translate(-50%, -50%) scale(1);
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
  --scale-amount: 0.82;
  z-index: 1;
  cursor: pointer;

  transform: translate(-50%, -50%) scale(var(--scale-amount))
    rotateY(var(--rotate-amount));
  transition:
    left 0.45s ease,
    opacity 0.45s ease,
    box-shadow 0.2s ease,
    transform 0.45s ease,
    width 0.45s ease;
}
.lesson-card.is-previous {
  --rotate-amount: calc(-1 * 30deg);
  left: max(0px, calc(50% - min(40vw, 460px)));
}
.lesson-card.is-next {
  --rotate-amount: 30deg;
  left: min(100%, calc(50% + min(40vw, 460px)));
}
.lesson-card.is-previous:hover,
.lesson-card.is-next:hover {
  --scale-amount: 0.88;
  opacity: 0.88;
}
.lesson-card.is-hidden {
  z-index: 0;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -50%) scale(1);
}
.lesson-card.unavailable {
  filter: grayscale(0.5);
}
.lesson-card.is-current.unavailable {
  opacity: 0.55;
}

.lesson-card:focus-visible {
  outline: 4px solid var(--purple);
  outline-offset: 5px;
}
@media (max-width: 700px) {
  .lesson-card {
    width: min(78vw, 380px);
    min-height: 440px;
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
  .lesson-card.is-previous {
    left: 20%;
  }
  .lesson-card.is-next {
    left: 80%;
  }
}

/* Larger screens: scale lesson cards and their contents */
@media (min-width: 1600px) {
  .lesson-card {
    width: max(660px, 28vw);
    min-height: max(490px, 50vh);
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

  .lesson-card.is-previous {
    left: calc(50% - max(460px, 18vw));
  }

  .lesson-card.is-next {
    left: calc(50% + max(460px, 18vw));
  }
}
</style>
