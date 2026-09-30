const jwt = require('jsonwebtoken');

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.realm_access || !decoded.realm_access.roles) {
      return res.status(403).json({ error: "Rôles introuvables dans le token" });
    }

    const userRoles = decoded.realm_access.roles;
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: "Accès refusé : rôle insuffisant" });
    }

    req.user = decoded;
    next();
  };
}

module.exports = requireRole;
