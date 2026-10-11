/* Add or edit vocabulary in cards.json. This site works on GitHub Pages.
   The card data is embedded in index.html at build/edit time so no fetch/server is needed. */
(() => {
  "use strict";

  const els = {
    card: document.getElementById("flashcard"),
    gaelic: document.getElementById("card-gaelic"),
    english: document.getElementById("card-english"),
    category: document.getElementById("card-category"),
    related: document.getElementById("card-related"),
    note: document.getElementById("card-note"),
    deckSelect: document.getElementById("deck-select"),
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
    status: document.getElementById("status")
  };

  // This JSON block is generated into index.html. Edit it there to add cards,
  // or edit cards.json and copy its contents into the block named card-data.
  const allCards = JSON.parse(document.getElementById("card-data").textContent);
  let activeCards = [...allCards];
  let currentIndex = 0;
  let flipped = false;
  let shuffledCards = [...allCards];

  function setupDecks() {
    const decks = [...new Set(allCards.map(card => card.deck || "Everyday Words"))].sort((a, b) => a.localeCompare(b));
    for (const deck of decks) {
      const option = document.createElement("option");
      option.value = deck;
      option.textContent = deck;
      els.deckSelect.appendChild(option);
    }
  }

  function updateDeck() {
    const deck = els.deckSelect.value;
    const query = els.search.value.trim().toLocaleLowerCase();
    activeCards = shuffledCards.filter(card => {
      const inDeck = deck === "all" || (card.deck || "Everyday Words") === deck;
      const searchable = [card.gaelic, card.english, card.category, card.deck, card.note, ...(card.related || []).flatMap(item => typeof item === "string" ? [item] : [item.english, item.gaelic])].join(" ").toLocaleLowerCase();
      return inDeck && searchable.includes(query);
    });
    currentIndex = 0;
    render();
  }

  function flip(value = !flipped) {
    flipped = value;
    els.card.classList.toggle("is-flipped", flipped);
    els.card.setAttribute("aria-pressed", String(flipped));
  }

  function render() {
    const card = activeCards[currentIndex];
    const total = activeCards.length;
    const deck = els.deckSelect.value;
    els.deckName.textContent = deck === "all" ? "ALL WORDS" : deck.toLocaleUpperCase();
    els.cardCount.textContent = `${total} CARD${total === 1 ? "" : "S"}`;

    if (!card) {
      els.gaelic.textContent = "No matches";
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
  let suppressCardClick = false;

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
    suppressCardClick = true;
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
    if (suppressCardClick) {
      event.preventDefault();
      suppressCardClick = false;
      return;
    }
    flip();
  });
  els.flip.addEventListener("click", () => flip());
  els.previous.addEventListener("click", () => move(-1));
  els.next.addEventListener("click", () => move(1));
  els.shuffle.addEventListener("click", shuffle);
  els.deckSelect.addEventListener("change", updateDeck);
  els.search.addEventListener("input", updateDeck);
  els.clearSearch.addEventListener("click", () => {
    els.search.value = "";
    updateDeck();
    els.search.focus();
  });

  document.addEventListener("keydown", event => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (event.key === "ArrowLeft") move(-1);
    else if (event.key === "ArrowRight") move(1);
    else if (event.code === "Space") {
      event.preventDefault();
      flip();
    }
  });

  setupDecks();
  updateDeck();
})();
