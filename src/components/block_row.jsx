import React, { Component } from "react";
import Seat from "./seat";


class BlockRow extends Component {
  render() {
    const {
      row,
      state,
      onSeatClick
    } = this.props;
    return (
      <div>
        <div>
            <span style={{ fontSize: 24 }}>
            {row.block} | {row.row}
            </span>
          {state.map((seat_state, index) => (
            <Seat
              key={index}
              seat={index}
              row={row}
              onSeatClick={onSeatClick}
              state={seat_state}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default BlockRow;
