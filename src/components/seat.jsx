import React, { Component } from "react";
import { isComputedPropertyName } from "typescript";

class Seat extends Component {
  render() {
    const {
        onSeatClick,
        row,
        seat,
        state
      } = this.props;
    return (
        <span style={{ fontSize: 24 }} className={this.getBadgeClasses(this.props.state)}>
            <button
                className="btn btn-secondary"
                onClick={() => {this.props.onSeatClick(this.props.row, this.props.seat)}}
                disabled={this.props.state === "Taken" ? "disabled" : ""}
            >
                <i className={this.getIcon(this.props.state)} />
            </button>
        </span>
    );
  }

  getBadgeClasses = (state) => {
    let classes = "badge m-2 badge-";
    switch (state) {
      case "Reserved":
        return classes += "warning";
      case "Taken":
        return classes += "error";
      case "Available":
        return classes += "primary";
    }
  }

  getIcon = (state) => {
    switch (state) {
      case "Reserved":
        return("fa fa-ticket");
      case "Taken":
        return("fa fa-times-circle");
      case "Available":
        return("fas fa-check-circle");
    }
  }
}

export default Seat;
