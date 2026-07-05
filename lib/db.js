import fs from "node:fs";
import path from "node:path";
import envPaths from "env-paths";
import Database from "better-sqlite3";

const paths = envPaths("arkaive");
fs.mkdirSync(paths.data, { recursive: true });

const db = new Database(path.join(paths.data, "arkaive.db"));

db.exec(`
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY,
    path TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS file_tags (
    file_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY(file_id, tag_id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
    path,
    tags,
    content='',
    content_rowid='id'
);
`);

export default db;
