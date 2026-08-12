const questionsText = [
	{
		text: "Does the amount of sunlight affect plant growth?",
		answer: "left"
	},
	{
		text: "Which colour is the prettiest?",
		answer: "right"
	},
	{
		text: "Does temperature affect how fast ice melts?",
		answer: "left"
	},
	{
		text: "Is chocolate better than vanilla?",
		answer: "right"
	},
	{
		text: "Do heavier objects fall faster?",
		answer: "left"
	},
	{
		text: "What is the best sport?",
		answer: "right"
	},
	{
		text: "Does salt change the boiling point of water?",
		answer: "left"
	},
	{
		text: "Are cats smarter than dogs?",
		answer: "right"
	}
];

let questions = shuffleRandom([...questionsText]); // Create a copy of the questions array

let currentIndex = 0,
	leftCount = 0,
	rightCount = 0,
	hasStarted = false,
	isSorted = false;
	inputLocked = false;

function shuffleRandom(array) {
	const shuffled = [...array];
	
	for (let currentIndex = shuffled.length - 1; currentIndex > 0; currentIndex--) {
		const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
		[shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
	}

	return shuffled;
}

function showCard() {
	const card = document.getElementById('current-card');
	const progress = document.getElementById('progress');
	if (currentIndex < questions.length) {
		card.textContent = questions[currentIndex].text;
		card.classList.remove('hidden', 'card-fly-left', 'card-fly-right', 'card-fly-up');
		progress.textContent = (currentIndex + 1) + ' of ' + questions.length;
	} else {
		card.classList.add('hidden');
		document.getElementById('done-message').classList.add('visible');
		isSorted = true;
		progress.textContent = 'All sorted!';
		document.getElementById('btn-investigable').disabled = true;
		document.getElementById('btn-uninvestigable').disabled = true;
		const nextButton = window.parent.document.getElementById("flashcardsNextButton");
		nextButton.hidden = false;
	}
}

function sortCard(direction) {
	if (currentIndex >= questions.length || inputLocked) return;
	const card = document.getElementById('current-card');
	const correctAnswer = questions[currentIndex].answer;
	const isCorrect = direction === correctAnswer;
	
	inputLocked = true;

	if (!hasStarted) {
		hasStarted = true;
		document.getElementById('reset-btn').classList.remove('hidden');
	}

	if (isCorrect) {
		// Correct answer: fly to pile and move to next card
		card.classList.add(direction === 'left' ? 'card-fly-left' : 'card-fly-right');
		setTimeout(() => {
			addToPile(direction, questions[currentIndex].text);
			currentIndex++;
			showCard();
			inputLocked = false;
		}, 350);
	} else {
		// Wrong answer: show feedback briefly, then send to back of deck
		card.style.opacity = '0.5';
		card.classList.add('card-fly-up');
		setTimeout(() => {
			card.style.opacity = '1';
			// Move this card to the back of the questions array
			const currentCard = questions.splice(currentIndex, 1)[0];
			questions.push(currentCard);
			// Show next card (now at currentIndex)
			showCard();
			inputLocked = false;
		}, 600);
	}
}

function addToPile(direction, text) {
	const pile = document.getElementById(direction + '-pile');
	const el = document.createElement('div');
	el.className = 'pile-card animate-in';
	el.textContent = text.length > 25 ? text.slice(0, 25) + '…' : text;
	pile.appendChild(el);
	if (direction === 'left') {
		leftCount++;
		document.getElementById('left-count').textContent = leftCount;
	} else {
		rightCount++;
		document.getElementById('right-count').textContent = rightCount;
	}
}

function resetCards() {
	questions = shuffleRandom([...questionsText]);
	currentIndex = 0;
	leftCount = 0;
	rightCount = 0;
	hasStarted = false;
	isSorted = false;
	inputLocked = false;
	document.getElementById('progress').textContent = (currentIndex + 1) + ' of ' + questions.length;
	document.getElementById('reset-btn').classList.add('hidden');
	document.getElementById('left-pile').innerHTML = '';
	document.getElementById('right-pile').innerHTML = '';
	document.getElementById('left-count').textContent = '0';
	document.getElementById('right-count').textContent = '0';

	const card = document.getElementById('current-card');
	card.textContent = questions[currentIndex].text;
	card.classList.remove('hidden', 'card-fly-left', 'card-fly-right', 'card-fly-up');
	card.style.opacity = '1';
	document.getElementById('done-message').classList.remove('visible');
	document.getElementById('btn-investigable').disabled = false;
	document.getElementById('btn-uninvestigable').disabled = false;
	showCard();
}

showCard();