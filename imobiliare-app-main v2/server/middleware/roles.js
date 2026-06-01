/**
 * Middleware de autorizare pe roluri.
 * Folosire: router.get("/", auth, requireRole("admin", "contabil"), handler)
 * Rolurile sistemului: admin, contabil, tehnic, client.
 */
module.exports = function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Neautentificat." });
    }
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res
      .status(403)
      .json({ message: "Acces interzis pentru rolul curent." });
  };
};
