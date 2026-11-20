<script setup>
defineProps({
  tag: { type: String, default: "div" },
});
</script>

<template>
  <component :is="tag" class="content-box">
    <div v-if="$slots.eyebrow" class="intro-eyebrow">
      <slot name="eyebrow" />
    </div>
    <slot />
  </component>
</template>

<style scoped>
:where(.content-box) {
  border-radius: var(--radius-large);
  color: var(--muted);
  display: block;
  padding: 20px;
  margin-bottom: 20px;
  background: white;
  border: var(--border-medium);
  box-shadow: var(--shadow-medium);

  animation: pop-fade-in 0.5s ease;
}
.intro-eyebrow {
  margin: 0 0 7px;

  color: var(--accent-text);

  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
