import React, { Component } from "react";
import NavBar from "./components/navbar";
import Counters from "./components/counters";
import Blocks from "./components/blocks";
import { v4 as uuidv4 } from 'uuid';
import { GraphQLClient, gql } from 'graphql-request'

const endpoint = process.env.REACT_APP_ASTRA_ENDPOINT;
const client = new GraphQLClient(endpoint, { headers: { "x-cassandra-token": process.env.REACT_APP_ASTRA_TOKEN }});

const UPDATE_CART = gql`
  mutation UpdateCart ($id: Uuid!, $upsert: Boolean!, $bag: [EntryStringKeyIntValueInput!]) {
      updatecarts(
      value: {
          id: $id,
          bag: $bag
      },
      ifExists: $upsert
      ) {
      applied
      }
  }`;

/* BUG: The variable/param needs to be 'crt_id', with 'cart' you get the following error
   Uncaught (in promise) Error: Variable 'cart' has coerced Null value for NonNull type 'Uuid!': {"response":{"errors":[{"message":"Variable 'cart' has coerced Null value for NonNull type 'Uuid!'","locations":[{"line":2,"column":89}],"extensions":{"classification":"ValidationError"}}],"status":200,"headers":{"map":{"content-length":"177","content-type":"application/json","date":"Sat, 04 Sep 2021 20:52:11 GMT"}}},"request":{"query":"\n  mutation InsertHold ($event: String!, $block: String!, $row: String!, $seat: String!, $cart: Uuid!) {\n    insertseat_holds(\n      value: {\n          event: $event,\n          block: $block,\n          row: $row,\n          seat: $seat,\n          cart_id: $cart\n      },\n      options: { ttl: 60 }\n    ) {\n      applied\n    }\n  }","variables":{"event":"567","block":"A","row":"23","seat":0,"cart_id":"f754e582-72a6-4d52-9f34-b967b6726c25"}}}
    at index.js:491
    at step (index.js:179)
    at Object.next (index.js:109)
    at fulfilled (index.js:63)
*/
const ADD_HOLD = gql`
  mutation InsertHold ($event: String!, $block: String!, $row: String!, $seat: String!, $cart_id: Uuid!) {
    insertseat_holds(
      value: {
          event: $event,
          block: $block,
          row: $row,
          seat: $seat,
          cart_id: $cart_id
      },
      ifNotExists: true,
      options: { ttl: 30 }
    ) {
      applied
    }
  }`;

  const DEL_HOLD = gql`
  mutation DeleteHold ($event: String!, $block: String!, $row: String!, $seat: String!) {
    deleteseat_holds(
      value: {
        event: $event
        block: $block
        row: $row
        seat: $seat
      }
    ) {
      applied
    }
  }`;

  const QUERY_SEAT_MAP = gql`
  query allSeatMaps ($event_id: String!) {
    seat_maps (value: {event_id: $event_id}) {
      values {
        block
        row
        state
      }
    }
  }`;

class App extends Component {
  state = {
    counters: [
      { id: 1, value: 0, name: "Adult", needs_ticket: true },
      { id: 2, value: 0, name: "Children", needs_ticket: true },
      { id: 3, value: 0, name: "Infant In Arms", needs_ticket: false },
      { id: 4, value: 0, name: "Student", needs_ticket: true }
    ],
    total_tickets: 0,
    total_reserved: 0,
    cart_id: "",
    seat_blocks: [],
    event: "567"
  };

  updateCart = (counters) => {
    let upsert = true;
    let cart_id = this.state.cart_id
    if ( cart_id === "" ) {
      cart_id = uuidv4();
      this.setState( {cart_id} )
      upsert = false;
    }
    var bag = []
    for (let i=0; i < counters.length; i++) {
      if ( counters[i].needs_ticket ) {
        bag.push({"key": counters[i].name, "value": counters[i].value});
      }
    }
    return new Promise((resolve, reject) => {
        let vars = { id: cart_id, upsert: upsert, bag: bag};
        client.request(UPDATE_CART, vars)
            .then((res) => {
              this.setState( {cart_id} );
              return resolve(res);
            })
            .catch((err) => {return reject(err)});
    })
  }

  handleFailure = rejectReason => {
    console.log(rejectReason);
  }

  handleIncrement = counter => {
    let total_tickets = this.state.total_tickets;
    if ( total_tickets < 4 || !counter.needs_tickets) {
      const counters = [...this.state.counters];
      const index = counter.id-1;
      counters[index] = { ...counters[index] };
      if ( counters[index].needs_ticket ) {
        total_tickets++;
        counters[index].value++;
      }
      else {
        if (counters[index].value < total_tickets) {
          counters[index].value++;
        }
      }

      this.updateCart(counters)
         .then(this.setState({ counters, total_tickets }));
    }
  };

  handleDecrement = counter => {
    let total_tickets = this.state.total_tickets;
    const counters = [...this.state.counters];
    const index = counters.indexOf(counter);
    counters[index] = { ...counters[index] };
    if ( counters[index].needs_ticket ) {
      total_tickets--;
    }
    counters[index].value--;
  
    this.updateCart(counters)
      .then(this.setState({ counters, total_tickets }));
  };

  getSeatBlocks = (event) => {
    return new Promise((resolve, reject) => {
      const vars = { event_id: event };
      client.request(QUERY_SEAT_MAP, vars)
        .then((data) => {return resolve(data.seat_maps.values)})
        .catch((err) => {return reject(err)});
  })
  };

  handleGetSeatMap = () => {
    this.getSeatBlocks(this.state.event)
      .then((seat_blocks) => {
        for (let i=0; i < seat_blocks.length; i++) {
          seat_blocks[i]['state'] = seat_blocks[i]['state'].map(state => (state === true ? "Available" : "Taken"))
        }
        this.setState({ seat_blocks });
      })
      .catch((err) => {console.log(err)});  
  };

  modifySeatHold = (event, block, row, seat, state, cart) => {
    let vars = { event: event, block: block, row: row, seat: seat, cart_id: cart};
    if (state === "Reserved" ) {
      return new Promise((resolve, reject) => {
        client.request(ADD_HOLD, vars)
          .then((res) => {
            const applied = res.insertseat_holds.applied;
            if ( applied ) {
              let total_reserved = this.state.total_reserved;
              total_reserved++;
              this.setState( {total_reserved} );
            }
            return resolve(applied);
          })
          .catch((err) => reject(err));
        })
      } 
    else {
      return new Promise((resolve, reject) => {
        client.request(DEL_HOLD, vars)
          .then((res) => {
            const applied = res.deleteseat_holds.applied;
            if ( applied ) {
              let total_reserved = this.state.total_reserved;
              total_reserved--;
              this.setState( {total_reserved} );
            }
            return resolve(applied);
          })
          .catch((err) => reject(err));
      })
    }
  }

  handleSeatClick = (row, seat) => {
      if ( this.state.total_reserved < this.state.total_tickets || row.state[seat] === "Reserved" ) {
      const seat_blocks = [...this.state.seat_blocks];
      const index = seat_blocks.findIndex(block => block.block === row.block && block.row === row.row);
      seat_blocks[index]['state'][seat] = (row.state[seat] === "Available" ? "Reserved" : "Available");
      console.log('Create a latch for ' + row.block + ':' + row.row + ':' + seat + ' ' + this.state.cart_id)
      this.modifySeatHold(this.state.event, row.block, row.row, seat, seat_blocks[index]['state'][seat], this.state.cart_id)
        .then((res) => {
          if (!res) {
            seat_blocks[index]['state'][seat] = "Taken";
          }
          this.setState( {seat_blocks} );
        })
    }
    else {
      console.log('selected all your tickets!');
    }
  };

  handleCheckOut = () => {
    console.log("You brought ticket");
  }

  render() {
    return (
      <div>
        <NavBar
          ticketTotal={this.state.total_tickets}
          reservedTotal={this.state.total_reserved}
          onCheckOut={this.handleCheckOut}
        />
        <main className="container">
          <Counters
            total_tickets={this.state.total_tickets}
            counters={this.state.counters}
            onIncrement={this.handleIncrement}
            onDecrement={this.handleDecrement}
            onGetSeatMap={this.handleGetSeatMap}
          />
          <div className="col-md-0">
            <button
              className="btn btn-success m-2"
              onClick={() => this.handleGetSeatMap()}
              disabled={this.state.total_tickets === 0 ? "disabled" : ""}
            >
              <i className="fa fa-street-view" aria-hidden="true" />
            </button>
          </div>
          <Blocks
            blocks={this.state.seat_blocks}
            onSeatClick={this.handleSeatClick}
          />
        </main>
      </div>
    );
  }
}

export default App;
