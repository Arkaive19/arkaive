import os from "node:os";
import path from "node:path";
import db from "../lib/db.js";

export const tag = async ({ file, tags }) => {
  const normalizePath = (p) => path.resolve(p.replace(/^~/, os.homedir()));
  file = normalizePath(file);
  const insertFile = db.prepare(`
    INSERT OR IGNORE INTO files (path) VALUES (?)
  `);
  const getFile = db.prepare(`
    SELECT id FROM files WHERE path = ?
  `);

  const insertTag = db.prepare(`
    INSERT OR IGNORE INTO tags (name) VALUES (?)
  `);

  const getTag = db.prepare(`
    SELECT id FROM tags WHERE name = ?
  `);
  const link = db.prepare(`
    INSERT OR IGNORE INTO file_tags (file_id, tag_id)
    VALUES (?, ?)
  `);
  insertFile.run(file);
  const fileId = getFile.get(file).id;

  for (const tag of tags) {
    insertTag.run(tag);
    const tagId = getTag.get(tag).id;
    link.run(fileId, tagId);
  }
};

export const search = (query) => {
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  const queries = query.split(",").map((q) => `%${normalize(q)}%`);

  const conditions = queries
    .map(() => `LOWER(files.path) LIKE ? OR LOWER(tags.name) LIKE ?`)
    .join(" OR ");

  const params = queries.flatMap((q) => [q, q]);

  return db
    .prepare(
      `
    SELECT DISTINCT files.path
    FROM files
    LEFT JOIN file_tags ON files.id = file_tags.file_id
    LEFT JOIN tags ON tags.id = file_tags.tag_id
    WHERE ${conditions}
  `,
    )
    .all(...params);
};

export const list = (type, value) => {
  if (type === "tags") {
    return db
      .prepare(
        `
      SELECT name FROM tags
      ORDER BY name ASC
    `,
      )
      .all();
  }

  if (type === "files") {
    return db
      .prepare(
        `
      SELECT path FROM files
      ORDER BY path ASC
    `,
      )
      .all();
  }
  if (type === "tag_file") {
    return db
      .prepare(
        `
      SELECT tags.name
      FROM tags
      JOIN file_tags ON tags.id = file_tags.tag_id
      JOIN files ON files.id = file_tags.file_id
      WHERE files.path = ?
    `,
      )
      .all(value);
  }
  if (type === "archive") {
    return db
      .prepare(
        `
    SELECT 
      files.path AS file,
      GROUP_CONCAT(tags.name, ', ') AS tags
    FROM files
    LEFT JOIN file_tags ON files.id = file_tags.file_id
    LEFT JOIN tags ON tags.id = file_tags.tag_id
    GROUP BY files.id
    ORDER BY files.path ASC
  `,
      )
      .all();
  }

  throw new Error("Usage: list 'tags' | 'files'");
};

export const untag = ({ file, tags }) => {
  const normalizePath = (p) => path.resolve(p.replace(/^~/, os.homedir()));

  file = normalizePath(file);

  const getFile = db.prepare(`SELECT id FROM files WHERE path = ?`);
  const getTag = db.prepare(`SELECT id FROM tags WHERE name = ?`);

  const remove = db.prepare(`
    DELETE FROM file_tags
    WHERE file_id = ? AND tag_id = ?
  `);

  const fileRow = getFile.get(file);
  if (!fileRow) return;

  const fileId = fileRow.id;

  for (const tag of tags) {
    const tagRow = getTag.get(tag);
    if (!tagRow) continue;

    remove.run(fileId, tagRow.id);
  }
};

export const removeFile = (file) => {
  db.prepare(`DELETE FROM files WHERE path = ?`).run(file);
};
