import "dotenv/config";
import mysql from "mysql2/promise";
import { CATALOG } from "../shared/content.ts";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the catalog.");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const statement = `
  INSERT INTO catalog_courses
    (slug, type, title, tagline, description, duration, difficulty, domainsJson, status, requiredTier, contentJson, published, sortOrder)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, ?)
  ON DUPLICATE KEY UPDATE
    type = VALUES(type),
    title = VALUES(title),
    tagline = VALUES(tagline),
    description = VALUES(description),
    duration = VALUES(duration),
    difficulty = VALUES(difficulty),
    domainsJson = VALUES(domainsJson),
    status = VALUES(status),
    requiredTier = VALUES(requiredTier),
    contentJson = VALUES(contentJson),
    published = true,
    sortOrder = VALUES(sortOrder)
`;

try {
  for (const [index, course] of CATALOG.entries()) {
    await connection.execute(statement, [
      course.slug,
      course.type,
      course.title,
      course.tagline,
      course.description,
      course.duration,
      course.difficulty,
      JSON.stringify(course.domains),
      course.status,
      course.requiredTier,
      JSON.stringify(course),
      index + 1,
    ]);
  }
  console.log(`Seeded ${CATALOG.length} Project Polaris catalog entries.`);
} finally {
  await connection.end();
}
