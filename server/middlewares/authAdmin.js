// auth for check is admin or not
module.exports = (req, res, next) => {

  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  next();

};