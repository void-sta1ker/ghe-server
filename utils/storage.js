const AWS = require("aws-sdk");
const keys = require("../config/keys");

exports.s3Upload = async (image) => {
  let imageUrl = "";
  let imageKey = "";

  if (image) {
    const s3bucket = new AWS.S3({
      accessKeyId: keys.aws.accessKeyId,
      secretAccessKey: keys.aws.secretAccessKey,
      region: keys.aws.region,
    });

    const params = {
      Bucket: keys.aws.bucketName,
      Key: image.originalname, // a timestamp or UUID
      Body: image.buffer,
      ContentType: image.mimetype,
      // ACL: "public-read",
    };

    const s3Upload = await s3bucket.upload(params).promise();

    imageUrl = s3Upload.Location;
    imageKey = s3Upload.Key;
  }

  return { imageUrl, imageKey };
};

exports.s3ListAll = async () => {
  const s3bucket = new AWS.S3({
    accessKeyId: keys.aws.accessKeyId,
    secretAccessKey: keys.aws.secretAccessKey,
    region: keys.aws.region,
  });

  const params = {
    Bucket: keys.aws.bucketName,
  };

  const s3List = await s3bucket.listObjectsV2(params).promise();

  return s3List.Contents;
};
