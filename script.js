/* Card data lives in cards.json and is loaded for the GitHub Pages site. */
(() => {
  "use strict";

  const els = {
    card: document.getElementById("flashcard"),
    gaelic: document.getElementById("card-gaelic"),
    pronunciation: document.getElementById("card-pronunciation"),
    english: document.getElementById("card-english"),
    category: document.getElementById("card-category"),
    related: document.getElementById("card-related"),
    note: document.getElementById("card-note"),
    deckSelect: document.getElementById("deck-select"),
    levelOptions: document.getElementById("level-options"),
    levelSelection: document.getElementById("level-selection"),
    deckName: document.getElementById("deck-name"),
    cardCount: document.getElementById("card-count"),
    progressLabel: document.getElementById("progress-label"),
    progressBar: document.getElementById("progress-bar"),
    search: document.getElementById("search-input"),
    clearSearch: document.getElementById("clear-search"),
    previous: document.getElementById("previous-button"),
    next: document.getElementById("next-button"),
    flip: document.getElementById("flip-button"),
    shuffle: document.getElementById("shuffle-button"),
    status: document.getElementById("status"),
    quizStart: document.getElementById("quiz-start"),
    quizAvailability: document.getElementById("quiz-availability"),
    quizDialog: document.getElementById("quiz-dialog"),
    quizClose: document.getElementById("quiz-close"),
    quizQuestionView: document.getElementById("quiz-question-view"),
    quizProgressLabel: document.getElementById("quiz-progress-label"),
    quizProgressBar: document.getElementById("quiz-progress-bar"),
    quizGaelic: document.getElementById("quiz-gaelic"),
    quizPronunciation: document.getElementById("quiz-pronunciation"),
    quizChoices: document.getElementById("quiz-choices"),
    quizFeedback: document.getElementById("quiz-feedback"),
    quizNext: document.getElementById("quiz-next"),
    quizResult: document.getElementById("quiz-result"),
    quizScore: document.getElementById("quiz-score"),
    quizResultMessage: document.getElementById("quiz-result-message"),
    quizReplay: document.getElementById("quiz-replay"),
    quizDone: document.getElementById("quiz-done")
  };

  let allCards = [];
  let activeCards = [];
  let currentIndex = 0;
  let flipped = false;
  let shuffledCards = [];
  let quizQuestions = [];
  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;
  const selectedLevels = new Set(Array.from({ length: 9 }, (_, index) => index + 1));

  function setupDecks() {
    const decks = [...new Set(allCards.map(card => card.deck || "Everyday Words"))].sort((a, b) => a.localeCompare(b));
    for (const deck of decks) {
      const option = document.createElement("option");
      option.value = deck;
      option.textContent = deck;
      els.deckSelect.appendChild(option);
    }
  }

  function setupLevels() {
    for (let level = 1; level <= 9; level++) {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = String(level);
      checkbox.checked = true;
      label.append(checkbox, `Level ${level}`);
      els.levelOptions.appendChild(label);
    }
  }

  function updateDeck() {
    const deck = els.deckSelect.value;
    const query = els.search.value.trim().toLocaleLowerCase();
    activeCards = shuffledCards.filter(card => {
      const inDeck = deck === "all" || (card.deck || "Everyday Words") === deck;
      const inLevel = selectedLevels.has(Number(card.level));
      const searchable = [card.gaelic, card.pronunciation, card.english, card.category, card.deck, card.note, ...(card.related || []).flatMap(item => typeof item === "string" ? [item] : [item.english, item.gaelic])].join(" ").toLocaleLowerCase();
      return inDeck && inLevel && searchable.includes(query);
    });
    els.levelSelection.textContent = selectedLevels.size === 9 ? "1-9" : [...selectedLevels].sort((a, b) => a - b).join(", ") || "None";
    const quizLength = Math.min(10, activeCards.length);
    els.quizStart.disabled = activeCards.length < 2;
    els.quizAvailability.textContent = activeCards.length < 2
      ? "Choose at least two matching words to play."
      : `${quizLength} question${quizLength === 1 ? "" : "s"} from your current words.`;
    currentIndex = 0;
    render();
  }

  function shuffled(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function startQuiz() {
    const uniqueCards = [...new Map(activeCards.map(card => [`${card.id ?? card.gaelic}:${card.english}`, card])).values()];
    quizQuestions = shuffled(uniqueCards).slice(0, 10).map(card => {
      const answerKey = String(card.english).trim().toLocaleLowerCase();
      const distractors = [...new Map(uniqueCards
        .filter(candidate => String(candidate.english).trim().toLocaleLowerCase() !== answerKey)
        .map(candidate => [String(candidate.english).trim().toLocaleLowerCase(), candidate.english])).values()];
      const choices = shuffled([card.english, ...shuffled(distractors).slice(0, 3)]);
      return { ...card, choices };
    });
    quizIndex = 0;
    quizScore = 0;
    quizAnswered = false;
    els.quizQuestionView.hidden = false;
    els.quizResult.hidden = true;
    if (!els.quizDialog.open) els.quizDialog.showModal();
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const question = quizQuestions[quizIndex];
    if (!question) return showQuizResult();

    quizAnswered = false;
    els.quizProgressLabel.textContent = `QUESTION ${quizIndex + 1} OF ${quizQuestions.length}`;
    els.quizProgressBar.style.width = `${((quizIndex + 1) / quizQuestions.length) * 100}%`;
    els.quizGaelic.textContent = question.gaelic;
    els.quizPronunciation.textContent = question.pronunciation ? `/${question.pronunciation}/` : "";
    els.quizChoices.replaceChildren();
    els.quizFeedback.textContent = "";
    els.quizFeedback.className = "quiz-feedback";
    els.quizNext.disabled = true;
    els.quizNext.textContent = quizIndex === quizQuestions.length - 1 ? "See my score" : "Lock it in";

    for (const choice of question.choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-choice";
      button.textContent = choice;
      button.addEventListener("click", () => answerQuiz(button, choice));
      els.quizChoices.appendChild(button);
    }
  }

  function answerQuiz(selectedButton, choice) {
    if (quizAnswered) return;
    quizAnswered = true;
    const question = quizQuestions[quizIndex];
    const isCorrect = choice === question.english;
    if (isCorrect) quizScore++;

    for (const button of els.quizChoices.querySelectorAll("button")) {
      button.disabled = true;
      if (button.textContent === question.english) button.classList.add("is-correct");
    }
    if (!isCorrect) selectedButton.classList.add("is-wrong");
    els.quizFeedback.textContent = isCorrect
      ? ["Glè mhath! Nailed it.", "Spot on! Keep that streak.", "Brilliant! That one’s yours."][Math.floor(Math.random() * 3)]
      : `Not quite. The answer is “${question.english}”.`;
    els.quizFeedback.classList.add(isCorrect ? "is-correct" : "is-wrong");
    els.quizNext.disabled = false;
  }

  function showQuizResult() {
    els.quizQuestionView.hidden = true;
    els.quizResult.hidden = false;
    els.quizScore.textContent = `${quizScore} / ${quizQuestions.length}`;
    els.quizResultMessage.textContent = quizScore === quizQuestions.length
      ? "Flawless round. You’re on fire!"
      : quizScore >= Math.ceil(quizQuestions.length * 0.7)
        ? "Mìorbhaileach! A strong round."
        : "Good warm-up. One more round?";
  }

  function flip(value = !flipped) {
    flipped = value;
    els.card.classList.toggle("is-flipped", flipped);
    els.card.setAttribute("aria-pressed", String(flipped));
  }

  function navigateToGaelic(word) {
    const normalizedWord = String(word).normalize("NFC").trim().toLocaleLowerCase();
    let targetIndex = activeCards.findIndex(card => String(card.gaelic).normalize("NFC").trim().toLocaleLowerCase() === normalizedWord);

    if (targetIndex < 0) {
      const target = allCards.find(card => String(card.gaelic).normalize("NFC").trim().toLocaleLowerCase() === normalizedWord);
      if (!target) return;

      els.deckSelect.value = "all";
      els.search.value = "";
      selectedLevels.add(Number(target.level));
      for (const checkbox of els.levelOptions.querySelectorAll("input")) {
        checkbox.checked = selectedLevels.has(Number(checkbox.value));
      }
      updateDeck();
      targetIndex = activeCards.findIndex(card => String(card.gaelic).normalize("NFC").trim().toLocaleLowerCase() === normalizedWord);
    }

    if (targetIndex < 0) return;
    currentIndex = targetIndex;
    render();
    flip(false);
  }

  function render() {
    const card = activeCards[currentIndex];
    const total = activeCards.length;
    const deck = els.deckSelect.value;
    els.deckName.textContent = deck === "all" ? "ALL WORDS" : deck.toLocaleUpperCase();
    els.cardCount.textContent = `${total} CARD${total === 1 ? "" : "S"}`;

    if (!card) {
      els.gaelic.textContent = "No matches";
      els.pronunciation.textContent = "";
      els.english.textContent = "Try another search";
      els.category.textContent = "Empty deck";
      els.related.textContent = "Clear the search or choose another deck.";
      els.note.textContent = "";
      els.progressLabel.textContent = "0 / 0";
      els.progressBar.style.width = "0%";
      els.previous.disabled = true;
      els.next.disabled = true;
      flip(true);
      return;
    }

    flip(false);
    els.gaelic.textContent = card.gaelic;
    els.pronunciation.textContent = card.pronunciation ? `/${card.pronunciation}/` : "";
    els.english.textContent = card.english;
    els.category.textContent = card.category || card.deck || "General";
    els.related.replaceChildren();
    for (const item of (card.related || [])) {
      const row = document.createElement("span");
      row.className = "related-item";
      if (typeof item === "string") {
        row.textContent = item;
      } else {
        const gaelic = document.createElement("strong");
        gaelic.className = "related-gaelic";
        gaelic.textContent = item.gaelic;
        row.dataset.gaelic = item.gaelic;
        row.title = `Open ${item.gaelic}`;
        const english = document.createElement("span");
        english.className = "related-english";
        english.textContent = item.english;
        row.append(gaelic, english);
      }
      els.related.appendChild(row);
    }
    if (!(card.related || []).length) els.related.textContent = "No related words added yet.";
    els.note.textContent = card.note || "";
    els.progressLabel.textContent = `${currentIndex + 1} / ${total}`;
    els.progressBar.style.width = `${((currentIndex + 1) / total) * 100}%`;
    els.previous.disabled = total < 2;
    els.next.disabled = total < 2;
  }

  function move(step) {
    if (!activeCards.length) return;
    currentIndex = (currentIndex + step + activeCards.length) % activeCards.length;
    render();
  }

  let swipeStart = null;
  let suppressCardClickUntil = 0;

  els.card.addEventListener("pointerdown", event => {
    if (event.pointerType !== "touch" || !event.isPrimary) return;
    swipeStart = { x: event.clientX, y: event.clientY };
  });
  els.card.addEventListener("pointerup", event => {
    if (!swipeStart) return;
    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    suppressCardClickUntil = Date.now() + 150;
    move(deltaX < 0 ? 1 : -1);
  });
  els.card.addEventListener("pointercancel", () => {
    swipeStart = null;
  });

  function shuffle() {
    for (let i = shuffledCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
    }
    updateDeck();
    els.status.textContent = "Deck shuffled.";
  }

  function resetOrder() {
    shuffledCards = [...allCards];
    els.search.value = "";
    els.deckSelect.value = "all";
    updateDeck();
    els.status.textContent = "Original order restored.";
  }

  els.card.addEventListener("click", event => {
    if (Date.now() < suppressCardClickUntil) {
      event.preventDefault();
      suppressCardClickUntil = 0;
      return;
    }
    flip();
  });
  els.related.addEventListener("click", event => {
    const row = event.target.closest(".related-item[data-gaelic]");
    if (!row) return;
    event.preventDefault();
    event.stopPropagation();
    navigateToGaelic(row.dataset.gaelic);
  });
  els.flip.addEventListener("click", () => flip());
  els.previous.addEventListener("click", () => move(-1));
  els.next.addEventListener("click", () => move(1));
  els.shuffle.addEventListener("click", shuffle);
  els.deckSelect.addEventListener("change", updateDeck);
  els.levelOptions.addEventListener("change", event => {
    const checkbox = event.target;
    if (checkbox.type !== "checkbox") return;
    const level = Number(checkbox.value);
    if (checkbox.checked) selectedLevels.add(level);
    else selectedLevels.delete(level);
    updateDeck();
  });
  els.search.addEventListener("input", updateDeck);
  els.clearSearch.addEventListener("click", () => {
    els.search.value = "";
    updateDeck();
    els.search.focus();
  });
  els.quizStart.addEventListener("click", startQuiz);
  els.quizClose.addEventListener("click", () => els.quizDialog.close());
  els.quizDone.addEventListener("click", () => els.quizDialog.close());
  els.quizReplay.addEventListener("click", startQuiz);
  els.quizNext.addEventListener("click", () => {
    if (!quizAnswered) return;
    quizIndex++;
    renderQuizQuestion();
  });

  document.addEventListener("keydown", event => {
    if (els.quizDialog.open) return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (event.key === "ArrowLeft") move(-1);
    else if (event.key === "ArrowRight") move(1);
    else if (event.code === "Space") {
      event.preventDefault();
      flip();
    }
  });

  fetch("./cards.json")
    .then(response => {
      if (!response.ok) throw new Error(`Could not load cards.json (${response.status})`);
      return response.json();
    })
    .then(cards => {
      allCards = cards;
      shuffledCards = [...allCards];
      setupDecks();
      setupLevels();
      updateDeck();
    })
    .catch(() => {
      els.gaelic.textContent = "Cards unavailable";
      els.english.textContent = "Could not load cards.json";
      els.category.textContent = "Load error";
      els.related.textContent = "Open this page through GitHub Pages or a local web server.";
      els.status.textContent = "Card data failed to load.";
    });
})();
