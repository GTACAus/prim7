let placed1 = new Set();
const total1 = 4;

function switchGame(game) {
  if (placed1.size === total1) {
    document.getElementById('game-parts').classList.toggle('hidden', game !== 'parts');
    document.getElementById('game-labels').classList.toggle('hidden', game !== 'labels');
    document.getElementById('tab-parts').classList.toggle('active', game === 'parts');
    document.getElementById('tab-labels').classList.toggle('active', game === 'labels');
  }
}

document.querySelectorAll('#game-parts .part').forEach(part => {
  part.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', part.dataset.part));
  part.addEventListener('touchstart', e => {
    window._drag1 = part;
  }, {
    passive: true
  });
  part.addEventListener('touchmove', e => e.preventDefault(), {
    passive: false
  });
  part.addEventListener('touchend', e => {
    if (!window._drag1) return;
    const t = e.changedTouches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const slot = el ? el.closest('.slot') : null;
    if (slot && slot.dataset.part === window._drag1.dataset.part) placePart(window._drag1.dataset.part, slot);
    window._drag1 = null;
  });
});

document.querySelectorAll('#plant-area-1 .slot').forEach(slot => {
  slot.addEventListener('dragover', e => {
    e.preventDefault();
    slot.classList.add('drag-over');
  });
  slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
  slot.addEventListener('drop', e => {
    e.preventDefault();
    slot.classList.remove('drag-over');
    const partId = e.dataTransfer.getData('text/plain');
    if (partId === slot.dataset.part) placePart(partId, slot);
  });
});

function placePart(partId, slot) {
  if (placed1.has(partId)) return;
  placed1.add(partId);
  slot.classList.add('filled');
  slot.querySelector('.slot-content').classList.add('animate-in');
  slot.querySelector('.slot-content').style.opacity = '1';
  document.querySelector(`#game-parts .part[data-part="${partId}"]`).classList.add('placed');
  if (placed1.size === total1) {
    document.getElementById('success-1').classList.remove('hidden');
    document.getElementById('continue-button').classList.remove('hidden');

  };
}

function resetGame1() {
  placed1.clear();
  document.querySelectorAll('#plant-area-1 .slot').forEach(s => {
    s.classList.remove('filled');
    s.querySelector('.slot-content').style.opacity = '0.2';
    s.querySelector('.slot-content').classList.remove('animate-in');
  });
  document.querySelectorAll('#game-parts .part').forEach(p => p.classList.remove('placed'));
  document.getElementById('success-1').classList.add('hidden');
  document.getElementById('continue-button').classList.add('hidden');
}

let placed2 = new Set();
const total2 = 4;

let labelState = false;

document.querySelectorAll('#game-labels .part').forEach(part => {
  part.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', part.dataset.label));
  part.addEventListener('touchstart', e => {
    window._drag2 = part;
  }, {
    passive: true
  });
  part.addEventListener('touchmove', e => e.preventDefault(), {
    passive: false
  });
  part.addEventListener('touchend', e => {
    if (!window._drag2) return;
    const t = e.changedTouches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const slot = el ? el.closest('.label-slot') : null;
    if (slot && slot.dataset.label === window._drag2.dataset.label) placeLabel(window._drag2.dataset.label, slot);
    window._drag2 = null;
  });
});

document.querySelectorAll('#plant-area-2 .label-slot').forEach(slot => {
  slot.addEventListener('dragover', e => {
    e.preventDefault();
    slot.classList.add('drag-over');
  });
  slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
  slot.addEventListener('drop', e => {
    e.preventDefault();
    slot.classList.remove('drag-over');
    const labelId = e.dataTransfer.getData('text/plain');
    if (labelId === slot.dataset.label) placeLabel(labelId, slot);
  });
});

function placeLabel(labelId, slot) {
  if (placed2.has(labelId)) return;
  placed2.add(labelId);
  slot.classList.add('filled');
  const names = {
    flower: document.getElementById('flower').textContent,
    leaf: document.getElementById('leaf').textContent,
    stem: document.getElementById('stem').textContent,
    roots: document.getElementById('roots').textContent
  };
  slot.innerHTML = `<span class="text-xs font-bold text-green-800 animate-in">${names[labelId]}</span>`;
  document.querySelector(`#game-labels .part[data-label="${labelId}"]`).classList.add('placed');
  checkLabelComplete();
}

function resetGame2() {
  placed2.clear();
  document.querySelectorAll('#plant-area-2 .label-slot').forEach(s => {
    s.classList.remove('filled');
    s.innerHTML = '<span class="text-xs text-gray-400">?</span>';
  });
  document.querySelectorAll('#game-labels .part').forEach(p => p.classList.remove('placed'));
  document.getElementById('success-2').classList.add('hidden');
  document.getElementById('buildNextButton').classList.remove('ready');
  checklabelComplete();
}

function checkLabelComplete() {
  const nextButton = document.getElementById('buildNextButton');
  
  if (placed2.size === total2) {
    document.getElementById('success-2').classList.remove('hidden');
    nextButton.classList.add('ready');
  } else {
    nextButton.classList.remove('ready');
  }
}