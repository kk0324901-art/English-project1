const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('.'));

// Sentence database with difficulty levels
const sentences = {
  easy: [
    { text: 'The quick brown fox jumps over the lazy dog', difficulty: 'Easy' },
    { text: 'She sells seashells by the seashore', difficulty: 'Easy' },
    { text: 'I love learning English every day', difficulty: 'Easy' },
    { text: 'The sun rises in the morning', difficulty: 'Easy' },
    { text: 'Birds fly high in the sky', difficulty: 'Easy' },
  ],
  medium: [
    { text: 'Learning new languages opens many opportunities', difficulty: 'Medium' },
    { text: 'The presentation was more interesting than I expected', difficulty: 'Medium' },
    { text: 'Technology has changed the way we communicate', difficulty: 'Medium' },
    { text: 'She enjoys reading books in her free time', difficulty: 'Medium' },
    { text: 'The conference will take place next month', difficulty: 'Medium' },
  ],
  hard: [
    { text: 'Despite the challenges, they persevered and ultimately succeeded', difficulty: 'Hard' },
    { text: 'The implications of this research will fundamentally transform our understanding', difficulty: 'Hard' },
    { text: 'Notwithstanding the considerable obstacles, progress was maintained', difficulty: 'Hard' },
    { text: 'The multifaceted approach required careful coordination and meticulous planning', difficulty: 'Hard' },
    { text: 'Consequently, the organization underwent a comprehensive restructuring process', difficulty: 'Hard' },
  ],
};

// Helper functions
function getRandomDifficulty() {
  const difficulties = ['easy', 'medium', 'hard'];
  return difficulties[Math.floor(Math.random() * difficulties.length)];
}

function getRandomSentence(difficulty) {
  const sentenceList = sentences[difficulty];
  return sentenceList[Math.floor(Math.random() * sentenceList.length)];
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getHint(sentence) {
  const words = sentence.split(' ');
  const hints = [
    `The sentence has ${words.length} words.`,
    `The sentence starts with: "${words[0]}"`,
    `The sentence ends with: "${words[words.length - 1]}"`,
    `The second word is: "${words[1]}"`,
  ];
  return hints[Math.floor(Math.random() * hints.length)];
}

// API Endpoints
app.get('/api/new-sentence', (req, res) => {
  const difficulty = getRandomDifficulty();
  const sentence = getRandomSentence(difficulty);
  const words = sentence.text.split(' ');
  const shuffled = shuffleArray(words);

  res.json({
    sentence: sentence.text,
    shuffled: shuffled,
    difficulty: sentence.difficulty,
  });
});

app.post('/api/check', (req, res) => {
  const { formed, sentence, hint_used } = req.body;

  // Normalize for comparison (case-insensitive, trim whitespace)
  const formedNormalized = formed.toLowerCase().trim();
  const sentenceNormalized = sentence.toLowerCase().trim();

  const correct = formedNormalized === sentenceNormalized;
  let points = correct ? 10 : 0;

  // Bonus points for not using hints
  if (correct && !hint_used) {
    points += 5;
  }

  res.json({
    correct: correct,
    points: points,
    correct_sentence: sentence,
  });
});

app.post('/api/hint', (req, res) => {
  const { sentence } = req.body;
  const hint = getHint(sentence);
  res.json({ hint: hint });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎮 Sentence Trainer running at http://localhost:${PORT}`);
  console.log('💡 Open http://localhost:3000 in your browser');
});