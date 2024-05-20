const check =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).send({
        success: false,
        message: "Unauthenticated",
      });
    }

    const hasRole = roles.find((role) => req.user.role === role);

    if (!hasRole) {
      return res.status(403).send({
        success: false,
        message: "You are not allowed to make this request.",
      });
    }

    return next();
  };

const role = { check };

module.exports = role;
