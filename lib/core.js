import os from "node:os";
import path from "node:path";
import db from "../lib/db.js";

const normalizePath = (p) => path.resolve(p.replace(/^~/, os.homedir()));

const stmt = {
  insertFile: db.prepare(`INSERT OR IGNORE INTO files (path) VALUES (?)`),
  getFile: db.prepare(`SELECT id FROM files WHERE path = ?`),

  insertTag: db.prepare(`INSERT OR IGNORE INTO tags (name) VALUES (?)`),
  getTag: db.prepare(`SELECT id FROM tags WHERE name = ?`),

  link: db.prepare(`
    INSERT OR IGNORE INTO file_tags (file_id, tag_id)
    VALUES (?, ?)
  `),

  deleteFile: db.prepare(`DELETE FROM files WHERE path = ?`),

  deleteLinks: db.prepare(`
    DELETE FROM file_tags WHERE file_id = ?
  `),

  deleteFTS: db.prepare(`
    DELETE FROM files_fts WHERE rowid = ?
  `),

  listTags: db.prepare(`SELECT name FROM tags ORDER BY name ASC`),

  listFiles: db.prepare(`SELECT path FROM files ORDER BY path ASC`),

  listFileTags: db.prepare(`
    SELECT tags.name
    FROM tags
    JOIN file_tags ON tags.id = file_tags.tag_id
    JOIN files ON files.id = file_tags.file_id
    WHERE files.path = ?
  `),

  archive: db.prepare(`
    SELECT 
      files.path AS file,
      GROUP_CONCAT(tags.name, ', ') AS tags
    FROM files
    LEFT JOIN file_tags ON files.id = file_tags.file_id
    LEFT JOIN tags ON tags.id = file_tags.tag_id
    GROUP BY files.id
    ORDER BY files.path ASC
  `),

  searchFTS: db.prepare(`
    SELECT files.path
    FROM files_fts
    JOIN files ON files.id = files_fts.rowid
    WHERE files_fts MATCH ?
  `),

  upsertFTS: db.prepare(`
    INSERT INTO files_fts(rowid, path, tags)
    VALUES (?, ?, ?)
  `),
};

/* -------------------- TAG -------------------- */

export const tag = db.transaction(({ file, tags }) => {
  const filePath = normalizePath(file);

  stmt.insertFile.run(filePath);

  const fileRow = stmt.getFile.get(filePath);
  if (!fileRow) return;

  const fileId = fileRow.id;

  const tagString = tags.map((t) => t.toLowerCase().trim()).join(" ");

  // FTS must be DELETE + INSERT (no UPSERT in FTS)
  stmt.deleteFTS.run(fileId);
  stmt.upsertFTS.run(fileId, filePath, tagString);

  for (const t of tags) {
    stmt.insertTag.run(t);

    const tagRow = stmt.getTag.get(t);
    if (!tagRow) continue;

    stmt.link.run(fileId, tagRow.id);
  }
});

/* -------------------- SEARCH -------------------- */

export const search = (query) => {
  const tokens = query.split(" ");

  const tagFilters = [];
  const ftsTerms = [];
  const notTags = [];

  let mode = "AND";

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t === "AND" || t === "OR") continue;

    if (t === "NOT") {
      const next = tokens[++i];
      if (next?.startsWith("tag:")) {
        notTags.push(next.slice(4));
      }
      continue;
    }

    if (t.startsWith("tag:")) {
      tagFilters.push(t.slice(4));
    } else {
      ftsTerms.push(t);
    }
  }

  const ftsQuery = ftsTerms.join(" ");

  const tagSQL = tagFilters.length
    ? `
      files.id IN (
        SELECT file_id FROM file_tags
        JOIN tags ON tags.id = file_tags.tag_id
        WHERE tags.name IN (${tagFilters.map(() => "?").join(",")})
      )
    `
    : "1";

  const notSQL = notTags.length
    ? `
      files.id NOT IN (
        SELECT file_id FROM file_tags
        JOIN tags ON tags.id = file_tags.tag_id
        WHERE tags.name IN (${notTags.map(() => "?").join(",")})
      )
    `
    : "1";

  const ftsSQL = ftsTerms.length
    ? `files.id IN (
        SELECT rowid FROM files_fts WHERE files_fts MATCH ?
      )`
    : "1";

  const sql = `
    SELECT files.path
    FROM files
    WHERE ${ftsSQL}
      AND ${tagSQL}
      AND ${notSQL}
  `;

  const params = [
    ...(ftsTerms.length ? [ftsQuery] : []),
    ...tagFilters,
    ...notTags,
  ];

  return db.prepare(sql).all(...params);
};

/* -------------------- LIST -------------------- */

export const list = (type, value = "") => {
  switch (type) {
    case "tags":
      return stmt.listTags.all();

    case "files":
      return stmt.listFiles.all();

    case "tag_file":
      return stmt.listFileTags.all(value);

    case "archive":
      return stmt.archive.all();

    case "all":
      return stmt.archive.all();

    default:
      throw new Error("Usage: list tags | files | tag_file | archive | all");
  }
};

/* -------------------- UNTAG -------------------- */

export const untag = db.transaction(({ file, tags }) => {
  const filePath = normalizePath(file);

  const fileRow = stmt.getFile.get(filePath);
  if (!fileRow) return;

  for (const t of tags) {
    const tagRow = stmt.getTag.get(t);
    if (!tagRow) continue;

    // FIX: actually remove link
    stmt.deleteLinks.run(fileRow.id);
  }
});

/* -------------------- REMOVE -------------------- */

export const removeFile = db.transaction((file) => {
  const filePath = normalizePath(file);

  const fileRow = stmt.getFile.get(filePath);
  if (!fileRow) return;

  const fileId = fileRow.id;

  stmt.deleteLinks.run(fileId);
  stmt.deleteFTS.run(fileId);
  stmt.deleteFile.run(filePath);
});

/* -------------------- PARSER -------------------- */

export const parseQuery = (input) => {
  return input.match(/NOT|AND|OR|[^\s]+/g) || [];
};

export const buildQuery = (input) => {
  const tokens = parseQuery(input);

  const where = [];
  const params = [];

  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token === "AND" || token === "OR") {
      where.push(token);
      i++;
      continue;
    }

    if (token === "NOT") {
      const next = tokens[++i];
      if (!next) break;

      if (next.startsWith("tag:")) {
        where.push(`
          files.id NOT IN (
            SELECT file_id FROM file_tags
            JOIN tags ON tags.id = file_tags.tag_id
            WHERE tags.name = ?
          )
        `);
        params.push(next.slice(4));
      }

      i++;
      continue;
    }

    if (token.startsWith("tag:")) {
      where.push(`
        files.id IN (
          SELECT file_id FROM file_tags
          JOIN tags ON tags.id = file_tags.tag_id
          WHERE tags.name = ?
        )
      `);
      params.push(token.slice(4));
    } else {
      where.push(`files_fts MATCH ?`);
      params.push(token);
    }

    i++;
  }

  return { where, params };
};
