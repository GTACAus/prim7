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
// found with a red overlay, and syncs the matching counter by ±1.
document.querySelectorAll('.animal-hotspot').forEach((hotspot) => {
  hotspot.addEventListener('click', () => {
    const wasFound = hotspot.classList.contains('found');
    hotspot.classList.toggle('found');
    const nowFound = hotspot.classList.contains('found');

    const type = hotspot.dataset.animal;
    const counter = document.querySelector('.animal-counter[data-animal-counter="' + type + '"]');
    if (!counter) return;

    if (nowFound && !wasFound) {
      changeAnimalCount(counter, 1, false);
    } else if (!nowFound && wasFound) {
      changeAnimalCount(counter, -1, false);
    }
  });
});

function startNight() {
  stage.classList.add('is-night');
  const nightButton = document.getElementById('waitForNightButton');
  if (nightButton) nightButton.disabled = true;
}

function returnToDay() {
  stage.classList.remove('is-night');
  const nightButton = document.getElementById('waitForNightButton');
  if (nightButton) nightButton.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  const nightButton = document.getElementById('waitForNightButton');
  if (nightButton) nightButton.addEventListener('click', startNight);
});

/* ==================================================
   ANIMAL COUNTERS
   One counter per unique data-animal type in
   #animalLayer. Checked against how many hotspots
   of that type actually exist.
   ================================================== */

const colourPalette = [
  'var(--yellow)', 'var(--mint)', 'var(--blue)',
  'var(--lavender)', 'var(--green)', 'var(--purple)'
];

function colourForIndex(index) {
  return colourPalette[index % colourPalette.length];
}

function countHotspotsByType() {
  const hotspots = document.querySelectorAll('#animalLayer .animal-hotspot');
  const countsByType = {};

  hotspots.forEach((hotspot) => {
    const type = hotspot.dataset.animal || 'animal';
    countsByType[type] = (countsByType[type] || 0) + 1;
  });

  return countsByType;
}

function renderAnimalCounterDots(counter, count) {
  const circle = counter.querySelector('.counter-circle');
  
  circle.innerHTML = '';

  for (let index = 0; index < count; index += 1) {
    const dot = document.createElement('span');
    dot.className = 'counter-dot';
    dot.style.backgroundColor = counter.dataset.dotColour;
    circle.appendChild(dot);
  }
}

function getHotspotsByType(type) {
  return Array.from(document.querySelectorAll('.animal-hotspot[data-animal="' + type + '"]'));
}

function pickRandomElement(elements) {
  if (!elements.length) return null;
  return elements[Math.floor(Math.random() * elements.length)];
}

// Reconciles found hotspots toward the counter value, capped at the
// real number of hotspots. If the counter is over-counting (higher
// than the true amount), every hotspot is already found and stays
// that way — decreasing the counter only starts un-marking hotspots
// once it drops back to or below the true count.
function syncHotspotsForCounterChange(type, counterValue) {
  const hotspots = getHotspotsByType(type);
  const actualCount = hotspots.length;
  const desiredFoundCount = Math.min(counterValue, actualCount);

  const currentlyFound = hotspots.filter((hotspot) => hotspot.classList.contains('found'));

  if (desiredFoundCount > currentlyFound.length) {
    const available = hotspots.filter((hotspot) => !hotspot.classList.contains('found'));
    let needed = desiredFoundCount - currentlyFound.length;

    while (needed > 0 && available.length) {
      const target = pickRandomElement(available);
      target.classList.add('found');
      available.splice(available.indexOf(target), 1);
      needed -= 1;
    }
  } else if (desiredFoundCount < currentlyFound.length) {
    const stillFound = [...currentlyFound];
    let excess = currentlyFound.length - desiredFoundCount;

    while (excess > 0 && stillFound.length) {
      const target = pickRandomElement(stillFound);
      target.classList.remove('found');
      stillFound.splice(stillFound.indexOf(target), 1);
      excess -= 1;
    }
  }
  // If desiredFoundCount === currentlyFound.length (e.g. moving between
  // over-count values), nothing changes — this is the fix.
}

function changeAnimalCount(counter, delta, syncHotspots = true) {
  const max = Number(counter.dataset.max);
  const current = Number(counter.dataset.value);
  const next = Math.max(0, Math.min(max, current + delta));

  if (next === current) return;

  counter.dataset.value = String(next);
  counter.classList.remove('counter-correct', 'counter-incorrect');
  renderAnimalCounterDots(counter, next);
  counter.querySelector('.counter-value-text').textContent = String(next);

  if (syncHotspots) {
    syncHotspotsForCounterChange(counter.dataset.animalCounter, next);
  }
}

function getAnimalColourFor(type) {
  const hotspot = document.querySelector('.animal-hotspot[data-animal="' + type + '"]');
  if (!hotspot) return 'var(--orange)'; // fallback if no matching hotspot exists

  const computed = getComputedStyle(hotspot).getPropertyValue('--animal-colour').trim();
  return computed || 'var(--orange)';
}

function buildAnimalCounters() {
  const panel = document.getElementById('animalCounterPanel');
  if (!panel) return;

  const countsByType = countHotspotsByType();
  panel.innerHTML = '';

  Object.keys(countsByType).forEach((type) => {
    const actualCount = countsByType[type];
    const maxCount = actualCount + 3; // headroom above the correct answer

    const counter = document.createElement('div');
    counter.className = 'animal-counter';
    counter.dataset.animalCounter = type;
    counter.dataset.value = '0';
    counter.dataset.max = String(maxCount);
    counter.dataset.dotColour = getAnimalColourFor(type);

    const label = document.createElement('p');
    label.className = 'animal-counter-label';
    label.textContent = type;
    counter.appendChild(label);

    const circle = document.createElement('div');
    circle.className = 'counter-circle';
    circle.setAttribute('aria-hidden', 'true');
    counter.appendChild(circle);

    const valueText = document.createElement('p');
    valueText.className = 'counter-value-text';
    valueText.textContent = '0';
    counter.appendChild(valueText);

    const buttonRow = document.createElement('div');
    buttonRow.className = 'counter-button-row';

    const downButton = document.createElement('button');
    downButton.type = 'button';
    downButton.className = 'counter-button counter-down';
    downButton.setAttribute('aria-label', 'Remove one ' + type);
    downButton.textContent = '−';
    downButton.addEventListener('click', () => changeAnimalCount(counter, -1));

    const upButton = document.createElement('button');
    upButton.type = 'button';
    upButton.className = 'counter-button counter-up';
    upButton.setAttribute('aria-label', 'Add one ' + type);
    upButton.textContent = '+';
    upButton.addEventListener('click', () => changeAnimalCount(counter, 1));

    buttonRow.appendChild(downButton);
    buttonRow.appendChild(upButton);
    counter.appendChild(buttonRow);

    panel.appendChild(counter);
  });
}

function checkAnimalCount() {
  const feedback = document.getElementById('animalCountFeedback');
  if (!feedback) return;

  const countsByType = countHotspotsByType();
  const counters = document.querySelectorAll('.animal-counter');
  let allCorrect = true;
  let firstWrongLabel = '';

  counters.forEach((counter) => {
    const type = counter.dataset.animalCounter;
    const actualCount = countsByType[type] || 0;
    const guess = Number(counter.dataset.value);
    const correct = guess === actualCount;

    counter.classList.toggle('counter-correct', correct);
    counter.classList.toggle('counter-incorrect', !correct);

    if (!correct && !firstWrongLabel) firstWrongLabel = type;
    if (!correct) allCorrect = false;
  });

  feedback.classList.remove('success', 'try-again');
  feedback.innerHTML = '';
  const strong = document.createElement('strong');

  if (allCorrect) {
    feedback.classList.add('success');
    strong.textContent = 'All counts match!';
    feedback.appendChild(strong);
    feedback.appendChild(document.createTextNode(' You found and counted every hidden animal correctly.'));
    revealStackButtons();
    returnToDay();
    return;
  }

  feedback.classList.add('try-again');
  strong.textContent = firstWrongLabel + ' needs another look.';
  feedback.appendChild(strong);
  feedback.appendChild(document.createTextNode(' Move the torch around the whole photo, then adjust the counter to match what you found.'));
}

function resetAnimalCounters() {
  document.querySelectorAll('.animal-counter').forEach((counter) => {
    counter.dataset.value = '0';
    counter.classList.remove('counter-correct', 'counter-incorrect');
    renderAnimalCounterDots(counter, 0);
    counter.querySelector('.counter-value-text').textContent = '0';
  });

  const feedback = document.getElementById('animalCountFeedback');
  if (!feedback) return;
  feedback.classList.remove('success', 'try-again');
  feedback.innerHTML = '<strong>Use the torch to search first.</strong>Set each counter to how many of that animal you found hiding in the photo.';

  hideStackVisuals();
  returnToDay();
  document.querySelectorAll('.animal-hotspot.found').forEach(h => h.classList.remove('found'));
}

document.addEventListener('DOMContentLoaded', () => {
  buildAnimalCounters();

  const checkButton = document.getElementById('checkAnimalCountButton');
  if (checkButton) checkButton.addEventListener('click', checkAnimalCount);
});

/* ==================================================
   STACK VISUALISATION (shape-morphing)
   Built once when the count is confirmed correct.
   The two buttons just toggle a CSS class that morphs
   the same segments between bar and circle shapes.
   ================================================== */


function getCheckedAnimalCounts() {
  const counts = [];
  document.querySelectorAll('.animal-counter').forEach((counter) => {
    counts.push({
      type: counter.dataset.animalCounter,
      value: Number(counter.dataset.value)
    });
  });
  return counts;
}

function createCylinder(parent, colour) {
  const cylinder = document.createElement('div');
  cylinder.className = 'cylinder';

  const stripCount = 12;

  const diameter = 46; // circle diameter
  const height = 7;   // cylinder thickness/height
  const radius = diameter / 2;

  const circumference = 2 * Math.PI * radius;

  // Slight overlap prevents tiny gaps between strips.
  const stripWidth = (circumference / stripCount) * 1.12;

  // Pass dimensions to CSS
  parent.style.setProperty('--cylinder-diameter', `${diameter}px`);
  parent.style.setProperty('--cylinder-height', `${height}px`);

  for (let i = 0; i < stripCount; i += 1) {
    const strip = document.createElement('div');
    strip.className = 'cylinder-strip';

    const angle = (360 / stripCount) * i;

    strip.style.width = stripWidth + 'px';
    strip.style.height = height + 'px';
    strip.style.marginLeft = -(stripWidth / 2) + 'px';

    strip.style.backgroundColor = colour;

    strip.style.transform =
      `rotateY(${angle}deg) translateZ(${radius}px)`;

    const brightness =
      0.72 + 0.28 * Math.max(
        0,
        Math.cos(angle * Math.PI / 180)
      );

    strip.style.filter = `brightness(${brightness})`;

    cylinder.appendChild(strip);
  }

  // Circular cap
  const top = document.createElement('div');
  top.className = 'cylinder-top';
  top.style.backgroundColor = colour;

  cylinder.appendChild(top);

  parent.appendChild(cylinder);
}

function buildStackVisual() {
  const visual = document.getElementById('animalStackVisual');
  const row = document.getElementById('stackRow');
  const counts = getCheckedAnimalCounts();

  row.innerHTML = '';
  row.classList.remove('circle-mode');

  counts.forEach((entry, groupIndex) => {
    const group = document.createElement('div');
    group.className = 'stack-group';

    const column = document.createElement('div');
    column.className = 'bar-stack-column';

    for (let i = 0; i < entry.value; i += 1) {
      const unit = document.createElement('div');

      unit.className = 'stack-unit';
      unit.style.animationDelay = (i * 0.05) + 's';

      const colour = colourForIndex(groupIndex);

      createCylinder(unit, colour);

      column.appendChild(unit);
    }

    const label = document.createElement('div');
    label.className = 'bar-stack-label';
    label.innerHTML = entry.type + '<span>' + entry.value + '</span>';

    group.appendChild(column);
    group.appendChild(label);
    row.appendChild(group);
  });

  visual.hidden = false;
  setStackShape('bar');
}

function setStackShape(mode) {
  const row = document.getElementById('stackRow');
  const title = document.getElementById('stackVisualTitle');
  if (!row) return;

  row.classList.toggle('circle-mode', mode === 'circle');

  title.textContent = mode === 'circle'
    ? 'Every circle is one animal you counted'
    : 'Each block is one animal you found';

  document.getElementById('showBarStackButton').classList.toggle('stack-active', mode === 'bar');
  document.getElementById('showCircleStackButton').classList.toggle('stack-active', mode === 'circle');
}

function revealStackButtons() {
  const buttonsRow = document.getElementById('stackButtonsRow');
  if (buttonsRow) {
    buttonsRow.hidden = false;
    buttonsRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  buildStackVisual();
}

function hideStackVisuals() {
  const buttonsRow = document.getElementById('stackButtonsRow');
  const visual = document.getElementById('animalStackVisual');
  if (buttonsRow) buttonsRow.hidden = true;
  if (visual) visual.hidden = true;

  const row = document.getElementById('stackRow');
  if (row) { row.innerHTML = ''; row.classList.remove('circle-mode'); }
}

document.addEventListener('DOMContentLoaded', () => {
  const barButton = document.getElementById('showBarStackButton');
  const circleButton = document.getElementById('showCircleStackButton');

  if (barButton) barButton.addEventListener('click', () => setStackShape('bar'));
  if (circleButton) circleButton.addEventListener('click', () => setStackShape('circle'));
});