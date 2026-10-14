Scottish Gaelic Neon Flashcards

Files:
- index.html: page structure (load it through GitHub Pages or a local web server)
- styles.css: desktop / general neon styling
- phone.css: dedicated small-screen phone layout
- script.js: flipping, searching, filtering, navigation, shuffle
- cards.json: card data loaded by the page at runtime

Related words:
Each related word now has both a Gaelic counterpart and its English association, for example:
  {"english": "summit", "gaelic": "mullach"}
Some Gaelic equivalents are approximate or context-dependent; Scottish Gaelic often changes wording with grammar and phrase context.

Add a card:
1. Add an object to cards.json with gaelic, pronunciation, english, category, related, note, deck, id, and level (1-9).
2. Each related entry should be an object with both "english" and "gaelic" fields.
3. Commit both the updated page and cards.json; GitHub Pages serves the JSON alongside the page.

Run locally (optional):
  python3 -m http.server 8000
Then open http://localhost:8000 and stop the server with Ctrl+C. Opening index.html directly with file:// will not load cards.json.
