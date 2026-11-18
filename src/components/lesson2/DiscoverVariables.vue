<script setup>
/*
  Lesson 2 "discover possible variables": type the variables you can spot on a
  mind-map image (a box laid over each spot), then list them again in a grid.

    <DiscoverVariables image="../images/lesson2/l2-stw.png" image-alt="...">
      <template #intro> instructions above the image </template>
      <template #between> instructions between the image and the grid </template>
    </DiscoverVariables>

  Every box is a <StudentEntry> that takes one answer. Nothing has to be
  filled in, so the activity is always complete. The answers are saved
  through <Activity :state>.
*/
import { ref } from "vue";
import Activity from "../activities/Activity.vue";
import StudentEntry from "../StudentEntry.vue";

const props = defineProps({
  image: { type: String, required: true },
  imageAlt: { type: String, default: "" },
  overlays: { type: Number, default: 9 },
  cards: { type: Number, default: 9 },
});

const emptyLists = (n) => Array.from({ length: n }, () => []);

// Saved progress: one answer list per box
const overlayAnswers = ref(emptyLists(props.overlays));
const cardAnswers = ref(emptyLists(props.cards));
const state = { overlayAnswers, cardAnswers }; // the refs themselves, so <Activity> can restore them

function reset() {
  overlayAnswers.value = emptyLists(props.overlays);
  cardAnswers.value = emptyLists(props.cards);
}

defineExpose({ reset });
</script>

<template>
  <Activity :complete="true" :state="state" @reset="reset">
    <slot name="intro" />

    <div class="hook-image-box variable-image-box">
      <div class="variable-image-stage">
        <img
          :src="image"
          :alt="imageAlt"
          class="hook-image variable-background-image"
        />

        <div
          v-for="(answers, i) in overlayAnswers"
          :key="i"
          class="variable-overlay-entry"
          :class="'variable-overlay-' + (i + 1)"
        >
          <StudentEntry
            v-model:answers="overlayAnswers[i]"
            :multiple-inputs="false"
            :max="1"
            :maxlength="24"
            :input-id="'imageVariable' + (i + 1)"
            placeholder="Type here"
            :aria-label="'Add image variable ' + (i + 1)"
            row-class="variable-entry-input-row"
            list-class="variable-entry-answer"
            :list-id="'imageVariable' + (i + 1) + 'Answer'"
          />
        </div>
      </div>
    </div>

    <slot name="between" />

    <div class="variable-grid">
      <div
        v-for="(answers, i) in cardAnswers"
        :key="i"
        class="variable-entry-card"
      >
        <label :for="'variable' + (i + 1)">Variable {{ i + 1 }}</label>
        <StudentEntry
          v-model:answers="cardAnswers[i]"
          :multiple-inputs="false"
          :max="1"
          :input-id="'variable' + (i + 1)"
          placeholder="Type here"
          row-class="variable-entry-input-row"
          list-class="variable-entry-answer"
          :list-id="'variable' + (i + 1) + 'Answer'"
        />
      </div>
    </div>
  </Activity>
</template>

<style>
/* Plain (not scoped): these also style the inputs and answers that
   <StudentEntry> renders inside each box. */
.hook-image-box {
  min-height: 500px;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--soft-blue);
  border: 2px dashed var(--line);
  border-radius: 20px;
  color: var(--muted);
  text-align: center;
}

.hook-image-placeholder {
  max-width: 360px;
  line-height: 1.6;
}

.hook-image-placeholder .placeholder-icon {
  display: block;
  margin-bottom: 12px;
  font-size: 4rem;
}

.variable-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.variable-entry-card {
  min-height: 120px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  border: 2px solid var(--line);
  border-radius: 18px;
  background: var(--soft-green);
  box-shadow: 0 4px 0 rgba(48, 51, 47, 0.18);
}

.variable-entry-card label {
  font-weight: 700;
  color: var(--text);
}

/* ==================================================
   ENTRIES (box and saved answer)
   No look of their own here: they just fill their spot, and a saved
   answer puts its × on the right.
      ================================================== */

/* the answer can sit in the list (cards) or in place of the box (image) */
.variable-entry-input-row,
.variable-entry-input-row input,
.variable-entry-answer,
:is(.variable-overlay-entry, .variable-entry-card) .ir-answer {
  box-sizing: border-box;
  width: 100%;
  max-width: none;
}

:is(.variable-overlay-entry, .variable-entry-card) .ir-answer {
  display: flex;
  align-items: center;
  gap: 6px;
}

:is(.variable-overlay-entry, .variable-entry-card) .ir-answer > span {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.variable-entry-card .ir-answer {
  --background: white;
}
/* ==================================================
   DISCOVER VARIABLES — IMAGE OVERLAY INPUTS
   ================================================== */

.variable-image-box {
  padding: 4px;
  margin-bottom: 20px;
}

.variable-image-stage {
  position: relative;

  width: min(100%, 1450px);
  aspect-ratio: 1648 / 928;

  margin: 0 auto;
}

.variable-background-image {
  display: block;

  width: 100%;
  height: 100%;
  max-height: none;

  object-fit: contain;
}

.variable-overlay-entry {
  position: absolute;
  z-index: 2;

  width: 18.6%;
  height: 6.8%;
}

.variable-overlay-entry > * {
  position: absolute;
}

/* on the image, the box and the answer fill the whole overlay spot */
.variable-overlay-entry .variable-entry-input-row,
.variable-overlay-entry input,
.variable-overlay-entry .variable-entry-answer,
.variable-overlay-entry .ir-answer {
  height: 100%;
}

.variable-overlay-1 {
  top: 9.9%;
  left: 77.8%;
}

.variable-overlay-2 {
  top: 17.8%;
  left: 77.8%;
}

.variable-overlay-3 {
  top: 25.6%;
  left: 78%;
}

.variable-overlay-4 {
  top: 33.5%;
  left: 77.8%;
}

.variable-overlay-5 {
  top: 41.1%;
  left: 77.8%;
}

.variable-overlay-6 {
  top: 48.8%;
  left: 77.8%;
}

.variable-overlay-7 {
  top: 56.5%;
  left: 77.8%;
}

/*
  Skip the two Drop Height boxes.
  They already contain 1.5m and 1.0m.
*/

.variable-overlay-8 {
  top: 80.4%;
  left: 77.8%;
}

.variable-overlay-9 {
  top: 88.3%;
  left: 77.8%;
}

.hook-image {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  max-height: 650px;
  object-fit: contain;
}
</style>
