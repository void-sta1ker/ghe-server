const router = require("express").Router();
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const { ROLES } = require("../../constants");

router.get("/", auth, role.check(ROLES.admin), (req, res) => {
  const roles = Object.values(ROLES);

  res.status(200).json({
    results: roles,
  });
});

module.exports = router;
