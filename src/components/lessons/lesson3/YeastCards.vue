<script setup>
/*
  Lesson 3 "Is yeast alive?": four numbered photos. Hovering a card shows its
  text over the image; on small screens (≤1000px) tapping a card opens the
  text full screen instead.

    <YeastCards />
*/
import { ref } from "vue";
import Button from "@/components/ui/Button.vue";
import sourdoughBreadImg from "@/assets/lesson3/sourdough-bread.jpg";
import sourdoughStarterImg from "@/assets/lesson3/sourdough-starter.jpg";
import sugarBlocksImg from "@/assets/lesson3/sugar-blocks.jpg";
import yeastImg from "@/assets/lesson3/yeast.jpg";

const cards = [
  {
    image: yeastImg,
    alt: "Dry yeast",
    text: "Dry yeast is sold in packets. Yeast is a tiny living thing that you can only see under a microscope! Even though it is tiny, yeast is alive, and just like other living things, it needs food to survive. The yeast in these packets is dormant. To wake it up you need to give it water, sugar, and the right temperature to make it active.",
  },
  {
    image: sugarBlocksImg,
    alt: "Sugar",
    text: "Yeast uses sugar as a food source, so it can grow and reproduce.",
  },
  {
    image: sourdoughStarterImg,
    alt: "Sourdough starter",
    text: "When you mix dry yeast and sugar in water, the yeast becomes active. Active yeast releases carbon dioxide gas. This gas can be seen as bubbles in the mixture. The gas bubbles rise to the top and they pop, so the gas escapes the mixture into the air.",
  },
  {
    image: sourdoughBreadImg,
    alt: "Sourdough bread",
    text: "Active yeast produces and releases carbon dioxide gas. When added to bread dough, this makes the dough rise. As bread is baked the bubbles of gas get trapped, making holes in the bread so it is light and soft to eat.",
  },
];

// text shown in the full-screen mobile overlay (null = closed)
const modalText = ref(null);

function openCard(card) {
  if (window.matchMedia("(max-width: 1000px)").matches)
    modalText.value = card.text;
}

function close() {
  modalText.value = null;
}
</script>

<template>
  <div class="diagram-box diagram-activity yeast-image-activity">
    <div
      v-for="(card, i) in cards"
      :key="card.image"
      class="yeast-card"
      @click="openCard(card)"
    >
      <span class="yeast-number">{{ i + 1 }}</span>
      <img :src="card.image" :alt="card.alt" />
      <div class="yeast-overlay">
        <p>{{ card.text }}</p>
      </div>
    </div>
  </div>

  <!-- Full-screen mobile overlay -->
  <Teleport to="body">
    <div
      class="yeast-mobile-modal"
      :class="{ 'is-open': modalText }"
      @click.self="close"
    >
      <div class="yeast-mobile-modal-box">
        <button
          class="yeast-modal-close"
          type="button"
          aria-label="Close"
          @click="close"
        >
          &times;
        </button>

        <div class="yeast-modal-content">
          <p>{{ modalText }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.yeast-image-activity {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin: 0 auto;
}

.yeast-card {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  aspect-ratio: 4 / 3;
  cursor: pointer;

  container-type: inline-size;
}

.yeast-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Number label */
.yeast-number {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 3;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 36px;
  height: 36px;
  border-radius: 50%;

  background: rgba(0, 0, 0, 0.3);
  color: var(--paper);
  font-size: 20px;
  font-weight: bold;
}

.yeast-card:hover .yeast-number {
  display: none;
}

/* Hover information */
.yeast-overlay {
  position: absolute;
  inset: 0;

  display: flex;
  flex-direction: column;
  justify-content: center;

  padding: clamp(8px, 5cqw, 24px);

  background: rgba(0, 0, 0, 0.75);
  color: var(--paper);

  opacity: 0;
  transition: opacity 0.25s ease;
}

.yeast-mobile-modal {
  display: none;
}

/* Mobile */
@media (max-width: 1000px) {
  /* Stop the normal hover overlay appearing */
  .yeast-card:hover .yeast-overlay {
    opacity: 0;
  }

  .yeast-mobile-modal {
    position: fixed;
    inset: 0;
    z-index: 9999;

    display: flex;
    align-items: center;
    justify-content: center;

    opacity: 0;
    visibility: hidden;
    pointer-events: none;

    /*
        The backdrop fades quickly so the box is already visible while it
        grows. Visibility must last as long as the growth animation,
        otherwise the box is hidden part way through.
      */
    transition:
      opacity 0.12s ease,
      visibility 0.32s ease;
  }

  .yeast-mobile-modal-box {
    position: relative;
    width: 500px;
    height: 50%;

    display: flex;
    justify-content: center;
    align-items: center;

    margin: auto;
    padding: 40px;

    color: var(--paper);
    background: rgba(0, 0, 0, 0.9);
    border-radius: 16px;
  }

  .yeast-mobile-modal.is-open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  .yeast-modal-content {
    width: 100%;
    max-width: 500px;
    text-align: center;
  }

  .yeast-modal-content h3 {
    font-size: clamp(24px, 7vw, 38px);
    margin: 0 0 20px;
  }

  .yeast-modal-content p {
    font-size: clamp(16px, 4.5vw, 22px);
    line-height: 1.5;
    margin: 0;
  }

  .yeast-modal-close {
    position: absolute;
    top: 0;
    right: 0;

    border: 0;
    background: transparent;
    color: white;

    font-size: 48px;
    line-height: 1;

    cursor: pointer;
  }
}

.yeast-card:hover .yeast-overlay {
  opacity: 1;
}

.yeast-overlay p {
  margin: 0;
  line-height: 1.5;
  font-size: clamp(11px, 4cqw, 16px);
}

/* Mobile */
@media (max-width: 600px) {
  .yeast-image-activity {
    grid-template-columns: 1fr;
  }
}
</style>
