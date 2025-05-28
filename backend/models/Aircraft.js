class Aircraft {
    constructor({
        id,
        code,
        manufacturer,
        seats,
        createdAt
    }) {
        this.id = id;
        this.code = code;
        this.manufacturer = manufacturer;
        this.seats = seats || [];
        this.createdAt = createdAt || new Date();
    }
}

module.exports = Aircraft;