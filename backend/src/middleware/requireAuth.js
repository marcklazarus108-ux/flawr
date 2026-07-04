import { verifyToken } from "../utils/token.js";

// Reads the "Authorization: Bearer <token>" header, verifies it, and attaches
// the logged-in user's id to req.userId. Every protected route uses this.
export default function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "You need to sign in to do that." });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Your session expired. Sign in again." });
  }
}
