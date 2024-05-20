const express = require("express");
const path = require("path");
const logger = require("../middleware/logger");
const keys = require("../config/keys");
const apiRoutes = require("./api");
const { s3ListAll } = require("../utils/storage");

const router = express.Router();

const api = keys.app.apiURL;

const appDir = path.dirname(require.main.filename);

// serve static files using express.static middleware function
router.use(`/static`, express.static(path.join(appDir, "public")));

router.use(`/s3-assets`, async (req, res) => {
  const list = await s3ListAll();

  res.status(200).json({
    data: list,
  });
});

router.use(logger);

router.use(api, apiRoutes);

router.use(api, (req, res, next) => {
  res.status(404).json({ success: false, message: "Not found" });
});

module.exports = router;
