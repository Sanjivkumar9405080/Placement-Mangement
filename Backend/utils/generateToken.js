const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'placement_secret_key_jwt_2026_secure';
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

module.exports = generateToken;
