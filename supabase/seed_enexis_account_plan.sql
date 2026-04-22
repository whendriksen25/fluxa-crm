-- ============================================================
-- Seed Data for Enexis Account Plan
-- Plan ID: e2d616f9-5453-4ee4-9cc2-628fd7fbae3e
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- REVENUE FORECASTS (11 months)
-- ────────────────────────────────────────────────────────────

INSERT INTO account_revenue_forecasts (account_plan_id, month_label, month_index, pipeline_value, closed_value, activity_count)
VALUES
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Apr', 0, 3800000, 0, 8),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'May', 1, 4200000, 0, 6),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Jun', 2, 3400000, 1400000, 4),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Jul', 3, 3800000, 200000, 3),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Aug', 4, 4600000, 960000, 4),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Sep', 5, 4800000, 400000, 5),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Oct', 6, 5200000, 800000, 5),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Nov', 7, 4200000, 300000, 4),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Dec', 8, 3800000, 1800000, 3),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Jan', 9, 3200000, 600000, 4),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Feb', 10, 2800000, 200000, 3);


-- ────────────────────────────────────────────────────────────
-- REVENUE EVENTS (5 milestone markers)
-- ────────────────────────────────────────────────────────────

INSERT INTO account_revenue_events (account_plan_id, month_index, label, color)
VALUES
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 2, 'CTO Architecture Review', '#ef5757'),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 3, 'Budget Cycle H2', '#f5c048'),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 6, 'Q4 Budget', '#f5c048'),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 8, 'Contract Renewal', '#28d688'),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 9, 'NIS2 Deadline', '#ef5757');


-- ────────────────────────────────────────────────────────────
-- OPPORTUNITIES (5 open opportunities)
-- ────────────────────────────────────────────────────────────

INSERT INTO account_opportunities (account_plan_id, name, business_unit, value, decision_date, actions, win_probability, status, competitor_risk, risk_percentage)
VALUES
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Asset Management Platform', 'Grid Operations', 1400000, 'Q3 2025', '3 actions pending', 70, 'Negotiation', 'IBM Maximo', 20),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Grid Analytics Expansion', 'Data & Analytics', 1200000, 'Q4 2025', '2 actions pending', 60, 'Proposal', 'Siemens', 10),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Workforce Management', 'Field Operations', 960000, 'Q3 2025', '4 actions pending', 45, 'Discovery', 'SAP', 15),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Cybersecurity (NIS2)', 'IT & Security', 800000, 'Q2 2025', '1 action pending', 35, 'Discovery', 'IBM', 12),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Contract Renewal', 'Grid Operations', 1800000, 'Dec 2025', '1 action pending', 80, 'Renewal', NULL, 14);


-- ────────────────────────────────────────────────────────────
-- PIPELINE RISK (11 months)
-- ────────────────────────────────────────────────────────────

INSERT INTO account_pipeline_risk (account_plan_id, month_label, month_index, pipeline_value, at_risk_value, counter_actions, net_win_value)
VALUES
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Apr', 0, 3800000, 1000000, 7, 0),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'May', 1, 4200000, 1200000, 5, 0),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Jun', 2, 3400000, 700000, 3, 1400000),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Jul', 3, 3800000, 500000, 2, 200000),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Aug', 4, 4600000, 600000, 3, 960000),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Sep', 5, 4800000, 700000, 4, 400000),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Oct', 6, 5200000, 900000, 4, 800000),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Nov', 7, 4200000, 600000, 3, 300000),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Dec', 8, 3800000, 1000000, 3, 1800000),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Jan', 9, 3200000, 350000, 3, 600000),
  ('e2d616f9-5453-4ee4-9cc2-628fd7fbae3e', 'Feb', 10, 2800000, 250000, 2, 200000);
