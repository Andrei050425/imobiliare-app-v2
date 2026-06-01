module.exports = function (req, res, next) {
  // req.user este populat deja de Passport
  if (req.user && req.user.role === "admin") {
    next(); // E admin, treci mai departe
  } else {
    res.status(403).json({ message: "Access Denied. Admins only." });
  }
};
