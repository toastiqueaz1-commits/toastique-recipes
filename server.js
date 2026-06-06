/**
 * Toastique Recipe Book – Server
 *
 * Setup:
 *   npm install
 *   node server.js
 *
 * Then open http://localhost:3000 in your browser.
 *
 * On first run, if recipes.json does not exist, the server seeds it
 * from the data embedded in index.html (localStorage fallback).
 * To seed manually, copy your exported JSON to recipes.json.
 */

const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app      = express();
const PORT     = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'recipes.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));  // serves index.html, any assets

// ─── Helper ─────────────────────────────────────────────────────────────────

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return null; }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ─── API ────────────────────────────────────────────────────────────────────

// GET all data (recipes + groups)
app.get('/api/data', (req, res) => {
  const data = loadData();
  if (!data) return res.status(404).json({ error: 'No data file yet. Export from the browser to seed it.' });
  res.json(data);
});

// POST – save entire dataset (used by browser on export/sync)
app.post('/api/data', (req, res) => {
  const { recipes, groups } = req.body;
  if (!Array.isArray(recipes)) return res.status(400).json({ error: 'Invalid payload' });
  saveData({ recipes, groups: groups || [] });
  res.json({ ok: true, count: recipes.length });
});

// POST – add single recipe
app.post('/api/recipes', (req, res) => {
  const data = loadData() || { recipes: [], groups: [] };
  const recipe = { ...req.body, id: req.body.id || String(Date.now()) };
  data.recipes.push(recipe);
  saveData(data);
  res.status(201).json(recipe);
});

// PUT – update single recipe
app.put('/api/recipes/:id', (req, res) => {
  const data = loadData();
  if (!data) return res.status(404).json({ error: 'No data' });
  const idx = data.recipes.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Recipe not found' });
  data.recipes[idx] = { ...data.recipes[idx], ...req.body, id: req.params.id };
  saveData(data);
  res.json(data.recipes[idx]);
});

// DELETE – remove single recipe
app.delete('/api/recipes/:id', (req, res) => {
  const data = loadData();
  if (!data) return res.status(404).json({ error: 'No data' });
  data.recipes = data.recipes.filter(r => r.id !== req.params.id);
  data.groups.forEach(g => { g.recipeIds = g.recipeIds.filter(id => id !== req.params.id); });
  saveData(data);
  res.json({ ok: true });
});

// POST – add group
app.post('/api/groups', (req, res) => {
  const data = loadData() || { recipes: [], groups: [] };
  const group = { ...req.body, id: req.body.id || String(Date.now()) };
  data.groups.push(group);
  saveData(data);
  res.status(201).json(group);
});

// PUT – update group
app.put('/api/groups/:id', (req, res) => {
  const data = loadData();
  if (!data) return res.status(404).json({ error: 'No data' });
  const idx = data.groups.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });
  data.groups[idx] = { ...data.groups[idx], ...req.body, id: req.params.id };
  saveData(data);
  res.json(data.groups[idx]);
});

// DELETE – remove group
app.delete('/api/groups/:id', (req, res) => {
  const data = loadData();
  if (!data) return res.status(404).json({ error: 'No data' });
  data.groups = data.groups.filter(g => g.id !== req.params.id);
  saveData(data);
  res.json({ ok: true });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🌿 Toastique Recipe Book`);
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`   Data:   ${DATA_FILE}`);
  if (!fs.existsSync(DATA_FILE)) {
    console.log(`\n   ⚠️  No recipes.json found.`);
    console.log(`   Open the site, click "Export Recipes", then upload the file as recipes.json.`);
  }
  console.log('');
});
