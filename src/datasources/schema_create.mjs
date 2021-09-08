import { GraphQLClient, gql } from 'graphql-request'

const schema_endpoint = process.env.REACT_APP_ASTRA_SCHEMA_ENDPOINT;
const schema_client = new GraphQLClient(schema_endpoint, { headers: { "x-cassandra-token": process.env.REACT_APP_ASTRA_SCHEMA_TOKEN }});

const endpoint = process.env.REACT_APP_ASTRA_ENDPOINT;
const client = new GraphQLClient(endpoint, { headers: { "x-cassandra-token": process.env.REACT_APP_ASTRA_TOKEN }});

const KEYSPACE = "js_demo";

/* GraphQL versions of these CQL commands */

/*
  CREATE TABLE events ( id text, venue text, event text, event_start date, event_end date, location text, ticket_limit int,
    PRIMARY KEY (venue, event, event_start)
   );
*/

const CREATE_EVENTS =
gql`mutation createTableIfNotExists ($keyspaceName: String!) {
      events: createTable(
        keyspaceName: $keyspaceName,
        tableName: "events",
        partitionKeys: [
          { name: "venue", type: {basic: TEXT} }
          { name: "event", type: {basic: TEXT} }
          { name: "event_start", type: {basic: DATE} }
        ]
      values: [
        { name: "id", type: {basic: TEXT} }
        { name: "event_end", type: {basic: DATE} }
        { name: "location", type: {basic: TEXT} }
        { name: "ticket_limit", type: {basic: INT} }
      ]
    )
  }`;

/*
   CREATE TABLE seat_maps (event_id text, block text, row text, state list<boolean>,
    PRIMARY KEY (event_id, block, row)
   );
*/

// NOTE: Had to add cluster keys (which CQL defines by default) to avoid the "use ALLOW FILTERING" error
const CREATE_SEAT_MAPS =
  gql`mutation createTableIfNotExists ($keyspaceName: String!) {
        seat_maps: createTable(
          keyspaceName: $keyspaceName,
          tableName: "seat_maps",
          partitionKeys: [
            { name: "event_id", type: {basic: TEXT} }
          ],
          clusteringKeys: [
            { name: "block", type: { basic: TEXT} }
            { name: "row", type: { basic: TEXT} }
          ],
        values: [
            { name: "state", type: {basic:LIST, info:{ subTypes: [ { basic: BOOLEAN } ] } } }
        ]
      )
  }`;

/*
  CREATE TABLE carts (id uuid, bag map<text, int>,
      PRIMARY KEY (id)
    );
*/

const CREATE_CARTS =
  gql`mutation createTableIfNotExists ($keyspaceName: String!) {
        carts: createTable(
          keyspaceName: $keyspaceName,
          tableName: "carts",
          partitionKeys: [
            { name: "id", type: {basic: UUID} }
          ]
        values: [
            { name: "bag", type:{basic: MAP, info:{ subTypes: [ { basic: TEXT }, {basic: INT} ] } } }
        ]
      )
  }`;

/*
  CREATE TABLE seat_holds (cart_id uuid, event text, block text, row text, seat text,
    PRIMARY KEY (event, block, row, seat)
   );
*/

const CREATE_SEAT_HOLDS =
  gql`mutation createTableIfNotExists ($keyspaceName: String!) {
        seat_holds: createTable(
          keyspaceName: $keyspaceName,
          tableName: "seat_holds",
          partitionKeys: [
            { name: "event", type: {basic: TEXT} }
            { name: "block", type: {basic: TEXT} }
            { name: "row", type: {basic: TEXT} }
            { name: "seat", type: {basic: TEXT} }
          ]
        values: [
            { name: "cart_id", type:{basic: UUID } }
        ]
      )
  }`;

const ddl_cmds = [
  {name: 'events',      cmd: CREATE_EVENTS},
  {name: 'seat_maps',   cmd: CREATE_SEAT_MAPS},
  {name: 'carts',       cmd: CREATE_CARTS},
  {name: 'seat_holds',  cmd: CREATE_SEAT_HOLDS}
];

const executeDDLCmds = (request) => {
   console.log(request.name);
    return new Promise((resolve, reject) => {
      const vars = { keyspaceName: KEYSPACE };
      schema_client.request(request.cmd, vars)
        .then((res) => {return resolve(res)})
        .catch((err) => {return reject(err)});
  })
};

//ddl_cmds.forEach(executeDDLCmds);

/*
   insert into events (id, venue, event, event_start, event_end, location, ticket_limit) values ('567', 'The Dell', 'vs. Man Utd.', todate(now()), todate(now()), 'Southampton, England', 4);
*/

const INSERT_EVENTS =
  gql`mutation InsertEvent ($id: String!, $venue: String!, $event: String!, $event_start: Date!, $event_end: Date!, $location: String!, $ticket_limit: Int!) {
        insertevents(
          value: {
            id: $id,
            venue: $venue,
            event: $event,
            event_start: $event_start,
            event_end: $event_end,
            location: $location,
            ticket_limit: $ticket_limit
          },
          ifNotExists: false
        ) {
        applied
        }
    }`;

const events = [
  { id: '567', venue: 'The Dell', event: 'vs. Man Utd.', event_start: new Date().toISOString().split('T')[0], event_end: new Date().toISOString().split('T')[0], location: 'Southampton, England', ticket_limit: 4}
]

/*
   insert into seat_maps ( event_id, block, row, state) values ('567', 'A', '23', [true, true, true, true, true]);
   insert into seat_maps ( event_id, block, row, state) values ('567', 'A', '24', [false, true, false, true, true]);
   insert into seat_maps ( event_id, block, row, state) values ('567', 'A', '25', [true, false, true, false, true]);
   insert into seat_maps ( event_id, block, row, state) values ('567', 'A', '26', [true, true, true, true, false]);

   insert into seat_maps ( event_id, block, row, state) values ('567', 'B', '10', [true, true, true, true, false]);

   insert into seat_maps ( event_id, block, row, state) values ('789', 'Z', '99', [true, true, true, true, true]);
*/

const INSERT_SEAT_MAPS =
  gql`mutation InsertSeatMap ($event_id: String!, $block: String!, $row: String!, $state: [Boolean]!) {
        insertseat_maps(
          value: {
              event_id: $event_id,
              block: $block,
              row: $row,
              state: $state
          },
          ifNotExists: false
        ) {
        applied
        }
    }`;

const seat_maps = [
  { event_id: '567', block: 'A', row: '23', state: [true, true, true, true, true] },
  { event_id: '567', block: 'A', row: '24', state: [false, true, false, true, true] },
  { event_id: '567', block: 'A', row: '25', state: [true, false, true, false, true] },
  { event_id: '567', block: 'A', row: '26', state: [true, true, true, true, false] },
  { event_id: '567', block: 'B', row: '10', state: [true, true, true, true, false] },
  { event_id: '789', block: 'Z', row: '99', state: [true, true, true, true, true] }
]

/*
insert into seat_holds (cart_id, event, block, row, seat) values (52eebef2-7050-48c3-b841-fd5c1e5149c1, '567', 'A14', 'D', '14') using TTL 10;
   insert into seat_holds (cart_id, event, block, row, seat) values (52eebef2-7050-48c3-b841-fd5c1e5149c1, '567', 'B', '10', '0');
*/

const INSERT_SEAT_HOLDS =
  gql`mutation InsertSeatHold ($cart_id: Uuid!, $event: String!, $block: String!, $row: String!, $seat: String!) {
        insertseat_holds(
          value: {
              cart_id: $cart_id,
              event: $event,
              block: $block,
              row: $row,
              seat: $seat
          },
          ifNotExists: false
        ) {
        applied
        }
    }`;

const seat_holds = [
  { cart_id: '52eebef2-7050-48c3-b841-fd5c1e5149c1', event: '567', block: 'B', row: '10', seat: '0' }
]

const dml_cmds = [ {name: "insert events", cmd: INSERT_EVENTS, data: events},
                   {name: "insert seat_maps", cmd: INSERT_SEAT_MAPS, data: seat_maps},
                   {name: "insert seat_holds", cmd: INSERT_SEAT_HOLDS, data: seat_holds}
                ]

const executeDMLCmd = (cmd, data) => {
  return new Promise((resolve, reject) => {
     client.request(cmd, data)
       .then((res) => {console.log(res);return resolve(res)})
       .catch((err) => {return reject(err)});
 })
};

dml_cmds.forEach((request) => { request.data.forEach((data) => executeDMLCmd(request.cmd, data)) } );
