import jwt from "jsonwebtoken";

// Roles the system knows about. "admin" is reserved for the future super-admin.
const VALID_ROLES = ["student", "teacher", "admin"];

export function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;

  // Check whether the Authorization header exists
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token required.",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token required.",
    });
  }

  // Ensure the JWT secret is configured
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");

    return res.status(500).json({
      success: false,
      message: "Authentication service configuration error.",
    });
  }

  try {
    // Verify the token's signature and expiry
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // Validate the required token fields
    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
            !VALID_ROLES.includes(payload.role)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    // Attach authenticated user information to the request
    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    // IMPORTANT: Continue to the next middleware or route
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Authentication service error.",
    });
  }
}

export function requireAdmin(req, res, next) {
  // Only allow authenticated administrators
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Administrator access required.",
    });
  }

  return next();
}

// Teachers manage their own exams. The admin can do everything a teacher can.
export function requireTeacher(req, res, next) {
  if (!["teacher", "admin"].includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: "Teacher access required.",
    });
  }
  return next();
}


export function requireStudent(req, res, next) {
  if (req.user?.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Student access required.",
    });
  }

  return next();
}

