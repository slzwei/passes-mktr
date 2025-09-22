/**
 * Base Model - Single Responsibility: Database operations
 * Open-Closed: Can be extended without modifying existing code
 */
class BaseModel {
  constructor(dbService, tableName) {
    this.dbService = dbService;
    this.tableName = tableName;
  }

  // Convert camelCase to snake_case for database
  toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Convert snake_case to camelCase for JavaScript
  toCamelCase(str) {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  async create(data) {
    // Convert camelCase keys to snake_case for database
    const dbData = {};
    Object.keys(data).forEach(key => {
      const dbKey = this.toSnakeCase(key);
      dbData[dbKey] = data[key];
    });

    const columns = Object.keys(dbData);
    const values = Object.values(dbData);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    return this.dbService.executeQuery(query, values);
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    return this.dbService.executeQuery(query, [id]);
  }

  async findAll(where = {}, orderBy = 'created_at', order = 'DESC') {
    let query = `SELECT * FROM ${this.tableName}`;
    const values = [];

    if (Object.keys(where).length > 0) {
      // Convert camelCase keys to snake_case for database
      const dbWhere = {};
      Object.keys(where).forEach(key => {
        const dbKey = this.toSnakeCase(key);
        dbWhere[dbKey] = where[key];
      });

      const conditions = Object.keys(dbWhere).map((key, i) => `${key} = $${i + 1}`);
      query += ` WHERE ${conditions.join(' AND ')}`;
      values.push(...Object.values(dbWhere));
    }

    query += ` ORDER BY ${orderBy} ${order}`;
    return this.dbService.executeQuery(query, values);
  }

  async update(id, data) {
    // Convert camelCase keys to snake_case for database
    const dbData = {};
    Object.keys(data).forEach(key => {
      const dbKey = this.toSnakeCase(key);
      dbData[dbKey] = data[key];
    });

    const columns = Object.keys(dbData);
    const values = Object.values(dbData);
    const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    return this.dbService.executeQuery(query, [id, ...values]);
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    return this.dbService.executeQuery(query, [id]);
  }

  async exists(id) {
    const query = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`;
    const result = await this.dbService.executeQuery(query, [id]);
    return result.rows[0].exists;
  }
}

module.exports = BaseModel;
