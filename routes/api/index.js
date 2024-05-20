const express = require("express");
const publicRoutes = require("./public");
const authRoutes = require("./auth");
const productRoutes = require("./product");
const userRoutes = require("./user");
const merchantRoutes = require("./merchant");
const orderRoutes = require("./order");
const brandRoutes = require("./brand");
const addressRoutes = require("./address");
const cartRoutes = require("./cart");
const categoryRoutes = require("./category");
const contactRoutes = require("./contact");
const reviewRoutes = require("./review");
const wishlistRoutes = require("./wishlist");
const statusRoutes = require("./status");
const roleRoutes = require("./role");
const dashboardRoutes = require("./dashboard");

const router = express.Router();

router.use("/public", publicRoutes);
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/users", userRoutes);
router.use("/merchants", merchantRoutes);
router.use("/orders", orderRoutes);
router.use("/brands", brandRoutes);
router.use("/categories", categoryRoutes);
router.use("/reviews", reviewRoutes);
router.use("/addresses", addressRoutes);
router.use("/contact", contactRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/cart", cartRoutes);
router.use("/statuses", statusRoutes);
router.use("/roles", roleRoutes);
router.use("/dashboard", dashboardRoutes);

// router.use("*", (req, res) => {
//   res.status(404).json({ success: false, message: "not found" });
// });

module.exports = router;
