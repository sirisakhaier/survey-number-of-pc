-- Migration to add is_active and phone columns to existing DB tables
ALTER TABLE stores ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE brands ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE answer_choices ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE survey_header ADD COLUMN phone TEXT;
