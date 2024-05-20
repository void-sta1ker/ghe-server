const express = require("express");
const bodyParser = require("body-parser");
const Category = require("../../models/category");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const store = require("../../services/store");
const { ROLES } = require("../../constants");

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
      const products = req.body.products;
      const isActive = req.body.isActive;
      const { slug } = req.body;

      const foundCategory = await Category.findOne({
        $or: [{ slug }],
      });

      if (foundCategory) {
        return res
          .status(400)
          .json({ success: false, message: "Slug is already in use." });
      }

      if (!description || !name) {
        return res.status(400).json({
          success: false,
          message: "You must enter description & name.",
        });
      }

      const category = new Category({
        name,
        description,
        slug,
        products,
        isActive,
      });

      await category.save();

      res.status(200).json({
        success: true,
        message: `Category has been added successfully!`,
        category: category,
      });
    } catch (err) {
      console.error(err);
      res.status(400).json({
        success: false,
        message: "Your request could not be processed. Please try again.",
      });
    }
  },
);

router.get("/list", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }, "slug name id");

    res.status(200).json({
      results: categories,
      count: categories.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({});
    res.status(200).json({
      results: categories,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;

    const categoryDoc = await Category.findOne({ _id: categoryId });
    // .populate({
    //   path: "products",
    //   select: "name",
    // });

    if (!categoryDoc) {
      return res.status(404).json({
        message: "No Category found.",
      });
    }

    res.status(200).json(categoryDoc);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

router.put(
  "/:id",
  auth,
  role.check(ROLES.admin, ROLES.merchant), // added merchant
  jsonParser,
  async (req, res) => {
    try {
      const categoryId = req.params.id;
      const update = req.body;
      const query = { _id: categoryId };
      const { slug } = req.body;

      const foundCategory = await Category.findOne({
        $or: [{ slug }],
        _id: categoryId,
      });

      if (foundCategory && foundCategory._id != categoryId) {
        return res.status(400).json({ error: "Slug is already in use." });
      }

      await Category.findOneAndUpdate(
        query,
        { ...update },
        {
          new: true,
        },
      );

      res.status(200).json({
        success: true,
        message: "Category has been updated successfully!",
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
  role.check(ROLES.admin),
  jsonParser,
  async (req, res) => {
    try {
      const categoryId = req.params.id;
      const update = req.body;
      const query = { _id: categoryId };

      if (!update.isActive) {
        const categoryDoc = await Category.findOne(
          { _id: categoryId, isActive: true },
          "products -_id",
        ).populate("products");

        store.disableProducts(categoryDoc.products);
      }

      await Category.findOneAndUpdate(query, update, {
        new: true,
      });

      res.status(200).json({
        success: true,
        message: "Category has been updated successfully!",
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
    const product = await Category.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: `Category has been deleted successfully!`,
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Your request could not be processed. Please try again.",
    });
  }
});

module.exports = router;
