/*
 * Planty Flashcards & Quiz
 *
 * This script dynamically loads plant data from a JSON file and builds
 * interactive flashcards. It also powers a simple multiple‑choice quiz
 * based on plant care categories (soil, light, water and DON'Ts).
 */

let plants = [];
let currentQuestion = null;

/**
 * Shuffle an array in place using the Fisher–Yates algorithm.
 * @param {any[]} array The array to shuffle
 * @returns {any[]} The shuffled array
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Build flashcards from the loaded plant data.
 */
function buildCards() {
  const container = document.getElementById('cardsSection');
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'cards-grid';
  plants.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'card';
    const img = document.createElement('img');
    img.src = 'images/' + p.image;
    img.alt = p.common_name;
    card.appendChild(img);
    const body = document.createElement('div');
    body.className = 'card-body';
    // convert newline characters to <br> tags for better display
    const soil = (p.soil || '').toString().replace(/\n/g, '<br>');
    const light = (p.light || '').toString().replace(/\n/g, '<br>');
    const water = (p.water || '').toString().replace(/\n/g, '<br>');
    const donts = (p.donts || '').toString().replace(/\n/g, '<br>');
    body.innerHTML = `
      <h3>${p.common_name}</h3>
      <p><em>${p.latin_name || ''}</em></p>
      ${p.type ? `<p><strong>Type:</strong> ${p.type}</p>` : ''}
      ${soil ? `<p><strong>Soil:</strong> ${soil}</p>` : ''}
      ${light ? `<p><strong>Light:</strong> ${light}</p>` : ''}
      ${water ? `<p><strong>Water:</strong> ${water}</p>` : ''}
      ${donts ? `<p><strong>DON'Ts:</strong> ${donts}</p>` : ''}
    `;
    card.appendChild(body);
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

/**
 * Generate a new quiz question.
 * Chooses a random plant and a random category, then composes the
 * question text, the correct answer and a list of wrong answers.
 */
function generateQuestion() {
  const categories = ['soil', 'light', 'water', 'donts'];
  // pick a random plant
  const plant = plants[Math.floor(Math.random() * plants.length)];
  // pick a random category
  const category = categories[Math.floor(Math.random() * categories.length)];
  const questionText = `What is the recommended ${category.toUpperCase()} for <strong>${plant.common_name}</strong>?`;
  const correct = plant[category] ? plant[category].toString() : '';
  // gather all unique answers for the same category from other plants
  const otherAnswers = plants
    .filter((p) => p.id !== plant.id && p[category])
    .map((p) => p[category].toString())
    .filter((ans) => ans && ans !== correct);
  // pick up to 3 random wrong answers
  shuffle(otherAnswers);
  const wrongOptions = otherAnswers.slice(0, 3);
  // assemble options and shuffle
  const allOptions = shuffle([correct, ...wrongOptions]);
  return {
    plant: plant,
    category: category,
    question: questionText,
    correct: correct,
    options: allOptions,
  };
}

/**
 * Render the current question to the quiz UI.
 */
function renderQuestion() {
  const questionEl = document.getElementById('quizQuestion');
  const optionsList = document.getElementById('quizOptions');
  const feedbackEl = document.getElementById('quizFeedback');
  const revealBtn = document.getElementById('revealOptionsButton');
  const nextBtn = document.getElementById('nextQuestionButton');

  // reset UI
  feedbackEl.textContent = '';
  optionsList.innerHTML = '';
  optionsList.classList.add('hidden');
  revealBtn.classList.remove('hidden');
  nextBtn.classList.add('hidden');

  questionEl.innerHTML = currentQuestion.question;

  // populate options when reveal button is clicked
  revealBtn.onclick = () => {
    revealBtn.classList.add('hidden');
    optionsList.classList.remove('hidden');
    currentQuestion.options.forEach((opt) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      // store the raw answer on the element for later comparison
      btn.dataset.answer = opt;
      btn.dataset.correct = opt === currentQuestion.correct ? 'true' : 'false';
      // convert newlines for display
      btn.innerHTML = opt.replace(/\n/g, '<br>');
      btn.onclick = () => handleAnswer(btn, opt);
      li.appendChild(btn);
      optionsList.appendChild(li);
    });
  };
}

/**
 * Handle the user's answer selection.
 * @param {HTMLElement} btn The button that was clicked
 * @param {string} selected The selected answer text
 */
function handleAnswer(btn, selected) {
  const nextBtn = document.getElementById('nextQuestionButton');
  const feedbackEl = document.getElementById('quizFeedback');
  const buttons = document.querySelectorAll('.option-btn');
  // disable all buttons after selection
  buttons.forEach((b) => (b.disabled = true));
  // check correctness
  const isCorrect = selected === currentQuestion.correct;
  if (isCorrect) {
    btn.classList.add('correct');
    feedbackEl.textContent = 'Correct!';
  } else {
    btn.classList.add('incorrect');
    feedbackEl.textContent = 'Incorrect. The correct answer is highlighted in green.';
  }
  // in all cases, highlight the button that holds the correct answer
  buttons.forEach((b) => {
    if (b.dataset.correct === 'true') {
      b.classList.add('correct');
    }
  });
  // show next button
  nextBtn.classList.remove('hidden');
}

/**
 * Advance to the next question.
 */
function nextQuestion() {
  currentQuestion = generateQuestion();
  renderQuestion();
}

/**
 * Initialisation: fetch data and wire up event handlers.
 */
document.addEventListener('DOMContentLoaded', () => {
  // initialise plant data from the global variable created in plantsData.js
  // plantData is defined in plantsData.js and loaded via a script tag in index.html
  if (typeof plantData !== 'undefined') {
    plants = plantData;
  } else {
    console.error('Plant data missing: ensure plantsData.js is included');
    plants = [];
  }
  // build the flashcards
  buildCards();
  // prepare the first question
  currentQuestion = generateQuestion();
  renderQuestion();

  // navigation buttons for toggling views
  const cardsBtn = document.getElementById('showCards');
  const quizBtn = document.getElementById('showQuiz');
  const cardsSection = document.getElementById('cardsSection');
  const quizSection = document.getElementById('quizSection');

  // ensure the quiz section is hidden by default and flashcards are visible
  quizSection.style.display = 'none';
  cardsSection.style.display = '';

  cardsBtn.addEventListener('click', () => {
    cardsBtn.classList.add('active');
    quizBtn.classList.remove('active');
    cardsSection.style.display = '';
    quizSection.style.display = 'none';
  });
  quizBtn.addEventListener('click', () => {
    quizBtn.classList.add('active');
    cardsBtn.classList.remove('active');
    cardsSection.style.display = 'none';
    quizSection.style.display = '';
  });

  // hook up next question button
  document
    .getElementById('nextQuestionButton')
    .addEventListener('click', () => {
      nextQuestion();
    });
});