const express = require("express");
const Order = require("../../models/order");
const Product = require("../../models/product");
const User = require("../../models/user");
const Cart = require("../../models/cart");
const Merchant = require("../../models/merchant");
const Review = require("../../models/review");
const Category = require("../../models/category");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const { ROLES, CART_ITEM_STATUS } = require("../../constants");

const router = express.Router();

router.get(
  "/summary",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  async (req, res) => {
    try {
      const { start_date = "", end_date = "" } = req.query;

      const customers = await User.find({
        // created: { $gte: start_date, $lte: end_date },
        role: { $nin: [ROLES.admin, ROLES.merchant] },
      }).countDocuments();

      const sales = await Order.aggregate([
        {
          $lookup: {
            from: "carts",
            localField: "cart",
            foreignField: "_id",
            as: "cart",
          },
        },
        {
          $unwind: "$cart",
        },
        {
          $unwind: "$cart.products",
        },
        {
          $match: {
            "cart.products.status": CART_ITEM_STATUS.delivered,
          },
        },
        {
          $group: {
            _id: "$cart.products.product",
            total: { $sum: "$cart.products.quantity" },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
          },
        },
      ]);

      const lowStock = await Product.find({
        quantity: { $lte: 10 },
      }).countDocuments();

      const returns = await Order.aggregate([
        {
          $lookup: {
            from: "carts",
            localField: "cart",
            foreignField: "_id",
            as: "cart",
          },
        },
        {
          $unwind: "$cart",
        },
        {
          $unwind: "$cart.products",
        },
        {
          $match: {
            "cart.products.status": CART_ITEM_STATUS.cancelled,
          },
        },
        {
          $group: {
            _id: "$cart.products.product",
            total: { $sum: "$cart.products.quantity" },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
          },
        },
      ]);

      res.status(200).json({
        customers,
        sales: sales.length > 0 ? sales[0].total : 0,
        lowStock,
        returns: returns.length > 0 ? returns[0].total : 0,
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

router.get(
  "/statuses",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  async (req, res) => {
    try {
      const { start_date = "", end_date = "" } = req;

      // wrong, not calculating orders statuses, but calculating cart items statuses
      const orderStatuses = await Cart.aggregate([
        {
          $unwind: "$products",
        },
        {
          $group: {
            _id: "$products.status",
            totalCartItems: { $sum: 1 },
          },
        },
        {
          $project: {
            status: "$_id",
            total: "$totalCartItems",
            _id: 0,
          },
        },
      ]);

      const merchantStatuses = await Merchant.aggregate([
        {
          $group: {
            _id: "$status",
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            status: "$_id",
            _id: 0,
            total: 1,
          },
        },
      ]);

      const reviewStatuses = await Review.aggregate([
        {
          $group: {
            _id: "$status",
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            status: "$_id",
            _id: 0,
            total: 1,
          },
        },
      ]);

      res.status(200).json({
        orders: orderStatuses,
        merchants: merchantStatuses,
        reviews: reviewStatuses,
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

router.get(
  "/top-products",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  async (req, res) => {
    try {
      const { start_date = "", end_date = "" } = req;

      const products = await Order.aggregate([
        {
          $unwind: "$cart",
        },
        {
          $unwind: "$cart.products",
        },
        {
          $match: {
            "cart.products.status": CART_ITEM_STATUS.delivered,
          },
        },
        {
          $group: {
            _id: "$cart.products.product",
            total: { $sum: "$cart.products.quantity" },
          },
        },
        {
          $sort: {
            total: -1,
          },
        },
        {
          $limit: 10,
        },
      ]);

      res.status(200).json({
        products,
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

router.get(
  "/customer-growth",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  async (req, res) => {
    try {
      const { start_date = "", end_date = "" } = req;

      const customers = await User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(start_date),
              $lte: new Date(end_date),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            total: { $sum: 1 },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

      res.status(200).json({
        customers,
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

router.get(
  "/total-sales",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  async (req, res) => {
    try {
      const { start_date = "", end_date = "" } = req;

      res.status(200).json({
        success: true,
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

router.get(
  "/categorical-sales",
  auth,
  role.check(ROLES.admin, ROLES.merchant),
  async (req, res) => {
    try {
      const { start_date = "", end_date = "" } = req;

      const categories = await Order.aggregate([
        {
          $unwind: "$cart",
        },
        {
          $unwind: "$cart.products",
        },
        {
          $match: {
            "cart.products.status": CART_ITEM_STATUS.delivered,
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "cart.products.product",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $unwind: "$product",
        },
        {
          $group: {
            _id: "$product.category", // there is no category field in product schema
            total: { $sum: "$cart.products.quantity" },
          },
        },
        {
          $sort: {
            total: -1,
          },
        },
        {
          $limit: 10,
        },
      ]);

      res.status(200).json({
        categories,
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

module.exports = router;
