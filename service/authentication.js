const jwt = require('jsonwebtoken');

const SECRET = 'superBahubali';

function createTokenForUser(user) {
  const payload = {
    _id: user._id,
    email: user.email,
    FullName:user.FullName,
    profileImage: user.profileImage,
    role: user.role,
  };
  return jwt.sign(payload, SECRET, { expiresIn: '1h' }); // Added token expiration
}

function validateToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = {
  createTokenForUser,
  validateToken,
};
