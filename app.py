from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__)

# ── Sentence Pool ──
SENTENCES = [
    # Easy
    {"sentence": "The cat sat on the mat", "difficulty": "Easy"},
    {"sentence": "She reads a book every day", "difficulty": "Easy"},
    {"sentence": "The sun rises in the east", "difficulty": "Easy"},
    {"sentence": "He drinks coffee every morning", "difficulty": "Easy"},
    {"sentence": "The dog runs in the park", "difficulty": "Easy"},
    {"sentence": "Birds sing beautiful songs", "difficulty": "Easy"},
    {"sentence": "We play football on weekends", "difficulty": "Easy"},
    {"sentence": "The baby sleeps all night", "difficulty": "Easy"},
    {"sentence": "I love reading good books", "difficulty": "Easy"},
    {"sentence": "Fish live in the water", "difficulty": "Easy"},

    # Medium
    {"sentence": "Learning new languages opens many doors", "difficulty": "Medium"},
    {"sentence": "The children were playing happily in the garden", "difficulty": "Medium"},
    {"sentence": "She finished her homework before dinner", "difficulty": "Medium"},
    {"sentence": "The train arrived at the station on time", "difficulty": "Medium"},
    {"sentence": "He cooked a delicious meal for his family", "difficulty": "Medium"},
    {"sentence": "The students listened carefully to the teacher", "difficulty": "Medium"},
    {"sentence": "She bought fresh vegetables from the market", "difficulty": "Medium"},
    {"sentence": "The team worked together to solve the problem", "difficulty": "Medium"},
    {"sentence": "We visited the museum last weekend", "difficulty": "Medium"},
    {"sentence": "The weather forecast predicted heavy rain tomorrow", "difficulty": "Medium"},

    # Hard
    {"sentence": "Despite the heavy rain the match continued without interruption", "difficulty": "Hard"},
    {"sentence": "The scientist discovered a revolutionary method for treating the disease", "difficulty": "Hard"},
    {"sentence": "Successful people consistently develop habits that lead to long-term achievement", "difficulty": "Hard"},
    {"sentence": "The ancient civilization built magnificent structures that still stand today", "difficulty": "Hard"},
    {"sentence": "She managed to complete all her assignments despite the challenging circumstances", "difficulty": "Hard"},
    {"sentence": "The government introduced new policies to improve the quality of public education", "difficulty": "Hard"},
    {"sentence": "Modern technology has dramatically transformed the way people communicate worldwide", "difficulty": "Hard"},
    {"sentence": "The researchers analyzed thousands of data points to validate their hypothesis", "difficulty": "Hard"},
]

USED_INDICES = []


def get_next_sentence():
    """Return a random sentence, cycling through all before repeating."""
    global USED_INDICES
    available = [i for i in range(len(SENTENCES)) if i not in USED_INDICES]
    if not available:
        USED_INDICES = []
        available = list(range(len(SENTENCES)))
    idx = random.choice(available)
    USED_INDICES.append(idx)
    return SENTENCES[idx]


def shuffle_words(sentence: str):
    """Shuffle words ensuring the result is not the original order."""
    words = sentence.split()
    shuffled = words[:]
    attempts = 0
    while shuffled == words and attempts < 20:
        random.shuffle(shuffled)
        attempts += 1
    return shuffled


def calculate_points(difficulty: str, hint_used: bool) -> int:
    base = {"Easy": 10, "Medium": 20, "Hard": 35}.get(difficulty, 10)
    if hint_used:
        base = max(5, base // 2)
    return base


def generate_hint(sentence: str) -> str:
    words = sentence.split()
    hints = [
        f"The sentence has {len(words)} words.",
        f"It starts with '{words[0]}'.",
        f"It ends with '{words[-1]}'.",
        f"The third word is '{words[2]}'." if len(words) > 2 else f"Look carefully at the word order.",
    ]
    return random.choice(hints)


# ── Routes ──

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/new-sentence')
def new_sentence():
    item = get_next_sentence()
    shuffled = shuffle_words(item['sentence'])
    return jsonify({
        'sentence':   item['sentence'],
        'shuffled':   shuffled,
        'difficulty': item['difficulty'],
    })


@app.route('/api/check', methods=['POST'])
def check_answer():
    data     = request.get_json()
    formed   = data.get('formed', '').strip()
    sentence = data.get('sentence', '').strip()
    hint_used = data.get('hint_used', False)

    # Find difficulty for points
    difficulty = 'Easy'
    for s in SENTENCES:
        if s['sentence'].lower() == sentence.lower():
            difficulty = s['difficulty']
            break

    correct = formed.lower() == sentence.lower()
    points  = calculate_points(difficulty, hint_used) if correct else 0

    return jsonify({
        'correct':          correct,
        'points':           points,
        'correct_sentence': sentence,
        'difficulty':       difficulty,
    })


@app.route('/api/hint', methods=['POST'])
def hint():
    data     = request.get_json()
    sentence = data.get('sentence', '')
    return jsonify({'hint': generate_hint(sentence)})


if __name__ == '__main__':
    app.run(debug=True)
