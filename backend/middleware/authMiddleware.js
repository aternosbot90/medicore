const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'No token provided' });

  // Token usually comes as "Bearer <token>"
  const tokenString = token.split(' ')[1] || token;

  jwt.verify(tokenString, process.env.JWT_SECRET || 'medicore_secret_key', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.user = decoded;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Require Admin Role' });
  }
};

module.exports = { verifyToken, isAdmin };
