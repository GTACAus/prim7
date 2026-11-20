<script setup>
/*
  Mission 2: match each highlighted part of the rust experiment to its
  scientific symbol. Each round has its own options; the right one flashes
  green, adds its piece to the diagram and moves on to the next round. A
  wrong one shakes and emits "incorrect".

    <RustSymbolMatch v-model:index="state.selections.rustSymbolMatchTest.index"
                     @incorrect="..." />

  index = how many rounds have been matched (saved by the page).
*/
import { computed, onBeforeUnmount, ref } from "vue";
import { RUST_SYMBOL_ROUNDS } from "./expedition.js";
import RustDiagram from "./RustDiagram.vue";

const ADVANCE_DELAY = 450; // ms the correct flash shows before the next round
const INCORRECT_FLASH = 600;

const props = defineProps({
  index: { type: Number, default: 0 },
});
const emit = defineEmits(["update:index", "incorrect"]);

const rounds = RUST_SYMBOL_ROUNDS;
const complete = computed(() => props.index >= rounds.length);
const round = computed(() => rounds[props.index]);

const correctId = ref(null);
const wrongId = ref(null);
let timer = null;

function choose(option) {
  if (complete.value || correctId.value) return;
  if (option.correct) {
    correctId.value = option.id;
    timer = setTimeout(() => {
      correctId.value = null;
      emit("update:index", props.index + 1);
    }, ADVANCE_DELAY);
    return;
  }
  wrongId.value = null;
  requestAnimationFrame(() => (wrongId.value = option.id)); // restart the shake
  clearTimeout(timer);
  timer = setTimeout(() => (wrongId.value = null), INCORRECT_FLASH);
  emit("incorrect", option.id);
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="item-match-activity">
    <!-- the diagram fills in with each correctly matched symbol -->
    <div class="item-match-diagram-frame">
      <RustDiagram
        class="item-match-diagram"
        view-box="0 0 240 220"
        :pieces="index"
        aria-label="Rust experiment diagram, built up as parts are matched"
      />
      <p v-if="index === 0" class="item-match-diagram-placeholder">
        Match each highlighted part to build the diagram.
      </p>
    </div>

    <div class="item-match-row">
      <!-- the highlighted part of the experiment to match -->
      <div class="dd-reference item-match-reference">
        <span class="dd-caption">
          <span>{{ complete ? "All parts matched" : round.label }}</span>
          ·
          <span>{{
            complete
              ? `${rounds.length} of ${rounds.length} · complete`
              : `${index + 1} of ${rounds.length}`
          }}</span>
        </span>
        <div
          v-if="!complete"
          data-im-prompt-content
          v-html="round.promptHtml"
        ></div>
      </div>

      <!-- this round's symbol choices -->
      <div
        class="item-match-options"
        role="group"
        aria-label="Scientific symbol choices"
      >
        <template v-if="!complete">
          <button
            v-for="option in round.options"
            :key="round.id + option.id"
            type="button"
            class="item-match-option"
            :class="{
              correct: correctId === option.id,
              incorrect: wrongId === option.id,
            }"
            :disabled="Boolean(correctId)"
            :aria-label="option.label"
            @click="choose(option)"
            v-html="option.html"
          ></button>
        </template>
      </div>
    </div>
  </div>
</template>
