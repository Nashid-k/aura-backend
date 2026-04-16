import jwt from 'jsonwebtoken';
import User from '../modules/auth/models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aura-local-secret';

export async function authMiddleware(request, response, next) {
  const header = request.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return response.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.userId).lean();

    if (!user) {
      return response.status(401).json({ message: 'Invalid session.' });
    }

    request.user = user;
    return next();
  } catch (_error) {
    return response.status(401).json({ message: 'Invalid session.' });
  }
}

export function createToken(user) {
  return jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
}
