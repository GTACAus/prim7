<script setup>
/*
  One stage of an expedition mission: the terminal-window frame around it,
  the "Mission 02 · Stage 3 of 8" row and the stage's feedback box (filled
  by CHECK).

    <MissionStage id="m2-symbol-match" bar="mission 2: scientific symbols"
                  label="Mission 02" chip="Stage 3 of 8" :feedback="feedback">
      ...stage content...
    </MissionStage>

  feedback: { variant: "success" | "try-again", title, text } or null.
  Only the current stage is shown (.active, set by <Expedition>).
*/
defineProps({
  id: { type: String, required: true },
  bar: { type: String, required: true },
  label: { type: String, default: "" },
  chip: { type: String, default: "" },
  dots: { type: Boolean, default: true },
  active: { type: Boolean, default: false },
  feedback: { type: Object, default: null },
});
</script>

<template>
  <div class="mission-stage" :class="{ active }" :data-stage-id="id">
    <div class="mission-window">
      <div class="mission-window-bar">
        <strong>Deep field terminal // {{ bar }}</strong>
        <div v-if="dots" class="window-dots" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div class="mission-window-body">
        <div v-if="label || chip" class="stage-progress-row">
          <p class="mission-label">{{ label }}</p>
          <span class="stage-progress-chip">{{ chip }}</span>
        </div>

        <slot />

        <div
          class="variable-feedback stage-feedback"
          :class="feedback ? 'feedback-' + feedback.variant : null"
          role="status"
          aria-live="polite"
        >
          <template v-if="feedback">
            <strong class="ball-pair-feedback-title">{{ feedback.title }}</strong>
            <span class="ball-pair-feedback-text">{{ feedback.text }}</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Lesson 7 (Expedition Log). Colours come from the "dark" theme in
   src/styles/themes.css (--exp-* variables). */

.mission-window {
  --border-colour: var(--mission-border);

  width: min(920px, 100%);
  margin: 0 auto;
  overflow: hidden;
  border: 3px solid var(--mission-border);
  border-radius: 20px;
  background: var(--mission-bg);
  color: var(--mission-text);
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.3);
  animation: border-pulse 3s ease-in-out infinite;
}

.mission-window-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 13px;
  background: var(--mission-bg-alt);
  border-bottom: 3px solid var(--mission-border);
}

.mission-window-bar :deep(strong) {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.window-dots {
  display: flex;
  gap: 5px;
}

.window-dots :deep(span) {
  width: 12px;
  height: 12px;
  border: 2px solid var(--mission-border);
  border-radius: 50%;
  background: var(--green);
}

.window-dots :deep(span:nth-child(2)) {
  background: var(--yellow);
}
.window-dots :deep(span:nth-child(3)) {
  background: var(--orange);
}

.mission-window-body {
  padding: 24px;
}

.mission-window :deep(h3) {
  margin: 0 0 7px;
  color: var(--mission-text);
  font-size: clamp(1.55rem, 3vw, 2.3rem);
}

.variable-feedback {
  display: none;
  gap: 5px;
  margin-top: 18px;
  padding: 14px 16px;
  border: 3px solid var(--charcoal);
  border-radius: 14px;
  line-height: 1.45;
  animation: pop-fade-in 0.5s ease;
}

.variable-feedback {
  color: var(--charcoal);
}

.ball-pair-feedback-title {
  font-weight: 800;
}

.ball-pair-feedback-text {
  color: var(--muted);
}

.mission-stage {
  display: none;
}

.stage-progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
</style>
