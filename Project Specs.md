# Bridge CRM — Project Specs

## 1 — Product summary
Bridge CRM is a SaaS CRM that acts as a bridge between HubSpot, Salesforce and enterprise systems. Core goals:
- Full contact / company / deal / activity CRM (parity with HubSpot/Salesforce).
- Bi-directional import/export with HubSpot & Salesforce (CSV and API/OAuth sync).
- Connectors for ERP systems and generic databases.
- Lead ingestion from forms, scrapers, email parsing and uploaded files (images, HEIC, PDF).
- Business-card scan + OCR + fuzzy-merge against existing records.
- Flexible Kanban funnel (Trello-like) with free card moves between stages.
- Email & calendar sync with Outlook (Exchange OAuth/IMAP) and later other providers.
- Marketing automation (email sequences, segmentation, templates).
- Web scraping with user-adaptable scrape profiles to populate leads.
- Enterprise-grade security, RLS, and multi-tenant behavior.

## 2 — Roles & personas
- Super Admin (enterprise): manage tenants, connectors, billing, audit logs.  
- Tenant Admin: configure integrations, users, fields, scrape profiles, kanban stages.  
- Sales Rep: manage leads, drag/drop cards, log activity, email/calendar sync.  
- Marketing Manager: build segments, run campaigns, view analytics.  
- Integration Engineer: configure ERP mappings, scraping rules.

## 3 — User stories (high level)
- Import and keep contacts in sync with HubSpot/Salesforce.  
- Configure a Kanban board with custom stages and freely drag cards.  
- Scan a business card (jpg, heic, pdf) and get a suggested or merged contact.  
- Map ERP fields to Bridge CRM entities and schedule syncs.  
- Provision OAuth connectors and API tokens.

## 4 — Core data model (abbreviated)
- User { id, email, name, role, tenant_id, settings, oauth_tokens_encrypted }  
- Tenant { id, name, billing_plan, settings }  
- Company { id, tenant_id, name, website, custom_fields }  
- Contact { id, tenant_id, first_name, last_name, emails[], phones[], company_id, lead_score, source, notes }  
- Deal { id, tenant_id, title, company_id, contact_id, value, stage, probability, close_date }  
- Activity { id, tenant_id, type, description, contact_id, deal_id, timestamp }  
- EmailRecord { id, message_id, thread_id, from, to, subject, snippet, synced_at }  
- CalendarEvent { id, provider_event_id, start, end, attendees, synced_at }  
- ImportJob { id, tenant_id, source, status, mapping, errors }  
- ScrapeProfile { id, tenant_id, name, selectors, schedule, last_run }  
- ScanDocument { id, tenant_id, file_url, ocr_text, matched_contact_id, confidence }  
- IntegrationConnector { id, tenant_id, type, config_encrypted, status }

Storage:
- Postgres (Supabase) for relational data.  
- Supabase Storage for uploaded files (signed URLs).  
- OCR via managed provider (AWS Textract / Google Vision) with Tesseract fallback.

## 5 — API routes (examples)
- /api/auth/* (Supabase wrappers)  
- /api/contacts (GET/POST/PUT/DELETE, bulk import)  
- /api/companies  
- /api/deals  
- /api/activities  
- /api/imports (start import, mapping preview)  
- /api/export (CSV / HubSpot / Salesforce mappings)  
- /api/integrations/hubspot/oauth  
- /api/integrations/salesforce/oauth  
- /api/integrations/outlook/oauth  
- /api/scraper/profiles  
- /api/scraper/run  
- /api/ocr/scan (accept images, HEIC, PDF; returns extracted fields and match suggestions)  
- /api/kanban/boards, /api/kanban/cards (drag/drop operations)  
- /api/billing (Stripe webhooks, plan management)

Note: All routes are thin and call services in /lib/services per development rules.

## 6 — Tech decisions & rationale
- Frontend: Next.js 14 (App Router) with server components where appropriate.  
- UI: shadcn/ui + Tailwind CSS for consistent, accessible dark-themed UI.  
- DB & Auth: Supabase (Postgres, Auth, Storage). Use RLS and server-side Supabase client for sensitive ops.  
- OCR: Managed provider (Textract / Vision) for accuracy; Tesseract fallback for on-premise.  
- Kanban DnD: dnd-kit for accessible drag/drop.  
- Background jobs: worker queue (Supabase Edge Functions or external worker like BullMQ) for OCR, scraping, and ETL.  
- Billing: Stripe subscriptions + metered billing for OCR/scrape overages.  
- Deployment: Vercel for Next.js; workers on suitable platform if needed.  
- Security: RLS per tenant, encrypted tokens, audit logs.

## 7 — Pricing & feature matrix
Free — $0/mo
- 1 user
- 500 contacts
- CSV import/export
- Basic Kanban (1 board, 3 stages)
- Manual HubSpot/Salesforce CSV export/import
- Basic email templates
- Community support

Pro — $49/mo
- Up to 5 users
- 25,000 contacts
- Unlimited boards & custom stages
- Bi-directional sync with HubSpot & Salesforce (hourly)
- Outlook email & calendar sync (per-user)
- Business card scanning (50 scans/mo) + OCR
- Web scraping: 100 pages/mo with configurable profiles
- Marketing sequences and segmentation
- Priority support

Enterprise — Custom
- SSO (SAML/SCIM)
- Unlimited users & contacts
- Dedicated connectors & custom mappings
- Real-time bi-directional sync + conflict resolution
- ERP connector support & onboarding
- SLA, dedicated instance option
- Advanced audit/compliance, on-premise OCR if required

Billing notes:
- Overage billing for OCR scans, scraping pages, and high-volume API usage.  
- 14-day Pro trial recommended.

## 8 — Non-functional requirements
- Multi-tenant isolation and RLS.  
- GDPR compliance and data export.  
- Observability: structured logs and metrics.  
- Rate-limiting and polite scraping.  
- Signed URLs for file access.

## 9 — MVP (first release)
- CRUD for Contacts, Companies, Deals.  
- CSV import/export and mapping UI.  
- Kanban board with drag/drop and stage customization.  
- Business card upload + OCR endpoint + match suggestions.  
- Outlook OAuth for email/calendar sync (single-user tested).  
- Stripe billing with Free and Pro plans.  
- Manual scraper profile runner.

## 10 — Risks & open decisions
- Choose OCR provider (cost vs accuracy).  
- Two-way sync semantics and conflict resolution strategy.  
- Scraping legal/ethical policy and rate limits per tenant.  
- Enterprise deployment model (single-tenant vs multi-tenant with isolation).

## 11 — Next repo structure (recommended)
/app
  /(auth)
  /dashboard
    /boards
      board/[id]/page.tsx
  /contacts
  /companies
  /deals
  /integrations
    /hubspot
    /salesforce
    /outlook
  /billing
/components
  /ui
  KanbanBoard.tsx
  ContactCard.tsx
/lib
  /supabase
    client.ts
    serverClient.ts
  /integrations
    hubspot.ts
    salesforce.ts
    outlook.ts
  /ocr
    ocrWorker.ts
  /scraper
    runner.ts
/supabase
  migrations/
/public
/tests
README.md
project_specs.md

---
