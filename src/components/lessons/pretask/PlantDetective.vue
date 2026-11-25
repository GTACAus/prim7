<script setup>
/*
  Plant Detective (shown in an iframe on the pre-task page): eight unhealthy
  plants in a random order. For each one, choose more or less water,
  sunlight, CO2 or nutrients. The right choice fades in the healthy plant
  and moves on after a moment; a wrong one shakes its button.
*/
import { computed, onBeforeUnmount, ref } from "vue";

const IMG = "../images/pretask/plant_detective/";

const SCENARIOS = [
  {
    answer: "water-more",
    hint: "This plant is wilting — it looks thirsty!",
    image: "not_enough_water_plant.png",
    alt: "A wilted plant that needs more water",
  },
  {
    answer: "water-less",
    hint: "The leaves are turning yellow and soggy!",
    image: "too_much_water_plant.png",
    alt: "An overwatered plant with yellow soggy leaves",
  },
  {
    answer: "sunlight-more",
    hint: "This plant is pale and stretching toward light!",
    image: "not_enough_sunlight_plant.png",
    alt: "A pale plant stretching toward light needing more sunlight",
  },
  {
    answer: "sunlight-less",
    hint: "The leaves look scorched and brown!",
    image: "too_much_sunlight_plant.png",
    alt: "A plant with scorched brown leaves from too much sun",
  },
  {
    answer: "co2-more",
    hint: "This plant is growing very slowly and looks stunted!",
    image: "not_enough_co2_plant.png",
    alt: "A small stunted plant growing slowly needing more CO2",
  },
  {
    answer: "co2-less",
    hint: "The leaves are curling up and closing!",
    image: "too_much_co2_plant.png",
    alt: "A plant with curling leaves needing less carbon dioxide",
  },
  {
    answer: "nutrients-more",
    hint: "The leaves are turning yellow at the edges!",
    image: "not_enough_nutrients_plant.png",
    alt: "A plant with yellow leaves showing nutrient deficiency",
  },
  {
    answer: "nutrients-less",
    hint: "The leaf tips are brown and burnt-looking!",
    image: "too_much_nutrients_plant.png",
    alt: "A plant with brown burnt leaf tips from too much fertilizer",
  },
];

const CONTROLS = [
  {
    key: "water",
    label: "💧 Water",
    name: "Water",
    className: "water-control",
  },
  {
    key: "sunlight",
    label: "☀️ Sunlight",
    name: "Sunlight",
    className: "sunlight-control",
  },
  {
    key: "co2",
    label: "🌬️ CO₂",
    name: "Carbon Dioxide",
    className: "co2-control",
  },
  {
    key: "nutrients",
    label: "🧪 Nutrients",
    name: "Nutrients",
    className: "nutrient-control",
  },
];

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const order = ref([]);
const current = ref(0);
const score = ref(0);
const solved = ref(false);
const finished = ref(false);
const shaking = ref(null); // the action of a wrong button, while it shakes
let nextTimer = null;
let shakeTimer = null;

const scenario = computed(() => SCENARIOS[order.value[current.value]]);
const scoreText = computed(
  () =>
    `Question ${Math.min(current.value + 1, 8)} of 8 · Score: ${score.value}`,
);

function startGame() {
  clearTimeout(nextTimer);
  order.value = shuffle(SCENARIOS.map((_, i) => i));
  current.value = 0;
  score.value = 0;
  solved.value = false;
  finished.value = false;
}

function choose(action) {
  if (solved.value) return;
  if (action !== scenario.value.answer) {
    clearTimeout(shakeTimer);
    shaking.value = null;
    requestAnimationFrame(() => (shaking.value = action));
    shakeTimer = setTimeout(() => (shaking.value = null), 350);
    return;
  }
  solved.value = true;
  score.value++;
  nextTimer = setTimeout(() => {
    if (current.value < SCENARIOS.length - 1) {
      current.value++;
      solved.value = false;
    } else {
      finished.value = true;
    }
  }, 1500);
}

startGame();

onBeforeUnmount(() => {
  clearTimeout(nextTimer);
  clearTimeout(shakeTimer);
});
</script>

<template>
  <div class="plant-detective-page">
    <main v-if="!finished" id="game-area">
      <div class="detective-question-card">
        <p class="detective-question">What does this plant need?</p>
        <p class="detective-hint">{{ scenario.hint }}</p>
      </div>

      <div id="plant-comparison">
        <div id="left-frame">
          <!-- keyed so a new plant starts without the last one's fade -->
          <img
            :key="current"
            class="scenario-img"
            :class="{ 'fade-out': solved }"
            :src="IMG + scenario.image"
            :alt="scenario.alt"
          />
          <img
            :key="'healthy' + current"
            id="healthy-overlay"
            class="scenario-img"
            :class="{ revealed: solved }"
            :src="IMG + 'healthy_plant.png'"
            alt="Vibrant healthy green houseplant"
          />
        </div>
        <div id="arrow-separator"></div>
        <div id="right-frame">
          <img
            :src="IMG + 'healthy_plant.png'"
            alt="Vibrant healthy green houseplant goal"
          />
        </div>
      </div>

      <div class="detective-controls">
        <div
          v-for="control in CONTROLS"
          :key="control.key"
          class="detective-control-group"
          :class="control.className"
        >
          <button
            type="button"
            class="control-btn control-more"
            :class="{ shake: shaking === control.key + '-more' }"
            :aria-label="'More ' + control.name"
            @click="choose(control.key + '-more')"
          >
            ▲
          </button>
          <span class="control-label">{{ control.label }}</span>
          <button
            type="button"
            class="control-btn control-less"
            :class="{ shake: shaking === control.key + '-less' }"
            :aria-label="'Less ' + control.name"
            @click="choose(control.key + '-less')"
          >
            ▼
          </button>
        </div>

        <div class="detective-header">
          <p class="detective-score">{{ scoreText }}</p>
        </div>
      </div>

      <div id="feedback" role="status" aria-live="polite">
        <p v-if="solved" id="feedback-text">🌟 Correct! Great job!</p>
      </div>
    </main>

    <div v-else class="detective-complete-screen">
      <p class="detective-complete-icon">🎉</p>
      <span class="detective-label">Investigation complete</span>
      <h2>Well done! You helped all the plants.</h2>
      <p class="detective-final-score">You got {{ score }} out of 8 correct!</p>
      <button type="button" class="detective-replay-button" @click="startGame">
        Play again
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ==================================================
   PLANT DETECTIVE GAME
   (moved here from styles/pretask_styles/plant_detective.css)
   ================================================== */

.plant-detective-page {
  min-height: 100%;
  height: auto;

  margin: 0;
  padding: 18px;

  background: var(--cream);
  color: var(--charcoal);

  font-family: "DM Sans", Arial, sans-serif;
}

.detective-header {
  display: grid;
  grid-column: 1 / -1;

  width: min(780px, 100%);
  margin: 0 auto 12px;
  text-align: center;
}

.detective-label {
  display: inline-block;

  margin-bottom: 8px;
  padding: 7px 13px;

  background: var(--purple);
  color: white;

  border: 2px solid var(--charcoal);
  border-radius: 999px;

  box-shadow: 0 3px 0 var(--charcoal);

  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.detective-header h1 {
  margin: 5px 0 5px;

  color: var(--charcoal);

  font-size: clamp(1.7rem, 4vw, 2.4rem);
  font-weight: 700;
  line-height: 1.1;
}

.detective-score {
  display: grid;
  margin: 4px 30%;
  padding: 6px 11px;

  background: var(--mint);
  border: 2px solid var(--charcoal);
  border-radius: 999px;

  color: var(--charcoal);

  font-size: 0.8rem;
  font-weight: 700;
}

.plant-detective-page #game-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: min(900px, 100%);
  margin: 0 auto;

  padding: 14px 18px 16px;

  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.detective-question-card {
  width: min(620px, 100%);
  margin: 0 auto 10px;
  padding: 10px 15px;

  background: var(--yellow);
  border: 2px solid var(--charcoal);
  border-radius: 14px;

  text-align: center;

  box-shadow: 0 3px 0 var(--charcoal);
}

.detective-question {
  margin: 0;

  color: var(--charcoal);

  font-size: 1.1rem;
  font-weight: 700;
}

.detective-hint {
  min-height: 1.3rem;
  margin: 4px 0 0;

  color: var(--charcoal);

  font-size: 0.86rem;
  font-weight: 500;
}

.plant-detective-page #plant-comparison {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  gap: 20px;
  margin: 8px 0 12px;
}

.plant-detective-page #left-frame,
.plant-detective-page #right-frame {
  width: clamp(150px, 28vw, 255px);
  aspect-ratio: 1;

  position: relative;
  overflow: hidden;

  background: var(--paper);
  border: 3px solid var(--charcoal);
  border-radius: 20px;

  box-shadow: 0 5px 0 var(--charcoal);
}

.plant-detective-page #left-frame {
  border-top: 12px solid var(--orange);
}

.plant-detective-page #right-frame {
  border-top: 12px solid var(--green);
}

/* Keep every plant image inside the same frame during the fade */
.plant-detective-page #left-frame .scenario-img,
.plant-detective-page #right-frame img {
  position: absolute;
  inset: 0;

  display: block;

  width: 100%;
  height: 100%;

  max-width: none;
  max-height: none;

  object-fit: contain;
  object-position: center bottom;
}

.plant-detective-page #healthy-overlay {
  z-index: 2;
  opacity: 0;
  pointer-events: none;
}

.plant-detective-page #healthy-overlay.revealed {
  opacity: 1;
  transition: opacity 0.8s;
}

.plant-detective-page #left-frame::before,
.plant-detective-page #right-frame::before {
  display: none;
  position: absolute;
  top: 8px;
  left: 10px;

  z-index: 5;

  padding: 4px 8px;

  background: var(--paper);
  border: 2px solid var(--charcoal);
  border-radius: 999px;

  color: var(--charcoal);

  font-size: 0.67rem;
  font-weight: 700;
  text-transform: uppercase;
}

.plant-detective-page #left-frame::before {
  content: "Investigate";
}

.plant-detective-page #right-frame::before {
  content: "Healthy plant";
}

.plant-detective-page #arrow-separator {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 48px;
  height: 48px;

  background: var(--orange);
  border: 3px solid var(--charcoal);
  border-radius: 50%;

  color: white;

  box-shadow: 0 4px 0 var(--charcoal);
}

.plant-detective-page #arrow-separator::before {
  content: "→";

  color: white;

  font-size: 1.7rem;
  font-weight: 700;
}

.detective-controls {
  display: grid;
  grid-template-columns: repeat(4, minmax(110px, 1fr));

  width: min(760px, 100%);
  margin: 10px auto 4px;
  gap: 12px;
}

.detective-control-group {
  display: grid;
  grid-template-rows: auto auto auto;
  justify-items: center;
  gap: 7px;

  padding: 11px;

  background: var(--paper);
  border: 2px solid var(--charcoal);
  border-radius: 16px;

  box-shadow: 0 4px 0 var(--charcoal);
}

.water-control {
  border-top: 9px solid var(--blue);
}

.sunlight-control {
  border-top: 9px solid var(--yellow);
}

.co2-control {
  border-top: 9px solid var(--lavender);
}

.nutrient-control {
  border-top: 9px solid var(--orange);
}

.control-label {
  color: var(--charcoal);

  font-size: 0.92rem;
  font-weight: 700;
}

.control-btn {
  width: 100%;
  min-width: 76px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 2px solid var(--charcoal);
  border-radius: 10px;

  color: var(--charcoal);

  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;

  box-shadow: 0 3px 0 var(--charcoal);

  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    background 0.12s ease;
}

.control-more {
  background: var(--green);
  color: white;
}

.control-less {
  background: var(--paper);
}

.control-btn:hover {
  background: var(--purple);
  color: white;

  transform: translateY(-2px);
  box-shadow: 0 5px 0 var(--charcoal);
}

.control-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--charcoal);
}

.control-btn:focus-visible {
  outline: 3px solid var(--yellow);
  outline-offset: 3px;
}

.plant-detective-page #feedback {
  min-height: 38px;
  margin-top: 8px;
}

.plant-detective-page #feedback-text {
  margin: 0;
  padding: 7px 13px;

  background: var(--mint);
  border: 2px solid var(--charcoal);
  border-radius: 999px;

  color: var(--charcoal);

  font-size: 0.95rem;
  font-weight: 700;

  box-shadow: 0 3px 0 var(--charcoal);
}

.detective-complete-screen {
  width: min(520px, 92%);
  margin: auto;
  padding: 30px;

  background: var(--yellow);
  border: 3px solid var(--charcoal);
  border-radius: 24px;

  color: var(--charcoal);
  text-align: center;

  box-shadow: 0 7px 0 var(--charcoal);
}

.detective-complete-icon {
  margin: 0 0 8px;
  font-size: 3rem;
}

.detective-complete-screen h2 {
  margin: 12px 0 8px;

  color: var(--charcoal);

  font-size: 1.7rem;
  font-weight: 700;
}

.detective-final-score {
  margin: 0 0 18px;

  color: var(--charcoal);

  font-size: 1.05rem;
  font-weight: 600;
}

.detective-replay-button {
  padding: 11px 20px;

  background: var(--orange);
  color: white;

  border: 2px solid var(--charcoal);
  border-radius: 12px;

  box-shadow: 0 4px 0 var(--charcoal);

  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.detective-replay-button:hover {
  background: var(--purple);
}

@media (max-width: 700px) {
  .plant-detective-page {
    padding: 10px;
  }

  .plant-detective-page #game-area {
    padding: 12px;
  }

  .plant-detective-page #plant-comparison {
    flex-direction: column;
    gap: 10px;
  }

  .plant-detective-page #arrow-separator::before {
    content: "↓";
  }

  .detective-controls {
    grid-template-columns: repeat(2, minmax(105px, 1fr));
  }

  .plant-detective-page #left-frame,
  .plant-detective-page #right-frame {
    width: min(220px, 66vw);
  }
}

/* Animations */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-5px);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(3px);
  }
}

.shake {
  animation: shake 0.35s ease;
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.fade-out {
  animation: fadeOut 0.8s ease forwards;
}
</style>
