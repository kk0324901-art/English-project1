// ── State ──
let state = {
  currentSentence: null,
  shuffledWords: [],
  placedWords: [],
  score: 0,
  streak: 0,
  bestStreak: 0,
  round: 1,
  totalCorrect: 0,
  totalWrong: 0,
  hintUsed: false,
  gameActive: false,
};

// ── DOM helpers ──
const $ = id => document.getElementById(id);

function updateScoreboard() {
  $('score').textContent  = state.score;
  $('streak').textContent = state.streak > 0 ? `${state.streak}🔥` : '0';
  $('round').textContent  = state.round;
  $('total-correct').textContent = state.totalCorrect;
  $('total-wrong').textContent   = state.totalWrong;
  $('best-streak').textContent   = state.bestStreak;

  const total = state.totalCorrect + state.totalWrong;
  $('accuracy').textContent = total > 0
    ? Math.round((state.totalCorrect / total) * 100) + '%'
    : '—';
}

// ── New Sentence ──
async function newSentence() {
  hideFeedback();
  state.placedWords = [];
  state.hintUsed = false;
  $('hint-text').textContent = '';
  $('hint-text').classList.remove('visible');

  try {
    const res  = await fetch('/api/new-sentence');
    const data = await res.json();

    state.currentSentence = data.sentence;
    state.shuffledWords   = data.shuffled;
    state.gameActive      = true;

    renderWordBank();
    renderSentenceDisplay();
    updateDifficulty(data.difficulty);

    $('check-btn').disabled = true;
    $('hint-btn').disabled  = false;
    $('sentence-display').className = 'sentence-display active';
  } catch (e) {
    alert('Error fetching sentence. Is the server running?');
  }
}

// ── Render Word Bank ──
function renderWordBank() {
  const bank = $('word-bank');
  bank.innerHTML = '';
  state.shuffledWords.forEach((word, idx) => {
    const chip = document.createElement('button');
    chip.className = 'word-chip bank-chip';
    chip.textContent = word;
    chip.dataset.idx = idx;
    if (state.placedWords.includes(idx)) chip.classList.add('used');
    chip.addEventListener('click', () => placeWord(idx));
    bank.appendChild(chip);
  });
}

// ── Render Sentence Display ──
function renderSentenceDisplay() {
  const display = $('sentence-display');
  display.innerHTML = '';

  if (state.placedWords.length === 0) {
    const ph = document.createElement('p');
    ph.className = 'placeholder-text';
    ph.textContent = 'Click words below to build your sentence...';
    display.appendChild(ph);
    $('check-btn').disabled = true;
    return;
  }

  state.placedWords.forEach(idx => {
    const chip = document.createElement('button');
    chip.className = 'word-chip placed-chip';
    chip.textContent = state.shuffledWords[idx];
    chip.addEventListener('click', () => removeWord(idx));
    display.appendChild(chip);
  });

  $('check-btn').disabled = false;
}

// ── Place / Remove Word ──
function placeWord(idx) {
  if (state.placedWords.includes(idx)) return;
  state.placedWords.push(idx);
  renderSentenceDisplay();
  renderWordBank();
}

function removeWord(idx) {
  state.placedWords = state.placedWords.filter(i => i !== idx);
  renderSentenceDisplay();
  renderWordBank();
}

function clearSentence() {
  state.placedWords = [];
  renderSentenceDisplay();
  renderWordBank();
  hideFeedback();
}

// ── Check Answer ──
async function checkSentence() {
  if (!state.gameActive || state.placedWords.length === 0) return;

  const formed = state.placedWords.map(i => state.shuffledWords[i]).join(' ');

  try {
    const res  = await fetch('/api/check', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ formed, sentence: state.currentSentence, hint_used: state.hintUsed }),
    });
    const data = await res.json();

    if (data.correct) {
      handleCorrect(data.points);
    } else {
      handleWrong(data.correct_sentence);
    }

    state.gameActive = false;
    $('check-btn').disabled = true;
    $('hint-btn').disabled  = true;
    state.round++;
    updateScoreboard();
  } catch (e) {
    alert('Error checking answer.');
  }
}

function handleCorrect(points) {
  state.score += points;
  state.streak++;
  state.totalCorrect++;
  if (state.streak > state.bestStreak) state.bestStreak = state.streak;

  $('sentence-display').className = 'sentence-display correct';
  showFeedback(true, `+${points} points! ${getEncouragement()}`, '');
}

function handleWrong(correctSentence) {
  state.streak = 0;
  state.totalWrong++;

  $('sentence-display').className = 'sentence-display wrong';
  $('sentence-display').classList.add('shake');
  setTimeout(() => $('sentence-display').classList.remove('shake'), 400);

  showFeedback(false, 'Not quite! Try the next one.', `Correct: "${correctSentence}"`);
}

function getEncouragement() {
  const msgs = ['Amazing!', 'Excellent!', 'Keep it up!', 'Brilliant!', 'Superb!', 'Nailed it!'];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// ── Hint ──
async function getHint() {
  if (!state.currentSentence) return;
  try {
    const res  = await fetch('/api/hint', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sentence: state.currentSentence }),
    });
    const data = await res.json();
    state.hintUsed = true;

    const el = $('hint-text');
    el.textContent = `💡 ${data.hint}`;
    el.classList.add('visible');
    $('hint-btn').disabled = true;
  } catch (e) { /* silent */ }
}

// ── Feedback ──
function showFeedback(correct, message, detail) {
  const card = $('feedback-card');
  card.className = `feedback-card show ${correct ? 'correct-fb' : 'wrong-fb'}`;

  $('feedback-icon').textContent    = correct ? '🎉' : '😔';
  $('feedback-message').textContent = message;
  $('correct-answer-display').textContent = detail;
}

function hideFeedback() {
  $('feedback-card').className = 'feedback-card';
}

// ── Difficulty badge ──
function updateDifficulty(level) {
  const badge = $('difficulty-badge');
  badge.textContent = level;
  badge.className   = `difficulty-badge ${level.toLowerCase()}`;
}

// ── Init ──
updateScoreboard();
