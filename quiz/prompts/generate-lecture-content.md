# Subagent prompt: Generate flashcards and quiz from a lecture PDF

Use this prompt when asking a subagent to produce `lecture_N.json` and `quiz_N.json` for the EC2A1 minisite.

---

## Task

Read the lecture PDF and produce:

1. **`quiz/lecture_N.json`** — ~30–40 flashcards  
2. **`quiz/quiz_N.json`** — ~10 multiple-choice quiz questions  

Replace `N` with the lecture number (e.g. `6` for Lecture 6).

**Status:** Lectures **1–10** are complete (content + quiz review).

| | |
|---|---|
| **Input** | `Lectures/LectureN.pdf` (e.g. `Lectures/Lecture6.pdf`) |
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
- **Slide fidelity:** Stay faithful to the lecture. Do not invent topics absent from the slides. Use **slide phrasing** for theorems and results — do not invent labels (e.g. “monopoly-style trade-off” if the slide says something else). You may state standard definitions clearly when slides abbreviate them.

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

**Purpose:** One step above flashcards — application, comparison, or short reasoning. Not exam-level proofs. Prefer **computation and “why”** over pure definition recall.

**Good question types:**
- Given a payoff matrix fragment or belief, determine a best response, dominance relation, or equilibrium property  
- Explain why an outcome or policy fails using strategic reasoning  
- Distinguish two related concepts from the lecture (as applied in a scenario, not as bare definitions)  
- Predict **one step** of a procedure (e.g. why a strategy becomes dominated in the **reduced** game after one elimination)  
- Interpret what an experiment implies for a modelling assumption  
- Check **mutual** best responses when testing equilibrium claims  

**Weaker (use sparingly):** “Which is the correct definition of …?” without an applied setting.

**Do not** reuse flashcard wording verbatim; quiz questions should require combining or applying ideas.

**One question, one skill:** Do not combine equilibrium computation and comparative statics, or two unrelated concepts, in a single item.

**Order:** Follow the lecture flow (definitions → examples → solution concepts → applications).

**Coverage:** Each major slide block in the lecture should have at least one quiz question.

| Field | Required | Notes |
|-------|----------|-------|
| `question` | yes | LaTeX allowed; see stem rules below |
| `answerOptions` | yes | Exactly 4 options; each needs `text`, `isCorrect`, `rationale` |
| `hint` | yes | See hint rules below |

### Stem rules
- **Do not embed the answer in the stem** — the question must not state the conclusion students are meant to derive (e.g. do not name the IDSDS round sequence; ask *why* a strategy is eliminated in the reduced game).
- Set up a scenario or payoff fragment; let the options carry the competing claims.

### Hint rules
- Nudge toward the **method**, not the result.
- **Do not** quote key equations, first-order conditions, or indifference conditions from the slides.
- **Do not** name the correct concept or option in the hint.

### Distractor rules
- Every wrong option should reflect a **plausible lecture-specific misunderstanding**, not filler.
- Good distractors mirror confusions the slides warn about, e.g.:
  - DSE vs Nash equilibrium; IIA vs strategic interaction  
  - mixing vs incomplete information; independence vs private values  
  - treating types as separate players; averaging complete-information equilibria  
  - “preferred joint payoffs ⇒ equilibrium”; favourite-cell thinking as dominance  
  - swapped properties of auction formats; one-bidder vs two-bidder sale probability  
- **Avoid** generic falsehoods (“mixed strategies are impossible when sets are finite”) unless the lecture actually discusses that error.

### Option and rationale rules
- **Do not dump full worked solutions in the options** — students should not pick the answer by recognising a memorised derivation.
- Rationales: 1–2 sentences each; say **why** the option is right or wrong using slide logic or a minimal calculation reference.
- Exactly one correct option per question  
- Avoid trick questions and double negatives  
- **Randomize `answerOptions` order in the JSON** — vary correct-answer positions across questions (not always first). The app also shuffles at quiz launch; JSON order is for authoring consistency.  
- **No extra fields** — only `question`, `answerOptions`, and `hint` per question (no stray `text`, `id`, etc.)

---

## Review pass (required after first draft)

After writing `quiz_N.json`, re-read the PDF, `lecture_N.json`, and the quiz file. Edit the quiz (not the flashcards, unless a factual error affects an answer):

1. Remove stems that give away the answer  
2. Replace weak or generic distractors with lecture-specific mix-ups  
3. Tighten hints so they do not quote equations or name the answer  
4. Replace recall-only items with application where possible  
5. Confirm each major slide block is covered  
6. Re-randomize correct-answer positions if needed  
7. Confirm `topics` in `quiz_N.json` **identical** to `lecture_N.json`  
8. Re-run `json.load` validation  

Do **not** rewrite `lecture_N.json` unless a factual error affects a quiz answer.

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
      "question": "In the reduced game after $B$ is eliminated, why can $R$ now be removed for Player 2?",
      "answerOptions": [
        { "text": "…", "isCorrect": true, "rationale": "…" },
        { "text": "…", "isCorrect": false, "rationale": "…" },
        { "text": "…", "isCorrect": false, "rationale": "…" },
        { "text": "…", "isCorrect": false, "rationale": "…" }
      ],
      "hint": "Compare payoffs against the remaining strategies only."
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
- **Match lecture notation** — follow conventions on the slides (e.g. Player 1 = rows, $(u_1, u_2)$ in cells, $s_{-i}$, $\sigma_i$, $\theta_{-i}$)

---

## Quality checklist

- [ ] ~30–40 flashcards spanning the whole lecture  
- [ ] ~10 quiz questions with 4 options, hints, and rationales for every option  
- [ ] Each major slide block has at least one quiz question  
- [ ] Stems do not embed the answer; hints do not quote key equations  
- [ ] Distractors are lecture-specific mix-ups, not generic filler  
- [ ] Options do not dump full worked solutions  
- [ ] Correct answers varied in position across questions  
- [ ] Review pass completed on `quiz_N.json`  
- [ ] Valid JSON in both files (run `json.load` check)  
- [ ] Identical `topics` in flashcard and quiz files  
- [ ] No course-admin content; mechanisms not trivia; slide phrasing for theorems  
- [ ] Lecture topic updated in `index.html` if applicable  
- [ ] No undocumented extra JSON fields  

---

## Example invocation (for parent agent)

**Generate** (new or replacement lecture):

```
Launch subagent with model cursor-grok-4.6-high-fast.
Read Lectures/LectureN.pdf and follow quiz/prompts/generate-lecture-content.md
to produce quiz/lecture_N.json and quiz/quiz_N.json.
Update the Lecture N topic in quiz/index.html to match the slide subtitle.
Run the review pass on quiz_N.json. Validate both JSON files before finishing.
```

**Review only** (e.g. after manual edits):

```
Launch subagent with model cursor-grok-4.6-high-fast.
Read Lectures/LectureN.pdf, quiz/lecture_N.json, and quiz/quiz_N.json.
Follow the review pass in quiz/prompts/generate-lecture-content.md.
Edit quiz/quiz_N.json only. Validate JSON before finishing.
```

---

## Appendix: Lecture 1 reference (illustrative only)

Do not copy these topics into other lectures. Shown to calibrate tone and depth for EC2A1.

**Lecture 1 subtitle:** Normal Form, Rationality, Dominance  

**Typical `topics.covered`:** Strategic interaction; normal form games; mixed strategies and beliefs; best responses; strict dominance and DSE; IDSDS and rationalizability; beauty contest and CKR  

**Typical `topics.followUp`:** Nash equilibrium; extensive form games; mixed strategy equilibrium  

**Example application pattern:** Hanoi rat bounty → incentive misalignment, not anticipating strategic response. EV charging → coordination with distributional conflict. Beauty contest → iterated dominance under CKR vs. experimental choices.
