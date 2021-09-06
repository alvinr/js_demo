import React, { Component } from "react";
import BlockRow from "./block_row";

class Blocks extends Component {
  render() {
    const {
      onSeatClick,
      blocks
    } = this.props;
    return (
      <div>
        <div>
          {blocks.map((row, index) => (
            <BlockRow
              key={index}
              row={row}
              state={row.state}
              onSeatClick={onSeatClick}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default Blocks;
