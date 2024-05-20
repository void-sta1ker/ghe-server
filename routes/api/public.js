const express = require("express");
const AWS = require("aws-sdk");
const keys = require("../../config/keys");

const router = express.Router();

const s3 = new AWS.S3();

router.get("/images/:key", async (req, res) => {
  try {
    const { key } = req.params;

    const params = {
      Bucket: keys.aws.bucketName,
      Key: key,
    };

    s3.getObject(params, (err, data) => {
      if (err) throw new Error(err);

      res.setHeader("Content-Type", data.ContentType);
      res.send(data.Body);
    });
  } catch (err) {
    console.error("Error fetching image:", err);
    res.status(500).send("Error fetching image");
  }
});

module.exports = router;
