<script setup>
import { onMounted, onBeforeUnmount } from "vue";
import Card from "../components/homepage/Card.vue";
import { useHomeStore } from "../stores/home.js";

const lessons = [
  {
    href: "lesson1/",
    img: "/images/index/lesson1.png",
    accent: "var(--purple)",
    subtitle: "Asking Scientific Questions & Making Predictions",
    description:
      "Use what you know about the world to ask questions and make predictions.",
    experiment: "Toy Cars Rolling Down Ramps",
  },
  {
    href: "lesson2/",
    img: "/images/index/lesson2.png",
    accent: "var(--orange)",
    subtitle: "Planning a Fair Test",
    description: "Learn how to plan a fair test and represent it as a diagram.",
    experiment: "Ball Bounce Test",
  },
  {
    href: "lesson3/",
    img: "/images/index/lesson3.png",
    accent: "var(--green)",
    subtitle: "Organising Fair Test Data into a Table",
    description:
      "Collect data from a fair test and learn how to organize it into a table.",
    experiment: "Is Yeast Alive?",
  },
  {
    href: "lesson4/",
    img: "/images/index/lesson3.png",
    accent: "var(--purple)",
    subtitle: "Science Inquiry Lab - Skills Check!",
    description:
      "Apply what you have learned in lessons 1,2 and 3.",
    experiment: "Ball Bounce Test Continued",
  },
  {
    href: "lesson5/",
    img: "/images/index/lesson4.png",
    accent: "var(--blue)",
    subtitle: "Using Bar Graphs to Visualise Data",
    description:
      "Learn how to convert data into a bar graph to help analyse results.",
    experiment: "Leadbeaters Possum Conservation",
  },
  {
    href: "lesson6/",
    img: "/images/index/lesson4.png",
    accent: "var(--blue)",
    subtitle: "Using Line Graphs to Visualise Data",
    description:
      "Learn how to convert data into a line graph to help analyse results.",
    experiment: "What lives in the intertidal zone?",
  },
  {
    href: "lesson7/",
    img: "/images/index/lesson4.png",
    accent: "var(--green)",
    subtitle: "Drawing Scientific Diagrams",
    description:
      "Learn how to represent experiments as a diagram and observations as scientific drawings.",
    experiment: "Deep Sea Exploration + Rust experiment",
  },
  {
    href: "lesson8/",
    img: "/images/index/lesson4.png",
    accent: "var(--green)",
    subtitle: "Communicating Science",
    description:
      "Learn how to report on a fair test using a scientific poster or scientific report.",
    experiment: "Reaction Time Experiment",
  },
];

const home = useHomeStore();

function isLessonComplete(lessonNumber) {
  return home.completeLessons.includes(`lesson${lessonNumber}`);
}

let teardown = null;

// All DOM access happens after the template has rendered.
onMounted(() => {
  document.title = "Science Inquiry Lab Overview";

  // ─────────────────────────────────────────────
  // Carousel configuration
  // ─────────────────────────────────────────────

  // Lessons up to availableLesson are unlocked.
  // Click the heading 5 times to unlock everything.

  const availableLesson = 7;
  let showAll = false;

  const cards = [...document.querySelectorAll(".lesson-card")];

  const carouselTrack = document.querySelector(".carousel-track");
  const previousButton = document.querySelector(".carousel-control--previous");
  const nextButton = document.querySelector(".carousel-control--next");
  const status = document.querySelector(".carousel-status");

  let currentIndex = 0;

  // ─────────────────────────────────────────────
  // Tilt configuration
  // ─────────────────────────────────────────────

  const MAX_ROTATION = 3; // Maximum rotation in degrees

  const BASE_SCALE = 1.05; // Scale when hovering at the centre
  const EXTRA_SCALE = 0.01; // Additional scale toward corners

  const SMOOTHING = 0.15; // 0.08 - 0.15 feels good

  const MAX_SHADOW_OFFSET = 10; // Maximum shadow offset in px
  const BASE_SHADOW_BLUR = 10; // Minimum shadow blur in px
  const EXTRA_SHADOW_BLUR = 10; // Additional blur toward corners

  const SHADOW_OPACITY = 0.4;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // ─────────────────────────────────────────────
  // Animation state
  // ─────────────────────────────────────────────

  const activeCards = new Set();

  let animationRunning = false;

  // ─────────────────────────────────────────────
  // Initialise card objects
  // ─────────────────────────────────────────────

  const cardStates = cards.map((element) => ({
    element,

    // Hover state
    hovered: false,

    // Current rendered values
    currentRotateX: 0,
    currentRotateY: 0,
    currentScale: 1,

    currentShadowX: 0,
    currentShadowY: 0,
    currentShadowOpacity: 0,

    // Target values
    targetRotateX: 0,
    targetRotateY: 0,
    targetScale: 1,

    targetShadowX: 0,
    targetShadowY: 0,
    targetShadowOpacity: 0,

    // Normalized mouse position (-1 to 1)
    dx: 0,
    dy: 0,
  }));

  const cardEventListeners = new Map(cards.map((card) => [card, []]));

  function addCardEventListener(card, type, listener) {
    card.addEventListener(type, listener);
    cardEventListeners.get(card).push({ type, listener });
  }

  // ─────────────────────────────────────────────
  // Animation utilities
  // ─────────────────────────────────────────────

  function startAnimation() {
    if (reduceMotion || animationRunning) return;

    animationRunning = true;

    requestAnimationFrame(animate);
  }

  function isSettled(card) {
    const threshold = 0.001;

    return (
      Math.abs(card.targetRotateX - card.currentRotateX) < threshold &&
      Math.abs(card.targetRotateY - card.currentRotateY) < threshold &&
      Math.abs(card.targetScale - card.currentScale) < threshold &&
      Math.abs(card.targetShadowX - card.currentShadowX) < threshold &&
      Math.abs(card.targetShadowY - card.currentShadowY) < threshold &&
      Math.abs(card.targetShadowOpacity - card.currentShadowOpacity) < threshold
    );
  }

  function updateCardStyles(card) {
    const distance = Math.min(
      Math.sqrt(card.dx * card.dx + card.dy * card.dy),
      1,
    );

    const blur = BASE_SHADOW_BLUR + distance * EXTRA_SHADOW_BLUR;

    const x = card.currentRotateX;
    const y = card.currentRotateY;

    const angle = Math.hypot(x, y);

    const axisX = angle > 0.0001 ? x / angle : 1;
    const axisY = angle > 0.0001 ? y / angle : 0;

    card.element.style.setProperty(
      "--tilt-angle",
      `${axisX} ${axisY} 0 ${angle}deg`,
    );

    card.element.style.setProperty("--tilt-scale", card.currentScale);

    // Shadow
    card.element.style.setProperty(
      "--tilt-shadow",
      `
              ${card.currentShadowX}px
              ${card.currentShadowY}px
              ${blur}px
              rgba(0, 0, 0, ${card.currentShadowOpacity})
          `,
    );
  }

  // ─────────────────────────────────────────────
  // Animation loop
  // ─────────────────────────────────────────────

  function animate() {
    for (const card of activeCards) {
      // ─────────────────────────────────────
      // Rotation and scale
      // ─────────────────────────────────────

      card.currentRotateX +=
        (card.targetRotateX - card.currentRotateX) * SMOOTHING;

      card.currentRotateY +=
        (card.targetRotateY - card.currentRotateY) * SMOOTHING;

      card.currentScale += (card.targetScale - card.currentScale) * SMOOTHING;

      // ─────────────────────────────────────
      // Shadow interpolation
      // ─────────────────────────────────────

      card.currentShadowOpacity +=
        (card.targetShadowOpacity - card.currentShadowOpacity) * SMOOTHING;

      card.currentShadowX +=
        (card.targetShadowX - card.currentShadowX) * SMOOTHING;

      card.currentShadowY +=
        (card.targetShadowY - card.currentShadowY) * SMOOTHING;

      // Apply updated styles
      updateCardStyles(card);

      // ─────────────────────────────────────
      // Check whether card has settled
      // ─────────────────────────────────────

      if (!card.hovered && isSettled(card)) {
        // Snap to exact target values
        card.currentRotateX = card.targetRotateX;
        card.currentRotateY = card.targetRotateY;
        card.currentScale = card.targetScale;

        card.currentShadowX = card.targetShadowX;
        card.currentShadowY = card.targetShadowY;
        card.currentShadowOpacity = card.targetShadowOpacity;

        updateCardStyles(card);

        // No longer needs animation
        activeCards.delete(card);
      }
    }

    // Continue only while cards are active
    if (activeCards.size > 0) {
      requestAnimationFrame(animate);
    } else {
      animationRunning = false;
    }
  }

  // ─────────────────────────────────────────────
  // Reset tilt
  // ─────────────────────────────────────────────

  function resetTilt() {
    cardStates.forEach((card) => {
      card.hovered = false;

      card.targetRotateX = 0;
      card.targetRotateY = 0;
      card.targetScale = 1;

      card.targetShadowOpacity = 0;

      // Preserve the last shadow position while it fades out.
      // This prevents the shadow from jumping on mouseleave.

      if (!reduceMotion) {
        activeCards.add(card);
      } else {
        card.currentRotateX = 0;
        card.currentRotateY = 0;
        card.currentScale = 1;

        card.currentShadowOpacity = 0;

        updateCardStyles(card);
      }
    });

    startAnimation();
  }

  // ─────────────────────────────────────────────
  // Tilt event listeners
  // ─────────────────────────────────────────────

  cardStates.forEach((card, index) => {
    const element = card.element;

    addCardEventListener(element, "mouseenter", () => {
      // Only tilt the currently selected lesson
      if (index !== currentIndex || element.classList.contains("unavailable")) {
        return;
      }

      card.hovered = true;

      activeCards.add(card);

      startAnimation();
    });

    addCardEventListener(element, "mousemove", (event) => {
      // Only tilt the currently selected lesson
      if (index !== currentIndex || element.classList.contains("unavailable")) {
        return;
      }

      const rect = element.getBoundingClientRect();

      // Mouse position normalised to -1..1

      card.dx =
        (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);

      card.dy =
        (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

      // Clamp values

      card.dx = Math.max(-1, Math.min(1, card.dx));
      card.dy = Math.max(-1, Math.min(1, card.dy));

      // ─────────────────────────────────────
      // Rotation
      // ─────────────────────────────────────

      card.targetRotateY = card.dx * MAX_ROTATION;
      card.targetRotateX = -card.dy * MAX_ROTATION;

      // ─────────────────────────────────────
      // Scale
      // ─────────────────────────────────────

      const distance = Math.min(
        Math.sqrt(card.dx * card.dx + card.dy * card.dy),
        1,
      );

      card.targetScale = BASE_SCALE + distance * EXTRA_SCALE;

      // ─────────────────────────────────────
      // Shadow
      // ─────────────────────────────────────

      card.targetShadowOpacity = SHADOW_OPACITY;

      card.targetShadowX = -card.dx * MAX_SHADOW_OFFSET;
      card.targetShadowY = card.dy * MAX_SHADOW_OFFSET;

      activeCards.add(card);

      startAnimation();
    });

    addCardEventListener(element, "mouseleave", () => {
      card.hovered = false;

      // Return to original position
      card.targetRotateX = 0;
      card.targetRotateY = 0;
      card.targetScale = 1;

      // Fade shadow out
      card.targetShadowOpacity = 0;

      // Keep animating until the card settles
      activeCards.add(card);

      startAnimation();
    });
  });

  // ─────────────────────────────────────────────
  // Carousel functionality
  // ─────────────────────────────────────────────

  function updateVisibility() {
    document.querySelectorAll("[data-stage]").forEach((item) => {
      item.classList.toggle(
        "unavailable",
        !showAll && Number(item.dataset.stage) > availableLesson,
      );

      item.setAttribute(
        "aria-disabled",
        String(item.classList.contains("unavailable")),
      );
    });
  }

  // The current lesson lives in the home store, which saves itself.
  showLesson(home.currentLesson);

  function showLesson(index, animate = false) {
    // Reset any active tilt before changing lessons
    resetTilt();

    currentIndex = Math.max(0, Math.min(index, cards.length - 1));
    home.currentLesson = currentIndex;

    cards.forEach((card, cardIndex) => {
      const offset = cardIndex - currentIndex;

      card.classList.toggle("is-current", offset === 0);
      card.classList.toggle("is-previous", offset === -1);
      card.classList.toggle("is-next", offset === 1);
      card.classList.toggle("is-hidden", Math.abs(offset) > 1);

      card.tabIndex = Math.abs(offset) <= 1 ? 0 : -1;

      card.setAttribute("aria-hidden", String(Math.abs(offset) > 1));

      if (offset === 0) {
        card.setAttribute("aria-current", "true");
      } else {
        card.removeAttribute("aria-current");
      }
    });

    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === cards.length - 1;

    status.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
  }

  // ─────────────────────────────────────────────
  // Carousel controls
  // ─────────────────────────────────────────────

  previousButton.addEventListener("click", () => {
    showLesson(currentIndex - 1, true);
  });

  nextButton.addEventListener("click", () => {
    showLesson(currentIndex + 1, true);
  });

  let swipeStart = null;
  let swipeClickCard = null;
  let swipeClickTimeout = 0;

  const SWIPE_THRESHOLD = 100;

  function updateSwipePreview(deltaX) {
    const trackWidth = carouselTrack.clientWidth;
    const swipeDirection = deltaX < 0 ? 1 : -1;
    let progress = Math.min(Math.abs(deltaX) / (trackWidth * 0.55), 1);

    if (
      (currentIndex === 0 && swipeDirection < 0) ||
      (currentIndex === cards.length - 1 && swipeDirection > 0)
    ) {
      progress *= 0.18;
    }

    const swipeDistance =
      window.innerWidth <= 600
        ? trackWidth * 0.3
        : Math.min(window.innerWidth * 0.4, 460);
    const currentWidth = cards[currentIndex].getBoundingClientRect().width;
    const sideWidth =
      window.innerWidth <= 600
        ? Math.min(window.innerWidth * 0.54, 250)
        : currentWidth;

    carouselTrack.classList.add("is-swiping");

    cards.forEach((card, cardIndex) => {
      const offset = cardIndex - currentIndex - swipeDirection * progress;
      const distance = Math.abs(offset);
      const visibleOffset = Math.min(distance, 1);
      const sideOpacity =
        distance <= 1
          ? 1 - visibleOffset * 0.38
          : Math.max(0, 0.62 * (1 - (distance - 1) / 0.6));

      card.style.setProperty(
        "--swipe-x",
        `${Math.max(-1, Math.min(1, offset)) * swipeDistance}px`,
      );

      card.style.setProperty("--swipe-opacity", String(sideOpacity));
      card.style.setProperty("--swipe-scale", String(1 - visibleOffset * 0.18));
      card.style.setProperty(
        "--swipe-rotate",
        `${Math.max(-1, Math.min(1, offset)) * 30}deg`,
      );
      card.style.setProperty(
        "--swipe-z",
        String(Math.max(0, 2 - Math.round(distance))),
      );
    });
  }

  function clearSwipePreview() {
    carouselTrack.classList.remove("is-swiping");
    cards.forEach((card) => {
      card.style.removeProperty("--swipe-x");
      card.style.removeProperty("--swipe-opacity");
      card.style.removeProperty("--swipe-scale");
      card.style.removeProperty("--swipe-rotate");
      card.style.removeProperty("--swipe-z");
    });
  }

  carouselTrack.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" || !event.isPrimary) {
      return;
    }

    const target = event.target;
    swipeStart = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      card: target instanceof Element ? target.closest(".lesson-card") : null,
    };
  });

  carouselTrack.addEventListener("pointermove", (event) => {
    if (!swipeStart || event.pointerId !== swipeStart.pointerId) {
      return;
    }

    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;

    if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
      updateSwipePreview(deltaX);
    } else if (Math.abs(deltaY) > 8) {
      clearSwipePreview();
    }
  });

  carouselTrack.addEventListener("pointerup", (event) => {
    if (!swipeStart || event.pointerId !== swipeStart.pointerId) {
      return;
    }

    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    const swipedCard = swipeStart.card;
    swipeStart = null;

    const isSwipe =
      Math.abs(deltaX) >= SWIPE_THRESHOLD &&
      Math.abs(deltaX) > Math.abs(deltaY);

    if (isSwipe) {
      const nextIndex = currentIndex + (deltaX < 0 ? 1 : -1);
      if (nextIndex !== currentIndex) {
        showLesson(nextIndex, true);
      }
    }

    clearSwipePreview();

    if (!isSwipe) {
      return;
    }

    if (swipedCard) {
      swipeClickCard = swipedCard;
      window.clearTimeout(swipeClickTimeout);
      swipeClickTimeout = window.setTimeout(() => {
        swipeClickCard = null;
      }, 750);
    }
  });

  carouselTrack.addEventListener("pointercancel", (event) => {
    if (swipeStart?.pointerId === event.pointerId) {
      swipeStart = null;
      clearSwipePreview();
    }
  });

  carouselTrack.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (
        swipeClickCard &&
        event.detail > 0 &&
        target instanceof Element &&
        target.closest(".lesson-card") === swipeClickCard
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        swipeClickCard = null;
        window.clearTimeout(swipeClickTimeout);
      }
    },
    true,
  );

  // ─────────────────────────────────────────────
  // Card click behaviour
  // ─────────────────────────────────────────────

  cards.forEach((card, index) => {
    addCardEventListener(card, "click", (event) => {
      if (index !== currentIndex || card.classList.contains("unavailable")) {
        event.preventDefault();
        showLesson(index, true);
      }
    });
  });

  // ─────────────────────────────────────────────
  // Initialise carousel
  // ─────────────────────────────────────────────

  updateVisibility();

  showLesson(currentIndex);

  // ─────────────────────────────────────────────
  // Unlock all lessons
  // ─────────────────────────────────────────────

  function removeEventListenersAndClasses() {
    cards.forEach((card) => {
      cardEventListeners.get(card).forEach(({ type, listener }) => {
        card.removeEventListener(type, listener);
      });
      cardEventListeners.delete(card);
      card.classList.remove(
        "is-current",
        "is-previous",
        "is-next",
        "is-hidden",
      );
    });
  }

  let heroClicks = 0;

  document.getElementById("hero").addEventListener("click", () => {
    if (!showAll && ++heroClicks >= 5) {
      showAll = true;

      removeEventListenersAndClasses();
      carouselTrack.classList.add("is-grid");
      updateVisibility();
    }
  });

  teardown = () => {
    // stop the animation loop and any pending timers
    activeCards.clear();
    window.clearTimeout(swipeClickTimeout);
  };
});

onBeforeUnmount(() => {
  if (teardown) teardown();
});
</script>

<template>
  <main class="page">
    <header class="lesson-heading">
      <div id="hero">
        <img src="../images/index/title.png" alt="Science Inquiry Lab" />
      </div>
    </header>

    <section class="carousel" aria-label="Choose a lesson">
      <button
        class="carousel-control carousel-control--previous"
        type="button"
        aria-label="Show previous lesson"
      ></button>
      <div class="carousel-track">
        <Card
          v-for="[number, lesson] of lessons.entries()"
          :key="number + 1"
          :href="lesson.href"
          :img="lesson.img"
          :stage="number + 1"
          :accent="lesson.accent"
          :description="lesson.description"
          :experiment="lesson.experiment"
          :lesson-complete="isLessonComplete(number + 1)"
        >
          <template #number>Lesson {{ number + 1 }}</template>
          <template #subtitle>{{ lesson.subtitle }}</template>
        </Card>
      </div>
      <button
        class="carousel-control carousel-control--next"
        type="button"
        aria-label="Show next lesson"
      ></button>
    </section>
    <p class="carousel-status" aria-live="polite"></p>
  </main>
</template>

<style scoped>
:global(body) {
  min-height: 100vh;
  /* background: radial-gradient(ellipse at 50% 48%, #fffdf4 0, var(--cream) 68%); */
  background-image: url("../images/index/background.png");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
.page {
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto minmax(min-content, 1fr) auto;
  align-items: center;
  gap: clamp(8px, 1.2vh, 20px);
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  /* Clip only sideways: allow vertical scrolling at high browser zoom. */
  overflow-x: clip;
  padding: clamp(14px, 2.5vh, 32px) 0;
}
.lesson-heading {
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  align-self: start;
  width: min(460px, 92vw);
  height: clamp(148px, 24vh, 210px);
  margin: 0;
}
#hero {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  box-shadow: none;
  user-select: none;
}

#hero img {
  display: block;
  /* Prevent the rotated logo from taking over short/zoomed viewports. */
  width: clamp(125px, 23vh, 180px);
  max-width: none;
  height: auto;
  transform: rotate(90deg);
}

.carousel {
  position: relative;
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 56px;
  grid-template-rows: 1fr;
  width: min(calc(100% - 32px), 1480px);
  height: clamp(460px, 58vh, 620px);
  align-self: center;
  justify-self: center;
  align-items: center;
  justify-items: center;
  column-gap: 12px;
  min-height: 0;
  margin: 0 auto;
}
.carousel-track {
  position: relative;
  align-self: stretch;
  grid-column: 1 / -1;
  grid-row: 1;
  width: 100%;
  perspective: 1200px;
  touch-action: pan-y;
}
/* Grid mode: hide arrows, let the track size to its cards */
.carousel:has(.carousel-track.is-grid) {
  grid-template-rows: auto;
  width: min(calc(100% - 100px), 1980px);
  height: auto;
}
.carousel:has(.carousel-track.is-grid) .carousel-control {
  display: none;
}
.carousel-track.is-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, min(100%, 550px));
  grid-auto-rows: auto;
  gap: 16px;
  align-items: stretch;
  justify-content: center;
  height: auto;
}
.carousel-track.is-grid .lesson-card {
  position: static;
  width: auto;
  min-height: 380px;
  /* Content determines height in the teacher's all-lessons grid. */
  aspect-ratio: auto;
  padding: clamp(16px, 2vw, 28px);
  box-shadow: none;

  transform: none;

  rotate: none;
  scale: 1;

  transition: none;
  will-change: none;

  animation: pop-fade-in 0.5s ease;
}
/* Grid mode: the overview sits in the card's flow, under the title */
.carousel-track.is-grid :deep(.overview) {
  position: static;
  width: 100%;
  margin: auto 0 0;
}
.carousel-track.is-grid .lesson-card:hover {
  background: color-mix(in srgb, var(--accent) 20%, white 80%);
}

.carousel-track.is-swiping .lesson-card {
  left: calc(50% + var(--swipe-x));
  z-index: var(--swipe-z);
  opacity: var(--swipe-opacity);
  transform: translate(-50%, -50%) scale(var(--swipe-scale))
    rotateY(var(--swipe-rotate));
  transition: none;
}
.carousel-control {
  position: relative;
  z-index: 3;
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  justify-self: center;
  border: 2px solid var(--line);
  border-radius: 50%;
  background: var(--paper);
  box-shadow: var(--shadow-small);
  cursor: pointer;
  transition:
    background 0.2s ease,
    opacity 0.2s ease;
}
.carousel-control:hover:not(:disabled) {
  background: var(--yellow);
}
.carousel-control:disabled {
  cursor: default;
  opacity: 0.35;
}
.carousel-control::before {
  width: 10px;
  height: 10px;
  border-top: 3px solid var(--text);
  border-right: 3px solid var(--text);
  content: "";
}
.carousel-control--previous {
  grid-column: 1;
  grid-row: 1;
}
.carousel-control--previous::before {
  margin-left: 5px;
  transform: rotate(-135deg);
}
.carousel-control--next {
  grid-column: 3;
  grid-row: 1;
}
.carousel-control--next::before {
  margin-right: 5px;
  transform: rotate(45deg);
}
.carousel-status {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-align: center;
  text-transform: uppercase;
}
.carousel-control:focus-visible,
#hero:focus-visible {
  outline: 4px solid var(--purple);
  outline-offset: 5px;
}
@media (max-width: 700px) {
  .page {
    padding: 18px 0;
  }
  .lesson-heading {
    height: 124px;
  }
  #hero img {
    width: 112px;
  }
  .carousel {
    grid-template-columns: 40px minmax(0, 1fr) 40px;
    grid-template-rows: 1fr;
    height: 560px;
  }
  .carousel-track {
    height: 100%;
  }
  .carousel-track.is-grid {
    height: auto;
  }
  .carousel-control {
    width: 40px;
    height: 40px;
  }
}
@media (max-width: 520px) {
  .carousel {
    height: 620px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}

/* Larger screens: scale the homepage with the viewport */
@media (min-width: 1600px) {
  .lesson-heading {
    height: max(210px, 18vh);
  }

  #hero img {
    /* Increase only the logo on large screens; keep carousel/card sizing unchanged. */
    width: clamp(360px, 18vw, 520px);
  }

  .carousel {
    width: min(calc(100% - 32px), max(1480px, 70vw));
    height: max(620px, 60vh);
  }

  .carousel-control {
    width: max(48px, 1.7vw);
    height: max(48px, 1.7vw);
  }
}
</style>
