class Flight {
  constructor({
    id,
    airline_id,
    flight_number,
    route_id,
    aircraft_id,
    departure_time,
    arrival_time,
    flight_status,
    base_first_class_price,
    base_business_class_price,
    base_economy_class_price,
    available_first_class_seats,
    available_business_class_seats,
    available_economy_class_seats
  }) {
    this.id = id;
    this.airline_id = airline_id;
    this.flight_number = flight_number;
    this.route_id = route_id;
    this.aircraft_id = aircraft_id;
    this.departure_time = departure_time;
    this.arrival_time = arrival_time;
    this.flight_status = flight_status;
    this.base_first_class_price = base_first_class_price;
    this.base_business_class_price = base_business_class_price;
    this.base_economy_class_price = base_economy_class_price;
    this.available_first_class_seats = available_first_class_seats;
    this.available_business_class_seats = available_business_class_seats;
    this.available_economy_class_seats = available_economy_class_seats;
  }
}

module.exports = Flight;
