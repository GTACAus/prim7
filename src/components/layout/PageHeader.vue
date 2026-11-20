<script setup>
import Button from "../ui/Button.vue";
import { openGlossary } from "../../composables/useModal.js";
import { downloadLessonPDF } from "../../composables/usePrintLesson.js";

defineProps({
  // show "Save my work" instead of "Home" (pretask)
  save: { type: Boolean, default: false },
  // optional link back to the first part of a lesson
  backHref: { type: String, default: "" },
  backLabel: { type: String, default: "Back" },
});
</script>

<template>
  <div class="page-header-wrapper">
    <header class="page-header">
      <Button
        v-if="save"
        class="save-work-button"
        style="margin-top: 0"
        @click="downloadLessonPDF"
        symbol="💾"
      >
        Save my work
      </Button>

      <Button v-else class="home-button" to="/" symbol="🏠">Home</Button>

      <Button class="glossary-button" @click="openGlossary" symbol="📖"
        >Vocabulary</Button
      >
    </header>
  </div>
</template>

<style>
.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;

  width: 90%;
  max-width: 1500px;
  margin: 0 auto;
  margin-top: 55px;
  padding-left: 40px;

  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto;
  row-gap: 0.6rem;
  align-items: center;

  z-index: 2000;
  pointer-events: none;
}

.home-button {
  border-top: 5px solid var(--marker);
  pointer-events: auto;
  --background-hover: var(--soft-yellow);
  --background-active: var(--yellow);
}

.glossary-button {
  pointer-events: auto;
  justify-self: end;

  border-top: 5px solid var(--accent-text);
  --background-hover: var(--soft-purple);
  --background-active: var(--purple);
  --color-active: var(--paper);
}

.save-work-button {
  margin-top: 12px;
  justify-self: start;
  align-items: center;

  z-index: inherit;

  background: var(--purple) !important;
  color: var(--paper) !important;

  display: block;
  width: fit-content;
  margin: 28px auto 0;
}

.save-work-button:hover {
  background: var(--green);
  transform: translateY(-2px);
  box-shadow: 0 6px 0 var(--line);
}

.save-work-button:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--line);
}

/* link back to Part B, sits beside Home in the header. */
#back-to-part1-button {
  grid-row: 2;

  --background: var(--card);
  --color: var(--text);

  border-top: 5px solid var(--green);

  pointer-events: auto;
}

#back-to-part1-button:hover {
  --background: var(--soft-green);
}

.home-button,
.glossary-button {
  --background: var(--card);
  --color: var(--text);
}

/* ---------- Smaller screens ---------- */
@media (max-width: 800px) {
  .page-header {
    max-width: none;
    padding-left: 0;
  }

  .home-button,
  .glossary-button,
  .save-work-button,
  .back-to-part1-button {
    margin: 0;
    padding: 10px 14px;
    font-size: 0.7rem;
    white-space: nowrap;
  }
}
</style>
