const jwt = require("jsonwebtoken");

/**
 * Middleware requireRole — copie exacte du pattern employee-service
 * Kong a déjà validé la signature JWT, on decode seulement pour lire les rôles.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.decode(token); // Pas de vérification signature ici, Kong l'a déjà faite

    if (!decoded || !decoded.realm_access || !decoded.realm_access.roles) {
      return res.status(403).json({ error: "Rôles introuvables dans le token" });
    }

    const userRoles = decoded.realm_access.roles;
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: "Accès refusé : rôle insuffisant" });
    }

    req.user = decoded; // Disponible dans les routes suivantes si besoin
    next();
  };
}

module.exports = requireRole;
