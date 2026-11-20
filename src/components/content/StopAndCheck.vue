<script setup>
/*
  "Stop and think" box: a question (#content) and an answer (#answer) shown
  once the button is pressed. Exposes `pressed` so the page can show more
  once it has been checked (<StopAndCheck ref="check"> ... v-if="check?.pressed").
*/
import { computed, ref } from "vue";
import ButtonReveal from "../activities/ButtonReveal.vue";
import Button from "../ui/Button.vue";

const reveal = ref(null);
const pressed = computed(() => reveal.value?.pressed ?? false);

defineExpose({ pressed });
</script>

<template>
  <ButtonReveal ref="reveal" class="stop-and-check" v-slot="{ pressed, press }">
    <div class="stop-and-check-content">
      <slot name="content" />
      <p>Click the button below to check your answer.</p>
    </div>
    <img
      src="../component_assets/stopandthinkicon.png"
      alt="Stop and think icon"
    />
    <div v-if="pressed" class="stop-and-check-answer">
      <slot name="answer" />
    </div>
    <Button v-else class="stop-and-check-button" symbol="✅" @click="press">
      Check Your Answer
    </Button>
  </ButtonReveal>
</template>

<style scoped>
.stop-and-check::before {
  content: "STOP AND THINK";

  position: absolute;
  top: -16px;
  left: 18px;

  padding: 4px 12px;

  background: var(--blue);
  border: 2px solid var(--line);
  border-radius: 999px;

  color: var(--text);

  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.stop-and-check-answer {
  position: relative;
  grid-column: 1 / -1;
  margin-top: 15px;
  background-color: var(--soft-green);
  border-radius: 16px;
  padding: 10px 15px;
  padding-top: 15px;
  margin-top: 20px;
  border: 2px solid var(--charcoal);
  border-top: 4px solid var(--green);
  animation: pop-fade-in 0.5s ease-out;
}

.stop-and-check-answer::before {
  content: "ANSWER";
  text-transform: uppercase;

  position: absolute;
  top: -16px;
  left: 18px;

  padding: 4px 12px;

  background: var(--green);
  border: 2px solid var(--line);
  border-radius: 999px;

  color: var(--paper);

  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.stop-and-check-button {
  width: fit-content;
  margin: 0 auto;
  margin-top: 20px;
  background: var(--mint);
  color: var(--text);
  font-weight: 600;
  grid-column: 1 / -1;

  --background-active: var(--mint);
  --color-active: var(--text);
}

.stop-and-check-button[hidden] {
  display: none;
}

.stop-and-check {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 30px 0 24px;
  padding: 16px 18px;
  border: 3px solid var(--charcoal);
  border-top: 6px solid var(--blue);
  background: var(--paper);
  box-shadow: 0 4px 0 var(--charcoal);
  border-radius: 16px;
  font-weight: 500;
  color: var(--text);
  animation: pop-fade-in 0.5s ease-out;
}

.stop-and-check[hidden] {
  display: none;
}

.stop-and-check {
  display: grid;
  grid-template-columns: 4fr 1fr;
  grid-template-rows: 1fr;
}

.stop-and-check img {
  align-self: center;
  width: clamp(150px, 20vw, 200px);
}
</style>
