const db = require('../config/db');

class CountryService {

  /**
   * Lấy danh sách quốc gia với tùy chọn phân trang và lọc.
   * @param {Object} options - Tùy chọn: page, limit, nameKeyword, code, ...
   * @returns {Promise<Object>} - { data: [], total: number }
   */
  async getCountries(options = {}) {
    const {
      page = 1,
      limit = 10,
      nameKeyword,      // New filter: keyword in name
      code           // New filter: exact match for code
    } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, code
      FROM countries
      WHERE 1=1 -- Start with a true condition to easily append others
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM countries
      WHERE 1=1
    `;

    const filterValues = [];
    const countFilterValues = [];
    let paramIndex = 1;

    // Filter by name keyword (case-insensitive)
    if (nameKeyword) {
        query += ` AND name ILIKE $${paramIndex}`;
        countQuery += ` AND name ILIKE $${paramIndex}`;
        filterValues.push(`%${nameKeyword}%`);
        countFilterValues.push(`%${nameKeyword}%`);
        paramIndex++;
    }

     // Filter by code (case-insensitive)
    if (code) {
        query += ` AND code ILIKE $${paramIndex}`;
        countQuery += ` AND code ILIKE $${paramIndex}`;
        filterValues.push(code.toUpperCase()); // Store and filter as uppercase
        countFilterValues.push(code.toUpperCase()); // Store and filter as uppercase
        paramIndex++;
    }


    // Add other filters here if needed

    query += `
      ORDER BY name ASC -- Default order
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    filterValues.push(limit);
    filterValues.push(offset);


    try {
      const result = await db.query(query, filterValues);
      const countResult = await db.query(countQuery, countFilterValues);

      return {
          data: result.rows,
          total: parseInt(countResult.rows[0].count, 10)
      };

    } catch (error) {
      console.error('❌ Error fetching countries:', error.message);
      throw new Error(`Could not fetch countries: ${error.message}`);
    }
  }

  /**
   * Lấy chi tiết quốc gia theo ID.
   * @param {string} id - UUID quốc gia.
   * @returns {Promise<Object|null>}
   */
   async getCountryById(id) {
       try {
           const query = `
                SELECT id, name, code
                FROM countries
                WHERE id = $1;
           `;
           const result = await db.query(query, [id]); // UUID id
           if (result.rows.length === 0) {
               return null; // Country not found
           }
           return result.rows[0];
       } catch (error) {
           console.error(`❌ Error fetching country by ID ${id}:`, error.message);
           throw new Error(`Could not fetch country by ID: ${error.message}`);
       }
   }

  /**
   * Tạo quốc gia mới.
   * @param {Object} data - name, code.
   * @returns {Promise<Object>} Quốc gia đã tạo.
   */
  async createCountry(data) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // TODO: Add input validation (e.g., name, code are required)
      // TODO: Validate uniqueness of code

      const query = `
        INSERT INTO countries (name, code)
        VALUES ($1, $2)
        RETURNING id, name, code;
      `;
      const values = [
        data.name,
        data.code ? data.code.toUpperCase() : null // Store as uppercase
      ];
      const result = await client.query(query, values);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error creating country:', error.message);
      throw new Error(`Could not create country: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Cập nhật thông tin quốc gia.
   * @param {string} id - UUID quốc gia.
   * @param {Object} data - name (optional), code (optional).
   * @returns {Promise<Object>} Quốc gia đã cập nhật.
   */
  async updateCountry(id, data) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // TODO: Add input validation
      // TODO: Validate uniqueness of code if it is being updated

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
          updateFields.push(`name = $${paramIndex}`);
          values.push(data.name);
          paramIndex++;
      }
      if (data.code !== undefined) {
          updateFields.push(`code = $${paramIndex}`);
          values.push(data.code ? data.code.toUpperCase() : null); // Store as uppercase
          paramIndex++;
      }

      if (updateFields.length === 0) {
          // No fields to update
           await client.query('ROLLBACK'); // No changes, rollback the BEGIN
           const existing = await this.getCountryById(id); // Fetch current data
           if (!existing) {
               throw new Error('Country not found');
           }
           return existing; // Return existing data if no updates were requested
      }

      values.push(id); // UUID id for WHERE clause
      const query = `
        UPDATE countries
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, code;
      `;

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Country not found');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Error updating country ${id}:`, error.message);
      throw new Error(`Could not update country: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Xoá quốc gia.
   * Kiểm tra ràng buộc với bảng 'cities' và 'airports'.
   * @param {string} id - UUID quốc gia.
   * @returns {Promise<{deleted: true, id: string}>}
   */
  async deleteCountry(id) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Check for related cities
      const citiesRef = await client.query(
        'SELECT 1 FROM cities WHERE country_id = $1 LIMIT 1',
        [id] // UUID id
      );
      if (citiesRef.rows.length > 0) {
        throw new Error('Cannot delete country: Still has cities linked.');
      }

      // Check for related airports via cities
      const airportsRef = await client.query(
        `SELECT 1 FROM airports a
         JOIN cities c ON a.city_id = c.id
         WHERE c.country_id = $1 LIMIT 1`,
        [id]
      );
      if (airportsRef.rows.length > 0) {
        throw new Error('Cannot delete country: Still has airports linked.');
      }


      const query = `
        DELETE FROM countries
        WHERE id = $1
        RETURNING id;
      `;
      const result = await client.query(query, [id]); // UUID id

      if (result.rows.length === 0) {
        throw new Error('Country not found');
      }

      await client.query('COMMIT');
      return { deleted: true, id: result.rows[0].id };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Error deleting country ${id}:`, error.message);
      throw new Error(`Could not delete country: ${error.message}`);
    } finally {
      client.release();
    }
  }
}

// Ensure exporting an instance
module.exports = new CountryService();
