const Mongoose = require("mongoose");

const getStoreProductsWishlistQuery = (userId) => {
  const wishlistQuery = [
    {
      $lookup: {
        from: "wishlists",
        let: { product: "$_id" },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ["$$product", "$product"] } },
                { user: new Mongoose.Types.ObjectId(userId) },
              ],
            },
          },
        ],
        as: "isLiked",
      },
    },
    {
      $addFields: {
        isLiked: { $arrayElemAt: ["$isLiked.isLiked", 0] },
      },
    },
  ];

  return wishlistQuery;
};

module.exports = getStoreProductsWishlistQuery;
