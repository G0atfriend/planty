/*
 * Planty Flashcards & Quiz
 *
 * This script dynamically loads plant data from a JSON file and builds
 * interactive flashcards. It also powers a simple multiple‑choice quiz
 * based on plant care categories (soil, light, water and DON'Ts).
 */

let plants = [];
// State variables for the quiz
let currentQuestion = null;
let quizType = 'who';
let quizCategories = ['soil', 'light', 'water'];
let questionList = [];
let currentQuestionIndex = 0;
let score = 0;

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
      ${p.type ? `<p class="type"><strong>Type:</strong> ${p.type}</p>` : ''}
      ${soil ? `<p class="soil detail"><strong>Soil:</strong> ${soil}</p>` : ''}
      ${light ? `<p class="light detail"><strong>Light:</strong> ${light}</p>` : ''}
      ${water ? `<p class="water detail"><strong>Water:</strong> ${water}</p>` : ''}
      ${donts ? `<p class="donts detail"><strong>DON'Ts:</strong> ${donts}</p>` : ''}
    `;
    card.appendChild(body);
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

/**
 * Build the list of questions based on the selected quiz type and categories.
 * For 'who' quiz: questionList contains one entry per plant (optionally limited).
 * For 'like' and 'dont' quizzes: there will be one entry per selected category per plant.
 * @param {string} qType
 * @param {string[]} categories
 * @returns {Array<Object>} questionList
 */
function buildQuestionList(qType, categories) {
  const list = [];
  if (qType === 'who') {
    plants.forEach((p) => {
      list.push({ plant: p, type: 'who' });
    });
  } else if (qType === 'like' || qType === 'dont') {
    plants.forEach((p) => {
      categories.forEach((cat) => {
        // ensure the plant has data for this category
        if (p[cat]) {
          list.push({ plant: p, type: qType, category: cat });
        }
      });
    });
  }
  return list;
}

/**
 * Start a quiz based on the current settings in the UI.
 */
function startQuiz() {
  // read quiz type
  const selectedType = document.querySelector('input[name="quizType"]:checked').value;
  quizType = selectedType;
  // read selected categories (for like/dont)
  const selectedCategories = Array.from(
    document.querySelectorAll('#likeCategories input[type="checkbox"]:checked')
  ).map((el) => el.value);
  quizCategories = selectedCategories.length > 0 ? selectedCategories : ['soil', 'light', 'water'];
  // build full question list
  questionList = buildQuestionList(quizType, quizCategories);
  // decide number of questions
  const qCountVal = document.querySelector('input[name="questionCount"]:checked').value;
  let maxQuestions;
  if (qCountVal === 'allplanties') {
    maxQuestions = 60;
  } else if (qCountVal === 'all') {
    maxQuestions = questionList.length;
  } else {
    maxQuestions = parseInt(qCountVal, 10);
  }
  // randomise questions and limit to requested number
  shuffle(questionList);
  if (questionList.length > maxQuestions) {
    questionList = questionList.slice(0, maxQuestions);
  }
  currentQuestionIndex = 0;
  score = 0;
  // hide setup and show quiz container
  document.getElementById('quizSetup').classList.add('hidden');
  document.getElementById('quizResults').classList.add('hidden');
  document.getElementById('quizContainer').classList.remove('hidden');
  // set title
  const titleEl = document.getElementById('quizTitle');
  if (quizType === 'who') {
    titleEl.textContent = 'Planty? Who am I?';
  } else if (quizType === 'like') {
    titleEl.textContent = 'Planty? What do you like?';
  } else {
    titleEl.textContent = "Planty? What DON'T you like?";
  }
  showCurrentQuestion();
}

/**
 * Display the current question from questionList.
 */
function showCurrentQuestion() {
  const qObj = questionList[currentQuestionIndex];
  const questionEl = document.getElementById('quizQuestion');
  const optionsList = document.getElementById('quizOptions');
  const feedbackEl = document.getElementById('quizFeedback');
  const nextBtn = document.getElementById('nextQuestionButton');
  const imgWrap = document.getElementById('quizImageWrap');
  const imgEl = document.getElementById('quizImage');
  // reset UI
  feedbackEl.textContent = '';
  optionsList.innerHTML = '';
  nextBtn.classList.add('hidden');
  // determine question and options based on type
  if (qObj.type === 'who') {
    // show image and ask for common name
    imgWrap.classList.remove('hidden');
    imgEl.src = 'images/' + qObj.plant.image;
    questionEl.innerHTML = 'Identify this plant:';
    // options are names of 4 plants including correct
    const otherPlants = plants.filter((p) => p.id !== qObj.plant.id);
    shuffle(otherPlants);
    const optionPlants = [qObj.plant, ...otherPlants.slice(0, 3)];
    shuffle(optionPlants);
    optionPlants.forEach((p) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `${p.common_name} <br><em>${p.latin_name || ''}</em>`;
      // mark if this option is correct
      btn.dataset.correct = p.id === qObj.plant.id ? 'true' : 'false';
      btn.onclick = () => {
        const isCorrect = p.id === qObj.plant.id;
        handleQuizAnswer(btn, isCorrect);
      };
      li.appendChild(btn);
      optionsList.appendChild(li);
    });
  } else {
    // hide image for care questions
    imgWrap.classList.add('hidden');
    // choose category for this question
    const cat = qObj.category;
    const categoryLabel = cat.toUpperCase();
    // set question text depending on quiz type
    if (qObj.type === 'like') {
      questionEl.innerHTML = `What is the recommended ${categoryLabel} for <strong>${qObj.plant.common_name}</strong>?`;
    } else {
      // don't quiz
      questionEl.innerHTML = `What should you AVOID for <strong>${qObj.plant.common_name}</strong> when it comes to ${categoryLabel}?`;
    }
    // compute correct answer(s)
    let correctAnswer = '';
    if (qObj.type === 'like') {
      correctAnswer = qObj.plant[cat] ? qObj.plant[cat].toString() : '';
    } else {
      // for don't, use donts field; if there are multiple lines, pick first line
      correctAnswer = qObj.plant.donts ? qObj.plant.donts.toString().split('\n')[0] : '';
    }
    // gather wrong answers from other plants for this category
    const wrongValues = plants
      .filter((p) => p.id !== qObj.plant.id && p[cat])
      .map((p) => {
        if (qObj.type === 'like') {
          return p[cat].toString();
        } else {
          return p.donts ? p.donts.toString().split('\n')[0] : '';
        }
      })
      .filter((ans) => ans && ans !== correctAnswer);
    shuffle(wrongValues);
    const options = [correctAnswer, ...wrongValues.slice(0, 3)];
    shuffle(options);
    options.forEach((opt) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = opt.replace(/\n/g, '<br>');
      btn.dataset.correct = opt === correctAnswer ? 'true' : 'false';
      btn.onclick = () => {
        const isCorrect = opt === correctAnswer;
        handleQuizAnswer(btn, isCorrect);
      };
      li.appendChild(btn);
      optionsList.appendChild(li);
    });
  }
}

/**
 * Handle the quiz answer: mark correct/incorrect, update score, and show next button.
 * @param {HTMLElement} btn
 * @param {boolean} isCorrect
 */
function handleQuizAnswer(btn, isCorrect) {
  const buttons = document.querySelectorAll('#quizOptions .option-btn');
  const feedbackEl = document.getElementById('quizFeedback');
  const nextBtn = document.getElementById('nextQuestionButton');
  // disable all buttons
  buttons.forEach((b) => (b.disabled = true));
  // update score
  if (isCorrect) {
    score++;
    btn.classList.add('correct');
    feedbackEl.textContent = 'Correct!';
  } else {
    btn.classList.add('incorrect');
    feedbackEl.textContent = 'Incorrect.';
  }
  // highlight the correct button(s) using dataset
  buttons.forEach((b) => {
    if (b.dataset.correct === 'true') {
      b.classList.add('correct');
    }
  });
  nextBtn.classList.remove('hidden');
  // when next button clicked, go to next question or finish
  nextBtn.onclick = () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questionList.length) {
      showCurrentQuestion();
    } else {
      endQuiz();
    }
  };
}

/**
 * Finish the quiz: show the results and rating.
 */
function endQuiz() {
  document.getElementById('quizContainer').classList.add('hidden');
  const resultsEl = document.getElementById('quizResults');
  resultsEl.classList.remove('hidden');
  const scoreEl = document.getElementById('quizScore');
  const ratingEl = document.getElementById('quizRating');
  scoreEl.textContent = `You scored ${score} out of ${questionList.length}`;
  const percent = (score / questionList.length) * 100;
  let rating;
  if (percent >= 80) {
    rating = 'Excellent! You really know your planties!';
  } else if (percent >= 50) {
    rating = 'Good job!';
  } else {
    rating = 'Needs improvement. Keep learning!';
  }
  ratingEl.textContent = rating;
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
  // navigation buttons for toggling views
  const cardsBtn = document.getElementById('showCards');
  const quizBtn = document.getElementById('showQuiz');
  const cardsSection = document.getElementById('cardsSection');
  const quizSection = document.getElementById('quizSection');

  // hide quiz section initially
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

  // toggle likeCategories visibility based on quiz type
  const quizTypeInputs = document.querySelectorAll('input[name="quizType"]');
  quizTypeInputs.forEach((input) => {
    input.addEventListener('change', () => {
      const likeOptions = document.getElementById('likeCategories');
      const qCountAllPlantiesLabel = document.getElementById('allPlantiesLabel');
      if (input.value === 'like' || input.value === 'dont') {
        likeOptions.classList.remove('hidden');
      } else {
        likeOptions.classList.add('hidden');
      }
      // show or hide All Planties option
      if (input.value === 'who') {
        qCountAllPlantiesLabel.classList.remove('hidden');
      } else {
        qCountAllPlantiesLabel.classList.add('hidden');
      }
    });
  });

  // start quiz button
  document.getElementById('startQuizButton').addEventListener('click', () => {
    startQuiz();
  });
  // restart quiz button resets to setup view
  document.getElementById('restartQuizButton').addEventListener('click', () => {
    document.getElementById('quizResults').classList.add('hidden');
    document.getElementById('quizSetup').classList.remove('hidden');
  });

  // detail toggle checkbox: show/hide details on hover
  const toggleDetails = document.getElementById('toggleDetails');
  if (toggleDetails) {
    toggleDetails.addEventListener('change', (e) => {
      const cardsGrid = document.querySelector('#cardsSection');
      if (e.target.checked) {
        cardsGrid.classList.remove('show-all-details');
      } else {
        cardsGrid.classList.add('show-all-details');
      }
    });
  }
});