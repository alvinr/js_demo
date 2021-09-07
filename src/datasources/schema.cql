CREATE TABLE events ( id text, venue text, event text, event_start date, event_end date, location text, ticket_limit int,
 PRIMARY KEY (venue, event, event_start)
);

insert into events (id, venue, event, event_start, event_end, location, ticket_limit) values ('123', 'The Dell', 'vs. Man Utd.', todate(now()), todate(now()), 'Southampton, England', 4);

CREATE TABLE seat_maps (event_id text, block text, row text, seat text, state boolean,
 PRIMARY KEY (event_id, block, row, seat)
);

insert into seat_maps ( event_id, block, row, seat, available) values ('567', 'A', '23', '1', true);
insert into seat_maps ( event_id, block, row, seat, available) values ('567', 'A', '23', '2', true);
insert into seat_maps ( event_id, block, row, seat, available) values ('567', 'A', '23', '3', true);
insert into seat_maps ( event_id, block, row, seat, available) values ('567', 'A', '23', '4', true);
insert into seat_maps ( event_id, block, row, seat, available) values ('567', 'A', '23', '5', true);
insert into seat_maps ( event_id, block, row, seat, available) values ('567', 'A', '23', '6', true);
insert into seat_maps ( event_id, block, row, seat, available) values ('567', 'A', '23', '6', true);

CREATE TABLE seat_maps (event_id text, block text, row text, state list<boolean>,
 PRIMARY KEY (event_id, block, row)
);

insert into seat_maps ( event_id, block, row, state) values ('567', 'A', '23', [true, true, true, true, true]);
insert into seat_maps ( event_id, block, row, state) values ('567', 'A', '24', [false, true, false, true, true]);
insert into seat_maps ( event_id, block, row, state) values ('567', 'A', '25', [true, false, true, false, true]);
insert into seat_maps ( event_id, block, row, state) values ('567', 'A', '26', [true, true, true, true, false]);

insert into seat_maps ( event_id, block, row, state) values ('567', 'B', '10', [true, true, true, true, false]);

insert into seat_maps ( event_id, block, row, state) values ('789', 'Z', '99', [true, true, true, true, true]);

CREATE TABLE carts (id uuid, bag map<text, int>,
 PRIMARY KEY (id)
);

insert into carts (id, bag) values (now(), {'Adults':1, 'Children':2, 'Infants in Arms':0, 'Disabled':0});

CREATE TABLE seat_holds (cart_id uuid, event text, block text, row text, seat text,
 PRIMARY KEY (event, block, row, seat)
);

insert into seat_holds (cart_id, event, block, row, seat) values (52eebef2-7050-48c3-b841-fd5c1e5149c1, '567', 'A14', 'D', '14') using TTL 10;
insert into seat_holds (cart_id, event, block, row, seat) values (52eebef2-7050-48c3-b841-fd5c1e5149c1, '567', 'B', '10', '0');
