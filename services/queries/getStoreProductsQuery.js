const getStoreProductsQuery = ({
  min = 0,
  max = Infinity,
  rating = 0,
  inDiscount = false,
  isNew = false,
  generalRecommendation = false,
}) => {
  rating = Number(rating);
  max = Number(max);
  min = Number(min);

  const priceFilter = { price: { $gte: min, $lte: max } };

  const ratingFilter = { rating: { $gte: rating } };

  const startDate = isNew ? new Date(new Date().setDate(1)) : new Date();
  const endDate = new Date();

  const matchQuery = {
    isActive: true,
    price: priceFilter.price,
    averageRating: ratingFilter.rating,
  };

  isNew && (matchQuery.created = { $gte: startDate, $lt: endDate });
  inDiscount && (matchQuery.isDiscounted = true);
  generalRecommendation &&
    (matchQuery.quantity = { $gt: 10 }) &&
    (matchQuery.averageRating = { $gte: 4.5 });

  const basicQuery = [
    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brands",
      },
    },
    {
      $unwind: {
        path: "$brands",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        "brand.name": "$brands.name",
        "brand._id": "$brands._id",
        "brand.isActive": "$brands.isActive",
      },
    },
    {
      $match: {
        "brand.isActive": true,
      },
    },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "product",
        as: "reviews",
      },
    },
    {
      $addFields: {
        totalRatings: { $sum: "$reviews.rating" },
        totalReviews: { $size: "$reviews" },
      },
    },
    {
      $addFields: {
        averageRating: {
          $cond: [
            { $eq: ["$totalReviews", 0] },
            0,
            { $divide: ["$totalRatings", "$totalReviews"] },
          ],
        },
      },
    },
    {
      $addFields: {
        isDiscounted: {
          $cond: {
            if: { $gt: ["$discountedPrice", 0] }, // Check if discountedPrice is greater than 0
            then: {
              $cond: {
                if: {
                  $and: [
                    // Check different cases for discountStart and discountEnd
                    { $ifNull: ["$discountStart", true] }, // If discountStart is not defined or null, consider it true
                    { $ifNull: ["$discountEnd", true] }, // If discountEnd is not defined or null, consider it true
                    {
                      $or: [
                        { $lte: ["$discountStart", new Date()] }, // Check if discountStart is less than or equal to now
                        { $gte: ["$discountEnd", new Date()] }, // Check if discountEnd is greater than or equal to now
                      ],
                    },
                  ],
                },
                then: true, // Return true if all conditions are met
                else: false, // Return false otherwise
              },
            },
            else: false, // Return false if discountedPrice is 0 or not defined
          },
        },
      },
    },
    {
      $match: {
        ...matchQuery,
      },
    },
    {
      $project: {
        brands: 0,
        reviews: 0,
      },
    },
  ];

  return basicQuery;
};

module.exports = getStoreProductsQuery;
