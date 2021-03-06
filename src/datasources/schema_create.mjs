import { execute } from 'graphql';
import { GraphQLClient, gql } from 'graphql-request'

/* Make sure these are defined as environment variable and pointing to the right endpoint with the right token/role tuple */

const schema_endpoint = process.env.REACT_APP_ASTRA_SCHEMA_ENDPOINT;
const schema_client = new GraphQLClient(schema_endpoint, { headers: { "x-cassandra-token": process.env.REACT_APP_ASTRA_SCHEMA_TOKEN }});

const endpoint = process.env.REACT_APP_ASTRA_ENDPOINT;
const client = new GraphQLClient(endpoint, { headers: { "x-cassandra-token": process.env.REACT_APP_ASTRA_TOKEN }});

const KEYSPACE = "js_demo";

/* GraphQL versions of these CQL commands */

// DDL COMMANDS

/*
  CREATE TABLE events ( id text, venue text, event text, event_start date, event_end date, location text, ticket_limit int,
    PRIMARY KEY (venue, event, event_start)
   );
*/

// NOTE: Had to add cluster keys (which CQL defines by default) to avoid the "use ALLOW FILTERING" error
// NOTE: The clustering keys get appended to the list of the Primary Key, again different from CQL
const CREATE_EVENTS =
gql`mutation createTableIfNotExists ($keyspaceName: String!) {
      events: createTable(
        keyspaceName: $keyspaceName,
        tableName: "events",
        partitionKeys: [
          { name: "venue", type: {basic: TEXT} }
        ]
        clusteringKeys: [
          { name: "event", type: { basic: TEXT} }
          { name: "event_start", type: { basic: DATE} }
        ],
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
// NOTE: The clustering keys get appended to the list of the Primary Key, again different from CQL
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

// NOTE: Had to add cluster keys (which CQL defines by default) to avoid the "use ALLOW FILTERING" error
// NOTE: The clustering keys get appended to the list of the Primary Key, again different from CQL
const CREATE_SEAT_HOLDS =
  gql`mutation createTableIfNotExists ($keyspaceName: String!) {
        seat_holds: createTable(
          keyspaceName: $keyspaceName,
          tableName: "seat_holds",
          partitionKeys: [
            { name: "event", type: {basic: TEXT} }
          ]
          clusteringKeys: [
            { name: "block", type: { basic: TEXT} }
            { name: "row", type: { basic: TEXT} }
            { name: "seat", type: {basic: TEXT} }
          ],
        values: [
            { name: "cart_id", type:{basic: UUID } }
        ]
      )
  }`;


// DML COMMANDS

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

// PROCESS THE DDL AND DML COMMANDS

const ddl_cmds = [
  {name: 'events',      cmd: CREATE_EVENTS},
  {name: 'seat_maps',   cmd: CREATE_SEAT_MAPS},
  {name: 'carts',       cmd: CREATE_CARTS},
  {name: 'seat_holds',  cmd: CREATE_SEAT_HOLDS}
];

const executeDDLCmd = (request) => {
    return new Promise((resolve, reject) => {
      const vars = { keyspaceName: KEYSPACE };
      schema_client.request(request.cmd, vars)
        .then((res) => {
          console.log(request.name);
          return resolve(res)
        })
        .catch((err) => {return reject(err)});
  })
};

const dml_cmds = [ {name: "insert events", cmd: INSERT_EVENTS, data: events},
                   {name: "insert seat_maps", cmd: INSERT_SEAT_MAPS, data: seat_maps},
                   {name: "insert seat_holds", cmd: INSERT_SEAT_HOLDS, data: seat_holds}
                ]

const executeDMLCmd = (cmd, data) => {
  return new Promise((resolve, reject) => {
     client.request(cmd, data)
       .then((res) => {
         console.log(res);
         return resolve(res);
       })
       .catch((err) => {return reject(err)});
 })
};

const cmds = [  { name: "events",
                  ddl: {name: 'create events',   cmd: CREATE_EVENTS},
                  dml: {name: "insert events", cmd: INSERT_EVENTS, data: events}
                },
                { name: "seat_maps",
                  ddl: {name: 'create seat_maps', cmd: CREATE_SEAT_MAPS},
                  dml: {name: "insert seat_maps", cmd: INSERT_SEAT_MAPS, data: seat_maps}
                },
                { name: "carts",
                  ddl: {name: 'create carts', cmd: CREATE_CARTS}
                },
                { name: "seat_holds",
                  ddl: {name: 'create seat_holds', cmd: CREATE_SEAT_HOLDS},
                  dml: {name: "insert seat_holds", cmd: INSERT_SEAT_HOLDS, data: seat_holds}
                }
            ]


const buildSchema = (cmds) => {
  cmds.forEach((request) => {
    if ( "ddl" in request) {
      executeDDLCmd(request.ddl)
        .then(() => {
          if ( "dml" in request) {
            request.dml.data.forEach((data) => executeDMLCmd(request.dml.cmd, data));
          }
          return true;
        })
        .catch((err) => {
          console.log(err);
          return false;
        })
    }
  })
}

//buildSchema(cmds);

// Re-write to use async and await
const ddl_promises = [];
const dml_promises = [];

const executeDDLCmdAsync = async (cmd) => {
  const vars = { keyspaceName: KEYSPACE };
  return schema_client.request(cmd, vars)
};

const executeDMLCmdAsync = async (cmd, data) => {
  return client.request(cmd, data);
};

const buildSchemaAsync = async (cmds) => {
  cmds.forEach( (request) => {
    if ( "ddl" in request) {
      console.log(request.ddl.name);
      ddl_promises.push(executeDDLCmdAsync(request.ddl.cmd));
    }
  });
  let foo = await Promise.all(ddl_promises);
  cmds.forEach( (request) => {
    if ( "dml" in request) {
      request.dml.data.forEach((data) => {
        console.log(request.dml.name);
        dml_promises.push(executeDMLCmdAsync(request.dml.cmd, data));
      });
    }
  });
  let bar = await Promise.all(dml_promises);
};

//buildSchemaAsync(cmds);

// Re-write to use async and await - TAKE 2
const buildTable = async (request) => {
  const vars = { keyspaceName: KEYSPACE };
  if ("ddl" in request) {
    schema_client.request(request.ddl.cmd, vars)
    .then( async () => {
      if ( "dml" in request) {
        const dml_promises = [];
        request.dml.data.forEach((data) =>  {
          console.log(request.dml.name);
          dml_promises.push(client.request(request.dml.cmd, data));
        });
        return await Promise.all(dml_promises);
      }
    });
  }
  return true;
};

const buildSchemaAsync2 = async (cmds) => {
  const ddl_promises = [];
  cmds.forEach( (request) => {
    if ( "ddl" in request) {
      console.log(request.ddl.name);
      ddl_promises.push(buildTable(request));
    }
  });
  return await Promise.all(ddl_promises);
};

buildSchemaAsync2(cmds);
