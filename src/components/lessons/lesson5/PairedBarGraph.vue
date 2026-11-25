<script setup>
/*
  Lesson 5 Part D graph: a pair of bars (Site 1, Site 2) for each animal.

    <PairedBarGraph svg-id="partDGraphSvg" :values="{ site1: [...], site2: [...] }"
                    show-difference />

  values: the height of each bar, per site. show-difference adds the marker
  showing the gap between the two Leadbeater's Possum bars.
*/
import { computed } from "vue";
import BarGraphFrame from "./BarGraphFrame.vue";
import { BOTH_SITES, PLOT, barBox, formatNumber, yOf } from "./barGraph.js";

const props = defineProps({
  svgId: { type: String, default: "" },
  values: { type: Object, required: true },
  showDifference: { type: Boolean, default: false },
});

const BAR_WIDTH = 38;
const PAIR_GAP = 4;

function barX(site, index) {
  const centre = PLOT.centres[index];
  return site === "site1" ? centre - PAIR_GAP / 2 - BAR_WIDTH : centre + PAIR_GAP / 2;
}

// the gap between the two Leadbeater's Possum bars
const difference = computed(() => {
  const lead = BOTH_SITES[0];
  const x = PLOT.centres[0] + BAR_WIDTH + 16;
  const a = yOf(lead.site1);
  const b = yOf(lead.site2);
  const top = Math.min(a, b);
  const bottom = Math.max(a, b);
  return { x, top, bottom, middle: (top + bottom) / 2, text: formatNumber(Math.abs(lead.site1 - lead.site2)) };
});
</script>

<template>
  <BarGraphFrame
    :svg-id="svgId"
    aria-label="Paired bar graph comparing average animal counts at Site 1 and Site 2"
    :items="BOTH_SITES"
    x-label="Type of animal"
    y-label="Number of animals (per hectare)"
  >
    <template v-for="site in ['site1', 'site2']" :key="site">
      <rect
        v-for="(item, i) in BOTH_SITES"
        :key="site + i"
        :class="`partd-${site}-bar`"
        :x="barX(site, i)"
        :y="barBox(values[site][i]).y"
        :width="BAR_WIDTH"
        :height="barBox(values[site][i]).height"
        rx="4"
      />
    </template>

    <g class="partd-difference-marker" :class="{ visible: showDifference }" aria-hidden="true">
      <template v-if="showDifference">
        <line class="partd-difference-line" :x1="difference.x" :x2="difference.x" :y1="difference.top" :y2="difference.bottom" />
        <line
          v-for="y in [difference.top, difference.bottom]"
          :key="y"
          class="partd-difference-line"
          :x1="difference.x - 6"
          :x2="difference.x + 6"
          :y1="y"
          :y2="y"
        />
        <rect class="partd-difference-badge" :x="difference.x - 23" :y="difference.middle - 15" width="46" height="30" rx="9" />
        <text class="partd-difference-text" :x="difference.x" :y="difference.middle">{{ difference.text }}</text>
      </template>
    </g>
  </BarGraphFrame>
</template>

<style scoped>

#partDGraphSvg .partd-difference-marker.visible {
  opacity: 1;
}

#partDGraphSvg .partd-difference-line {
  stroke: var(--orange);
  stroke-width: 3;
  stroke-linecap: round;
}

#partDGraphSvg .partd-difference-badge {
  fill: var(--soft-orange);
  stroke: var(--orange);
  stroke-width: 2.5;
}

#partDGraphSvg .partd-difference-text {
  fill: var(--charcoal);
  font-size: 16px;
  font-weight: 800;
  text-anchor: middle;
  dominant-baseline: middle;
}
</style>
