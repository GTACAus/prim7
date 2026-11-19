<script setup>
/*
  Grid – lays its children out in equal columns.

  Fixed columns (collapse automatically on smaller screens):
    <Grid :cols="3" gap="lg"> ... </Grid>
      3+ columns -> 2 columns below 900px -> 1 column below 650px
      2 columns  -> 1 column below 650px

  Auto-fill (as many columns as fit, each at least `min` wide):
    <Grid min="190px" gap="md"> ... </Grid>

  gap: "sm" (12px) | "md" (16px) | "lg" (22px)
  align: how items sit in their row - "stretch" (default: items in a row
    are all as tall as the tallest) | "start" | "center" | "end" (items keep
    their own height).
  tag: element to render (default "div"), e.g. "ul" or "section".

  Grid only handles columns and gaps. Spacing around the grid (margins)
  belongs to the page, so add a class for that if it's needed.
  A child can still span the full row with `grid-column: 1 / -1`.
*/
import { computed } from "vue";

const props = defineProps({
  cols: { type: Number, default: 2 },
  min: { type: String, default: "" },
  gap: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  align: {
    type: String,
    default: "stretch",
    validator: (value) => ["stretch", "start", "center", "end"].includes(value),
  },
  tag: { type: String, default: "div" },
});

const style = computed(() =>
  props.min
    ? { "--grid-min": props.min }
    : { "--grid-cols": props.cols, "--grid-cols-md": Math.min(props.cols, 2) },
);
</script>

<template>
  <component
    :is="tag"
    class="grid"
    :class="[
      `grid--gap-${gap}`,
      `grid--align-${align}`,
      min ? 'grid--auto' : 'grid--fixed',
    ]"
    :style="style"
  >
    <slot />
  </component>
</template>

<style>
.grid {
  display: grid;
}

.grid--gap-sm {
  gap: 12px;
}

.grid--gap-md {
  gap: 16px;
}

.grid--gap-lg {
  gap: 22px;
}

.grid--align-stretch {
  align-items: stretch;
}

.grid--align-start {
  align-items: start;
}

.grid--align-center {
  align-items: center;
}

.grid--align-end {
  align-items: end;
}

.grid--fixed {
  grid-template-columns: repeat(var(--grid-cols), minmax(0, 1fr));
}

.grid--auto {
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(var(--grid-min), 100%), 1fr)
  );
}

@media (max-width: 900px) {
  .grid--fixed {
    grid-template-columns: repeat(var(--grid-cols-md), minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .grid--fixed {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
