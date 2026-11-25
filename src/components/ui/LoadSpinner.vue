<script setup>
/*
  Loading spinner: a spinning ring in the GTAC colours on a white "puck".

    <LoadSpinner />                     default size, "Loading…" read out to screen readers
    <LoadSpinner size="40px" />         smaller
    <LoadSpinner label="Loading lesson" show-label />   with visible text underneath
*/
defineProps({
  // diameter of the puck (any CSS length)
  size: { type: String, default: "72px" },
  // text for screen readers (and underneath, with showLabel)
  label: { type: String, default: "Loading…" },
  showLabel: { type: Boolean, default: false },
});
</script>

<template>
  <div class="load-spinner" role="status" :style="{ '--spinner-size': size }">
    <div class="load-spinner-puck" aria-hidden="true">
      <div class="load-spinner-ring" />
    </div>
    <p v-if="showLabel" class="load-spinner-label">{{ label }}</p>
    <span v-else class="load-spinner-sr">{{ label }}</span>
  </div>
</template>

<style scoped>
.load-spinner {
  --ring-width: calc(var(--spinner-size) * 0.12);

  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  animation: pop-fade-in 0.5s ease;
}

/* the white disc behind the ring, in the same style as the app's cards and buttons */
.load-spinner-puck {
  display: grid;
  place-items: center;

  width: var(--spinner-size);
  height: var(--spinner-size);

  background: var(--surface);
  border: var(--border-medium);
  border-radius: 50%;
  box-shadow: var(--shadow-small);
}

/* four coloured quarters, each with a rounded end */
.load-spinner-ring {
  width: 72%;
  height: 72%;

  border: var(--ring-width) solid;
  border-color: var(--marker) var(--orange) var(--accent) var(--marker-2);
  border-radius: 50%;

  animation: load-spinner-turn 0.9s cubic-bezier(0.55, 0.15, 0.45, 0.85)
    infinite;
}

.load-spinner-label {
  margin: 0;

  color: var(--accent-text);

  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* visible only to screen readers */
.load-spinner-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@keyframes load-spinner-turn {
  to {
    transform: rotate(360deg);
  }
}

/* no spinning for people who turn motion off: a gentle pulse instead */
@keyframes load-spinner-pulse {
  50% {
    opacity: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .load-spinner {
    animation: none;
  }

  .load-spinner-ring {
    animation: load-spinner-pulse 1.6s ease-in-out infinite;
  }
}
</style>
