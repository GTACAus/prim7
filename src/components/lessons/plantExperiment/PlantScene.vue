<script setup>
/*
  One plant's setup drawn as a picture (classroom pot or Tiny Farm tray).

    <PlantScene letter="A" mode="classroom" :values="setupA" />

  values: every variable's setting for this plant (see plantData.js).
  The picture shows the setup, NOT a predicted result.
*/
import { computed } from "vue";
import {
  IMAGE_FRAMES,
  VARIABLES,
  VISUAL_ASSETS,
  labelFor,
  variablesFor,
} from "./plantData.js";

const props = defineProps({
  letter: { type: String, required: true },
  mode: { type: String, default: "classroom" },
  values: { type: Object, required: true },
});

const uid = computed(() => `pk-${props.letter.toLowerCase()}`);
const tiny = computed(() => props.mode === "tinyFarms");

const ariaLabel = computed(
  () =>
    `Plant ${props.letter}${tiny.value ? " in a Tiny Farm" : ""}: ` +
    variablesFor(props.mode)
      .map((key) => `${VARIABLES[key].label}: ${labelFor(key, props.values[key])}`)
      .join("; "),
);

/* ---------- Classroom ---------- */
const dark = computed(() => props.values.lightExposure === "cupboard");
const backdrop = computed(() => VISUAL_ASSETS.backgrounds[props.values.lightExposure]);
const backdropFrame = computed(
  () => IMAGE_FRAMES.backgrounds[props.values.lightExposure],
);
const large = computed(() => props.values.potSize === "large");
const full = computed(() => props.values.soilFill === "full");
const rimWidth = computed(() => (large.value ? 143 : 108));
const pot = computed(
  () =>
    VISUAL_ASSETS.potAndSoil[
      `${props.values.potSize}-${props.values.potMaterial}-${props.values.soilFill}-${props.values.soilType}`
    ],
);
const potFrame = computed(() => IMAGE_FRAMES.pot[props.values.potSize]);
const soilTop = computed(() => (full.value ? 183 : 219));

// The pot images have transparent padding above the soil, so the small pot's
// seedling sits lower and the stem is extended down into the soil.
const seedlingDrop = computed(() => (large.value ? 0 : full.value ? 34 : 20));
const stemExtension = computed(() =>
  large.value ? (full.value ? 18 : 26) : full.value ? 6 : 11,
);

/* ---------- Tiny Farms ---------- */
const lightColour = computed(
  () => ({ red: "#ff765f", green: "#69dd8a" })[props.values.lightColour] || "#fff6cf",
);
const nutrientLevel = computed(
  () => ({ low: 14, medium: 32, high: 50 })[props.values.nutrientLevel] || 32,
);
const temperature = computed(() =>
  ["warm", "cool"].includes(props.values.temperature) ? props.values.temperature : "",
);
const lampImage = computed(() => VISUAL_ASSETS.lamps[props.values.lightColour]);
const nutrientImage = computed(() => VISUAL_ASSETS.nutrients[props.values.nutrientLevel]);
const TRAY_PLANTS = [145, 210, 275];
</script>

<template>
  <svg
    class="pk-scene-picture"
    viewBox="0 0 420 306"
    role="img"
    :aria-label="ariaLabel"
  >
    <defs>
      <linearGradient :id="`${uid}-beam`" x1=".5" y1="0" x2=".5" y2="1">
        <stop offset="0%" :stop-color="lightColour" stop-opacity=".9" />
        <stop offset="100%" :stop-color="lightColour" stop-opacity=".05" />
      </linearGradient>
    </defs>

    <!-- ============ TINY FARM: lamp above a tray, nutrient bottle ============ -->
    <template v-if="tiny">
      <rect width="420" height="306" fill="#e8eee8" />

      <image v-if="lampImage" :href="lampImage" v-bind="IMAGE_FRAMES.lamp" />
      <g v-else>
        <path d="M20 0 H400" stroke="#444d4d" stroke-width="3" opacity=".5" />
        <path d="M210 0 V45" stroke="#1e2628" stroke-width="3" />
        <path d="M170 49 L250 49 L270 68 H150Z" fill="#1e2425" />
        <path d="M158 68 H262" :stroke="lightColour" stroke-width="6" stroke-linecap="round" />
        <path d="M160 72 L90 200 H330 L260 72Z" :fill="`url(#${uid}-beam)`" opacity=".7" />
      </g>

      <rect y="263" width="420" height="43" fill="#deb687" />
      <rect y="263" width="420" height="7" fill="#af855f" opacity=".3" />

      <g transform="translate(0,14)">
        <image
          v-if="VISUAL_ASSETS.tinyFarmTray"
          :href="VISUAL_ASSETS.tinyFarmTray"
          v-bind="IMAGE_FRAMES.tinyTray"
        />
        <g v-else>
          <rect x="95" y="190" width="230" height="22" rx="5" fill="#dfe7e3" stroke="#6f827a" stroke-width="3" />
          <rect x="110" y="212" width="200" height="40" rx="4" fill="#b5d8e8" fill-opacity=".7" stroke="#6f827a" stroke-width="3" />
          <rect
            v-for="cx in TRAY_PLANTS"
            :key="'pod' + cx"
            :x="cx - 14" y="186" width="28" height="12" rx="3"
            fill="#f5f1e4" stroke="#6f827a" stroke-width="2"
          />
          <g
            v-for="cx in TRAY_PLANTS"
            :key="'plant' + cx"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="`M${cx} 190 V150`" stroke="#356e3a" stroke-width="4" fill="none" />
            <path :d="`M${cx} 165 Q${cx - 26} 140 ${cx - 30} 158 Q${cx - 18} 176 ${cx} 168`" fill="#70bd59" stroke="#397c42" stroke-width="2" />
            <path :d="`M${cx} 158 Q${cx + 26} 132 ${cx + 32} 150 Q${cx + 18} 168 ${cx} 161`" fill="#8fcb63" stroke="#397c42" stroke-width="2" />
            <path :d="`M${cx} 150 Q${cx - 6} 130 ${cx + 4} 120 Q${cx + 14} 136 ${cx} 150`" fill="#9bd77c" stroke="#397c42" stroke-width="2" />
          </g>
        </g>
      </g>

      <image v-if="nutrientImage" :href="nutrientImage" v-bind="IMAGE_FRAMES.nutrient" />
      <g v-else transform="translate(335,192)">
        <rect x="0" y="0" width="43" height="66" rx="8" fill="#f5faff" fill-opacity=".72" stroke="#537a90" stroke-width="2" />
        <rect x="9" y="-8" width="25" height="9" rx="3" fill="#8aa1ad" />
        <path :d="`M3 ${65 - nutrientLevel} H40 V60 Q40 63 37 63 H6 Q3 63 3 60Z`" fill="#8bd05d" opacity=".9" />
        <text x="21" y="-14" text-anchor="middle" font-size="10" font-weight="900" fill="#33526b">NUTRIENTS</text>
      </g>

      <g v-if="temperature" transform="translate(40,60)">
        <rect x="0" y="0" width="16" height="70" rx="8" fill="#fff" stroke="#8b7b78" stroke-width="2" />
        <rect
          x="4"
          :y="temperature === 'warm' ? 14 : 44"
          width="8"
          :height="temperature === 'warm' ? 48 : 18"
          :fill="temperature === 'warm' ? '#ee6a4d' : '#5aa5e8'"
        />
        <text x="8" y="-6" text-anchor="middle" font-size="10" font-weight="900" fill="#51443f">
          {{ temperature.toUpperCase() }}
        </text>
      </g>
    </template>

    <!-- ============ CLASSROOM: pot on a bench by a window / in a cupboard ============ -->
    <template v-else>
      <rect width="420" height="306" fill="#eef6e9" />
      <image
        v-if="backdrop"
        :href="backdrop"
        v-bind="backdropFrame"
        preserveAspectRatio="xMidYMid meet"
      />

      <rect y="263" width="420" height="43" fill="#deb687" />
      <rect y="263" width="420" height="7" fill="#af855f" opacity=".3" />
      <ellipse cx="210" cy="267" :rx="rimWidth * 0.52" ry="10" fill="#503d30" opacity=".18" />

      <image v-if="pot" :href="pot" v-bind="potFrame" preserveAspectRatio="xMidYMid meet" />

      <g :transform="`translate(0, ${seedlingDrop})`">
        <image
          v-if="VISUAL_ASSETS.seedling"
          :href="VISUAL_ASSETS.seedling"
          v-bind="IMAGE_FRAMES.seedling"
        />
        <g
          v-else
          :opacity="dark ? 0.88 : 1"
          transform="translate(0,42) scale(1,0.78)"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path :d="`M210 ${soilTop + stemExtension} Q217 164 211 139 T209 91`" fill="none" stroke="#356e3a" stroke-width="5" />
          <path d="M211 132 Q177 103 166 125 Q178 152 211 135" fill="#70bd59" stroke="#397c42" stroke-width="2.5" />
          <path d="M211 123 Q243 94 264 111 Q250 138 211 129" fill="#8fcb63" stroke="#397c42" stroke-width="2.5" />
          <path d="M210 102 Q181 76 190 62 Q217 61 210 106" fill="#76c366" stroke="#397c42" stroke-width="2.5" />
          <path d="M211 104 Q226 76 245 80 Q246 108 211 111" fill="#88c95a" stroke="#397c42" stroke-width="2.5" />
          <path d="M211 91 Q205 68 218 52 Q229 78 211 91" fill="#9bd77c" stroke="#397c42" stroke-width="2" />
        </g>
      </g>
    </template>
  </svg>
</template>

<style>
.pk-scene-picture {
  display: block;
  width: 100%;
  height: auto;
  background: #f1f5ec;
}
</style>
