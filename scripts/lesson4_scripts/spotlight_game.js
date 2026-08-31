const stage = document.getElementById('stage');
const photo = document.getElementById('photo');
const glow = document.getElementById('glow');
function setSpot(xPct, yPct, radius) {
  stage.style.setProperty('--x', xPct + '%');
  stage.style.setProperty('--y', yPct + '%');
  stage.style.setProperty('--r', radius + 'px');
}
// start fully dark (spot off-canvas)
setSpot(-50, -50, 140);
stage.addEventListener('mousemove', (e) => {
  const rect = stage.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const xPct = (x / rect.width) * 100;
  const yPct = (y / rect.height) * 100;
  setSpot(xPct, yPct, 140);
});
stage.addEventListener('mouseleave', () => {
  setSpot(-50, -50, 140);
});
// touch support
stage.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  if (!touch) return;
  const rect = stage.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  setSpot((x / rect.width) * 100, (y / rect.height) * 100, 140);
  e.preventDefault();
}, { passive: false });
stage.addEventListener('touchend', () => {
  setSpot(-50, -50, 140);
});

// Hidden animals on top of the forest photo: clicking one marks it as
// found with a red overlay. Toggle so a mis-click can be undone.
document.querySelectorAll('.animal-hotspot').forEach((hotspot) => {
  hotspot.addEventListener('click', () => {
    hotspot.classList.toggle('found');
  });
});
