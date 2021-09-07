import React, { Component } from "react";

class NavBar extends Component {
  render () {
    const {
      ticketTotal,
      reservedTotal,
// eslint-disable-next-line      
      onCheckOut
    } = this.props;
    return (
      <nav className="navbar navbar-light bg-light">
        <div className="navbar-brand">
          <i className="fa fa-shopping-cart fa-lg m-2" />
          <span className="badge badge-pill badge-info m-2" style={{ width: 50 }}>
            {ticketTotal}
          </span>
          Tickets
          <button
            className="btn btn-success m-2"
            onClick={() => this.props.onCheckOut()}
            disabled={(ticketTotal > 0 && reservedTotal ===  ticketTotal) ? "" : "disabled"}
          >
            <i className="fa fa-credit-card" />
          </button>
        </div>
      </nav>
    );
  }
}
export default NavBar;
