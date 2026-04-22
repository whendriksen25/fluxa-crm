-- ============================================================
-- Bridge CRM — Lead Source (free-text)
-- Descriptive origin of the contact, e.g. "Webscrape jan 2026"
-- ============================================================

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_source TEXT;

-- Set all existing imported contacts to "Webscrape jan 2026"
UPDATE contacts SET lead_source = 'Webscrape jan 2026' WHERE source = 'import';

CREATE INDEX IF NOT EXISTS idx_contacts_lead_source ON contacts(lead_source);
