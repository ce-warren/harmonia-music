import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Database from "better-sqlite3";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database
const db = new Database("tags.db");

// Create table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS folder_tags (
    folderId TEXT PRIMARY KEY,
    tags TEXT
  )
`).run();

// Helper: get tags array for a folder
const getTags = (folderId) => {
  const row = db.prepare("SELECT tags FROM folder_tags WHERE folderId = ?").get(folderId);
  return row ? JSON.parse(row.tags) : [];
};

// Get tags for a folder
app.get("/tags/:folderId", (req, res) => {
  const tags = getTags(req.params.folderId);
  res.json({ tags });
});

// Update tags for a folder
app.post("/tags/:folderId", (req, res) => {
  const folderId = req.params.folderId;
  const tags = req.body.tags || [];
  const exists = db.prepare("SELECT 1 FROM folder_tags WHERE folderId = ?").get(folderId);

  if (exists) {
    db.prepare("UPDATE folder_tags SET tags = ? WHERE folderId = ?")
      .run(JSON.stringify(tags), folderId);
  } else {
    db.prepare("INSERT INTO folder_tags (folderId, tags) VALUES (?, ?)")
      .run(folderId, JSON.stringify(tags));
  }

  res.json({ success: true, tags });
});

app.listen(4000, () => console.log("Server running on port 4000"));
