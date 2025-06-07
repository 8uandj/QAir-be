class Aircraft {
  constructor({
    id,
    airline_id,
    aircraft_type,
    total_first_class_seats,
    total_business_class_seats,
    total_economy_class_seats,
    status,
    aircraft_code,
    manufacturer
  }) {
    this.id = id;
    this.airline_id = airline_id;
    this.aircraft_type = aircraft_type;
    this.total_first_class_seats = total_first_class_seats;
    this.total_business_class_seats = total_business_class_seats;
    this.total_economy_class_seats = total_economy_class_seats;
    this.status = status;
    this.aircraft_code = aircraft_code;
    this.manufacturer = manufacturer;
  }
}

module.exports = Aircraft;
