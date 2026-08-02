-- Database Schema for Survey Application
CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region TEXT NOT NULL,
    mall TEXT NOT NULL,
    province TEXT NOT NULL,
    store_name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS answer_choices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS survey_header (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL UNIQUE,
    last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
    user TEXT DEFAULT 'user',
    phone TEXT,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS survey_detail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id INTEGER NOT NULL,
    brand_id INTEGER NOT NULL,
    answer_choice_id INTEGER NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    UNIQUE(survey_id, brand_id, answer_choice_id),
    FOREIGN KEY (survey_id) REFERENCES survey_header(id) ON DELETE CASCADE,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_choice_id) REFERENCES answer_choices(id) ON DELETE CASCADE
);
