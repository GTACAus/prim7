<script setup>
// "Build a Plant" / "Label the Plant" drag and drop activity (pre-task, part C).
// Labelling opens once the plant is built.
import { computed, ref } from "vue";
import Button from "../../ui/Button.vue";
import DragDrop from "../../activities/DragDrop.vue";
import DropSlot from "../../activities/DropSlot.vue";
import DragItem from "../../activities/DragItem.vue";

const plantGame = ref("parts");
const plantParts = ref(null);
const partsDone = computed(() => plantParts.value?.done ?? false);
function switchGame(game) {
  if (game === "labels" && !partsDone.value) return;
  plantGame.value = game;
}
</script>

<template>
  <div class="plant-game">
    <div class="plant-canvas">
      <div class="plant-game-container">
        <div class="tab-button-container">
          <Button
            class="tab option-button"
            :class="{ active: plantGame === 'parts' }"
            @click="switchGame('parts')"
          >
            Build a Plant
          </Button>
          <Button
            class="tab option-button"
            :disabled="!partsDone"
            :class="{ active: plantGame === 'labels' }"
            @click="switchGame('labels')"
          >
            Label the Plant
          </Button>
        </div>
        <main v-show="plantGame === 'parts'">
          <DragDrop
            id="plantPartsActivity"
            ref="plantParts"
            class="plant-activity"
            strict
            v-slot="{ done, trayEmpty, reset }"
          >
            <div class="plant-area">
              <div class="plant-image-container">
                <img
                  class="plant-image"
                  src="../images/pretask/sunflower.png"
                  alt="Sunflower"
                />
              </div>
              <DropSlot
                class="slot slot-flower"
                name="flower"
                answer="flower"
              />
              <DropSlot
                class="slot slot-left-leaf"
                name="left-leaf"
                answer="left-leaf"
              />
              <DropSlot class="slot slot-stem" name="stem" answer="stem" />
              <DropSlot class="slot slot-roots" name="roots" answer="roots" />
            </div>

            <div id="success-1" v-if="done">
              <p class="success-text">Beautiful! Your plant is complete!</p>
              <span class="success-icon">🌻</span>
            </div>

            <div data-dd-tray class="parts-tray" v-show="!trayEmpty">
              <DragItem class="part" name="flower">
                <img
                  class="flower-image"
                  src="../images/pretask/flower.png"
                  alt="Flower"
                />
              </DragItem>
              <DragItem class="part" name="left-leaf">
                <img
                  class="left-leaf-image"
                  src="../images/pretask/left_leaf.png"
                  alt="Left Leaf"
                />
              </DragItem>
              <DragItem class="part" name="stem">
                <img
                  class="stem-image"
                  src="../images/pretask/stem.png"
                  alt="Stem"
                />
              </DragItem>
              <DragItem class="part" name="roots">
                <img
                  class="roots-image"
                  src="../images/pretask/roots.png"
                  alt="Roots"
                />
              </DragItem>
            </div>

            <div class="option-button-container">
              <Button class="option-button reset" @click="reset">
                Start Over
              </Button>
              <Button
                v-if="done"
                class="option-button"
                @click="switchGame('labels')"
              >
                Continue →
              </Button>
            </div>
          </DragDrop>
        </main>
        <main v-show="plantGame === 'labels'">
          <DragDrop
            id="plantLabelsActivity"
            class="plant-activity"
            strict
            v-slot="{ done, trayEmpty, reset }"
          >
            <div class="plant-area">
              <div class="plant-image-container">
                <img
                  class="plant-image"
                  src="../images/pretask/sunflower.png"
                  alt="Sunflower"
                />
              </div>

              <DropSlot
                class="label-slot label-flower-slot"
                name="flower"
                answer="flower"
              />
              <DropSlot
                class="label-slot label-leaf-slot"
                name="leaf"
                answer="leaf"
              />
              <DropSlot
                class="label-slot label-stem-slot"
                name="stem"
                answer="stem"
              />
              <DropSlot
                class="label-slot label-roots-slot"
                name="roots"
                answer="roots"
              />
            </div>

            <div id="success-2" class="success-message" v-if="done">
              <p class="success-text">Well done! All labels are correct! 🎉</p>
              <span class="success-icon">🌻</span>
            </div>

            <div data-dd-tray class="parts-tray" v-show="!trayEmpty">
              <DragItem class="part" name="flower">Flower</DragItem>
              <DragItem class="part" name="leaf">Leaf</DragItem>
              <DragItem class="part" name="stem">Stem</DragItem>
              <DragItem class="part" name="roots">Roots</DragItem>
            </div>

            <Button class="option-button reset" @click="reset">
              Start Over
            </Button>
          </DragDrop>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>

.plant-canvas {
  min-height: 280px;
  background:
    radial-gradient(circle, rgba(78, 50, 232, 0.1) 1.5px, transparent 1.5px),
    var(--card);
  background-size: 22px 22px;
  border: 3px solid var(--line);
  border-radius: 22px;
}

.plant-game-container {
  width: 100%;
  margin: 0;
  padding-bottom: 10px;
}

:deep(.reset) {
  background: var(--orange);
}

.plant-area {
  position: relative;
  width: 280px;
  height: 400px;
}

.plant-image {
  max-width: 99%;
  max-height: 99%;
  border: 20px solid white;
  border-radius: 20px;
}

#plantPartsActivity,
#plantLabelsActivity {
  --dd-accent: var(--yellow);
  --dd-slot-hover-bg: var(--soft-yellow);
  --dd-reject: var(--orange);
}

.slot-flower {
  top: 20px;
  left: 80px;
  width: 110px;
  height: 85px;
}

.slot-left-leaf {
  top: 115px;
  left: 50px;
  width: 75px;
  height: 55px;
}

.slot-roots {
  bottom: 60px;
  left: 85px;
  width: 100px;
  height: 80px;
}

.label-slot {
  width: 70px;
  height: 30px;
}

.label-flower-slot {
  top: 30px;
  right: 40px;
}

.label-leaf-slot {
  top: 120px;
  left: 5px;
}

.label-stem-slot {
  top: 175px;
  right: 60px;
}

.label-roots-slot {
  bottom: 50px;
  right: 110px;
}

.option-button.tab {
  padding: 0.5rem 1.25rem;
}

.option-button.tab:not(.active) {
  --background-hover: var(--soft-blue);
  --color-hover: var(--text);
}

.tab-button-container {
  padding: 10px;
  margin: 10px 10px 20px;

  background: var(--purple);
  border: 3px solid var(--line);
  border-radius: 16px;

  box-shadow: 0 4px 0 var(--line);
}

.tab-button-container .option-button {
  border: 2px solid var(--line) !important;
  border-radius: 12px !important;

  background: var(--soft-purple);
  color: var(--text);

  font-family: inherit;
  font-weight: 700;
}

/*
  Tray holding the draggable plant parts and labels.
  Was ".canva-section" with an inline background from the Canva export;
  the inline value never applied because this rule used !important.
*/
.parts-tray {
  display: flex;
  gap: 10px;
  border: 2px solid var(--line);
  border-radius: 18px;

  background: var(--card);
  min-height: 100px;
  padding: 10px;
}

.plant-activity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

#success-1,
#success-2 {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

/* The display rules above and on .parts-tray would otherwise override the
   hidden attribute. */
#success-1[hidden],
#success-2[hidden],
.parts-tray[hidden] {
  display: none;
}

/* Success message shown when a drag-and-drop activity is finished. */
.success-text {
  color: rgb(45, 80, 22);

  font-size: 22px;
  font-weight: 700;
  font-style: normal;
}

.success-icon {
  display: inline-block;
  font-size: 1.875rem;
  line-height: 2.25rem;
  animation: confetti 1s 5 ease-out;
}

.success-message {
  text-align: center;
}
</style>
