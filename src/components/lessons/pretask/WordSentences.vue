<script setup>
// "Plant Science" fill-in-the-blank sentences with a shared word bank (pre-task, diagram section).
import DragDrop from "../../activities/DragDrop.vue";
import DropSlot from "../../activities/DropSlot.vue";
import DragItem from "../../activities/DragItem.vue";
</script>

<template>
  <DragDrop
    id="wordSentencesActivity"
    class="word-sentences-activity dd-activity"
    strict
    v-slot="{ done, reset }"
  >
    <header class="wd-header">
      <h3 class="wd-title">Plant Science</h3>
      <p class="wd-subtitle">
        Drag the correct words into the blanks to complete each
        sentence.
      </p>
    </header>

    <div class="">
      <div class="sentence-card">
        Plants make sugar to get energy to grow. This occurs in the
        leaves using
        <DropSlot
          tag="span"
          class="drop-zone"
          name="s0-a"
          answer="sunlight carbon-dioxide water"
        />,
        <DropSlot
          tag="span"
          class="drop-zone"
          name="s0-b"
          answer="sunlight carbon-dioxide water"
        />, and
        <DropSlot
          tag="span"
          class="drop-zone"
          name="s0-c"
          answer="sunlight carbon-dioxide water"
        />.
      </div>
      <div class="sentence-card">
        Roots grow through
        <DropSlot
          tag="span"
          class="drop-zone"
          name="s1-a"
          answer="soil"
        />
        and this helps to keep the plant anchored.
      </div>
      <div class="sentence-card">
        <DropSlot
          tag="span"
          class="drop-zone"
          name="s2-a"
          answer="water"
        />
        moves from soil to roots, travels up the stem, and evaporates
        from the leaves. This helps the plant stay upright.
      </div>
      <div class="sentence-card">
        <DropSlot
          tag="span"
          class="drop-zone"
          name="s3-a"
          answer="nutrients"
        />
        in the soil are dissolved in water and enter the roots to
        travel around the plant.
      </div>
      <div class="sentence-card">
        <DropSlot
          tag="span"
          class="drop-zone"
          name="s4-a"
          answer="oxygen"
        />
        is found in pores in the soil and is needed to keep roots
        healthy. If plants are over-watered, they don't get enough
        oxygen.
      </div>
    </div>

    <div class="wd-word-bank">
      <p class="wd-word-bank-label">Word Bank</p>
      <div data-dd-tray class="word-tray">
        <DragItem
          tag="span"
          class="word-chip"
          name="sunlight"
          reusable
          >sunlight</DragItem
        >
        <DragItem
          tag="span"
          class="word-chip"
          name="carbon-dioxide"
          reusable
          >carbon dioxide</DragItem
        >
        <DragItem tag="span" class="word-chip" name="water" reusable
          >water</DragItem
        >
        <DragItem tag="span" class="word-chip" name="soil" reusable
          >soil</DragItem
        >
        <DragItem
          tag="span"
          class="word-chip"
          name="nutrients"
          reusable
          >nutrients</DragItem
        >
        <DragItem tag="span" class="word-chip" name="oxygen" reusable
          >oxygen</DragItem
        >
      </div>
    </div>

    <div class="wd-actions">
      <button
        type="button"
        class="general-button reset-btn"
        @click="reset"
      >
        Reset
      </button>
    </div>

    <div id="wordSentencesCelebration" v-if="done">Well done!</div>
  </DragDrop>
</template>

<style>
/* Moved from styles/pretask_styles/word_drag_and_drop.css. Not scoped: the drag ghost lives on <body>. */

#wordSentencesActivity {
  --dd-accent: #22c55e;
  --dd-slot-hover-bg: #dcfce7;
  --dd-slot-hover-scale: 1.05;
  --dd-reject: #ef4444;
}

#wordSentencesActivity .wd-header {
  margin-bottom: 1rem;
  text-align: center;
}

#wordSentencesActivity .wd-word-bank {
  margin-bottom: 1.5rem;
}

#wordSentencesActivity .wd-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

#wordSentencesActivity .wd-title {
  margin-bottom: 0.5rem;
  line-height: 2.25rem;
  color: rgb(6, 78, 59);
  font-size: 32px;
  font-weight: 700;
  font-style: normal;
}

#wordSentencesActivity .wd-subtitle {
  color: rgb(6, 95, 70);
  font-size: 16px;
  font-weight: 400;
  font-style: normal;
}

#wordSentencesActivity .wd-word-bank-label {
  margin-bottom: 0.75rem;
  color: rgb(6, 78, 59);
  font-size: 18px;
  font-weight: 700;
  font-style: normal;
}

#wordSentencesActivity .sentence-card {
  line-height: 2.2;
  width: 100%;
  max-width: 800px;
  box-sizing: border-box;
  margin: 0 auto;
  text-align: left;
}

/* ---------- blanks (data-dd-slot) ---------- */

#wordSentencesActivity [data-dd-slot] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 36px;
  border: 2px dashed #86efac;
  border-radius: 8px;
  margin: 0 4px;
  vertical-align: middle;
  background: rgba(255, 255, 255, 0.6);
}

#wordSentencesActivity [data-dd-slot].dd-filled {
  border: 2px solid var(--green);
  background: transparent;
}

/* The blank rule above outranks the base hover state, so restate it here
   to let --dd-accent and --dd-slot-hover-bg apply. */
#wordSentencesActivity [data-dd-slot].dd-hover,
#wordSentencesActivity.dd-has-selection [data-dd-slot]:not(.dd-filled):hover {
  border-color: var(--dd-accent);
  background: var(--dd-slot-hover-bg);
}

/* strictSlots: brief red flash when a dropped word doesn't belong here. */
#wordSentencesActivity [data-dd-slot].dd-rejected {
  border-color: var(--dd-reject);
  background: #fee2e2;
}

/* ---------- word bank (data-dd-tray / data-dd-item) ---------- */

#wordSentencesActivity [data-dd-tray] {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  width: 100%;
  max-width: 800px;
  box-sizing: border-box;
  margin: 0 auto;
  justify-content: center;
}

#wordSentencesActivity [data-dd-item],
.word-chip.dd-ghost, [data-dd-item].dd-ghost,
#wordSentecesActivity [data-dd-item].dd-placed {
  --background: white;
  --border: 2px solid #065f46;
  --border-radius: 8px;
  --padding: 8px 16px;
  display: inline-block;
  width: auto;
  height: auto;
  padding: var(--padding);
  background: var(--background);
  border: var(--border);
  color: var(--charcoal);
  border-radius: var(--border-radius);
  font-weight: 500;
  transition: transform 0.15s, opacity 0.15s, background 0.15s;
}

#wordSentencesActivity [data-dd-item]:not(.dd-placed):active {
  transform: scale(0.95);
}

#wordSentencesActivity [data-dd-item]:not(.dd-placed):hover {
  background: var(--soft-green);
  transform: scale(1.05);
}

/* A word sitting in a blank reads like filled-in text, not a loose chip. */
#wordSentencesActivity [data-dd-item].dd-placed {
  background: transparent;
  color: #065f46;
  border: none;
  font-size: 14px;
  box-shadow: none;
}

/* The ghost lives on <body>, outside #wordSentencesActivity, so it can't be
   scoped by that id; it keeps the item's .word-chip class instead. */
.word-chip.dd-ghost {
  background: var(--soft-green);
}

@keyframes bounce-once {
  0% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0); }
}

#wordSentencesCelebration {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 2.25rem;
  line-height: 2.5rem;
}

#wordSentencesCelebration:not([hidden]) {
  animation: bounce-once 0.6s ease-in-out;
}

/* From the old pretask.css, which loaded after the rules above. */
.drop-zone {
  transition:
    transform 0.2s,
    opacity 0.2s;
}
</style>
