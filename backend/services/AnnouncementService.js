const Announcement = require('../models/Announcement');
const db = require('../config/db');

class AnnouncementService {
  async getAll() {
    const result = await db.query('SELECT * FROM announcements WHERE expiry_date > NOW() ORDER BY published_date DESC');
    return result.rows.map(row => new Announcement(row));
  }

  async create(data) {
    const query = `
      INSERT INTO announcements (title, content, type, published_date, expiry_date, created_by)
      VALUES ($1,$2,$3,NOW(),$4,$5) RETURNING *;
    `;
    const values = [data.title, data.content, data.type, data.expiry_date, data.created_by];
    const result = await db.query(query, values);
    return new Announcement(result.rows[0]);
  }
}
module.exports = AnnouncementService;