import * as SQLite from 'expo-sqlite';

export interface CardSet {
  id: number;
  name: string;
  description: string;
  preset_type: string | null;
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: number;
  set_id: number;
  front: string;
  back: string;
  created_at: string;
}

export interface SRSchedule {
  id: number;
  card_id: number;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

export interface StudyRecord {
  id: number;
  card_id: number;
  set_id: number;
  result: number;
  studied_at: string;
}

export interface StudyStats {
  total_cards: number;
  mastered_cards: number;
  learning_cards: number;
  new_cards: number;
  today_studied: number;
  streak: number;
  total_studied: number;
}

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('remember.db');
  await initDatabase(db);
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS card_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      preset_type TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      set_id INTEGER NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (set_id) REFERENCES card_sets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sr_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL UNIQUE,
      next_review_at TEXT DEFAULT (datetime('now')),
      interval_days INTEGER DEFAULT 1,
      ease_factor REAL DEFAULT 2.5,
      repetitions INTEGER DEFAULT 0,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      set_id INTEGER NOT NULL,
      result INTEGER NOT NULL,
      studied_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_cards_set_id ON cards(set_id);
    CREATE INDEX IF NOT EXISTS idx_sr_next_review ON sr_schedule(next_review_at);
    CREATE INDEX IF NOT EXISTS idx_study_records_studied_at ON study_records(studied_at);
  `);
}

// CardSet operations
export async function getCardSets(): Promise<CardSet[]> {
  const database = await getDatabase();
  return database.getAllAsync<CardSet>(`
    SELECT cs.*, COUNT(c.id) as card_count
    FROM card_sets cs
    LEFT JOIN cards c ON cs.id = c.set_id
    GROUP BY cs.id
    ORDER BY cs.updated_at DESC
  `);
}

export async function getCardSet(id: number): Promise<CardSet | null> {
  const database = await getDatabase();
  return database.getFirstAsync<CardSet>(`
    SELECT cs.*, COUNT(c.id) as card_count
    FROM card_sets cs
    LEFT JOIN cards c ON cs.id = c.set_id
    WHERE cs.id = ?
    GROUP BY cs.id
  `, [id]);
}

export async function createCardSet(name: string, description: string, presetType?: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO card_sets (name, description, preset_type) VALUES (?, ?, ?)',
    [name, description, presetType ?? null]
  );
  return result.lastInsertRowId;
}

export async function updateCardSet(id: number, name: string, description: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE card_sets SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?",
    [name, description, id]
  );
}

export async function deleteCardSet(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM card_sets WHERE id = ?', [id]);
}

// Card operations
export async function getCards(setId: number): Promise<Card[]> {
  const database = await getDatabase();
  return database.getAllAsync<Card>(
    'SELECT * FROM cards WHERE set_id = ? ORDER BY created_at ASC',
    [setId]
  );
}

export async function getCard(id: number): Promise<Card | null> {
  const database = await getDatabase();
  return database.getFirstAsync<Card>('SELECT * FROM cards WHERE id = ?', [id]);
}

export async function createCard(setId: number, front: string, back: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO cards (set_id, front, back) VALUES (?, ?, ?)',
    [setId, front, back]
  );
  const cardId = result.lastInsertRowId;
  await database.runAsync(
    'INSERT OR IGNORE INTO sr_schedule (card_id) VALUES (?)',
    [cardId]
  );
  await database.runAsync(
    "UPDATE card_sets SET updated_at = datetime('now') WHERE id = ?",
    [setId]
  );
  return cardId;
}

export async function updateCard(id: number, front: string, back: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE cards SET front = ?, back = ? WHERE id = ?',
    [front, back, id]
  );
}

export async function deleteCard(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM cards WHERE id = ?', [id]);
}

export async function bulkCreateCards(setId: number, items: Array<{ front: string; back: string }>): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    const cardStmt = await database.prepareAsync(
      'INSERT INTO cards (set_id, front, back) VALUES (?, ?, ?)'
    );
    const srStmt = await database.prepareAsync(
      'INSERT OR IGNORE INTO sr_schedule (card_id) VALUES (?)'
    );
    try {
      for (const item of items) {
        const result = await cardStmt.executeAsync([setId, item.front, item.back]);
        await srStmt.executeAsync([result.lastInsertRowId]);
      }
    } finally {
      await cardStmt.finalizeAsync();
      await srStmt.finalizeAsync();
    }
    await database.runAsync(
      "UPDATE card_sets SET updated_at = datetime('now') WHERE id = ?",
      [setId]
    );
  });
}

// SR Schedule operations
export async function getSRSchedule(cardId: number): Promise<SRSchedule | null> {
  const database = await getDatabase();
  return database.getFirstAsync<SRSchedule>(
    'SELECT * FROM sr_schedule WHERE card_id = ?',
    [cardId]
  );
}

export async function updateSRSchedule(
  cardId: number,
  nextReviewAt: string,
  intervalDays: number,
  easeFactor: number,
  repetitions: number
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO sr_schedule (card_id, next_review_at, interval_days, ease_factor, repetitions)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(card_id) DO UPDATE SET
       next_review_at = excluded.next_review_at,
       interval_days = excluded.interval_days,
       ease_factor = excluded.ease_factor,
       repetitions = excluded.repetitions`,
    [cardId, nextReviewAt, intervalDays, easeFactor, repetitions]
  );
}

export async function getDueCards(limit?: number): Promise<Array<Card & { set_name: string }>> {
  const database = await getDatabase();
  const limitClause = limit ? `LIMIT ${limit}` : '';
  return database.getAllAsync<Card & { set_name: string }>(`
    SELECT c.*, cs.name as set_name
    FROM cards c
    JOIN sr_schedule sr ON c.id = sr.card_id
    JOIN card_sets cs ON c.set_id = cs.id
    WHERE date(sr.next_review_at) <= date('now')
    ORDER BY sr.next_review_at ASC
    ${limitClause}
  `);
}

export async function getDueCardsForSet(setId: number): Promise<Card[]> {
  const database = await getDatabase();
  return database.getAllAsync<Card>(`
    SELECT c.*
    FROM cards c
    JOIN sr_schedule sr ON c.id = sr.card_id
    WHERE c.set_id = ? AND date(sr.next_review_at) <= date('now')
    ORDER BY sr.next_review_at ASC
  `, [setId]);
}

export async function getDueCardCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM sr_schedule
    WHERE date(next_review_at) <= date('now')
  `);
  return result?.count ?? 0;
}

// Study record operations
export async function recordStudy(cardId: number, setId: number, result: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO study_records (card_id, set_id, result) VALUES (?, ?, ?)',
    [cardId, setId, result]
  );
}

export async function getStudyStats(): Promise<StudyStats> {
  const database = await getDatabase();
  const totalCards = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cards');
  const masteredCards = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sr_schedule WHERE interval_days >= 30'
  );
  const learningCards = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT rec.card_id) as count
     FROM study_records rec
     JOIN sr_schedule sr ON rec.card_id = sr.card_id
     WHERE sr.interval_days < 30`
  );
  const todayStudied = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(DISTINCT card_id) as count FROM study_records WHERE date(studied_at) = date('now')"
  );
  const totalStudied = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM study_records'
  );

  const tc = totalCards?.count ?? 0;
  const mc = masteredCards?.count ?? 0;
  const lc = learningCards?.count ?? 0;
  const nc = tc - mc - lc;

  const streak = await calculateStreak(database);

  return {
    total_cards: tc,
    mastered_cards: mc,
    learning_cards: lc,
    new_cards: nc > 0 ? nc : 0,
    today_studied: todayStudied?.count ?? 0,
    streak,
    total_studied: totalStudied?.count ?? 0,
  };
}

async function calculateStreak(database: SQLite.SQLiteDatabase): Promise<number> {
  const rows = await database.getAllAsync<{ date: string }>(
    `SELECT DISTINCT date(studied_at) as date
     FROM study_records
     ORDER BY date DESC
     LIMIT 100`
  );

  if (rows.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let current = new Date(today);

  for (const row of rows) {
    const rowDate = new Date(row.date);
    rowDate.setHours(0, 0, 0, 0);
    const diff = (current.getTime() - rowDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 0 || diff === 1) {
      streak++;
      current = rowDate;
    } else {
      break;
    }
  }

  return streak;
}

export async function getWeeklyStats(): Promise<Array<{ date: string; count: number }>> {
  const database = await getDatabase();
  return database.getAllAsync<{ date: string; count: number }>(`
    SELECT date(studied_at) as date, COUNT(*) as count
    FROM study_records
    WHERE studied_at >= datetime('now', '-7 days')
    GROUP BY date(studied_at)
    ORDER BY date ASC
  `);
}

export async function getSetStats(setId: number): Promise<{ correct: number; total: number }> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ correct: number; total: number }>(`
    SELECT
      SUM(CASE WHEN result >= 2 THEN 1 ELSE 0 END) as correct,
      COUNT(*) as total
    FROM study_records
    WHERE set_id = ?
  `, [setId]);
  return result ?? { correct: 0, total: 0 };
}

export async function getWrongCards(setId?: number): Promise<Array<Card & { wrong_count: number; set_name: string }>> {
  const database = await getDatabase();
  const whereClause = setId ? 'AND c.set_id = ?' : '';
  const params: number[] = setId ? [setId] : [];
  return database.getAllAsync<Card & { wrong_count: number; set_name: string }>(`
    SELECT c.*, COUNT(*) as wrong_count, cs.name as set_name
    FROM study_records sr
    JOIN cards c ON sr.card_id = c.id
    JOIN card_sets cs ON c.set_id = cs.id
    WHERE sr.result = 0 ${whereClause}
    GROUP BY sr.card_id
    ORDER BY wrong_count DESC
    LIMIT 50
  `, params);
}
