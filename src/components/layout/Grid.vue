<script setup>
/*
  Grid – lays its children out in columns.

  Fixed columns (collapse automatically on smaller screens):
    <Grid :cols="3" gap="lg"> ... </Grid>
      3+ columns -> 2 columns below 900px -> 1 column below 650px
      2 columns  -> 1 column below 650px

  Custom widths (any CSS column sizes, one per column; 1 column below 650px):
    <Grid cols="1fr 200px"> ... </Grid>          text + fixed-width sidebar
    <Grid cols="2fr 1fr"> ... </Grid>            two-thirds / one-third
    <Grid cols="1fr minmax(140px, 20%)"> ... </Grid>
      A bare "fr" size like 2fr is treated as minmax(0, 2fr), so long words
      or wide images can't push a column wider than its share.

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
  // A number (or "3") for equal columns, or a list of CSS column sizes.
  cols: { type: [Number, String], default: 2 },
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

// "3" and 3 both mean three equal columns; anything else is a custom list.
const count = computed(() =>
  /^\s*\d+\s*$/.test(String(props.cols)) ? Number(props.cols) : null,
);

// Wrap bare fr sizes ("2fr", not the one inside "minmax(0, 1fr)") so content
// can't stretch a column past its share.
const template = computed(() =>
  String(props.cols)
    .trim()
    .replace(/(^|\s)(\d*\.?\d+fr)(?=\s|$)/g, "$1minmax(0, $2)"),
);

const mode = computed(() =>
  props.min ? "auto" : count.value !== null ? "fixed" : "custom",
);

const style = computed(() => {
  if (mode.value === "auto") return { "--grid-min": props.min };
  if (mode.value === "custom") return { "--grid-template": template.value };
  return {
    "--grid-cols": count.value,
    "--grid-cols-md": Math.min(count.value, 2),
  };
});
</script>

<template>
  <component
    :is="tag"
    class="grid"
    :class="[
      `grid--gap-${gap}`,
      `grid--align-${align}`,
      `grid--${mode}`,
    ]"
    :style="style"
  >
    <slot />
  </component>
</template>

<style scoped>
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

.grid--custom {
  grid-template-columns: var(--grid-template);
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
  .grid--fixed,
  .grid--custom {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
