import React, { Component } from "react";
import Counter from "./counter";

class Counters extends Component {
  render() {
    const {
      onIncrement,
      onDecrement,
// eslint-disable-next-line
      onReserve,
      counters,
      total_tickets
    } = this.props;
    return (
      <div>
        <div>
          {counters.map(counter => (
            <Counter
              key={counter.id}
              counter={counter}
              total_tickets={total_tickets}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default Counters;
