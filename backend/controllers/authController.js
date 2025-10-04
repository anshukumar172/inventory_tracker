const userModel = require('../models/userModel');
const { comparePassword, generateToken } = require('../middleware/auth');

// POST /api/v1/auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await userModel.findByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/v1/auth/register (admin only)
exports.register = async (req, res) => {
  try {
    const { username, full_name, email, password, role } = req.body;
    const existingUser = await userModel.findByUsername(username);
    if (existingUser) return res.status(409).json({ error: 'Username already exists' });

    const userId = await userModel.create({ username, full_name, email, password, role });
    res.status(201).json({ message: 'User created successfully', userId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/v1/auth/me
exports.getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
