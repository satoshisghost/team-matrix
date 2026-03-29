import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const coachOnly = (req, res, next) => {
  const staffRoles = ['coach', 'admin', 'director', 'team_manager'];
  if (!staffRoles.includes(req.userRole)) {
    return res.status(403).json({ error: 'Coach/Staff access only' });
  }
  next();
};

export const adminOnly = (req, res, next) => {
  if (!['admin', 'director'].includes(req.userRole)) {
    return res.status(403).json({ error: 'Admin access only' });
  }
  next();
};
