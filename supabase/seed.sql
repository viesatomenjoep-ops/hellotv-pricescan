-- Seed voor lokale ontwikkeling / demo. Prijzen in centen, verkoop incl. 21% btw.
-- Idempotent via vaste UUID's + on conflict.

insert into models (id, brand, model_code, name, model_year, screen_size_inch, panel_type, segment, ean) values
  ('11111111-1111-1111-1111-111111111101', 'Samsung', 'QN90F-55', 'Samsung Neo QLED 55" QN90F', 2026, 55, 'Mini-LED', 'premium', '8806090000001'),
  ('11111111-1111-1111-1111-111111111102', 'LG',      'C5-55',    'LG OLED evo 55" C5',          2025, 55, 'OLED',     'premium', '8806090000002'),
  ('11111111-1111-1111-1111-111111111103', 'Sony',    'BRAVIA8-55','Sony BRAVIA 8 OLED 55"',      2025, 55, 'OLED',     'premium', '8806090000003'),
  ('11111111-1111-1111-1111-111111111104', 'Philips',  'OLED810-48','Philips OLED810 48"',         2026, 48, 'OLED',     'midden',  '8806090000004'),
  ('11111111-1111-1111-1111-111111111105', 'Samsung', 'DU7100-43','Samsung Crystal UHD 43" DU7100', 2025, 43, 'LED',    'budget',  '8806090000005')
on conflict (id) do nothing;

insert into vendit_articles (id, vendit_article_id, model_id, purchase_price_cents, sale_price_cents, price_includes_vat, vat_rate, stock_qty, synced_at) values
  ('22222222-2222-2222-2222-222222222201', 'VND-1001', '11111111-1111-1111-1111-111111111101', 110000, 179900, true, 0.210, 4, now()),
  ('22222222-2222-2222-2222-222222222202', 'VND-1002', '11111111-1111-1111-1111-111111111102',  95000, 159900, true, 0.210, 7, now()),
  ('22222222-2222-2222-2222-222222222203', 'VND-1003', '11111111-1111-1111-1111-111111111103', 105000, 149900, true, 0.210, 2, now()),
  ('22222222-2222-2222-2222-222222222205', 'VND-1005', '11111111-1111-1111-1111-111111111105',  22000,  39900, true, 0.210, 12, now())
on conflict (id) do nothing;
-- model ...104 (Philips OLED810) heeft bewust GEEN artikel -> verschijnt in "ongematcht".

insert into tags (id, epc, model_id) values
  ('33333333-3333-3333-3333-333333333301', 'E28011700000020000000001', '11111111-1111-1111-1111-111111111101'),
  ('33333333-3333-3333-3333-333333333302', 'E28011700000020000000002', '11111111-1111-1111-1111-111111111102'),
  ('33333333-3333-3333-3333-333333333303', 'E28011700000020000000003', '11111111-1111-1111-1111-111111111105')
on conflict (id) do nothing;
