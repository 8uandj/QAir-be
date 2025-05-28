class User {
    constructor({
        id,
        username,
        password,
        role,
        createdAt
    }) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.role = role || 'user';
        this.createdAt = createdAt || new Date();
    }
}

module.exports = User;