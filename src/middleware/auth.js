const jwt = require("jsonwebtoken")

function requireAuth(req, res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: "Missing token" })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: "Invalid token" })
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })
    if (req.user.role !== role)
      return res.status(403).json({ message: "Forbidden" })
    next()
  }
}

module.exports = { requireAuth, requireRole }
