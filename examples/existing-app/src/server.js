import express from "express";
import { load, save } from "./store.js";

const app = express();
app.use(express.json());
app.use(express.static(new URL("../public", import.meta.url).pathname));

app.get("/notes", (req, res) => {
  const tag = req.query.tag;
  const notes = load();
  res.json(tag ? notes.filter((n) => (n.tags || []).includes(tag)) : notes);
});

app.post("/notes", (req, res) => {
  const notes = load();
  const note = { id: Date.now(), text: String(req.body.text || ""), tags: req.body.tags || [] };
  notes.push(note);
  save(notes);
  res.status(201).json(note);
});

app.delete("/notes/:id", (req, res) => {
  save(load().filter((n) => n.id !== Number(req.params.id)));
  res.status(204).end();
});

app.listen(3000);
