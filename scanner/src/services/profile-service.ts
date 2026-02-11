import type Database from "better-sqlite3";

export interface Profile {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export function getProfile(
  db: Database.Database,
  profileId: string,
): Profile | undefined {
  return db.prepare("SELECT * FROM profiles WHERE id = ?").get(profileId) as
    | Profile
    | undefined;
}

export function listProfiles(db: Database.Database): Profile[] {
  return db.prepare("SELECT * FROM profiles ORDER BY id").all() as Profile[];
}
