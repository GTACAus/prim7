const stwAnswers = {
  see: [],
  think: [],
  wonder: []
};

const brainstormAnswers = {
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
  6: false,
  7: false,
  8: false
};

const functionAnswers = {
  leaves: false,
  stem: false,
  roots: false
};

function addSTW(type) {
  const input = document.getElementById(type + 'Input');
  const list = document.getElementById(type + 'List');
  const answer = input.value.trim();

  if (answer === '') {
    return;
  }

  stwAnswers[type].push(answer);

  const listItem = document.createElement('li');

  const answerText = document.createElement('span');
  answerText.textContent = answer;

  const deleteButton = document.createElement('button');
  deleteButton.textContent = '×';
  deleteButton.className = 'delete-answer';

  deleteButton.onclick = function() {
    const index = stwAnswers[type].indexOf(answer);

    if (index > -1) {
      stwAnswers[type].splice(index, 1);
    }

    listItem.remove();
    checkSTWComplete();
  };

  listItem.appendChild(answerText);
  listItem.appendChild(deleteButton);
  list.appendChild(listItem);

  input.value = '';

  checkSTWComplete();
}

function checkSTWComplete() {
  const nextButton = document.getElementById('watchNextButton');

  if (
    stwAnswers.see.length > 0 &&
    stwAnswers.think.length > 0 &&
    stwAnswers.wonder.length > 0
  ) {
    nextButton.classList.add('ready');
  } else {
    nextButton.classList.remove('ready');
  }
}

function submitBrainstorm(event, number) {
  if (event.key !== 'Enter') {
    return;
  }

  const input = document.getElementById('brainstormInput' + number);
  const answerBox = document.getElementById('brainstormAnswer' + number);
  const answer = input.value.trim();

  if (answer === '') {
    return;
  }

  answerBox.innerHTML = '';

  const answerText = document.createElement('span');
  answerText.textContent = answer;

  const deleteButton = document.createElement('button');
  deleteButton.textContent = '×';
  deleteButton.className = 'delete-answer';

  deleteButton.onclick = function() {
  answerBox.innerHTML = '';
  answerBox.classList.remove('visible');

  input.value = '';
  input.style.display = 'block';

  brainstormAnswers[number] = false;

  checkBrainstormComplete();
};

  answerBox.appendChild(answerText);
  answerBox.appendChild(deleteButton);

  answerBox.classList.add('visible');

  input.style.display = 'none';

  brainstormAnswers[number] = true;

  checkBrainstormComplete();
}

function checkBrainstormComplete() {
  const answeredCount = Object.values(brainstormAnswers).filter(Boolean).length;
  const nextButton = document.getElementById('brainstormNextButton');

  if (answeredCount >= 4) {
    nextButton.classList.add('ready');
  } else {
    nextButton.classList.remove('ready');
  }
}

function submitFunctionAnswer(event, part) {
  if (event.key !== 'Enter') {
    return;
  }

  const input = document.getElementById(part + 'FunctionInput');
  const answerBox = document.getElementById(part + 'FunctionAnswer');
  const answer = input.value.trim();

  if (answer === '') {
    return;
  }

  answerBox.innerHTML = '';

  const answerText = document.createElement('span');
  answerText.textContent = answer;

  const deleteButton = document.createElement('button');
  deleteButton.textContent = '×';
  deleteButton.className = 'delete-answer';

  deleteButton.onclick = function() {
    answerBox.innerHTML = '';
    answerBox.style.display = 'none';

    input.value = '';
    input.style.display = 'block';

    functionAnswers[part] = false;

    checkFunctionAnswersComplete();
  };

  answerBox.appendChild(answerText);
  answerBox.appendChild(deleteButton);

  answerBox.style.display = 'flex';
  answerBox.style.justifyContent = 'space-between';
  answerBox.style.alignItems = 'center';
  answerBox.style.gap = '10px';

  input.style.display = 'none';

  functionAnswers[part] = true;

  checkFunctionAnswersComplete();
}

function checkFunctionAnswersComplete() {
  const nextButton = document.getElementById('diagramNextButton');

  if (
    functionAnswers.leaves &&
    functionAnswers.stem &&
    functionAnswers.roots
  ) {
    nextButton.classList.add('ready');
  } else {
    nextButton.classList.remove('ready');
  }
}

document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    if (event.target.id === 'seeInput') {
      addSTW('see');
    }

    if (event.target.id === 'thinkInput') {
      addSTW('think');
    }

    if (event.target.id === 'wonderInput') {
      addSTW('wonder');
    }
  }
});

