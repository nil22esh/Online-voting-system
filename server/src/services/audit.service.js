import { pool } from "../db/db.js";

/**
 * Create an audit log entry
 */
export const createAuditLog = async (userId, action, entity, entityId, details, ipAddress) => {
  const query = `
    INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `;
  const result = await pool.query(query, [
    userId,
    action,
    entity,
    entityId,
    details ? JSON.stringify(details) : null,
    ipAddress,
  ]);
  return result.rows[0];
};

/**
 * Get audit logs with pagination and filtering
 */
export const getAuditLogs = async (page = 1, limit = 20, filters = {}) => {
  const offset = (page - 1) * limit;
  let whereClause = "";
  const values = [];
  let paramCount = 0;

  if (filters.userId) {
    paramCount++;
    whereClause += ` AND al.user_id = $${paramCount}`;
    values.push(filters.userId);
  }

  if (filters.action) {
    paramCount++;
    whereClause += ` AND al.action = $${paramCount}`;
    values.push(filters.action);
  }

  if (filters.entity) {
    paramCount++;
    whereClause += ` AND al.entity = $${paramCount}`;
    values.push(filters.entity);
  }

  // Count total with filters
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM audit_logs al 
    WHERE 1=1 ${whereClause}
  `;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total);

  // Fetch paginated results
  paramCount++;
  values.push(limit);
  paramCount++;
  values.push(offset);

  const query = `
    SELECT 
      al.*,
      u.name as user_name,
      u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1 ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT $${paramCount - 1} OFFSET $${paramCount}
  `;

  const result = await pool.query(query, values);

  return {
    logs: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
