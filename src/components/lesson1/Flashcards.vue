<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import Button from "../Button.vue";
import Activity from "../activities/Activity.vue";

const FLY_DELAY = 400;
const BOUNCE_DELAY = 600;

const DEFAULT_QUESTIONS = [
  {
    text: "Does the height of a ramp affect how far a toy car travels?",
    answer: "left",
  },
  { text: "Which toy car has the best design?", answer: "right" },
  {
    text: "Does the ramp surface affect how fast a toy car rolls?",
    answer: "left",
  },
  { text: "Is it more fun to race cars on a steep ramp?", answer: "right" },
  {
    text: "Does the weight of a toy car affect how far it travels?",
    answer: "left",
  },
  { text: "Which ramp colour looks the nicest?", answer: "right" },
  {
    text: "Does the steepness of a ramp affect the speed of a toy car?",
    answer: "left",
  },
  {
    text: "Is racing toy cars more exciting than racing bikes?",
    answer: "right",
  },
];

const props = defineProps({
  questions: { type: Array, default: null },
  labels: {
    type: Object,
    default: () => ({ left: "Testable", right: "Non-testable" }),
  },
});

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const deck = ref(shuffle(props.questions ?? DEFAULT_QUESTIONS));
const piles = ref({ left: [], right: [] });
const started = ref(false);
const flying = ref("");
const locked = ref(false);
let timer = null;

// Saved by <Activity> and restored when the page loads.
const state = { deck, piles, started };

const total = computed(() => (props.questions ?? DEFAULT_QUESTIONS).length);
const sortedCount = computed(
  () => piles.value.left.length + piles.value.right.length,
);

const isComplete = computed(
  () => total.value > 0 && sortedCount.value === total.value,
);

const done = isComplete;
const currentText = computed(() => deck.value[0]?.text ?? "");
const progress = computed(() =>
  done.value ? "All sorted!" : `${sortedCount.value + 1} of ${total.value}`,
);

// Saved refs are already restored; just make sure no animation is half-done.
function onRestore() {
  flying.value = "";
  locked.value = false;
}

function shortText(text) {
  return text.length > 25 ? text.slice(0, 25) + "…" : text;
}

function reset() {
  clearTimeout(timer);
  timer = null;
  deck.value = shuffle(props.questions ?? DEFAULT_QUESTIONS);
  piles.value = { left: [], right: [] };
  flying.value = "";
  locked.value = false;
  started.value = false;
}

function sort(direction) {
  if (locked.value || done.value || !deck.value.length) return;

  const card = deck.value[0];
  const correct = card.answer === direction;
  locked.value = true;
  started.value = true;
  flying.value = correct ? direction : "up";

  timer = setTimeout(
    () => {
      if (correct) {
        piles.value[direction].push(card.text);
        deck.value = deck.value.slice(1);
      } else {
        deck.value = [...deck.value.slice(1), card];
      }
      flying.value = "";
      locked.value = false;
      timer = null;
    },
    correct ? FLY_DELAY : BOUNCE_DELAY,
  );
}

watch(() => props.questions, reset);
onBeforeUnmount(() => clearTimeout(timer));
defineExpose({ reset });
</script>

<template>
  <Activity
    class="flashcard-box"
    :state="state"
    :complete="isComplete"
    @reset="reset"
    @restore="onRestore"
  >
    <div class="flashcard-content">
      <div class="layout">
        <div class="pile-section">
          <h2>{{ labels.left }}</h2>
          <div class="pile-container left-pile">
            <div
              v-for="(text, i) in piles.left"
              :key="i"
              class="pile-card animate-in"
            >
              {{ shortText(text) }}
            </div>
          </div>
          <p class="left-count">{{ piles.left.length }}</p>
        </div>

        <div class="center-section">
          <div class="card-area">
            <div
              v-if="!done"
              class="current-card"
              :class="{
                'card-fly-left': flying === 'left',
                'card-fly-right': flying === 'right',
                'card-fly-up': flying === 'up',
              }"
              :style="{ opacity: flying === 'up' ? 0.5 : 1 }"
            >
              {{ currentText }}
            </div>

            <div v-if="done" class="done-message visible">
              <span>🎉</span>
              <p>All Sorted!</p>
            </div>
          </div>

          <p class="flashcard-progress">{{ progress }}</p>

          <div class="btn-row">
            <Button
              class="btn-investigable"
              :disabled="done || locked"
              @click="sort('left')"
            >
              Testable
            </Button>
            <Button
              class="btn-uninvestigable"
              :disabled="done || locked"
              @click="sort('right')"
            >
              Non-Testable
            </Button>
          </div>

          <Button v-if="started" :is-reset="true" @click="reset" />
        </div>

        <div class="pile-section">
          <h2 class="mb-3">{{ labels.right }}</h2>
          <div class="pile-container right-pile">
            <div
              v-for="(text, i) in piles.right"
              :key="i"
              class="pile-card animate-in"
            >
              {{ shortText(text) }}
            </div>
          </div>
          <p class="right-count">{{ piles.right.length }}</p>
        </div>
      </div>
    </div>
  </Activity>
</template>

<style scoped>
.flashcard-box {
  padding: 12px;
  background: var(--soft-blue);
  border: 3px solid var(--line);
  border-radius: 22px;
  box-shadow: 0 5px 0 var(--line);
}

.flashcard-content {
  background-color: var(--soft-blue);
  padding: 50px 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.layout {
  width: 100%;
  max-width: 72rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2vw;
}

.pile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-height: 300px;
}

.pile-container {
  position: relative;
  width: 8rem;
  aspect-ratio: 2 / 3;
  border-radius: 0.5rem;
  border: 2px dashed;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.left-pile {
  border-color: var(--mint);
  background: var(--soft-green);
}

.right-pile {
  border-color: var(--yellow);
  background: var(--soft-yellow);
}

.left-count {
  color: var(--green);
  font-size: 0.875rem;
  margin-top: 0.75rem;
  font-weight: 600;
}

.right-count {
  color: var(--orange);
  font-size: 0.875rem;
  margin-top: 0.75rem;
  font-weight: 600;
}

.center-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

@media (max-width: 800px) {
  .btn-row {
    /* flex-direction: column; */
  }

  .left-count,
  .right-count {
    display: none;
  }

  .pile-section,
  .pile-container {
    width: 12rem;
    aspect-ratio: 3 / 2;
    justify-content: flex-start;
  }

  .pile-section {
    flex: 0;
  }

  .center-section {
    font-size: clamp(14px, 1vw, 18px);
  }
}

.card-area {
  position: relative;
  width: 18rem;
  height: 14rem;
  margin-bottom: 1.5rem;
}

.current-card {
  position: absolute;
  inset: 0;
  background: var(--paper);
  border-radius: 1rem;
  box-shadow: 0 4px 0 var(--charcoal);
  border: 2px solid var(--line);
  border-top: 10px solid var(--green);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  font-weight: 600;
  color: var(--charcoal);
  font-size: 1.25rem;
  line-height: 1.6;
}

.done-message {
  display: none;
  position: absolute;
  inset: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.done-message.visible {
  display: flex;
}

.done-message span {
  font-size: 3.75rem;
}

.done-message p {
  font-size: 1.5rem;
  font-weight: 700;
  color: #15803d;
}

.flashcard-progress {
  font-size: 1rem;
  color: var(--charcoal);
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.btn-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.btn-investigable {
  --background: var(--green);
}

.btn-uninvestigable {
  --color: var(--charcoal);
  --background: var(--yellow);
}

.btn-investigable,
.btn-uninvestigable {
  --background-hover: var(--button-hover);
  --color-hover: var(--paper);
}

.hidden {
  display: none !important;
}

.card-fly-left {
  animation: flyLeft 0.4s ease forwards;
}

.card-fly-right {
  animation: flyRight 0.4s ease forwards;
}

.card-fly-up {
  animation: flyUp 0.4s ease forwards;
}

@keyframes flyLeft {
  to {
    transform: translateX(-300px) rotate(-10deg);
    opacity: 0;
  }
}

@keyframes flyRight {
  to {
    transform: translateX(300px) rotate(10deg);
    opacity: 0;
  }
}

@keyframes flyUp {
  to {
    transform: translateY(-300px) rotate(10deg);
    opacity: 0;
  }
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

.animate-in {
  animation: bounce-in 0.4s ease-out;
}

.pile-card {
  box-shadow: 0 4px 0 var(--charcoal);
  background: #fff;
  border-radius: 0.5rem;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: var(--charcoal);
  border: 2px solid var(--line);
  flex-shrink: 0;
}

@media (max-width: 800px) {
  .layout {
    flex-direction: column;
    gap: 1vw;
  }

  @keyframes flyLeft {
    to {
      transform: translateY(-300px) rotate(-10deg);
      opacity: 0;
    }
  }

  @keyframes flyRight {
    to {
      transform: translateY(300px) rotate(10deg);
      opacity: 0;
    }
  }

  @keyframes flyUp {
    to {
      transform: translateX(-300px) rotate(10deg);
      opacity: 0;
    }
  }
}
</style>
