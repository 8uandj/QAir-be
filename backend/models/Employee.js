class Employee {
  constructor({
    id,
    first_name,
    last_name,
    email,
    password_hash,
    role,
    created_at
  }) {
    this.id = id;
    this.first_name = first_name;
    this.last_name = last_name;
    this.email = email;
    this.password_hash = password_hash;
    this.role = role;
    this.created_at = created_at;
  }
}
module.exports = Employee;
