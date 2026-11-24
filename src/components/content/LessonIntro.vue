<script setup>
import Button from "../ui/Button.vue";
import LessonCard from "./LessonCard.vue";
import Grid from "../layout/Grid.vue";
/*
  Lesson introduction: label, title, summary, worksheet download and an
  optional objectives / "think like a scientist" grid.

    <LessonIntro label="Lesson 1" title="Questioning and Predicting"
                 worksheet="../worksheets/l1-worksheet.pdf"
                 :objective="objective" :criteria="criteria">
      Summary text (may contain <strong>HTML</strong>).

      <template #observation> ...contents of the right-hand card... </template>
    </LessonIntro>

  Slots: default = summary, title = rich title (when plain text isn't enough),
  actions = extra buttons beside the worksheet button, mission = block between
  the heading and the grid, observation = right-hand grid card.
*/
defineProps({
  label: { type: String, default: "" },
  title: { type: String, default: "" },
  // URL of the worksheet PDF; omit for no download button
  worksheet: { type: String, default: "" },
  // extra class on the header
  introClass: { type: String, default: "" },
  // learning objective (HTML) and success criteria (array of HTML strings)
  objective: { type: String, default: "" },
  criteria: { type: Array, default: () => [] },
});
</script>

<template>
  <header class="lesson-intro" :class="introClass">
    <div class="lesson-heading">
      <span class="lesson-label">{{ label }}</span>

      <!-- clicking the title five times opens the hidden teacher menu -->
      <h1 id="teacherTrigger" class="lesson-title" :title="title">
        <slot name="title">{{ title }}</slot>
      </h1>

      <p v-if="$slots.default" class="lesson-summary"><slot /></p>

      <div v-if="$slots.actions" class="intro-actions">
        <Button
          v-if="worksheet"
          class="worksheet-button"
          :href="worksheet"
          download
          symbol="📄"
        >
          Download worksheet
        </Button>
        <slot name="actions" />
      </div>
      <Button
        v-else-if="worksheet"
        class="worksheet-button"
        :href="worksheet"
        download
        symbol="📄"
      >
        Download worksheet
      </Button>
    </div>

    <slot name="mission" />

    <Grid v-if="objective || $slots.observation" :cols="2" gap="lg">
      <LessonCard v-if="objective" class="objectives-card">
        <template #eyebrow>
          <p>Learning objective</p>
        </template>
        <template #content>
          <p class="learning-objective-text" v-html="objective"></p>

          <p class="success-heading">Success criteria</p>
          <ol class="objective-list">
            <li v-for="(item, i) in criteria" :key="i" v-html="item"></li>
          </ol>
        </template>
      </LessonCard>

      <LessonCard v-if="$slots.observation" class="observation-card">
        <template #eyebrow>
          <p>Think like a scientist</p>
        </template>
        <template #content>
          <slot name="observation" />
        </template>
      </LessonCard>
    </Grid>
  </header>
</template>

<style>
#teacherTrigger {
  user-select: none;
}

.intro-actions {
  display: inline-flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.intro-actions .general-button {
  width: 220px;
}

/* ---------- Lesson introduction ---------- */

.lesson-intro {
  position: relative;

  padding-top: 40px;
  animation: pop-fade-in 0.5s ease;
}

.lesson-label {
  display: inline-block;

  margin-bottom: 12px;
  padding: 8px 16px;

  background: var(--accent);
  color: var(--on-accent);

  border: 2px solid var(--line);
  border-radius: 999px;

  box-shadow: 0 3px 0 var(--line);

  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.lesson-summary {
  max-width: 700px;
  margin: 0 auto;
  margin-bottom: 10px;

  color: var(--muted);

  font-size: 1.06rem;
  line-height: 1.7;
}

.objectives-card {
  border-top: 10px solid var(--orange);
}

.observation-card {
  border-top: 10px solid var(--purple);
}

.objective-list {
  margin: 16px 0 0;
  padding: 0;

  list-style: none;

  counter-reset: objective;
}

.objective-list > li {
  position: relative;
  display: block;
  min-height: 42px;
  margin-bottom: 12px;
  padding: 30px 12px 30px 50px;

  background: var(--surface);
  border: 2px solid var(--line);
  border-radius: 14px;

  box-shadow: 0 3px 0 var(--shadow-soft);

  color: var(--text);
  line-height: 1.45;

  counter-increment: objective;
}

.objective-list > li ul {
  list-style: none;
  padding-left: 10px;
}

.objective-list > li li {
  position: relative;
  padding-left: 1.4rem;
}

.objective-list > li li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.4rem;
  width: 0.5rem;
  height: 0.5rem;
  border: 2px solid var(--charcoal);
  border-radius: 50%;
  background: var(--yellow);
}

.objective-list > li li:nth-child(2n)::before {
  background: var(--soft-purple);
}

.objective-list > li li:nth-child(3n)::before {
  background: var(--mint);
}

.objective-list > li:last-child {
  margin-bottom: 0;
}

.objective-list > li::before {
  content: counter(objective);

  position: absolute;
  left: 10px;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 30px;
  height: 30px;

  background: var(--marker);
  border: 2px solid var(--line);
  border-radius: 50%;

  color: var(--on-marker);
  font-weight: 700;
}

.learning-objective-text {
  margin: 12px 0 18px;
  padding: 14px 16px;

  background: var(--soft-yellow);
  border: 2px solid var(--line);
  border-radius: 14px;

  box-shadow: 0 3px 0 var(--shadow-soft);

  color: var(--text) !important;
  font-weight: 600;
  line-height: 1.55;
}

.success-heading {
  margin: 0 0 10px !important;

  color: var(--text) !important;

  font-size: 1rem;
  font-weight: 700;
}

.stw-explanation {
  display: grid;
  gap: 9px;

  margin-top: 16px;
}

.stw-explanation div {
  display: grid;
  grid-template-columns: 76px 1fr;
  align-items: center;
  gap: 10px;

  padding: 10px 12px;

  background: var(--soft-yellow);
  border: 2px solid var(--line);
  border-radius: 14px;
}

.stw-explanation strong {
  color: var(--text);
}

.stw-explanation span {
  color: var(--muted);
}

.stw-explanation div:nth-child(2) {
  background: var(--soft-green);
}

.stw-explanation div:nth-child(3) {
  background: var(--soft-purple);
}

.worksheet-button {
  display: inline-block;
  --background: var(--marker);
  --color: var(--on-marker);
  --padding: 8px;
  --background-hover: var(--marker-2);
  --color-hover: var(--on-marker);

  z-index: inherit;
}

/* ---------- Smaller screens ---------- */
@media (max-width: 800px) {
  .lesson-intro {
    padding-top: 92px;
  }

  .worksheet-button {
    position: relative;
    margin: 0;
    padding: 10px 14px;
    font-size: 0.7rem;
    white-space: nowrap;
  }
}
</style>
