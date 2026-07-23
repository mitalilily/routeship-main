insert into couriers (id, name, "serviceProvider", "isEnabled", business_type, created_at, updated_at)
values
  (91001, 'Innofulfill ECOMM', 'innofulfill', true, '["b2c"]'::jsonb, now(), now()),
  (91002, 'Innofulfill Hyperlocal', 'innofulfill', true, '["b2c"]'::jsonb, now(), now())
on conflict (id, "serviceProvider") do update
set
  name = excluded.name,
  "isEnabled" = true,
  business_type = excluded.business_type,
  updated_at = now();
