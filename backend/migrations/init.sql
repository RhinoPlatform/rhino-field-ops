CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin','Dispatcher','Technician')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  asset_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  mailing_address TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leases_wells (
  id BIGSERIAL PRIMARY KEY,
  lease_name TEXT NOT NULL,
  well_number TEXT,
  county TEXT,
  specific_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS truck_consumables_inventory (
  truck_id BIGINT PRIMARY KEY,
  toilet_paper NUMERIC NOT NULL DEFAULT 0,
  blue_chemical NUMERIC NOT NULL DEFAULT 0,
  deodorizer_pills NUMERIC NOT NULL DEFAULT 0,
  hand_soap NUMERIC NOT NULL DEFAULT 0,
  paper_towels NUMERIC NOT NULL DEFAULT 0,
  trash_bags NUMERIC NOT NULL DEFAULT 0,
  last_restocked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS service_tickets (
  folio BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  lease_well_id BIGINT REFERENCES leases_wells(id),
  asset_id TEXT REFERENCES assets(id),
  technician_id BIGINT REFERENCES users(id),
  customer_po_afe TEXT,
  rig_name TEXT,
  company_man TEXT,
  rig_phone TEXT,
  rig_fax TEXT,
  chk_vacuum_waste BOOLEAN NOT NULL DEFAULT FALSE,
  chk_pressure_wash_blue_chemical BOOLEAN NOT NULL DEFAULT FALSE,
  chk_deep_wipe_trash_liner BOOLEAN NOT NULL DEFAULT FALSE,
  chk_replenish_consumables BOOLEAN NOT NULL DEFAULT FALSE,
  usage_tier TEXT,
  personnel_count INT,
  days_since_last_service INT,
  arrive_time_job_site TIMESTAMPTZ,
  finish_time_job_site TIMESTAMPTZ,
  travel_time_duration TEXT,
  travel_end_time TIMESTAMPTZ,
  fuel_charges NUMERIC NOT NULL DEFAULT 0,
  sub_total NUMERIC NOT NULL DEFAULT 0,
  customer_signature TEXT,
  technician_signature TEXT,
  is_offline_sync BOOLEAN NOT NULL DEFAULT FALSE,
  sync_processed_at TIMESTAMPTZ,
  service_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_audited_and_approved BOOLEAN NOT NULL DEFAULT FALSE,
  audited_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS service_ticket_lines (
  id BIGSERIAL PRIMARY KEY,
  ticket_folio BIGINT REFERENCES service_tickets(folio),
  quantity INT NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  day_rate NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS consumables_usage_log (
  id BIGSERIAL PRIMARY KEY,
  ticket_folio BIGINT REFERENCES service_tickets(folio),
  toilet_paper_used NUMERIC NOT NULL DEFAULT 0,
  blue_chemical_used NUMERIC NOT NULL DEFAULT 0,
  deodorizer_pills_used NUMERIC NOT NULL DEFAULT 0,
  hand_soap_used NUMERIC NOT NULL DEFAULT 0,
  paper_towels_used NUMERIC NOT NULL DEFAULT 0,
  trash_bags_used NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_queue (
  id BIGSERIAL PRIMARY KEY,
  ticket_folio BIGINT REFERENCES service_tickets(folio),
  submitted_by BIGINT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION get_optimized_technician_route(day_filter TEXT, lat DOUBLE PRECISION, lng DOUBLE PRECISION)
RETURNS TABLE (
  stop_order INTEGER,
  asset_id TEXT,
  asset_type TEXT,
  customer_name TEXT,
  lease_name TEXT,
  well_number TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  delivery_date DATE,
  cleaning_counter INTEGER
)
LANGUAGE SQL
AS $$
SELECT 1 AS stop_order,
       a.id AS asset_id,
       a.asset_type,
       c.name AS customer_name,
       lw.lease_name,
       lw.well_number,
       29.7604 AS latitude,
       -95.3698 AS longitude,
       CURRENT_DATE AS delivery_date,
       1 AS cleaning_counter
FROM assets a
JOIN customers c ON c.id = 1
JOIN leases_wells lw ON lw.id = 1
WHERE a.id IS NOT NULL
$$;

INSERT INTO assets (id, asset_type) VALUES
  ('TO-0187', 'Porta Potty')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (id, name, mailing_address, city, state) VALUES
  (1, 'North Star Energy', '2210 Bay Area Blvd', 'Houston', 'TX')
ON CONFLICT (id) DO NOTHING;

INSERT INTO leases_wells (id, lease_name, well_number, county, specific_location) VALUES
  (1, 'Lease 42', 'A-17', 'Harris', 'West Field')
ON CONFLICT (id) DO NOTHING;

INSERT INTO truck_consumables_inventory (truck_id, toilet_paper, blue_chemical, deodorizer_pills, hand_soap, paper_towels, trash_bags)
VALUES (1, 50, 0, 100, 50, 100, 200)
ON CONFLICT (truck_id) DO NOTHING;
