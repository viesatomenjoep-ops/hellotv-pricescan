-- Extra filiaal-gegevens: adres, postcode, type (xl/standaard) en opening-status.
alter table filialen add column if not exists adres    text;
alter table filialen add column if not exists postcode text;
alter table filialen add column if not exists type     text not null default 'standaard';
alter table filialen add column if not exists opent    text; -- null = open; anders bv. 'oktober 2026'
