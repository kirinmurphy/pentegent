import type Database from "better-sqlite3";

export function seed(db: Database.Database): void {
  const targetCount = db
    .prepare("SELECT COUNT(*) as count FROM targets")
    .get() as { count: number };

  if (targetCount.count === 0) {
    const insertTarget = db.prepare(
      "INSERT INTO targets (id, base_url, description) VALUES (?, ?, ?)",
    );
    insertTarget.run(
      "staging",
      "https://platform.codethings.net",
      "CodeThings platform",
    );
    insertTarget.run(
      "prod",
      "https://example.org",
      "Production environment — replace with real domain",
    );
    console.log("Seeded targets");
  }

  const profileCount = db
    .prepare("SELECT COUNT(*) as count FROM profiles")
    .get() as { count: number };

  if (profileCount.count === 0) {
    const insertProfile = db.prepare(
      "INSERT INTO profiles (id, name, description) VALUES (?, ?, ?)",
    );
    insertProfile.run(
      "headers",
      "HTTP Security Headers",
      "Checks HTTP security headers and grades them",
    );
    console.log("Seeded profiles");
  }
}
