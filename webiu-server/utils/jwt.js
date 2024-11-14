// utils/jwt.js
const jwt = require('jsonwebtoken');

const signToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

module.exports = { signToken };
