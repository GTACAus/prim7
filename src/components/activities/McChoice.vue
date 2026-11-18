<script setup>
/*
  One choice inside an <McQuestion>. A button by default; when picked it gets
  the selected class plus the correct or incorrect class (renamable through
  <MultipleChoice :classes>).

    <McChoice value="basketballs" class="ball-pair-card" v-slot="{ selected, correct }">
      ...
    </McChoice>
*/
import { computed, inject } from "vue";

const props = defineProps({
  value: { type: String, required: true },
  tag: { type: String, default: "button" },
});

const mc = inject("multipleChoice");
const question = inject("mcQuestion");

const selected = computed(() => mc.picked.value[question.key] === props.value);
// with no answer on the question, every choice is right
const correct = computed(() => !question.answer || props.value === question.answer);

const stateClass = computed(() => {
  if (!selected.value) return null;
  const c = mc.classNames.value;
  if (!question.answer) return c.selected;
  return [c.selected, correct.value ? c.correct : c.incorrect];
});
</script>

<template>
  <component
    :is="tag"
    :type="tag === 'button' ? 'button' : undefined"
    :class="stateClass"
    :aria-pressed="selected"
    @click="mc.select(question, value)"
  >
    <slot :selected="selected" :correct="correct" />
  </component>
</template>
