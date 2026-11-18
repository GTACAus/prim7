<script setup>
defineProps({
  href: { type: String, required: true },
  img: { type: String, required: true },
  stage: { type: Number, required: true },
  accent: { type: String, default: "var(--purple)" },
  // overview under the title: what the lesson is about and its experiment
  description: { type: String, default: "" },
  experiment: { type: String, default: "" },
  lessonComplete: { type: Boolean, default: false },
});
</script>

<template>
  <a
    class="lesson-card"
    :href="href"
    :style="{ '--accent': accent }"
    :data-stage="stage"
  >
    <img v-if="img" :src="img" alt="" />
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
  width: clamp(220px, 60vw, 550px);
  min-height: clamp(260px, 44vh, 430px);
  flex-direction: column;
  align-items: center;
  justify-content: start;
  gap: 0.8rem;
  overflow: hidden;
  padding: clamp(20px, 4vw, 48px);
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
.lesson-card img {
  position: absolute;
  inset: -10%;
  height: 140%;
  margin: auto;
  object-fit: contain;
  opacity: 0.1;
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
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
  font-size: clamp(1.3rem, 2.4vw, 2rem);
  font-weight: 700;
  line-height: 1.2;
  transition: transform 0.45s ease;
}
.lesson-subtitle {
  max-width: 50ch;
  font-size: 1.6rem;
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
.lesson-card.is-current img {
  opacity: 0.1;
}

/* ---------- overview: description + experiment ---------- */
.overview {
  position: absolute;
  bottom: 40px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
  max-width: 700px;
  margin: 0 clamp(8px, 1.7vw, 20px);
  padding: clamp(10px, 1.7vw, 20px);
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
/* Reserve two lines so every overview is the same height */
.overview .description-content {
  min-height: 2lh;
  font-size: clamp(1.1rem, 2vw, 1.3rem);
}
.overview .experiment {
  display: flex;
  align-items: center;
  gap: clamp(5px, 0.85vw, 10px);
}
.overview .experiment-heading {
  margin-bottom: clamp(5px, 0.85vw, 10px);
  font-size: clamp(0.9rem, 1.6vw, 1.2rem);
}
.overview .experiment-content {
  padding: clamp(4px, 0.6vw, 7px);
  background: var(--green);
  border: 2px solid var(--charcoal);
  border-radius: 99px;
  box-shadow: 0 5px 5px rgb(0 0 0 / 40%);
  color: var(--paper);
  font-weight: 700;
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
    width: min(68vw, 310px);
    min-height: clamp(250px, 40vh, 360px);
  }
  .lesson-subtitle {
    margin: auto 0 0;
    font-size: clamp(1rem, 1vw, 1.2rem);
  }
  .lesson-card {
    min-height: 440px;
    padding: 18px 14px;
  }
  /* Overview flows under the title instead of overlapping it */
  .overview {
    position: static;
    width: 100%;
    margin: auto 0 0;
    padding: 10px;
  }
  .overview .description-content {
    min-height: 0;
    font-size: 0.95rem;
  }
  .overview .experiment {
    flex-direction: column;
  }
  .overview .experiment-heading {
    margin-bottom: 0;
    font-size: 0.9rem;
  }
  .overview .experiment-content {
    padding: 6px 10px;
    border-radius: 16px;
    font-size: 0.85rem;
    line-height: 1.25;
  }
  .lesson-card.is-previous {
    left: 20%;
  }
  .lesson-card.is-next {
    left: 80%;
  }
}
</style>
