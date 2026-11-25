<script setup>
/*
  The Deep-Sea Field Guide: every animal of the expedition, grouped by
  depth. Clicking one opens its species file below its group, with the
  description split into one fact per sentence.

    <FieldGuide v-model:selected="openFish" />   (a species id, or null)
*/
import { computed } from "vue";
import { guideGroups, staticSrc } from "./expedition.js";

const props = defineProps({
  selected: { type: String, default: null },
});
const emit = defineEmits(["update:selected"]);

const fish = computed(() =>
  guideGroups.flatMap((g) => g.species).find((f) => f.id === props.selected),
);

const facts = computed(() => {
  const text = fish.value?.guideText || fish.value?.note || "Information coming soon.";
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
});

const inGroup = (group) => group.species.some((f) => f.id === props.selected);
</script>

<template>
  <div id="creatureGrid">
    <template v-for="group in guideGroups" :key="group.title">
      <section class="creature-zone">
        <h4>{{ group.title }}</h4>
        <div class="creature-zone-grid">
          <button
            v-for="item in group.species"
            :key="item.id"
            type="button"
            @click="emit('update:selected', item.id)"
          >
            <img :src="staticSrc(item)" alt="" />
            <span>{{ item.name }}</span>
          </button>
        </div>
      </section>

      <!-- one information panel, under the group of the chosen animal -->
      <div v-if="fish && inGroup(group)" id="creaturePanel">
        <img :src="staticSrc(fish)" :alt="fish.name" />
        <div class="creature-info">
          <span class="creature-info-kicker">Species file // Field notes</span>
          <h4>{{ fish.name }}</h4>
          <ul class="creature-facts">
            <li v-for="fact in facts" :key="fact">{{ fact }}</li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Lesson 7 (Expedition Log). Colours come from the "dark" theme in
   src/styles/themes.css (--exp-* variables). */

/* POKEDEX ELEMENTS */

/* Main gallery container */
#creatureGrid {
  display: block;
  margin: 18px 0;
}

/* Three habitat sections */
.creature-zone {
  background: rgba(57, 211, 255, 0.05);
  border: 1px solid rgba(57, 211, 255, 0.4);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 18px;
}

.creature-zone :deep(h4) {
  color: #d8f7ff;
  margin: 0 0 14px;
}

/* Creature buttons within each section */
.creature-zone-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 12px;
}

#creatureGrid .creature-zone-grid :deep(button) {
  background: #0d3157;
  border: 2px solid #39d3ff;
  border-radius: 14px;
  color: white;
  padding: 10px;
  cursor: pointer;
}

#creatureGrid .creature-zone-grid :deep(button:hover) {
  border-color: #ffcd1d;
  background: #16476a;
}

/* Circular creature images */
#creatureGrid .creature-zone-grid :deep(button img) {
  display: block;
  width: 88px;
  height: 88px;
  object-fit: contain;
  border: 2px solid #39d3ff;
  border-radius: 50%;
  margin: 0 auto 8px;
}

/* Shared information panel: larger image + easy-to-scan facts */
#creaturePanel {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  align-items: center;
  gap: 22px;
  padding: 22px;
  margin-bottom: 18px;
  background: #0d3157;
  border: 2px solid #39d3ff;
  border-radius: 14px;
}

#creaturePanel[hidden] {
  display: none !important;
}

#creaturePanel > :deep(img) {
  display: block;
  width: 220px;
  height: 230px;
  max-width: 100%;
  object-fit: contain;
  border-radius: 14px;
  background: radial-gradient(circle, rgba(57, 211, 255, 0.1), transparent 70%);
}

#creaturePanel .creature-info {
  min-width: 0;
}

#creaturePanel .creature-info-kicker {
  display: block;
  margin-bottom: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #39d3ff;
}

#creaturePanel :deep(h4) {
  margin: 0 0 12px;
  color: #ffffff;
  font-size: 1.25rem;
}

#creaturePanel .creature-facts {
  margin: 0;
  padding-left: 1.4rem;
  list-style: disc;
  color: #d8f7ff;
  font-size: 0.9rem;
  line-height: 1.5;
}

#creaturePanel .creature-facts :deep(li) {
  margin-bottom: 9px;
  padding-left: 3px;
}

#creaturePanel .creature-facts :deep(li:last-child) {
  margin-bottom: 0;
}

#creaturePanel .creature-facts :deep(li::marker) {
  color: #39d3ff;
}

@media (max-width: 850px) {
  #creaturePanel {
    grid-template-columns: 1fr;
  }
  #creaturePanel > :deep(img) {
    width: min(100%, 240px);
    height: 210px;
    margin: 0 auto;
  }
}
</style>
