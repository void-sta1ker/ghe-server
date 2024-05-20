const express = require("express");
const bodyParser = require("body-parser");
const Brand = require("../../models/brand");
const Product = require("../../models/product");
const Merchant = require("../../models/merchant");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const store = require("../../services/store");
const { ROLES, MERCHANT_STATUS } = require("../../constants");

const router = express.Router();

const jsonParser = bodyParser.json();

router.post(
  "/",
  auth,
  role.check(ROLES.admin),
  jsonParser,
  async (req, res) => {
    try {
      const name = req.body.name;
      const description = req.body.description;
      const isActive = req.body.isActive;

      if (!description || !name) {
        return res.status(400).json({
          success: false,
          message: "You must enter description & name.",
        });
      }

      const brand = new Brand({
        name,
        description,
        isActive,
      });

      const brandDoc = await brand.save();

      res.status(200).json({
        success: true,
        message: `Brand has been added successfully!`,
        brand: brandDoc,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
      });
    }
  },
);

router.get("/list", async (req, res) => {
  try {
    const brands = await Brand.find({
      isActive: true,
    }).populate("merchant", "name");

    res.status(200).json({
      brands,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get(
  "/",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  async (req, res) => {
    try {
      let brands = null;

      if (req.user.merchant) {
        brands = await Brand.find({
          merchant: req.user.merchant,
        }).populate("merchant", "name");
      } else {
        brands = await Brand.find({}).populate("merchant", "name");
      }

      res.status(200).json({
        results: brands,
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

router.get("/:id", async (req, res) => {
  try {
    const brandId = req.params.id;

    const brandDoc = await Brand.findOne({ _id: brandId });
    // .populate(
    //   "merchant",
    //   "_id name",
    // );

    if (!brandDoc) {
      return res.status(404).json({
        message: `Cannot find brand with the id: ${brandId}.`,
      });
    }

    res.status(200).json(brandDoc);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get(
  "/list/select",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  async (req, res) => {
    try {
      let brands = null;

      if (req.user.merchant) {
        brands = await Brand.find(
          {
            merchant: req.user.merchant,
          },
          "name",
        );
      } else {
        brands = await Brand.find({}, "name");
      }

      res.status(200).json({
        brands,
      });
    } catch (error) {
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
  jsonParser,
  async (req, res) => {
    try {
      const brandId = req.params.id;
      const update = req.body;
      const query = { _id: brandId };
      const { slug } = req.body;

      const foundBrand = await Brand.findOne({
        $or: [{ slug }],
      });

      if (foundBrand && foundBrand._id != brandId) {
        return res
          .status(400)
          .json({ success: false, message: "Slug is already in use." });
      }

      await Brand.findOneAndUpdate(
        query,
        { ...update, merchant: update.merchant || null },
        {
          new: true,
        },
      );

      res.status(200).json({
        success: true,
        message: "Brand has been updated successfully!",
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

router.put(
  "/:id/active",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  jsonParser,
  async (req, res) => {
    try {
      const brandId = req.params.id;
      const update = req.body;
      const query = { _id: brandId };

      // disable brand(brandId) products
      if (!update.isActive) {
        const products = await Product.find({ brand: brandId });
        store.disableProducts(products);
      }

      await Brand.findOneAndUpdate(query, update, {
        new: true,
      });

      res.status(200).json({
        success: true,
        message: "Brand has been updated successfully!",
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

router.delete("/:id", auth, role.check(ROLES.admin), async (req, res) => {
  try {
    const brandId = req.params.id;
    await deactivateMerchant(brandId);
    const brand = await Brand.deleteOne({ _id: brandId });

    res.status(200).json({
      success: true,
      message: `Brand has been deleted successfully!`,
      brand,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

const deactivateMerchant = async (brandId) => {
  const brandDoc = await Brand.findOne({ _id: brandId }).populate(
    "merchant",
    "_id",
  );
  if (!brandDoc || !brandDoc.merchant) return;
  const merchantId = brandDoc.merchant._id;
  const query = { _id: merchantId };
  const update = {
    status: MERCHANT_STATUS.Waiting_Approval,
    isActive: false,
    brand: null,
  };
  return await Merchant.findOneAndUpdate(query, update, {
    new: true,
  });
};

module.exports = router;
