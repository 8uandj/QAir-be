class Customer {
  constructor({
    id,
    first_name,
    last_name,
    birth_date,
    gender,
    identity_number,
    phone_number,
    email,
    address,
    country,
    created_at
  }) {
    this.id = id;
    this.first_name = first_name;
    this.last_name = last_name;
    this.birth_date = birth_date;
    this.gender = gender;
    this.identity_number = identity_number;
    this.phone_number = phone_number;
    this.email = email;
    this.address = address;
    this.country = country;
    this.created_at = created_at;
  }
}
module.exports = Customer;
