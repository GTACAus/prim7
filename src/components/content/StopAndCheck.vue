<script setup>
/*
  "Stop and think" box: a question (#content) and an answer (#answer) shown
  once the button is pressed. Exposes `pressed` so the page can show more
  once it has been checked (<StopAndCheck ref="check"> ... v-if="check?.pressed").
*/
import { computed, ref } from "vue";
import ButtonReveal from "@/components/activities/ButtonReveal.vue";
import Button from "@/components/ui/Button.vue";
import FloatingTitleBox from "@/components/ui/FloatingTitleBox.vue";
import stopIcon from "@/assets/stopandthinkicon.png";

const reveal = ref(null);
const pressed = computed(() => reveal.value?.pressed ?? false);

defineExpose({ pressed });
</script>

<template>
  <ButtonReveal ref="reveal" class="stop-and-check" v-slot="{ pressed, press }">
    <FloatingTitleBox
      title="STOP AND THINK"
      border-color="var(--blue)"
      class="stop-and-check-box"
    >
      <div class="stop-and-check-content">
        <slot name="content" />
        <p>Click the button below to check your answer.</p>
      </div>
      <img :src="stopIcon" alt="Stop and think icon" />
      <FloatingTitleBox
        v-if="pressed"
        title="Answer"
        border-color="var(--green)"
        title-color="var(--paper)"
        class="stop-and-check-answer"
      >
        <slot name="answer" />
      </FloatingTitleBox>
      <Button v-else class="stop-and-check-button" symbol="✓" @click="press">
        Check Your Answer
      </Button>
    </FloatingTitleBox>
  </ButtonReveal>
</template>

<style scoped>
/* The box itself is the grid: question on the left, icon on the right, and
   the answer / button on a full-width row underneath. */
.stop-and-check-box {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(150px, 1fr);
  align-items: center;
  column-gap: 16px;
  margin: 0;
  font-weight: 500;
}

.stop-and-check-answer {
  grid-column: 1 / -1;
  margin: 20px 0 0;
  padding: 15px 15px 10px;
  background-color: var(--soft-green);
  font-weight: 500;
}

.stop-and-check-button {
  width: fit-content;
  margin: 0 auto;
  margin-top: 20px;
  background: var(--mint);
  --color: var(--text);
  font-weight: 600;
  grid-column: 1 / -1;

  --color-hover: var(--paper);
}

.stop-and-check-button[hidden] {
  display: none;
}

.stop-and-check {
  margin: 30px 0 24px;
}

.stop-and-check[hidden] {
  display: none;
}

.stop-and-check img {
  justify-self: center;
  width: clamp(150px, 20vw, 250px);
  max-width: 100%;
}
</style>
