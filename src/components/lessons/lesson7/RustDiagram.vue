<script setup>
/*
  The rust-experiment diagram built from the scientific symbols matched so
  far: the first `pieces` rounds of RUST_SYMBOL_ROUNDS, each drawn where it
  belongs. Shared by the symbol-matching stage and the labelling stage.
*/
import { RUST_SYMBOL_ROUNDS } from "./expedition.js";

defineProps({
  pieces: { type: Number, default: RUST_SYMBOL_ROUNDS.length },
  viewBox: { type: String, required: true },
});
</script>

<template>
  <svg :viewBox="viewBox" role="img">
    <g
      v-for="round in RUST_SYMBOL_ROUNDS.slice(0, pieces)"
      :key="round.id"
      class="im-diagram-piece"
      :transform="round.diagramTransform"
      v-html="round.diagramHtml"
    ></g>
  </svg>
</template>
