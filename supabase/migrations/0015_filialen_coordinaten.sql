-- Data-migratie: coördinaten (lat/lng) voor de echte helloTV-filialen (kaartweergave).
-- De kolommen bestaan al sinds 0012; deze migratie vult alleen de waarden. Idempotent (UPDATE).
update filialen set lat = 52.6320, lng = 4.7490 where id = 'alk';
update filialen set lat = 51.4950, lng = 4.2900 where id = 'bop';
update filialen set lat = 52.3430, lng = 4.6330 where id = 'cru';
update filialen set lat = 51.9470, lng = 5.9970 where id = 'dui';
update filialen set lat = 51.4900, lng = 5.4900 where id = 'ein';
update filialen set lat = 51.9120, lng = 4.4300 where id = 'rot';
update filialen set lat = 51.5600, lng = 5.0790 where id = 'til';
update filialen set lat = 52.0660, lng = 5.0950 where id = 'utr';
update filialen set lat = 52.3360, lng = 4.9330 where id = 'ams';
update filialen set lat = 52.2260, lng = 5.9850 where id = 'ape';
update filialen set lat = 51.5850, lng = 4.7400 where id = 'bre';
update filialen set lat = 51.7060, lng = 5.3010 where id = 'dbo';
update filialen set lat = 51.9650, lng = 6.2880 where id = 'doe';
update filialen set lat = 53.2030, lng = 6.5120 where id = 'gro';
update filialen set lat = 53.1850, lng = 5.8260 where id = 'lee';
update filialen set lat = 52.2950, lng = 5.1450 where id = 'naa';
update filialen set lat = 51.8440, lng = 5.8620 where id = 'nij';
update filialen set lat = 52.1350, lng = 4.5450 where id = 'zoe';
