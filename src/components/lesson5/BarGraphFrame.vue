<script setup>
/*
  The frame every Lesson 5 bar graph is drawn on (760 x 500 viewBox): grid
  lines, axes, y-axis numbers, the two-line category names and the axis
  titles. Bars, guides and labels go in the #default slot (inside the <svg>,
  drawn on top); HTML laid over the graph (axis drop slots) in #overlay.

    <BarGraphFrame svg-id="partCGraphSvg" :items="SITE_2"
                   x-label="Type of animal" y-label="Number of animals">
      <rect v-for="..." ... />                         <!-- the bars -->
      <template #overlay><DropSlot class="axis-slot axis-slot-x" ... /></template>
    </BarGraphFrame>

  Props
  - items: [{ short: [line1, line2] }] - one category per bar position.
  - x-label / y-label / y-unit: axis titles (y-unit is added after y-label).
  - label-class + labels-visible: extra class on the axis titles, plus
    "visible" while labels-visible (Part B / C reveal them once placed);
    { x, y } sets each title separately.
  - scale-class + scale-visible: class on the group holding the grid, numbers
    and categories, plus "visible" (Part C hides its scale until set up).
  - choices: a class prefix (e.g. "partb") to make the y-axis numbers and the
    categories clickable: emits choose-x(index) / choose-y(value). active-x,
    active-y, flash-y, complete-x and highlight-x style them.
  - category-class / category-attrs(index): for plain (non-clickable)
    categories; complete-x adds "complete" to them.
  @svg-click gets { x, y } in SVG units for clicks on the graph itself.
*/
import { computed, onBeforeUnmount, onMounted, ref, useSlots } from "vue";
import { PLOT, yOf } from "./barGraph.js";

const props = defineProps({
  svgId: { type: String, default: "" },
  ariaLabel: { type: String, default: "" },
  items: { type: Array, required: true },
  plot: { type: Object, default: () => PLOT },
  xLabel: { type: String, default: "" },
  yLabel: { type: String, default: "" },
  yUnit: { type: String, default: "" },
  labelClass: { type: String, default: "" },
  labelsVisible: { type: [Boolean, Object], default: true },
  scaleClass: { type: String, default: "" },
  scaleVisible: { type: Boolean, default: true },
  choices: { type: String, default: "" },
  activeX: { type: Number, default: null },
  activeY: { type: Number, default: null },
  flashY: { type: Number, default: null },
  completeX: { type: Array, default: () => [] },
  highlightX: { type: Array, default: () => [] },
  categoryClass: { type: String, default: "tick-label" },
  categoryAttrs: { type: Function, default: () => ({}) },
});

const emit = defineEmits(["choose-x", "choose-y", "svg-click"]);

const svg = ref(null);
const wrap = ref(null);

const labelVisible = computed(() =>
  typeof props.labelsVisible === "object"
    ? props.labelsVisible
    : { x: props.labelsVisible, y: props.labelsVisible },
);

// HTML laid over the graph (the axis drop slots) scales its text with the
// graph, which scales with its width.
const fontSize = ref("");
let observer = null;
const slots = useSlots();
onMounted(() => {
  if (!slots.overlay || typeof ResizeObserver !== "function") return;
  observer = new ResizeObserver(() => {
    const width = wrap.value?.clientWidth ?? 0;
    fontSize.value = Math.max(9, Math.min(14, width * 0.021)) + "px";
  });
  observer.observe(wrap.value);
});
onBeforeUnmount(() => observer?.disconnect());

const ticks = computed(() =>
  Array.from({ length: props.plot.maxY + 1 }, (_, value) => ({
    value,
    y: yOf(value, props.plot),
  })),
);

function onKey(event, handler) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handler();
  }
}

// a click in SVG units, ignoring clicks on the axis choices
function onClick(event) {
  if (props.choices && event.target.closest?.(`.${props.choices}-x-choice, .${props.choices}-y-choice`)) return;
  const el = svg.value;
  const matrix = el?.getScreenCTM();
  if (!matrix) return;
  const point = el.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const { x, y } = point.matrixTransform(matrix.inverse());
  emit("svg-click", { x, y });
}
</script>

<template>
  <div ref="wrap" class="graph-svg-wrap" :style="{ fontSize }">
    <svg
      :id="svgId || undefined"
      ref="svg"
      class="graph-svg"
      viewBox="0 0 760 500"
      role="img"
      :aria-label="ariaLabel"
      @click="onClick"
    >
      <rect x="0" y="0" width="760" height="500" rx="18" fill="white" />

      <g :class="[scaleClass, { visible: scaleVisible }]" aria-hidden="true">
        <!-- grid -->
        <line
          v-for="tick in ticks"
          :key="'grid' + tick.value"
          class="graph-grid-line"
          :x1="plot.left"
          :x2="plot.right"
          :y1="tick.y"
          :y2="tick.y"
        />

        <!-- y-axis numbers -->
        <template v-for="tick in ticks" :key="'tick' + tick.value">
          <g
            v-if="choices"
            :class="[
              `${choices}-y-choice`,
              { active: activeY === tick.value, 'try-again': flashY === tick.value },
            ]"
            tabindex="0"
            role="button"
            :aria-label="`Choose ${tick.value} on the y-axis`"
            @click="emit('choose-y', tick.value)"
            @keydown="onKey($event, () => emit('choose-y', tick.value))"
          >
            <rect :class="`${choices}-y-hit`" x="68" :y="tick.y - 14" width="48" height="28" rx="6" />
            <text class="tick-label" x="103" :y="tick.y + 4" text-anchor="end">{{ tick.value }}</text>
          </g>
          <text v-else class="tick-label" x="103" :y="tick.y + 4" text-anchor="end">
            {{ tick.value }}
          </text>
        </template>

        <!-- categories -->
        <template v-for="(item, index) in items" :key="'cat' + index">
          <g
            v-if="choices"
            :class="[
              `${choices}-x-choice`,
              {
                active: activeX === index,
                complete: completeX.includes(index),
                'analysis-highlight': highlightX.includes(index),
              },
            ]"
            tabindex="0"
            role="button"
            :aria-label="`Choose ${item.label} on the x-axis`"
            @click="emit('choose-x', index)"
            @keydown="onKey($event, () => emit('choose-x', index))"
          >
            <rect :class="`${choices}-x-hit`" :x="plot.centres[index] - 52" y="373" width="104" height="55" rx="6" />
            <text class="tick-label" :x="plot.centres[index]" y="394" text-anchor="middle">
              <tspan :x="plot.centres[index]" dy="0">{{ item.short[0] }}</tspan>
              <tspan :x="plot.centres[index]" dy="14">{{ item.short[1] }}</tspan>
            </text>
          </g>
          <text
            v-else
            :class="[categoryClass, { complete: completeX.includes(index) }]"
            :x="plot.centres[index]"
            y="394"
            text-anchor="middle"
            v-bind="categoryAttrs(index)"
          >
            <tspan :x="plot.centres[index]" dy="0">{{ item.short[0] }}</tspan>
            <tspan :x="plot.centres[index]" dy="14">{{ item.short[1] }}</tspan>
          </text>
        </template>
      </g>

      <line class="graph-axis" :x1="plot.left" :y1="plot.bottom" x2="715" :y2="plot.bottom" />
      <line class="graph-axis" :x1="plot.left" :y1="plot.bottom" :x2="plot.left" y2="35" />

      <text
        v-if="xLabel"
        class="axis-label"
        :class="[labelClass, { visible: labelVisible.x }]"
        x="415"
        y="470"
        text-anchor="middle"
      >
        {{ xLabel }}
      </text>
      <text
        v-if="yLabel"
        class="axis-label"
        :class="[labelClass, { visible: labelVisible.y }]"
        x="32"
        y="205"
        text-anchor="middle"
        transform="rotate(-90 32 205)"
      >
        {{ yLabel }}<tspan v-if="yUnit">{{ yUnit }}</tspan>
      </text>

      <slot />
    </svg>

    <slot name="overlay" />
  </div>
</template>
