<script setup>
import ContentBox from "./ContentBox.vue";

const props = defineProps({
  title: { type: String, default: "" },
  borderColor: { type: String, default: "var(--green)" },
  titleColor: { type: String, default: "var(--text)" },
  tag: { type: String, default: "div" },
});
</script>

<template>
  <ContentBox :tag="tag" class="box" :style="{ '--box-color': borderColor }">
    <span
      v-if="title"
      class="title"
      :style="{ background: borderColor, color: titleColor }"
      >{{ title }}</span
    >
    <slot />
  </ContentBox>
</template>

<style scoped>
:where(.box) {
  position: relative;
  margin: 10px 0 18px;
  padding: 28px 20px 16px;

  background: var(--paper);

  border: 2px solid var(--line);
  border-top: 4px solid var(--box-color, var(--blue));
  border-radius: 16px;

  color: var(--text);

  font-weight: 700;
  line-height: 1.55;
}

.title {
  position: absolute;
  top: -16px;
  left: 16px;

  text-transform: uppercase;

  padding: 4px 12px;

  background: var(--blue);

  border: 2px solid var(--line);
  border-radius: 999px;

  color: var(--text);

  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}
</style>
