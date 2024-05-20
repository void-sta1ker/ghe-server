const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const Product = require("../../models/product");
const Brand = require("../../models/brand");
const Category = require("../../models/category");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const { ROLES } = require("../../constants");
const { s3Upload } = require("../../utils/storage");
const checkAuth = require("../../helpers/checkAuth");
const {
  getStoreProductsQuery,
  getStoreProductsWishlistQuery,
} = require("../../services/queries");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

const jsonParser = bodyParser.json();

router.get(
  "/",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  async (req, res) => {
    try {
      let products = [];

      const { page = 1, limit = 10, search = "", ids = [] } = req.query;

      let query = {};

      if (ids.length > 0) {
        query = {
          _id: { $in: ids },
        };
      }

      if (search) {
        query = {
          $or: [
            { name: { $regex: new RegExp(search, "i") } },
            { description: { $regex: new RegExp(search, "i") } },
            { sku: { $regex: new RegExp(search, "i") } },
            { barcode: { $regex: new RegExp(search, "i") } },
          ],
        };
      }

      if (req.user.merchant) {
        const brands = await Brand.find({
          merchant: req.user.merchant,
        }).populate("merchant", "_id");

        const brandId = brands[0]?.["_id"]; // many brands can be attached to one merchant

        products = await Product.find(query)
          .populate({
            path: "brand",
            populate: {
              path: "merchant",
              model: "Merchant",
            },
          })
          .where("brand", brandId);
      } else {
        products = await Product.find(query)
          // .populate({
          //   path: "brand",
          //   populate: {
          //     path: "merchant",
          //     model: "Merchant",
          //   },
          // })
          .sort("-created")
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .exec();
      }

      const count = await Product.countDocuments(query);

      res.status(200).json({
        results: products,
        count,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

router.post(
  "/",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  upload.array("images", 10),
  async (req, res) => {
    try {
      const sku = req.body.sku;
      const barcode = req.body.barcode;
      const name = req.body.name;
      const description = req.body.description;
      const quantity = req.body.quantity;
      const price = req.body.price;
      const isActive = req.body.is_active;
      const brand = req.body.brand;
      const colors = req.body.colors;
      const discountedPrice = req.body.discountedPrice;
      const discountStart = req.body.discountStart;
      const discountEnd = req.body.discountEnd;
      const files = req.files;

      if (!sku) {
        return res
          .status(400)
          .json({ success: false, message: "You must enter sku." });
      }

      if (!description || !name) {
        return res.status(400).json({
          success: false,
          message: "You must enter description & name.",
        });
      }

      if (!quantity) {
        return res
          .status(400)
          .json({ success: false, message: "You must enter a quantity." });
      }

      if (!price) {
        return res
          .status(400)
          .json({ success: false, message: "You must enter a price." });
      }

      const foundProduct = await Product.findOne({ sku });

      if (foundProduct) {
        return res
          .status(400)
          .json({ success: false, message: "This sku is already in use." });
      }

      let images = [];

      for await (const file of files) {
        const { imageUrl, imageKey } = await s3Upload(file);
        images.push({
          imageUrl,
          imageKey,
        });
      }

      const product = new Product({
        sku,
        barcode,
        name,
        description,
        quantity,
        price,
        isActive,
        images,
        colors,
        discountedPrice: discountedPrice || 0,
        discountStart,
        discountEnd,
      });

      if (brand) {
        product.brand = brand;
      }

      const savedProduct = await product.save();

      res.status(200).json({
        success: true,
        message: `Product has been added successfully!`,
        product: savedProduct,
      });
    } catch (error) {
      console.error(error);
      return res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
      });
    }
  },
);

const sortByMapping = {
  all: { _id: 1 },
  "most-expensive": { price: -1 },
  cheapest: { price: 1 },
};

router.get("/list", async (req, res) => {
  try {
    let {
      // sortOrder,
      sortBy = "all",
      rating,
      max,
      min,
      category,
      inDiscount = false,
      isNew = false,
      generalRecommendation = false,
      page = 1,
      limit = 10,
    } = req.query;

    // if (!sortOrder) {
    //   sortOrder = '{ "created": -1 }';
    // }

    // sortOrder = JSON.parse(sortOrder);

    const sortCriteria = sortByMapping[sortBy];

    const categoryFilter = category ? { category } : {};

    const basicQuery = getStoreProductsQuery({
      min,
      max,
      rating,
      inDiscount,
      isNew,
      generalRecommendation,
    });

    const userDoc = await checkAuth(req);

    const categoryDoc = await Category.findOne(
      { slug: categoryFilter.category, isActive: true },
      "products name description _id",
    );

    if (categoryDoc && categoryFilter !== category) {
      basicQuery.push({
        $match: {
          isActive: true,
          _id: {
            $in: Array.from(categoryDoc.products),
          },
        },
      });
    }

    let products = null;
    const productsCount = await Product.aggregate(basicQuery);
    const count = productsCount.length;
    const size = count > limit ? page - 1 : 0;
    const currentPage = count > limit ? Number(page) : 1;

    // paginate query
    const paginateQuery = [
      { $sort: sortCriteria }, // sortOrder
      { $skip: size * limit },
      { $limit: limit * 1 },
    ];

    if (userDoc) {
      const wishListQuery = getStoreProductsWishlistQuery(userDoc.id).concat(
        basicQuery,
      );

      products = await Product.aggregate(
        [{ $addFields: { id: "$_id" } }]
          .concat(wishListQuery)
          .concat(paginateQuery),
        { includeVirtuals: true },
      );
    } else {
      products = await Product.aggregate(
        [{ $addFields: { id: "$_id" } }]
          .concat(basicQuery)
          .concat(paginateQuery),
        { includeVirtuals: true },
      );
    }

    products = products.map((product) => {
      const now = new Date();

      const hasDiscountedPrice = Boolean(product.discountedPrice);

      // if only discountedPrice defined, perpetual discount
      if (!product.discountStart && !product.discountEnd) {
        return {
          ...product,
          isDiscounted: hasDiscountedPrice && product.discountedPrice > 0,
        };
      }

      if (!product.discountEnd) {
        return {
          ...product,
          isDiscounted:
            hasDiscountedPrice &&
            product.discountStart &&
            now >= product.discountStart,
        };
      }

      if (!product.discountStart) {
        return {
          ...product,
          isDiscounted:
            hasDiscountedPrice &&
            product.discountEnd &&
            now <= product.discountEnd,
        };
      }

      return {
        ...product,
        isDiscounted:
          hasDiscountedPrice &&
          product.discountStart &&
          product.discountEnd &&
          now >= product.discountStart &&
          now <= product.discountEnd,
      };
    });

    res.status(200).json({
      category: categoryDoc
        ? {
            id: categoryDoc.id,
            name: categoryDoc.name,
            description: categoryDoc.description,
          }
        : null,
      results: products,
      count,
    });
  } catch (error) {
    console.log("error", error);

    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get(
  "/:id",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  async (req, res) => {
    try {
      const productId = req.params.id;

      let productDoc = null;

      if (req.user.merchant) {
        // const brands = await Brand.find({
        //   merchant: req.user.merchant,
        // }).populate("merchant", "_id");

        // const brandId = brands[0]["_id"];

        productDoc = await Product.findOne({ _id: productId });
        // .populate({
        //   path: "brand",
        //   select: "name",
        // })
        // .where("brand", brandId);
      } else {
        productDoc = await Product.findOne({ _id: productId });
        // .populate({
        //   path: "brand",
        //   select: "name",
        // });
      }

      if (!productDoc) {
        return res.status(404).json({
          success: false,
          message: "No product found.",
        });
      }

      res.status(200).json(productDoc);
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
      });
    }
  },
);

router.put(
  "/:id",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  upload.array("images", 10),
  async (req, res) => {
    try {
      const productId = req.params.id;
      const update = req.body;
      const query = { _id: productId };
      const { sku } = req.body;
      const files = req.files;

      const foundProduct = await Product.findOne({
        $or: [{ sku }],
      });

      if (foundProduct && foundProduct._id != productId) {
        return res
          .status(400)
          .json({ success: false, message: "Sku is already in use." });
      }

      let images = [];

      for await (const file of files) {
        const { imageUrl, imageKey } = await s3Upload(file);
        images.push({
          imageUrl,
          imageKey,
        });
      }

      await Product.findOneAndUpdate(
        query,
        {
          ...update,
          brand: update.brand || null,
          discountedPrice: update.discountedPrice || 0,
          discountStart: update.discountStart || null,
          discountEnd: update.discountEnd || null,
          images,
        },
        {
          new: true,
        },
      );

      res.status(200).json({
        success: true,
        message: "Product has been updated successfully!",
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
      });
    }
  },
);

router.delete(
  "/:id",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  async (req, res) => {
    try {
      const product = await Product.deleteOne({ _id: req.params.id });

      res.status(200).json({
        success: true,
        message: `Product has been deleted successfully!`,
        product,
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
      });
    }
  },
);

router.get("/list/select", auth, async (req, res) => {
  try {
    const products = await Product.find({}, "name");

    const count = await Product.countDocuments();

    res.status(200).json({
      results: products,
      count,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get("/list/search/:name", async (req, res) => {
  try {
    const name = req.params.name;

    const productDoc = await Product.find(
      { name: { $regex: new RegExp(name), $options: "is" }, isActive: true },
      { name: 1, price: 1, _id: 1, images: 1 },
    );

    if (productDoc.length < 0) {
      return res.status(404).json({
        success: false,
        message: "No product found.",
      });
    }

    res.status(200).json({
      results: productDoc,
      count: productDoc.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

// error in this route
router.get("/list/brand/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;

    const brand = await Brand.findOne({ slug, isActive: true });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: `Cannot find brand with the slug: ${slug}.`,
      });
    }

    const userDoc = await checkAuth(req);

    if (userDoc) {
      const products = await Product.aggregate([
        {
          $match: {
            isActive: true,
            brand: brand._id,
          },
        },
        {
          $lookup: {
            from: "wishlists",
            let: { product: "$_id" },
            pipeline: [
              {
                $match: {
                  $and: [
                    { $expr: { $eq: ["$$product", "$product"] } },
                    { user: new Mongoose.Types.ObjectId(userDoc.id) },
                  ],
                },
              },
            ],
            as: "isLiked",
          },
        },
        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brands",
          },
        },
        {
          $addFields: {
            isLiked: { $arrayElemAt: ["$isLiked.isLiked", 0] },
          },
        },
        {
          $unwind: "$brands",
        },
        {
          $addFields: {
            "brand.name": "$brands.name",
            "brand._id": "$brands._id",
            "brand.isActive": "$brands.isActive",
          },
        },
        { $project: { brands: 0 } },
      ]);

      res.status(200).json({
        results: products.reverse().slice(0, 10),
        count: products.length,
      });
    } else {
      const products = await Product.find({
        brand: brand._id,
        isActive: true,
      }).populate("brand", "name");

      res.status(200).json({
        results: products.reverse().slice(0, 10),
        count: products.length,
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get("/item/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const productDoc = await Product.findById(id).populate({
      path: "brand",
      select: "name isActive _id",
    });

    const hasNoBrand =
      productDoc?.brand === null || productDoc?.brand?.isActive === false;

    if (!productDoc || !productDoc.isActive || hasNoBrand) {
      return res.status(404).json({
        success: false,
        message: "No product found.",
      });
    }

    const categoryDoc = await Category.findOne({
      isActive: true,
      products: productDoc._id,
    });

    const productObj = productDoc.toObject();

    productObj.category = {
      id: categoryDoc._id,
      name: categoryDoc.name,
      slug: categoryDoc.slug,
    };

    res.status(200).json(productObj);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.put(
  "/:id/active",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  jsonParser,
  async (req, res) => {
    try {
      const productId = req.params.id;
      const update = req.body;
      const query = { _id: productId };

      await Product.findOneAndUpdate(query, update, {
        new: true,
      });

      res.status(200).json({
        success: true,
        message: "Product has been updated successfully!",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
      });
    }
  },
);

module.exports = router;
