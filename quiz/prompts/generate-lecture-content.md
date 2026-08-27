# Subagent prompt: Generate flashcards and quiz from a lecture PDF

Use this prompt when asking a subagent to produce `lecture_N.json` and `quiz_N.json` for the EC2A1 minisite.

---

## Task

Read the lecture PDF and produce two JSON files for the EC2A1 flashcard/quiz minisite:

1. **`quiz/lecture_N.json`** — ~30–40 flashcards
2. **`quiz/quiz_N.json`** — ~10 multiple-choice quiz questions

Replace `N` with the lecture number (e.g. 1 for Lecture 1).

**Input:** `Lectures/LectureN.pdf` (or path provided)
**Outputs:** `quiz/lecture_N.json`, `quiz/quiz_N.json`

Also update the `topic` field for Lecture N in the `LECTURES` array in `quiz/index.html` if the lecture has a clear title on the slides (e.g. "Normal Form, Rationality, Dominance" for Lecture 1).

---

## Course context

- **Course:** LSE EC2A1 — Intermediate Microeconomics - Game Theory
- **Level:** Rigorous intermediate game theory. Students have seen some material before but need precise definitions, notation, and reasoning.
- **Slides vs. lecture:** Slides are not exhaustive. Focus on concepts, definitions, and reasoning that appear on the slides and that an instructor would expect students to know from the lecture. Do not invent content not supported by the slides, but you may state standard definitions clearly even if the slide is abbreviated.

---

## Content principles

### What to include
- Formal definitions (normal form games, strategy profiles, mixed strategies, beliefs, best responses, dominance, IDSDS, etc.)
- Notation and conventions (e.g. Player 1 = rows, $s_{-i}$, $\sigma_i \in \Delta S_i$)
- Key distinctions (mixed strategy vs. belief; strict vs. weak dominance; DSE vs. rationalizability)
- Economic intuition behind applications (why strategic thinking matters, incentive misalignment, coordination failure)
- Standard worked examples from the slides (Prisoner's Dilemma, coordination/EV charging, IDSDS rounds, beauty contest logic)
- Limitations and preview concepts mentioned on slides (e.g. dominance limitations → Nash equilibrium)

### What to exclude or de-emphasize
- Course admin (deadlines, office hours, problem set percentages)
- Superficial application trivia (dates, place names, brand names) unless needed for the mechanism
- Journal article details beyond what the slide uses
- Content clearly marked as preview for a later week unless it is central to the current lecture

### Applications (Hanoi rats, EV charging, beauty contest, etc.)
- Test **underlying economic/game-theoretic mechanisms**, not surface facts.
- Good: "Why did the rat bounty backfire?" → perverse incentives / failure to anticipate strategic response
- Bad: "In what year did the Hanoi rat bounty occur?"
- Good: "What does the beauty contest experiment suggest about common knowledge of rationality?"
- Bad: "What was the peak frequency in Nagel (1995)?"

---

## Flashcards (~30–40)

**Purpose:** Basic comprehension and key concepts. One idea per card.

**Format:** Short question on front (`f`), concise answer on back (`b`).

**Style:**
- Front: direct question or "Define …" / "What is …?" / "How does X differ from Y?"
- Back: 1–3 sentences max; use precise terminology from the lecture
- Include notation where the lecture uses it ($u_i$, $\sigma_i$, $\theta_{-i}$, etc.)
- Mix definitional cards with "why" / "what goes wrong" intuition cards
- Cover the full lecture arc, not just the opening examples

**Required field:** `"c"` (complexity 1–4: 1 = conceptual, 2 = applied/reasoning, 3 = formal definition, 4 = notation/formulas).

**Do not** use `"deleted": true` unless explicitly retiring a card.

---

## Quiz (~10)

**Purpose:** One step above flashcards — application, comparison, or short reasoning. Still not exam-level proofs.

**Good quiz question types:**
- Identify the correct definition or characterization among close alternatives
- Given a payoff matrix fragment or belief, determine best response or dominance
- Explain why an outcome or policy fails using strategic reasoning
- Distinguish two related concepts (e.g. $\sigma_i$ vs. $\theta_{-i}$)
- Predict the result of one IDSDS round or one step of iterated reasoning
- Interpret what an experiment *implies* for an assumption (e.g. CKR)

**Each question must have:**
- `"question"`: string (LaTeX allowed)
- `"answerOptions"`: exactly 4 options, each with `"text"`, `"isCorrect"` (boolean), `"rationale"` (1–2 sentences explaining why right/wrong)
- `"hint"`: optional nudge without giving away the answer

**Rules:**
- Exactly one correct option per question
- Distractors should reflect plausible misunderstandings (e.g. confusing belief with mixed strategy, strict vs. weak dominance)
- Rationales are required for all four options
- Avoid trick questions and double negatives

---

## JSON schemas

### `lecture_N.json`

```json
{
  "flashcards": [
    { "f": "What is a normal form game?", "b": "A specification of players, strategy sets $S_i$ for each player $i$, and payoff functions $u_i : S \\to \\mathbb{R}$.", "c": 3 }
  ],
  "topics": {
    "covered": ["Normal Form Games", "Best Responses"],
    "followUp": ["Nash Equilibrium"]
  }
}
```

**Required per flashcard:** `f`, `b`, `c` (complexity 1–4: 1 = conceptual, 2 = applied/reasoning, 3 = formal definition, 4 = notation/formulas).

**Required top-level:** `topics` with `covered` and `followUp` arrays.

**Do not** use `"deleted": true` unless explicitly retiring a card.

### `quiz_N.json`

```json
{
  "quiz": [
    {
      "question": "Strategy $s_i$ is strictly dominated if and only if …",
      "answerOptions": [
        { "text": "…", "isCorrect": true, "rationale": "…" },
        { "text": "…", "isCorrect": false, "rationale": "…" },
        { "text": "…", "isCorrect": false, "rationale": "…" },
        { "text": "…", "isCorrect": false, "rationale": "…" }
      ],
      "hint": "Think about best responses to beliefs."
    }
  ]
}
```

---

## LaTeX and formatting

The minisite renders math via MathJax. Use `$…$` for inline math in JSON strings.

**Escape in JSON:** backslashes must be doubled (`\\sum`, `\\Delta`, `\\geq`, `\\frac`, etc.).

**Supported LaTeX shortcuts in text** (via app sanitizer): `\textbf{}`, `\textit{}`, `\emph{}`, `\pounds`, `\ldots`, `\dots`.

**Conventions from Lecture 1 slides:**
- Player 1 chooses rows, Player 2 columns; payoffs `(u_1, u_2)` in each cell
- Write $s_{-i}$ for opponents' strategies, $\sigma_i$ for mixed strategies, $\theta_{-i}$ for beliefs

---

## Quality checklist

Before finishing, verify:

- [ ] ~30–40 flashcards spanning the whole lecture (not only the opening motivation)
- [ ] ~10 quiz questions with 4 options each and rationales for all options
- [ ] Valid JSON (no trailing commas; escaped backslashes)
- [ ] No course-admin flashcards
- [ ] Application questions test mechanisms, not trivia
- [ ] Notation matches the lecture slides
- [ ] Quiz difficulty > flashcard difficulty but still appropriate for intermediate GT
- [ ] Lecture topic updated in `index.html` if applicable

---

## Example invocation (for parent agent)

```
Read Lectures/Lecture1.pdf and follow quiz/prompts/generate-lecture-content.md
to produce quiz/lecture_1.json and quiz/quiz_1.json.
Update the Lecture 1 topic in quiz/index.html to match the slide subtitle.
```
