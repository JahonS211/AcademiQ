const jwt = require("jsonwebtoken");

const adminMiddleware = (req, res, next) => {
  const staticToken = req.headers["x-admin-token"];
  if (process.env.ADMIN_TOKEN && staticToken === process.env.ADMIN_TOKEN) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
      if (decoded?.role === "admin" && decoded?.type === "admin") {
        req.admin = { email: decoded.email };
        return next();
      }
    } catch (error) {
      // fall through to forbidden response
    }
  }

  return res.status(403).json({ message: "Forbidden: admin access required" });
};

module.exports = adminMiddleware;
