<script setup>
/*
  Lesson 2 "select the picture showing a fair test": four pairs of balls, one
  of which changes only the ball size. Each card shows its own feedback once
  picked. Built on <MultipleChoice> (live: only the latest pick counts).

    <BallPairChoice />
*/
import MultipleChoice from "../activities/MultipleChoice.vue";
import McQuestion from "../activities/McQuestion.vue";
import McChoice from "../activities/McChoice.vue";
import Button from "../Button.vue";

const pairs = [
  {
    // Correct: different size, same material and shape
    value: "basketballs",
    image: "../images/lesson2/l2-mcq1.png",
    alt: "A large basketball beside a small basketball",
    title: "Yes — this pair can be used for a fair test experiment",
    text: "These basketballs are different sizes, but they have the same shape and are made from the same material. Ball size is the only variable changed, so this pair can be used in a <strong>fair test</strong>.",
  },
  {
    // Incorrect: material also changes
    value: "basketball-tennis",
    image: "../images/lesson2/l2-mcq2.png",
    alt: "A basketball beside a tennis ball",
    title: "Not a fair test experiment - two variables are changed",
    text: "These balls are different sizes, but they are also made of different materials. You could not know whether the height of the bounce changes because of size or material. Try again.",
  },
  {
    // Incorrect: shape also changes
    value: "soccer-football",
    image: "../images/lesson2/l2-mcq3.png",
    alt: "A soccer ball beside an oval football",
    title: "Not a fair test experiment - two variables are changed",
    text: "These balls are different sizes and have different shapes. The size and shape could both affect the bounce height. Try again.",
  },
  {
    // Incorrect: no size change
    value: "same-size",
    image: "../images/lesson2/l2-mcq4.png",
    alt: "Two basketballs of the same size",
    title: "Not a fair test experiment - no variables are changed",
    text: "These balls have the same size, shape, and they are made of the same material. This investigation is testing the effect of ball size, so the balls must be different sizes. Try again.",
  },
];

const classes = {
  selected: "selected",
  correct: "correct-selection",
  incorrect: "incorrect-selection",
};
</script>

<template>
  <MultipleChoice completion-mode="live" :classes="classes" v-slot="{ reset }">
    <McQuestion name="ball-pair" answer="basketballs" class="ball-pair-grid">
      <McChoice
        v-for="pair in pairs"
        :key="pair.value"
        :value="pair.value"
        class="ball-pair-card"
        v-slot="{ selected, correct }"
      >
        <span class="ball-pair-images">
          <img class="ball-pair-image" :src="pair.image" :alt="pair.alt" />
        </span>
        <span
          class="ball-pair-card-feedback"
          :class="
            selected
              ? correct
                ? 'feedback-success'
                : 'feedback-try-again'
              : null
          "
          role="status"
          aria-live="polite"
        >
          <template v-if="selected">
            <strong class="ball-pair-feedback-title">{{ pair.title }}</strong>
            <span class="ball-pair-feedback-text" v-html="pair.text"></span>
          </template>
        </span>
      </McChoice>
    </McQuestion>

    <div class="reset-button-container">
      <Button :is-reset="true" @click="reset" />
    </div>
  </MultipleChoice>
</template>

<style scoped>
.ball-pair-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
  margin-top: 20px;
  align-items: start;
}

.ball-pair-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;

  min-height: 0;
  padding: 16px;

  background: var(--paper);
  color: var(--text);

  border: 3px solid var(--line);
  border-radius: 20px;

  box-shadow: 0 3px 0 var(--line);

  font: inherit;
  text-align: left;

  cursor: pointer;

  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.ball-pair-card:not(.selected):hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 0 var(--line);
}

.ball-pair-card.selected {
  outline: none;
  transform: translateY(0);
  box-shadow: 0 0px 0 var(--line);
}

.ball-pair-card.correct-selection {
  background: var(--soft-green);
}

.ball-pair-card.incorrect-selection {
  background: var(--soft-orange);
}

.ball-pair-images {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  min-height: 180px;
  padding: 8px;

  overflow: hidden;

  background: var(--paper);

  border: 2px solid var(--line);
  border-radius: 16px;
}

.ball-pair-image {
  display: block;

  width: 100%;
  height: 180px;

  object-fit: contain;
}

.ball-pair-card-feedback {
  display: none;
}

.ball-pair-card-feedback.feedback-success,
.ball-pair-card-feedback.feedback-try-again {
  display: block;

  padding: 14px 16px;

  border: 2px solid var(--line);
  border-radius: 14px;

  color: var(--text);
  text-align: center;
  line-height: 1.5;
}

.ball-pair-card-feedback.feedback-success {
  background: var(--soft-green);
}

.ball-pair-card-feedback.feedback-try-again {
  background: var(--soft-orange);
}

.ball-pair-feedback-title {
  display: block;
  margin-bottom: 6px;

  font-size: 1.05rem;
  font-weight: 700;
}

.ball-pair-feedback-text {
  display: block;

  font-weight: 500;
  line-height: 1.55;
}

@media (max-width: 760px) {
  .ball-pair-grid {
    grid-template-columns: 1fr;
  }
}
</style>
