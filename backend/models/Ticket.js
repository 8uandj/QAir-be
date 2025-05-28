class Ticket {
  constructor({
    id,
    flight_id,
    customer_id,
    ticket_class_id,
    seat_number,
    price,
    booking_date,
    ticket_status,
    ticket_code,
    cancellation_deadline
  }) {
    this.id = id;
    this.flight_id = flight_id;
    this.customer_id = customer_id;
    this.ticket_class_id = ticket_class_id;
    this.seat_number = seat_number;
    this.price = price;
    this.booking_date = booking_date;
    this.ticket_status = ticket_status;
    this.ticket_code = ticket_code;
    this.cancellation_deadline = cancellation_deadline;
  }
}
module.exports = Ticket;
