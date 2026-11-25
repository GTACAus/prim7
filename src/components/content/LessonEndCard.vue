<script setup>
/*
  "Well done!" card shown when a lesson's last activity is finished, with the
  Save my work and Home buttons.

    <LessonEndCard
      v-if="finished"
      :lesson-number="3"
      :practiced="['Observing and investigating yeast', ...]"
    />

  The parent decides when it shows (v-if / v-show).
*/
import Button from "../ui/Button.vue";
import { downloadLessonPDF } from "../../composables/usePrintLesson.js";

defineProps({
  lessonNumber: { type: [Number, String], required: true },
  // the skills listed under "In Lesson N, you practiced:"
  practiced: { type: Array, default: () => [] },
});
</script>

<template>
  <div class="lesson-completion-card" role="status" aria-live="polite">
    <strong>Well done! You have completed Lesson {{ lessonNumber }}.</strong>
    <p>In Lesson {{ lessonNumber }}, you practiced:</p>
    <ol class="lesson-recap-list">
      <li v-for="item in practiced" :key="item">{{ item }}</li>
      <slot name="list" />
    </ol>
    <p>You can save your work using the button here.</p>
    <p>Click the Home button to choose your next lesson.</p>
    <div class="lesson-completion-actions">
      <Button class="save-work-button" symbol="💾" @click="downloadLessonPDF">
        Save my work
      </Button>
      <Button class="home-button lesson-completion-home" to="/" symbol="🏠">
        Home
      </Button>
    </div>
  </div>
</template>

<style scoped>
.lesson-completion-card {
  margin-top: 28px;
  padding: 20px;

  background: var(--soft-green);
  border: 3px solid var(--green);
  border-radius: 18px;
  box-shadow: 0 4px 0 var(--green);

  color: var(--text);
  text-align: center;

  animation: pop-fade-in 0.5s ease;
}

.lesson-completion-card > strong {
  display: block;
  margin-bottom: 7px;

  color: var(--purple);
  font-size: 1.2rem;
}

.lesson-completion-card > p {
  margin: 0;
  color: var(--text);
  line-height: 1.5;
}

.lesson-recap-list {
  display: grid;
  width: fit-content;
  gap: 4px;
  margin: 8px auto 14px;
  padding-left: 1.4rem;

  color: var(--text);
  text-align: left;
  line-height: 1.45;
}

.lesson-recap-list li {
  margin: 0;
}

.lesson-completion-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;

  width: 240px;
  max-width: 100%;
  margin: 14px auto 0;
}

/* Both buttons fill the column; overrides the header's save button layout */
.lesson-completion-actions :deep(.save-work-button),
.lesson-completion-actions :deep(.home-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  width: 100%;
  margin: 0;
}

.lesson-completion-actions :deep(.home-button) {
  --background: var(--card);
  --color: var(--text);
}

/* Same look as the header's buttons (PageHeader.vue). Kept light (no
   .lesson-completion-actions) so the colour theme's header-button rules still win. */
:deep(.home-button) {
  --background-hover: var(--soft-yellow);
  --background-active: var(--yellow);

  border-top: 5px solid var(--marker);
}

:deep(.save-work-button) {
  background: var(--purple) !important;
  color: var(--paper) !important;
}

:deep(.save-work-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 var(--line);
}

:deep(.save-work-button:active) {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--line);
}

@media (max-width: 800px) {
  :deep(.save-work-button),
  :deep(.home-button) {
    padding: 10px 14px;
    font-size: 0.7rem;
    white-space: nowrap;
  }
}
</style>
