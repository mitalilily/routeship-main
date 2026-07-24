ALTER TABLE routeship_international_rates
  ADD COLUMN IF NOT EXISTS fuel_surcharge_mode varchar(20) NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS fuel_surcharge_value numeric(12,2) NOT NULL DEFAULT 0;
