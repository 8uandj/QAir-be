class Route {
  constructor({ id, departure_airport_id, arrival_airport_id, distance, base_price }) {
    this.id = id;
    this.departure_airport_id = departure_airport_id;
    this.arrival_airport_id = arrival_airport_id;
    this.distance = distance;
    this.base_price = base_price;
  }
}
module.exports = Route;
