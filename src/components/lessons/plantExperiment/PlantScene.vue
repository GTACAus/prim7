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
  // Opt-in for the wall-layout trial; other PlantScene uses stay unchanged.
  wallLayout: { type: Boolean, default: false },
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
const backdropFrame = computed(() => {
  if (props.wallLayout && !tiny.value) {
    // Position the window/cupboard above the plant in the left half.
    // The right half stays open for the unboxed material references.
    return props.values.lightExposure === "cupboard"
      ? { x: 0, y: 81, width: 213, height: 208 }
      : { x: 18, y: 24, width: 177, height: 151 };
  }
  return IMAGE_FRAMES.backgrounds[props.values.lightExposure];
});
// Move AND scale the pot and seedling together. Their relative rooting
// positions remain intact across all 16 combined Canva pot/soil images.
// Roomier wall v3.1: move pot + seedling + shadow down with the bench,
// rather than stretching the artwork or disconnecting the stem from the pot.
const potGroupTransform = computed(() =>
  props.wallLayout && !tiny.value ? "translate(-53, 86) scale(0.76)" : ""
);
// Extend the illustrated wall by 26 SVG units (about 8.5% taller). Only
// applies to the classroom wall layout; the Tiny Farms scene is unchanged.
const classroomWallTall = computed(() => props.wallLayout && !tiny.value);
const sceneHeight = computed(() => classroomWallTall.value ? 330 : 306);
const sceneWidth = computed(() => classroomWallTall.value ? 520 : 420);
const benchY = computed(() => classroomWallTall.value ? 286 : 263);
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

/* ---------- Classroom: whiteboard scene ---------- */
// This trial uses 3 vs 5 tablespoons. Old 125/250 internal IDs are retained
// for compatibility with saved progress, NOT as millilitre measurements.
const WATER_SPOON_COUNTS = { 125: 3, 250: 5, 3: 3, 5: 5 };
const waterSpoonCount = computed(() => WATER_SPOON_COUNTS[props.values.waterVolume] || 3);
const spoonPositions = computed(() => Array.from({ length: waterSpoonCount.value }, (_, i) =>
  247 + (i - (waterSpoonCount.value - 1) / 2) * 23
));
const spoonCombinedImage = computed(() =>
  waterSpoonCount.value === 5
    ? VISUAL_ASSETS.waterSpoons?.five
    : VISUAL_ASSETS.waterSpoons?.three
);
const waterLabel = computed(() => labelFor('waterVolume', props.values.waterVolume));
const soilBagImage = computed(() => VISUAL_ASSETS.materials.soilType?.[props.values.soilType] || '');
const calendarImage = computed(() => VISUAL_ASSETS.materials.wateringFrequency?.[props.values.wateringFrequency] || '');
const fertiliserImage = computed(() => VISUAL_ASSETS.materials.fertiliser?.[props.values.fertiliser] || '');
const hasFertiliser = computed(() => props.values.fertiliser === 'yes');
const closedCupboard = computed(() => VISUAL_ASSETS.sceneFurniture?.closedCupboard || '');
const openCupboard = computed(() => VISUAL_ASSETS.sceneFurniture?.openCupboard || '');
const windowImage = computed(() => VISUAL_ASSETS.backgrounds.window || '');

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
    :viewBox="`0 0 ${sceneWidth} ${sceneHeight}`"
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

    <!-- ============ CLASSROOM: fixed physical scene ============ -->
    <template v-else>
      <!-- Only the planner opts into this whiteboard-inspired layout. -->
      <template v-if="wallLayout">
        <rect width="520" height="330" fill="#eef6e9" />

        <!-- Window remains in the classroom regardless of light condition. -->
        <image v-if="windowImage" :href="windowImage" x="12" y="13" width="126" height="132" preserveAspectRatio="xMidYMid meet" />
        <g v-else>
          <rect x="17" y="20" width="112" height="109" rx="3" fill="#9bcbdc" stroke="#ab8d6a" stroke-width="7" />
          <circle cx="49" cy="50" r="18" fill="#ffd56b" />
          <path d="M19 117 L48 90 L73 111 L97 87 L128 118Z" fill="#82aa87" />
          <path d="M73 20 V129 M17 73 H129" stroke="#e9f1e8" stroke-width="5" />
        </g>

        <!-- Cupboard always stays under the window.
             The open cupboard plus a left-pointing arrow tells students to
             put the plant inside when light exposure is "cupboard". -->
        <template v-if="!dark">
          <image v-if="closedCupboard" :href="closedCupboard" x="10" y="150" width="140" height="136" preserveAspectRatio="xMidYMid meet" />
          <g v-else>
            <rect x="21" y="163" width="116" height="123" rx="4" fill="#ba815c" stroke="#906044" stroke-width="3" />
            <rect x="27" y="170" width="104" height="109" rx="2" fill="#d4a078" stroke="#a16f51" stroke-width="2" />
            <path d="M79 171 V278" stroke="#8c5d42" stroke-width="2" />
            <rect x="67" y="218" width="4" height="12" rx="2" fill="#67584b" />
            <rect x="87" y="218" width="4" height="12" rx="2" fill="#67584b" />
            <rect x="13" y="156" width="132" height="11" rx="3" fill="#bd8e69" stroke="#9e7052" stroke-width="2" />
          </g>
        </template>
        <template v-else>
          <image v-if="openCupboard" :href="openCupboard" x="8" y="150" width="148" height="136" preserveAspectRatio="xMidYMid meet" />
          <g v-else>
            <rect x="22" y="163" width="120" height="120" fill="#a96d49" stroke="#915638" stroke-width="4" />
            <path d="M31 174 H133 V275 H31Z" fill="#7f624d" />
            <path d="M31 174 L45 191 V274 H31Z" fill="#916d52" />
            <path d="M133 174 L119 191 V274 H133Z" fill="#6a503f" />
            <path d="M22 165 L5 181 V282 L22 279Z" fill="#c8966d" stroke="#9c6949" stroke-width="3" />
            <path d="M142 165 L159 181 V282 L142 279Z" fill="#c8966d" stroke="#9c6949" stroke-width="3" />
            <path d="M31 170 H133" stroke="#d2a37d" stroke-width="8" />
          </g>
        </template>

        <!-- All objects rest on a common bench. -->
        <rect y="286" width="520" height="44" fill="#deb687" />
        <rect y="286" width="520" height="7" fill="#af855f" opacity=".26" />
        <ellipse cx="247" cy="287" :rx="rimWidth * .52" ry="8" fill="#503d30" opacity=".17" />

        <!-- Move pot and seedling together; preserve roots in the Canva soil. -->
        <!-- Canva pot PNGs have some transparent space below their artwork.
             Lower the pot and seedling together so the visible base meets the bench. -->
        <g transform="translate(37, 28)">
          <image v-if="pot" :href="pot" v-bind="potFrame" preserveAspectRatio="xMidYMid meet" />
          <g v-else>
            <path d="M160 175 H260 L250 255 H170Z" :fill="values.potMaterial === 'plastic' ? '#bfc7b7' : '#c9774e'" stroke="#885c43" stroke-width="3" />
            <path :d="`M168 ${values.soilFill === 'full' ? 186 : 214} H252 L246 247 H173Z`" :fill="values.soilType === 'garden' ? '#705137' : '#865b38'" />
            <ellipse cx="210" cy="176" rx="53" ry="8" :fill="values.potMaterial === 'plastic' ? '#c6cbbd' : '#ce8054'" stroke="#885c43" stroke-width="2" />
          </g>
          <g :transform="`translate(0, ${seedlingDrop})`">
            <image v-if="VISUAL_ASSETS.seedling" :href="VISUAL_ASSETS.seedling" v-bind="IMAGE_FRAMES.seedling" />
            <g v-else transform="translate(0,42) scale(1,0.78)" stroke-linecap="round" stroke-linejoin="round">
              <path :d="`M210 ${soilTop + stemExtension} Q217 164 211 139 T209 91`" fill="none" stroke="#356e3a" stroke-width="5" />
              <path d="M211 132 Q177 103 166 125 Q178 152 211 135" fill="#70bd59" stroke="#397c42" stroke-width="2.5" />
              <path d="M211 123 Q243 94 264 111 Q250 138 211 129" fill="#8fcb63" stroke="#397c42" stroke-width="2.5" />
              <path d="M210 102 Q181 76 190 62 Q217 61 210 106" fill="#76c366" stroke="#397c42" stroke-width="2.5" />
              <path d="M211 104 Q226 76 245 80 Q246 108 211 111" fill="#88c95a" stroke="#397c42" stroke-width="2.5" />
              <path d="M211 91 Q205 68 218 52 Q229 78 211 91" fill="#9bd77c" stroke="#397c42" stroke-width="2" />
            </g>
          </g>
        </g>

        <!-- Only the cupboard condition displays an instruction arrow.
             The plant remains centred as a schematic representation. -->
        <g v-if="dark" fill="none" stroke="#68776e" stroke-width="2.6"
           stroke-linecap="round" stroke-linejoin="round">
          <title>Move the plant into the cupboard</title>
          <path d="M201 243 H180" />
          <path d="M187 236 L180 243 L187 250" />
        </g>

        <!-- Water spoons remain centred above the plant in both conditions.
             Composite Canva artwork > repeated single spoon > SVG fallback. -->
        <image v-if="spoonCombinedImage" :href="spoonCombinedImage" x="173" y="16" width="148" height="69" preserveAspectRatio="xMidYMid meet" />
        <template v-else>
          <g v-for="(x, idx) in spoonPositions" :key="'spoon-' + idx" :transform="`translate(${x}, 22)`">
          <image v-if="VISUAL_ASSETS.waterSpoons?.single" :href="VISUAL_ASSETS.waterSpoons.single" x="-10" y="-1" width="20" height="55" preserveAspectRatio="xMidYMid meet" />
          <g v-else>
            <ellipse cx="0" cy="10" rx="8" ry="11" fill="#d2e0e7" stroke="#577b90" stroke-width="1.5" />
            <ellipse cx="0" cy="11" rx="5" ry="6" fill="#66bae0" opacity=".78" />
            <path d="M0 20 V49" fill="none" stroke="#8fa8b5" stroke-width="4.5" stroke-linecap="round" />
            <path d="M-2 20 V47" fill="none" stroke="#f3fafc" stroke-width="1.2" stroke-linecap="round" />
          </g>
        </g>
        </template>
        <text x="247" y="91" text-anchor="middle" font-size="12" font-weight="800" fill="#3c5464">{{ waterLabel }}</text>

        <!-- Fixed right-side physical materials: calendar, soil bag, fertiliser.
             These change by setting, NOT according to the selected tab. -->
        <image v-if="calendarImage" :href="calendarImage" x="387" y="12" width="127" height="87" preserveAspectRatio="xMidYMid meet" />
        <g v-else>
          <rect x="397" y="18" width="104" height="79" rx="3" fill="#fffdfa" stroke="#8f9c88" stroke-width="2" />
          <path v-for="i in 4" :key="'cal-line-' + i" :d="`M${393 + i * 21} 19 V96`" stroke="#cbd5cb" stroke-width="1" />
          <path d="M398 44 H500 M398 69 H500" stroke="#cbd5cb" />
          <text x="449" y="35" font-size="11" font-weight="800" text-anchor="middle" fill="#39704f">WATER</text>
        </g>
        <text x="452" y="114" text-anchor="middle" font-size="11" font-weight="800" fill="#3f5947">{{ labelFor('wateringFrequency', values.wateringFrequency) }}</text>

        <!-- Potting mix/dirt bag sits ON the bench, to the right of the plant.
             Keep labels ABOVE the objects instead of beneath the bench line. -->
        <text x="363" y="198" text-anchor="middle" font-size="11" font-weight="800" fill="#3f5947">{{ labelFor('soilType', values.soilType) }}</text>
        <image v-if="soilBagImage" :href="soilBagImage" x="317" y="203" width="92" height="83" preserveAspectRatio="xMidYMid meet" />
        <g v-else>
          <path d="M333 220 Q359 207 386 220 L392 285 H327Z" fill="#ead6b5" stroke="#a1896d" stroke-width="2" />
          <path d="M334 220 Q360 207 386 220" fill="none" stroke="#805e42" stroke-width="9" />
          <text x="359" y="251" text-anchor="middle" font-size="11" font-weight="800" fill="#4d3829">SOIL</text>
        </g>

        <!-- Fertiliser is a separate object further right, only when used. -->
        <template v-if="hasFertiliser">
          <image v-if="fertiliserImage" :href="fertiliserImage" x="430" y="215" width="70" height="71" preserveAspectRatio="xMidYMid meet" />
          <g v-else>
            <path d="M442 229 H474 L480 285 H436Z" fill="#e0e9cf" stroke="#709167" stroke-width="2" />
            <text x="458" y="251" text-anchor="middle" font-size="9" font-weight="900" fill="#376443">PLANT</text>
            <text x="458" y="263" text-anchor="middle" font-size="9" font-weight="900" fill="#376443">FOOD</text>
          </g>
        </template>
      </template>

      <!-- Original component behaviour, for any other caller not using the
           whiteboard-scene flag. Tiny Farms is entirely unaffected. -->
      <template v-else>
        <rect width="420" :height="sceneHeight" fill="#eef6e9" />
        <image v-if="backdrop" :href="backdrop" v-bind="backdropFrame" preserveAspectRatio="xMidYMid meet" />
        <rect :y="benchY" width="420" height="43" fill="#deb687" />
        <rect :y="benchY" width="420" height="7" fill="#af855f" opacity=".3" />
        <g :transform="potGroupTransform">
          <ellipse cx="210" cy="267" :rx="rimWidth * .52" ry="10" fill="#503d30" opacity=".18" />
          <image v-if="pot" :href="pot" v-bind="potFrame" preserveAspectRatio="xMidYMid meet" />
          <g :transform="`translate(0, ${seedlingDrop})`">
            <image v-if="VISUAL_ASSETS.seedling" :href="VISUAL_ASSETS.seedling" v-bind="IMAGE_FRAMES.seedling" />
            <g v-else :opacity="dark ? 0.88 : 1" transform="translate(0,42) scale(1,0.78)" stroke-linecap="round" stroke-linejoin="round">
              <path :d="`M210 ${soilTop + stemExtension} Q217 164 211 139 T209 91`" fill="none" stroke="#356e3a" stroke-width="5" />
              <path d="M211 132 Q177 103 166 125 Q178 152 211 135" fill="#70bd59" stroke="#397c42" stroke-width="2.5" />
              <path d="M211 123 Q243 94 264 111 Q250 138 211 129" fill="#8fcb63" stroke="#397c42" stroke-width="2.5" />
              <path d="M210 102 Q181 76 190 62 Q217 61 210 106" fill="#76c366" stroke="#397c42" stroke-width="2.5" />
              <path d="M211 104 Q226 76 245 80 Q246 108 211 111" fill="#88c95a" stroke="#397c42" stroke-width="2.5" />
              <path d="M211 91 Q205 68 218 52 Q229 78 211 91" fill="#9bd77c" stroke="#397c42" stroke-width="2" />
            </g>
          </g>
        </g>
      </template>
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
