class Announcement {
  constructor({
    id,
    title,
    content,
    type,
    published_date,
    expiry_date,
    created_by
  }) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.type = type;
    this.published_date = published_date;
    this.expiry_date = expiry_date;
    this.created_by = created_by;
  }
}
module.exports = Announcement;
