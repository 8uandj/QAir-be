const db = require('../config/db');

class CityService {

  /**
   * Lấy danh sách thành phố với tùy chọn phân trang và lọc.
  * @param {Object} options - Tùy chọn: page, limit, nameKeyword, countryId, ...
   * @returns {Promise<Object>} - { data: [], total: number }
   */
  async getCities(options = {}) {
    const {
      page = 1,
      limit = 10,
      nameKeyword,      // New filter: keyword in name
      countryId         // New filter: by country_id (UUID)
    } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, country_id
      FROM cities
      WHERE 1=1 -- Start with a true condition to easily append others
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM cities
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


    // Filter by country_id
    if (countryId) {
        query += ` AND country_id = $${paramIndex}`;
        countQuery += ` AND country_id = $${paramIndex}`;
        filterValues.push(countryId); // UUID
        countFilterValues.push(countryId); // UUID
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
      console.error('❌ Error fetching cities:', error.message);
      throw new Error(`Could not fetch cities: ${error.message}`);
    }
  }

  /**
   * Lấy chi tiết thành phố theo ID.
   * @param {string} id - UUID thành phố.
   * @returns {Promise<Object|null>}
   */
   async getCityById(id) {
       try {
           const query = `
               SELECT id, name, country_id
                FROM cities
                WHERE id = $1;
           `;
           const result = await db.query(query, [id]); // UUID id
           if (result.rows.length === 0) {
               return null; // City not found
           }
           return result.rows[0];
       } catch (error) {
           console.error(`❌ Error fetching city by ID ${id}:`, error.message);
           throw new Error(`Could not fetch city by ID: ${error.message}`);
       }
   }

  /**
   * Tạo thành phố mới.
  * @param {Object} data - name, country_id (UUID).
   * @returns {Promise<Object>} Thành phố đã tạo.
   */
  async createCity(data) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // TODO: Add input validation (e.g., name and country_id are required)
      // TODO: Validate if country_id exists in countries table
      // TODO: Validate uniqueness of name and country combination

      const query = `
        INSERT INTO cities (name, country_id)
        VALUES ($1, $2)
        RETURNING id, name, country_id;
      `;
      const values = [
        data.name,
        data.country_id // UUID
      ];
      const result = await client.query(query, values);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error creating city:', error.message);
      throw new Error(`Could not create city: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Cập nhật thông tin thành phố.
   * @param {string} id - UUID thành phố.
   * @param {Object} data - name (optional), country_id (UUID, optional).
   * @returns {Promise<Object>} Thành phố đã cập nhật.
   */
  async updateCity(id, data) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // TODO: Add input validation
      // TODO: Validate if country_id exists if provided
      // TODO: Validate uniqueness of name and country combination if name or country_id is updated

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
          updateFields.push(`name = $${paramIndex}`);
          values.push(data.name);
          paramIndex++;
      }
      if (data.country_id !== undefined) {
          updateFields.push(`country_id = $${paramIndex}`);
          values.push(data.country_id); // UUID
          paramIndex++;
      }


      if (updateFields.length === 0) {
          // No fields to update
          await client.query('ROLLBACK'); // No changes, rollback the BEGIN
          const existing = await this.getCityById(id); // Fetch current data
           if (!existing) {
              throw new Error('City not found');
           }
           return existing; // Return existing data if no updates were requested
      }

      values.push(id); // UUID id for WHERE clause
      const query = `
        UPDATE cities
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, country_id;
      `;

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('City not found');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Error updating city ${id}:`, error.message);
      throw new Error(`Could not update city: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Xoá thành phố.
   * Kiểm tra ràng buộc với bảng 'airports' và có thể các bảng khác (ví dụ: 'users').
   * @param {string} id - UUID thành phố.
   * @returns {Promise<{deleted: true, id: string}>}
   */
  async deleteCity(id) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Check for related airports
      const airportsRef = await client.query(
        'SELECT 1 FROM airports WHERE city_id = $1 LIMIT 1',
        [id] // UUID id
      );
      if (airportsRef.rows.length > 0) {
        throw new Error('Cannot delete city: Still has airports linked.');
      }

       // TODO: Check for related users if users table has city_id
       // const usersRef = await client.query(
       //   'SELECT 1 FROM users WHERE city_id = $1 LIMIT 1',
       //   [id] // UUID id
       // );
       // if (usersRef.rows.length > 0) {
       //   throw new Error('Cannot delete city: Still linked to users.');
       // }


      const query = `
        DELETE FROM cities
        WHERE id = $1
        RETURNING id;
      `;
      const result = await client.query(query, [id]); // UUID id

      if (result.rows.length === 0) {
        throw new Error('City not found');
      }

      await client.query('COMMIT');
      return { deleted: true, id: result.rows[0].id };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Error deleting city ${id}:`, error.message);
      throw new Error(`Could not delete city: ${error.message}`);
    } finally {
      client.release();
    }
  }
}

// Ensure exporting an instance
module.exports = new CityService();
