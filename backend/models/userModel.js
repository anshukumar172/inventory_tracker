const pool = require('../db');
const { hashPassword } = require('../middleware/auth');

exports.findByUsername = async (username) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
};

exports.findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
};

exports.create = async ({ username, full_name, email, password, role }) => {
  const password_hash = await hashPassword(password);
  const [result] = await pool.query(
    'INSERT INTO users (username, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [username, full_name, email, password_hash, role]
  );
  return result.insertId;
};

exports.getAll = async () => {
  const [rows] = await pool.query('SELECT id, username, full_name, email, role, created_at FROM users ORDER BY created_at DESC');
  return rows;
};

exports.updateById = async (id, updates) => {
  const fields = [];
  const values = [];

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });

  if (fields.length === 0) return false;

  values.push(id);
  const [result] = await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  return result.affectedRows > 0;
};

exports.deleteById = async (id) => {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
