/*
 * Planty Flashcards & Quiz
 *
 * This script dynamically loads plant data from a JSON file and builds
 * interactive flashcards. It also powers a simple multiple‑choice quiz
 * based on plant care categories (soil, light, water and DON'Ts).
 */

// Plant data array. Will be initialised from plantsData.js and processed to
// remove duplicates and assign new images from our curated collection.
let plants = [];

/*
 * Mapping from plant IDs (as defined in plantsData.js) to cropped image
 * filenames stored under the `images/` folder. For most entries the
 * filenames correspond to new photographs provided in plant_images_all_60.zip.
 * A handful of missing species have been mapped to closely related plants to
 * ensure all flashcards display an image. If you add or remove plants,
 * update this mapping accordingly.
 */
const imageMap = {
  'cylindrical-snake-plant': '01_01_cylindrical_snake_plant.jpg',
  'trailing-jade': '02_02_trailing_jade.jpg',
  'pink-passion': '03_03_pink_passion.jpg',
  'african-mask': '04_04_african_mask.jpg',
  'calathea-makoyana': '05_05_calathea_makoyana.jpg',
  'polka-dot-begonia': '06_06_polka_dot_begonia.jpg',
  'velvet-cardboard-anthurium': '07_07_velvet_cardboard_anthurium.jpg',
  'palm-begonia-indian-summer': '08_08_palm_begonia_indian_summer.jpg',
  'strelitzia-bird-of-paradise-all-50-pure': '09_09_strelitzia_bird_of_paradise_all_50_pure.jpg',
  'ocean-bambino-spider-plant': '10_10_ocean_bambino_spider_plant.jpg',
  'tradescantia-nanouk': '11_11_tradescantia_nanouk.jpg',
  'fittonia-verschaffeltii': '12_12_fittonia_verschaffeltii.jpg',
  'white-wave-philodendron': '13_13_white_wave_philodendron.jpg',
  'chinese-money-plant': '14_14_chinese_money_plant.jpg',
  'shamrock-oxalis-milkii': '15_15_shamrock_oxalis_milkii.jpg',
  'coleus-excellium-pinstripe-croton': '16_16_coleus_excellium_pinstripe_croton.jpg',
  // red-beauty-philodendron does not have its own photo – reuse a related Philodendron image
  'red-beauty-philodendron': '13_13_white_wave_philodendron.jpg',
  // the following IDs map to their corresponding images; some are assigned
  // to visually similar species where photos were unavailable
  'nerve-plant': '24_24_nerve_plant.jpg',
  'prayer-plant-lemon-lime': '25_25_prayer_plant_lemon_lime.jpg',
  'parlour-palm': '26_26_parlour_palm.jpg',
  'swiss-cheese-plant': '27_27_swiss_cheese_plant.jpg',
  'dragon-tree': '28_28_dragon_tree.jpg',
  'dwarf-fiddleleaf-fig': '29_29_dwarf_fiddleleaf_fig.jpg',
  'monkey-mask': '30_30_monkey_mask.jpg',
  'marble-queen-pothos': '31_31_marble_queen_pothos.jpg',
  'golden-pothos-devils-ivy': '32_32_golden_pothos_devils_ivy.jpg',
  'variegated-wax-plant': '33_33_variegated_wax_plant.jpg',
  'pinstripe-calathea': '34_34_pinstripe_calathea.jpg',
  'boston-fern': '35_35_boston_fern.jpg',
  'kentia-palm': '36_36_kentia_palm.jpg',
  'croton-mammi': '37_37_croton_mammi.jpg',
  'rubber-plant-robusta': '38_38_rubber_plant_robusta.jpg',
  'princess-plant': '40_40_princess_plant.jpg',
  'maidenhair-fern': '41_41_maidenhair_fern.jpg',
  'cast-iron-plant': '42_42_cast_iron_plant.jpg',
  'asparagus-fern': '43_43_asparagus_fern.jpg',
  'english-ivy': '44_44_english_ivy.jpg',
  'variegated-wax-plant-hoya-tricolor': '46_46_variegated_wax_plant_hoya_tricolor.jpg',
  // echeveria-spp lacked a photo – use a cactus image as a stand‑in
  'echeveria-spp': '59_59_bunnyear_cactus.jpg',
  'champion-pink-anthurium': '48_48_champion_pink_anthurium.jpg',
  'raindrop-peperomia': '49_49_raindrop_peperomia.jpg',
  // pepperspot-peperomia lacked a photo – reuse another Peperomia image
  'pepperspot-peperomia': '49_49_raindrop_peperomia.jpg',
  'zebra-plant': '55_55_zebra_plant.jpg',
  'gymnocalycium-cactus': '57_57_gymnocalycium_cactus.jpg',
  'bunnyear-cactus': '59_59_bunnyear_cactus.jpg',
  'pink-anthurium': '60_60_pink_anthurium.jpg'
};
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
  const nameEl = document.getElementById('quizPlantName');
  // reset UI
  feedbackEl.textContent = '';
  optionsList.innerHTML = '';
  nextBtn.classList.add('hidden');
  // determine question and options based on type
  // Determine question content based on type
  if (qObj.type === 'who') {
    // In a "Who am I?" question we display only the image; plant name is hidden
    imgWrap.classList.remove('hidden');
    imgEl.src = 'images/' + qObj.plant.image;
    nameEl.textContent = '';
    questionEl.innerHTML = 'Identify this plant:';
    // options are names of 4 plants including the correct one
    const otherPlants = plants.filter((p) => p.id !== qObj.plant.id);
    shuffle(otherPlants);
    const optionPlants = [qObj.plant, ...otherPlants.slice(0, 3)];
    shuffle(optionPlants);
    optionPlants.forEach((p) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `${p.common_name} <br><em>${p.latin_name || ''}</em>`;
      btn.dataset.correct = p.id === qObj.plant.id ? 'true' : 'false';
      btn.onclick = () => {
        const isCorrect = p.id === qObj.plant.id;
        handleQuizAnswer(btn, isCorrect);
      };
      li.appendChild(btn);
      optionsList.appendChild(li);
    });
  } else {
    // Care questions ("like" or "dont"): display image and plant name alongside the question
    imgWrap.classList.remove('hidden');
    imgEl.src = 'images/' + qObj.plant.image;
    nameEl.innerHTML = `<strong>${qObj.plant.common_name}</strong><br><em>${qObj.plant.latin_name || ''}</em>`;
    // choose category for this question
    const cat = qObj.category;
    const categoryLabel = cat.toUpperCase();
    // set question text depending on quiz type
    if (qObj.type === 'like') {
      questionEl.innerHTML = `What is the recommended ${categoryLabel} for <strong>${qObj.plant.common_name}</strong>?`;
    } else {
      questionEl.innerHTML = `What should you AVOID for <strong>${qObj.plant.common_name}</strong> when it comes to ${categoryLabel}?`;
    }
    // compute the correct answer
    let correctAnswer = '';
    if (qObj.type === 'like') {
      correctAnswer = qObj.plant[cat] ? qObj.plant[cat].toString() : '';
    } else {
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
    // Start with the raw data
    plants = plantData.slice();
    // Remove duplicate entries based on common_name (case‑insensitive).
    const seenNames = {};
    const deduped = [];
    plants.forEach((p) => {
      const nameKey = (p.common_name || '').trim().toLowerCase();
      if (!seenNames[nameKey]) {
        // Apply image override if available
        if (imageMap[p.id]) {
          p.image = imageMap[p.id];
        }
        deduped.push(p);
        seenNames[nameKey] = true;
      }
    });
    plants = deduped;
  } else {
    console.error('Plant data missing: ensure plantsData.js is included');
    plants = [];
  }
  // build the flashcards with the deduplicated data
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