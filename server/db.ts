import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "grantweave.db");

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL DEFAULT '',
    org_name TEXT NOT NULL DEFAULT '',
    org_type TEXT NOT NULL DEFAULT 'Nonprofit',
    country TEXT NOT NULL DEFAULT '',
    mission_statement TEXT DEFAULT '',
    focus_areas TEXT DEFAULT '[]',
    grant_size_min TEXT DEFAULT '50,000',
    grant_size_max TEXT DEFAULT '150,000',
    timeline TEXT DEFAULT 'Short Term (3-6 months)',
    regions TEXT DEFAULT '["United States"]',
    team_size TEXT DEFAULT '6-20 Employees',
    years_operating INTEGER DEFAULT 0,
    previous_grant_experience TEXT DEFAULT 'None',
    international_eligible INTEGER DEFAULT 1,
    has_onboarded INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS grants (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount TEXT NOT NULL,
    amount_num REAL NOT NULL DEFAULT 0,
    deadline TEXT NOT NULL DEFAULT '',
    portal TEXT NOT NULL DEFAULT '',
    source_url TEXT DEFAULT '',
    match_score INTEGER DEFAULT 50,
    description TEXT DEFAULT '',
    eligibility TEXT DEFAULT '[]',
    status TEXT DEFAULT 'available',
    user_id INTEGER,
    discovered_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    grant_id TEXT NOT NULL,
    sections TEXT DEFAULT '{"overview":false,"mission":false,"budget":false,"impact":false,"attachments":false}',
    form_data TEXT DEFAULT '{}',
    submitted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (grant_id) REFERENCES grants(id)
  );

  CREATE TABLE IF NOT EXISTS discovery_runs (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    portal TEXT NOT NULL DEFAULT '',
    status TEXT DEFAULT 'pending',
    goal TEXT DEFAULT '',
    tinyfish_run_id TEXT DEFAULT '',
    progress_log TEXT DEFAULT '[]',
    result_data TEXT DEFAULT '{}',
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

export default db;
