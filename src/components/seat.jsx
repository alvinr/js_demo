import React, { Component } from "react";

class Seat extends Component {
  render() {
    const {
// eslint-disable-next-line
        onSeatClick,
// eslint-disable-next-line
        row,
// eslint-disable-next-line
        seat,
// eslint-disable-next-line
        state,
// eslint-disable-next-line
      onSeatVisible
} = this.props;
    return (
        <span style={{ fontSize: 24 }} className={this.getBadgeClasses(this.props.state)}>
            <button
                className="btn btn-secondary"
                onClick={() => {this.props.onSeatClick(this.props.row, this.props.seat)}}
                // disabled={((this.props.state === "Taken")) ? "disabled" : ""}
                disabled={this.props.onSeatVisible(this.props.state)}
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
        return classes += "primary";
      case "Taken":
        return classes += "error";
      case "Available":
        return classes += "warning";
      default:
        return "";
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
      default:
        return "";
      }
  }
}

export default Seat;
