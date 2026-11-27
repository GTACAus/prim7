<script setup>
import ContentBox from "@/components/ui/ContentBox.vue";
</script>

<template>
  <ContentBox class="intro-card">
    <div class="intro-eyebrow">
      <slot name="eyebrow" />
    </div>
    <slot name="content" />
  </ContentBox>
</template>

<style scoped>
.intro-card {
  position: relative;
}

.intro-card::before {
  content: "";
  display: block;

  width: 54%;
  margin: 0 0 18px;

  border-top: 3px dashed var(--marker-2);
}

.intro-card h2 {
  margin: 0 0 9px;

  color: var(--text);

  font-size: 1.25rem;
  font-weight: 700;
}

.intro-eyebrow {
  margin: 0 0 7px;

  color: var(--accent-text);

  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.intro-card p {
  color: var(--muted);
  line-height: 1.6;
}
</style>
