import { onMounted, onBeforeUnmount } from "vue";

// Mouse-driven 3D tilt for one element. Writes --tilt-angle, --tilt-scale and
// --tilt-shadow on the element, which the element's own CSS reads.
//
//   const { reset } = useTilt(elementRef, () => shouldTilt);
//
// canTilt() is checked on every hover event; call reset() to ease the element
// back to rest (e.g. when it stops being the selected card).

const MAX_ROTATION = 3; // Maximum rotation in degrees

const BASE_SCALE = 1.05; // Scale when hovering at the centre
const EXTRA_SCALE = 0.01; // Additional scale toward corners

const SMOOTHING = 0.15; // 0.08 - 0.15 feels good
const SETTLE_THRESHOLD = 0.001;

const MAX_SHADOW_OFFSET = 10; // Maximum shadow offset in px
const BASE_SHADOW_BLUR = 10; // Minimum shadow blur in px
const EXTRA_SHADOW_BLUR = 10; // Additional blur toward corners
const SHADOW_OPACITY = 0.4;

export function useTilt(elementRef, canTilt = () => true) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let hovered = false;
  let frame = 0;

  // Normalised mouse position (-1 to 1)
  let dx = 0;
  let dy = 0;

  const current = {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    shadowX: 0,
    shadowY: 0,
    shadowOpacity: 0,
  };
  const target = {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    shadowX: 0,
    shadowY: 0,
    shadowOpacity: 0,
  };

  function applyStyles() {
    const element = elementRef.value;
    if (!element) return;

    const distance = Math.min(Math.hypot(dx, dy), 1);
    const blur = BASE_SHADOW_BLUR + distance * EXTRA_SHADOW_BLUR;

    const angle = Math.hypot(current.rotateX, current.rotateY);
    const axisX = angle > 0.0001 ? current.rotateX / angle : 1;
    const axisY = angle > 0.0001 ? current.rotateY / angle : 0;

    element.style.setProperty(
      "--tilt-angle",
      `${axisX} ${axisY} 0 ${angle}deg`,
    );
    element.style.setProperty("--tilt-scale", current.scale);
    element.style.setProperty(
      "--tilt-shadow",
      `${current.shadowX}px ${current.shadowY}px ${blur}px rgba(0, 0, 0, ${current.shadowOpacity})`,
    );
  }

  function isSettled() {
    return Object.keys(target).every(
      (key) => Math.abs(target[key] - current[key]) < SETTLE_THRESHOLD,
    );
  }

  function animate() {
    for (const key of Object.keys(target)) {
      current[key] += (target[key] - current[key]) * SMOOTHING;
    }
    applyStyles();

    if (!hovered && isSettled()) {
      // Snap to the exact target and stop the loop.
      Object.assign(current, target);
      applyStyles();
      frame = 0;
      return;
    }

    frame = requestAnimationFrame(animate);
  }

  function start() {
    if (reduceMotion || frame) return;
    frame = requestAnimationFrame(animate);
  }

  function aimAtRest() {
    target.rotateX = 0;
    target.rotateY = 0;
    target.scale = 1;
    // Fade the shadow out in place so it does not jump.
    target.shadowOpacity = 0;
  }

  function reset() {
    hovered = false;
    aimAtRest();

    if (reduceMotion) {
      Object.assign(current, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        shadowOpacity: 0,
      });
      applyStyles();
    } else {
      start();
    }
  }

  function onEnter() {
    if (!canTilt()) return;
    hovered = true;
    start();
  }

  function onMove(event) {
    if (!canTilt()) return;

    const rect = elementRef.value.getBoundingClientRect();
    dx = Math.max(
      -1,
      Math.min(
        1,
        (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2),
      ),
    );
    dy = Math.max(
      -1,
      Math.min(
        1,
        (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2),
      ),
    );

    target.rotateY = dx * MAX_ROTATION;
    target.rotateX = -dy * MAX_ROTATION;
    target.scale = BASE_SCALE + Math.min(Math.hypot(dx, dy), 1) * EXTRA_SCALE;
    target.shadowOpacity = SHADOW_OPACITY;
    target.shadowX = -dx * MAX_SHADOW_OFFSET;
    target.shadowY = dy * MAX_SHADOW_OFFSET;

    start();
  }

  onMounted(() => {
    const element = elementRef.value;
    element.addEventListener("mouseenter", onEnter);
    element.addEventListener("mousemove", onMove);
    element.addEventListener("mouseleave", reset);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    const element = elementRef.value;
    if (!element) return;
    element.removeEventListener("mouseenter", onEnter);
    element.removeEventListener("mousemove", onMove);
    element.removeEventListener("mouseleave", reset);
  });

  return { reset };
}
