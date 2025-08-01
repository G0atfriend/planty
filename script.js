/*
 * Planty Flashcards & Quiz
 *
 * This script dynamically loads plant data from a JSON file and builds
 * interactive flashcards. It also powers a simple multiple‑choice quiz
 * based on plant care categories (soil, light, water and DON'Ts).
 */

/**
 * Normalise an answer string by converting to lowercase, removing punctuation,
 * replacing HTML <br> tags with spaces, splitting into words, sorting them and
 * joining back together. This allows comparisons that ignore word order and
 * minor punctuation differences.
 * @param {string} str
 * @returns {string}
 */
function normalizeAnswer(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
}

// Plant data array. Will be initialised from plantsData.js and processed to
// remove duplicates and assign new images from our curated collection.
let plants = [];

// Utility: speak a given text using the Web Speech API (if available).
function speakText(text) {
  if (!text) return;
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    // Use a pleasant voice if available (optional)
    // Choose the first English voice for consistency
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find((v) => /en-GB|en-US/.test(v.lang));
    if (enVoice) {
      utterance.voice = enVoice;
    }
    window.speechSynthesis.speak(utterance);
  }
}

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
  'bunnyear-cactus': '59_59_bunnyear_cactus.jpg'
  // New species introduced in this version
  , 'pilea-moon-valley': '61_pilea_alumi_moon_valley.jpg'
  , 'kalanchoe-thyrsiflora': '62_kalanchoe_not_flowering_thyrsiflora.jpg'
  , 'crassula-ovata-jade': '63_crassula_ovata_jade.jpg'
  , 'ceropegia-woodii-hearts-entangled': '64_ceropegia_woodii_hearts_entangled.jpg'
  , 'echeveria-pulidonis': '65_pulidonis_echeveria.jpg'
  , 'yucca-gigantea-spineless-yucca': '66_yucca_gigantea_spineless_yucca.jpg'
  , 'lace-aloe': '67_lace_aloe_aloe_aristata.jpg'
  , 'epiphyllum-orchid-cactus': '68_epiphyllum_orchid_cacti.jpg'
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
    // Support data URLs as image sources for newly added plants. If the image
    // property looks like a base64 data URI, use it directly; otherwise
    // prefix with the images/ directory.
    if (typeof p.image === 'string' && p.image.startsWith('data:')) {
      img.src = p.image;
    } else {
      img.src = 'images/' + p.image;
    }
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
    // Add a speaker button to pronounce the plant name.
    const audioBtn = document.createElement('button');
    audioBtn.className = 'audio-btn';
    audioBtn.setAttribute('aria-label', 'Hear plant name');
    audioBtn.type = 'button';
    audioBtn.innerHTML = '🔊';
    audioBtn.onclick = () => {
      const name = `${p.common_name || ''}${p.latin_name ? ' ' + p.latin_name : ''}`.trim();
      speakText(name);
    };
    card.appendChild(audioBtn);
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
    // Use the current number of loaded plants rather than a hard‑coded 60
    maxQuestions = plants.length;
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
  const audioBtn = document.getElementById('quizAudioBtn');
  // reset UI
  feedbackEl.textContent = '';
  optionsList.innerHTML = '';
  nextBtn.classList.add('hidden');
  // hide audio button until we set it up for this question
  if (audioBtn) {
    audioBtn.onclick = null;
    audioBtn.classList.add('hidden');
  }
  // determine question and options based on type
  // Determine question content based on type
  if (qObj.type === 'who') {
    // In a "Who am I?" question we display only the image; plant name is hidden
    imgWrap.classList.remove('hidden');
    // Support DataURL images for newly added plants
    if (typeof qObj.plant.image === 'string' && qObj.plant.image.startsWith('data:')) {
      imgEl.src = qObj.plant.image;
    } else {
      imgEl.src = 'images/' + qObj.plant.image;
    }
    nameEl.textContent = '';
    // Set audio button to announce the plant name only on click (does not auto speak)
    if (audioBtn) {
      const speakName = `${qObj.plant.common_name || ''}${qObj.plant.latin_name ? ' ' + qObj.plant.latin_name : ''}`.trim();
      audioBtn.onclick = () => speakText(speakName);
      audioBtn.classList.remove('hidden');
    }
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
    // Support DataURL images for newly added plants
    if (typeof qObj.plant.image === 'string' && qObj.plant.image.startsWith('data:')) {
      imgEl.src = qObj.plant.image;
    } else {
      imgEl.src = 'images/' + qObj.plant.image;
    }
    nameEl.innerHTML = `<strong>${qObj.plant.common_name}</strong><br><em>${qObj.plant.latin_name || ''}</em>`;
    // Set audio button to speak the plant name
    if (audioBtn) {
      const speakName = `${qObj.plant.common_name || ''}${qObj.plant.latin_name ? ' ' + qObj.plant.latin_name : ''}`.trim();
      audioBtn.onclick = () => speakText(speakName);
      audioBtn.classList.remove('hidden');
    }
    // choose category for this question
    const cat = qObj.category;
    const categoryLabel = cat.toUpperCase();
    // set question text depending on quiz type
    if (qObj.type === 'like') {
      questionEl.innerHTML = `What is the recommended ${categoryLabel} for <strong>${qObj.plant.common_name}</strong>?`;
    } else {
      questionEl.innerHTML = `What should you AVOID for <strong>${qObj.plant.common_name}</strong> when it comes to ${categoryLabel}?`;
    }
    // compute the correct answer string and its normalised form
    let correctAnswer = '';
    if (qObj.type === 'like') {
      correctAnswer = qObj.plant[cat] ? qObj.plant[cat].toString() : '';
    } else {
      correctAnswer = qObj.plant.donts ? qObj.plant.donts.toString().split('\n')[0] : '';
    }
    const correctNormalized = normalizeAnswer(correctAnswer);
    // gather wrong answers from other plants for this category and deduplicate
    const wrongValues = plants
      .filter((p) => p.id !== qObj.plant.id && p[cat])
      .map((p) => {
        if (qObj.type === 'like') {
          return p[cat].toString();
        } else {
          return p.donts ? p.donts.toString().split('\n')[0] : '';
        }
      })
      .filter((ans) => ans && normalizeAnswer(ans) !== correctNormalized);
    // deduplicate wrong answers
    const uniqueWrong = Array.from(new Set(wrongValues));
    shuffle(uniqueWrong);
    const options = [correctAnswer, ...uniqueWrong.slice(0, 3)];
    shuffle(options);
    options.forEach((opt) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = opt.replace(/\n/g, '<br>');
      // mark as correct if the normalised strings match
      const optNorm = normalizeAnswer(opt);
      btn.dataset.correct = optNorm === correctNormalized ? 'true' : 'false';
      btn.onclick = () => {
        const isCorrect = optNorm === correctNormalized;
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

  // Update the All Planties label to reflect the current number of plants
  const allPlantiesLabel = document.getElementById('allPlantiesLabel');
  if (allPlantiesLabel) {
    // Remove existing number if present and append the current count
    allPlantiesLabel.querySelector('input').nextSibling.textContent = `All Planties (${plants.length})`;
  }
  // navigation buttons for toggling views
  const cardsBtn = document.getElementById('showCards');
  const quizBtn = document.getElementById('showQuiz');
  const manageBtn = document.getElementById('showManage');
  const cardsSection = document.getElementById('cardsSection');
  const quizSection = document.getElementById('quizSection');
  const manageSection = document.getElementById('manageSection');

  // hide quiz section initially
  quizSection.style.display = 'none';
  cardsSection.style.display = '';
  if (manageSection) {
    manageSection.classList.add('hidden');
  }

  cardsBtn.addEventListener('click', () => {
    cardsBtn.classList.add('active');
    quizBtn.classList.remove('active');
    if (manageBtn) manageBtn.classList.remove('active');
    cardsSection.style.display = '';
    quizSection.style.display = 'none';
    if (manageSection) manageSection.classList.add('hidden');
  });
  quizBtn.addEventListener('click', () => {
    quizBtn.classList.add('active');
    cardsBtn.classList.remove('active');
    if (manageBtn) manageBtn.classList.remove('active');
    cardsSection.style.display = 'none';
    quizSection.style.display = '';
    if (manageSection) manageSection.classList.add('hidden');
  });

  // Manage button toggles the management interface
  if (manageBtn) {
    manageBtn.addEventListener('click', () => {
      manageBtn.classList.add('active');
      cardsBtn.classList.remove('active');
      quizBtn.classList.remove('active');
      cardsSection.style.display = 'none';
      quizSection.style.display = 'none';
      if (manageSection) manageSection.classList.remove('hidden');
    });
  }


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

  /**
   * Populate the list of removable plants in the management section.
   * Each list item shows the plant's common name and a button to remove it.
   */
  function populateRemoveList() {
    const listEl = document.getElementById('removeList');
    if (!listEl) return;
    listEl.innerHTML = '';
    plants.forEach((p, index) => {
      const li = document.createElement('li');
      li.textContent = p.common_name;
      const btn = document.createElement('button');
      btn.textContent = 'Remove';
      btn.onclick = () => {
        // Remove this plant from the array
        plants.splice(index, 1);
        // Rebuild cards and list
        buildCards();
        populateRemoveList();
        // Optionally send a request to backend to delete the plant
        console.log('Plant removed:', p.common_name);
      };
      li.appendChild(btn);
      listEl.appendChild(li);
    });
  }

  /**
   * Handle reading and cropping an uploaded image file. The cropped image
   * is stored in the variable currentImageDataUrl for later use.
   */
  let currentImageDataUrl = '';
  function setupImageCropping() {
    const fileInput = document.getElementById('newImage');
    const cropCanvas = document.getElementById('cropCanvas');
    if (!fileInput || !cropCanvas) return;
    const ctx = cropCanvas.getContext('2d');
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const side = Math.min(img.width, img.height);
          const sx = (img.width - side) / 2;
          const sy = (img.height - side) / 2;
          // resize canvas to 300x300 for a consistent thumbnail
          cropCanvas.width = 300;
          cropCanvas.height = 300;
          ctx.clearRect(0, 0, 300, 300);
          ctx.drawImage(img, sx, sy, side, side, 0, 0, 300, 300);
          cropCanvas.style.display = 'block';
          currentImageDataUrl = cropCanvas.toDataURL('image/jpeg');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Handle submission of the new plant form: gather data, add to the
   * in-memory plants array, rebuild cards and remove list, and (optionally)
   * send a POST request to a serverless endpoint with the plant data.
   */
  function setupPlantForm() {
    const form = document.getElementById('plantForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const statusEl = document.getElementById('formStatus');
      // gather field values
      const common = document.getElementById('newCommon').value.trim();
      if (!common) {
        statusEl.textContent = 'Common name is required.';
        return;
      }
      const latin = document.getElementById('newLatin').value.trim();
      const type = document.getElementById('newType').value.trim();
      const soil = document.getElementById('newSoil').value.trim();
      const light = document.getElementById('newLight').value.trim();
      const water = document.getElementById('newWater').value.trim();
      const donts = document.getElementById('newDonts').value.trim();
      // generate a simple slug id from common name
      const slug = common
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      // build plant object
      const newPlant = {
        id: slug,
        common_name: common,
        latin_name: latin,
        type: type,
        soil: soil,
        light: light,
        water: water,
        donts: donts,
        image: currentImageDataUrl || ''
      };
      // add to array
      plants.push(newPlant);
      // refresh UI
      buildCards();
      populateRemoveList();
      // clear form fields
      form.reset();
      currentImageDataUrl = '';
      const canvas = document.getElementById('cropCanvas');
      if (canvas) {
        canvas.style.display = 'none';
      }
      statusEl.textContent = 'Plant added locally. (No backend integration yet)';
      // Example: send a POST request to a serverless function
      /*
      fetch('https://example.com/api/addPlant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlant)
      }).then((res) => {
        statusEl.textContent = res.ok ? 'Plant added successfully!' : 'Failed to add plant.';
      }).catch((err) => {
        statusEl.textContent = 'Error sending request.';
      });
      */
    });
  }

  // Initialize remove list, cropping, and form
  populateRemoveList();
  setupImageCropping();
  setupPlantForm();
});