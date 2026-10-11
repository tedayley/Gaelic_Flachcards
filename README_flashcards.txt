Scottish Gaelic Neon Flashcards

Files:
- index.html: page structure and embedded card data (works on GitHub Pages and by opening directly)
- styles.css: desktop / general neon styling
- phone.css: dedicated small-screen phone layout
- script.js: flipping, searching, filtering, navigation, shuffle
- cards.json: editable master card data

Related words:
Each related word now has both a Gaelic counterpart and its English association, for example:
  {"english": "summit", "gaelic": "mullach"}
Some Gaelic equivalents are approximate or context-dependent; Scottish Gaelic often changes wording with grammar and phrase context.

Add a card:
1. Add an object to cards.json with gaelic, english, category, related, note, deck, and id.
2. Each related entry should be an object with both "english" and "gaelic" fields.
3. Copy the updated JSON array into the <script id="card-data" type="application/json"> block in index.html. The site embeds the data so it works without a server and on GitHub Pages.

Run locally (optional):
  python3 -m http.server 8000
Then open http://localhost:8000 and stop the server with Ctrl+C.
