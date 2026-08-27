# Subagent prompt: Generate flashcards and quiz from a lecture PDF

Use this prompt when asking a subagent to produce `lecture_N.json` and `quiz_N.json` for the EC2A1 minisite.

---

## Task

Read the lecture PDF and produce:

1. **`quiz/lecture_N.json`** — ~30–40 flashcards  
2. **`quiz/quiz_N.json`** — ~10 multiple-choice quiz questions  

Replace `N` with the lecture number (e.g. `1` for Lecture 1). Repeat for **lectures 1–10** (Lecture 1 is already done).

| | |
|---|---|
| **Input** | `Lectures/LectureN.pdf` (e.g. `Lectures/Lecture1.pdf`) |
| **Outputs** | `quiz/lecture_N.json`, `quiz/quiz_N.json` |
| **Optional** | Update the `topic` field for Lecture N in the `LECTURES` array in `quiz/index.html` if the slides have a clear subtitle |

### Model

Launch each subagent with **`cursor-grok-4.6-high-fast`** (Grok 4.6 High Fast). Use this model for all ten lectures — do not use `inherit` or other models unless explicitly requested.

### Reading the PDF

Extract slide text before writing content — e.g. `pdftotext Lectures/LectureN.pdf -` or read the PDF directly. Base all cards and questions on material from the slides; do not rely on memory or generic textbook coverage alone.

### Validation

Before finishing, confirm both files parse as valid JSON:

```bash
python3 -c "import json; json.load(open('quiz/lecture_N.json')); json.load(open('quiz/quiz_N.json'))"
```

---

## Course context

- **Course:** LSE EC2A1 — Intermediate Microeconomics - Game Theory  
- **Level:** Rigorous intermediate game theory. Students have seen some material before but need precise definitions, notation, and reasoning.  
- **Register:** British spelling (`behaviour`, `randomisation`, etc.).  
- **Slide fidelity:** Stay faithful to the lecture. Do not invent topics absent from the slides. You may state standard definitions clearly when slides abbreviate them (e.g. a one-line formal definition alongside slide notation).

---

## Content principles

### Include
- Formal definitions, notation, and conventions introduced in the lecture  
- Key distinctions and relationships between concepts  
- Economic intuition behind examples and applications  
- Worked examples from the slides (payoff matrices, elimination rounds, etc.)  
- Limitations of concepts covered and previews explicitly mentioned on slides  

### Exclude or de-emphasize
- Course admin (deadlines, office hours, coursework percentages)  
- Journal article details beyond what the slide uses  
- Content marked as preview for a later lecture, unless central to the current one  

### Applications and examples
Test **underlying economic or game-theoretic mechanisms**, not surface facts.

| Good | Bad |
|------|-----|
| Why a policy backfired (failure to anticipate strategic response) | What year or city an anecdote occurred in |
| What an experiment implies about an assumption (e.g. common knowledge of rationality) | Replication sample sizes or citation details |
| Why coordination failed despite mutual gains | Brand or firm names when the mechanism is the point |

---

## Flashcards (~30–40)

**Purpose:** Basic comprehension and key concepts. One idea per card.

| Field | Required | Notes |
|-------|----------|-------|
| `f` | yes | Short question: "Define …", "What is …?", "How does X differ from Y?" |
| `b` | yes | Concise answer, 1–3 sentences; use lecture terminology and notation |
| `c` | yes | Complexity 1–4 (see schema section); metadata only — not shown in the app |

**Style:**
- Mix definitional, notational, and "why / what goes wrong" cards  
- Cover the full lecture arc, not only opening motivation  
- Do not use `"deleted": true` unless explicitly retiring a card  

---

## Quiz (~10)

**Purpose:** One step above flashcards — application, comparison, or short reasoning. Not exam-level proofs.

**Good question types:**
- Choose the correct definition or characterization among close alternatives  
- Given a payoff matrix fragment or belief, determine a best response or dominance relation  
- Explain why an outcome or policy fails using strategic reasoning  
- Distinguish two related concepts from the lecture  
- Predict one step of a procedure (e.g. one elimination round, one round of iterated reasoning)  
- Interpret what an experiment implies for a modelling assumption  

**Do not** reuse flashcard wording verbatim; quiz questions should require combining or applying ideas.

**Order:** Follow the lecture flow (definitions → examples → solution concepts → applications).

| Field | Required | Notes |
|-------|----------|-------|
| `question` | yes | LaTeX allowed |
| `answerOptions` | yes | Exactly 4 options; each needs `text`, `isCorrect`, `rationale` |
| `hint` | yes | Nudge without giving away the answer |

**Rules:**
- Exactly one correct option per question  
- Distractors should reflect plausible misunderstandings from the lecture  
- Rationales required for all four options (1–2 sentences each)  
- Avoid trick questions and double negatives  
- **Randomize `answerOptions` order in the JSON** so the correct answer is not always first; vary positions across questions. (The app also shuffles options at quiz launch, but JSON order should still vary for authoring consistency.)  
- **No extra fields** — only `question`, `answerOptions`, and `hint` per question (no stray `text`, `id`, etc.)

---

## JSON schemas

Both files share a top-level **`topics`** object. Use **identical** `topics` in `lecture_N.json` and `quiz_N.json` for the same lecture.

`c` (flashcards) and `topics` (both files) are **schema metadata** — required for file format consistency; the minisite does not display them.

### Complexity (`c`) — flashcards only

| Value | Meaning |
|-------|---------|
| 1 | Conceptual / intuition |
| 2 | Applied reasoning |
| 3 | Formal definition |
| 4 | Notation / formulas |

### `lecture_N.json`

```json
{
  "flashcards": [
    {
      "f": "What is a normal form game?",
      "b": "A specification of players, strategy sets $S_i$, and payoff functions $u_i : S \\to \\mathbb{R}$.",
      "c": 3
    }
  ],
  "topics": {
    "covered": ["Topic from this lecture", "..."],
    "followUp": ["Topic previewed for a later lecture", "..."]
  }
}
```

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
  ],
  "topics": {
    "covered": ["Topic from this lecture", "..."],
    "followUp": ["Topic previewed for a later lecture", "..."]
  }
}
```

---

## LaTeX and formatting

The minisite renders math via MathJax. Use `$…$` for inline math in JSON strings.

- **JSON escaping:** double backslashes (`\\sum`, `\\Delta`, `\\geq`, `\\frac`, etc.)  
- **Supported text markup** (via app sanitizer): `\textbf{}`, `\textit{}`, `\emph{}`, `\pounds`, `\ldots`, `\dots`  
- **Match lecture notation** — e.g. if slides use Player 1 = rows, $(u_1, u_2)$ in cells, $s_{-i}$, $\sigma_i$, $\theta_{-i}$, follow that convention  

---

## Quality checklist

- [ ] ~30–40 flashcards spanning the whole lecture  
- [ ] ~10 quiz questions with 4 options, hints, and rationales for every option  
- [ ] Correct answers varied in position across questions (not always first)  
- [ ] Valid JSON in both files (run `json.load` check)  
- [ ] Identical `topics` in flashcard and quiz files  
- [ ] No course-admin content  
- [ ] Application items test mechanisms, not trivia  
- [ ] Notation matches the lecture slides  
- [ ] Quiz questions apply material, not duplicate flashcards verbatim  
- [ ] Lecture topic updated in `index.html` if applicable  
- [ ] No undocumented extra JSON fields  

---

## Example invocation (for parent agent)

Launch a subagent with model **`cursor-grok-4.6-high-fast`** for each lecture. Lecture 1 is complete; run 2–10:

```
For Lecture N (N = 2..10): launch a subagent with model cursor-grok-4.6-high-fast.
Read Lectures/LectureN.pdf and follow quiz/prompts/generate-lecture-content.md
to produce quiz/lecture_N.json and quiz/quiz_N.json.
Update the Lecture N topic in quiz/index.html to match the slide subtitle.
Validate both JSON files before finishing.
```

Single-lecture example (Lecture 2):

```
Launch subagent with model cursor-grok-4.6-high-fast.
Read Lectures/Lecture2.pdf and follow quiz/prompts/generate-lecture-content.md
to produce quiz/lecture_2.json and quiz/quiz_2.json.
Update the Lecture 2 topic in quiz/index.html to match the slide subtitle.
Validate both JSON files before finishing.
```

---

## Appendix: Lecture 1 reference (illustrative only)

Do not copy these topics into other lectures. Shown to calibrate tone and depth for EC2A1.

**Lecture 1 subtitle:** Normal Form, Rationality, Dominance  

**Typical `topics.covered`:** Strategic interaction; normal form games; mixed strategies and beliefs; best responses; strict dominance and DSE; IDSDS and rationalizability; beauty contest and CKR  

**Typical `topics.followUp`:** Nash equilibrium; extensive form games; mixed strategy equilibrium  

**Example application pattern:** Hanoi rat bounty → incentive misalignment, not anticipating strategic response. EV charging → coordination with distributional conflict. Beauty contest → iterated dominance under CKR vs. experimental choices.
