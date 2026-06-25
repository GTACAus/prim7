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