function unlockSection(nextSectionId, currentSectionId) {
  const nextSection = document.getElementById(nextSectionId);
  const currentSection = document.getElementById(currentSectionId);

  nextSection.classList.remove('locked');
  currentSection.classList.add('completed');

  setTimeout(() => {
    nextSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 100);
}

function openGlossary() {
  const modal = document.getElementById('glossaryModal');

  if (modal) {
    modal.style.display = 'block';
  }
}

function closeGlossary() {
  const modal = document.getElementById('glossaryModal');

  if (modal) {
    modal.style.display = 'none';
  }
}

window.addEventListener('click', function(event) {
  const modal = document.getElementById('glossaryModal');

  if (modal && event.target === modal) {
    closeGlossary();
  }
});