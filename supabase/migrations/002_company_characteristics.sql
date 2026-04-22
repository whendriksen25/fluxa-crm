-- ============================================================
-- Bridge CRM — Company Characteristics
-- Adds first-class columns for Cellpack prospect data:
-- category, country, region, segment, relevance, network_group
-- ============================================================

-- Category: the type of company (ETG, MV Installer, LV Installer, or custom)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS category TEXT;

-- Country the company operates in
ALTER TABLE companies ADD COLUMN IF NOT EXISTS country TEXT;

-- Region within the country (e.g. Vlaanderen, Limburg, Heel Nederland)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS region TEXT;

-- Segment describes what the company does (e.g. MV netaannemer + industrieel)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS segment TEXT;

-- Relevance to Cellpack (Zeer hoog, Hoog, Middel, Middel-hoog, Laag)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS relevance TEXT;

-- Network or group the company belongs to (e.g. Fedibel, GIBED, Fedet ETG)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS network_group TEXT;

-- Location details (HQ + branches)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS location TEXT;

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_companies_category ON companies(category);
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);
CREATE INDEX IF NOT EXISTS idx_companies_relevance ON companies(relevance);
