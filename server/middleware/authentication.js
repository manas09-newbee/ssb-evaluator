const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET );
      
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized." });
      }
      return next();
    } catch (err) {
      console.error("[Auth Middleware Error]:", err.message);
      return res.status(401).json({ message: "Not authorized, token validation failed." });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no session token provided." });
  }
};

module.exports = { protect };