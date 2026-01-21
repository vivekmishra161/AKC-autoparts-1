const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const { getProducts } = require("../models/productData");
const Review = require("../models/review");

router.get("/products", adminAuth, async (req, res) => {
  try {
    const products = await getProducts();

    console.log("ADMIN PRODUCTS:", products.length);

    res.render("admin/products", {
      products
    });

  } catch (err) {
    console.log("Admin product error:", err);
    res.render("admin/products", { products: [] });
  }
});

// Admin Reviews Management Page
router.get("/reviews", adminAuth, async (req, res) => {
  try {
    const allReviews = await Review.findAll({
      order: [["createdAt", "DESC"]]
    });

    // Get all products for product details
    const allProducts = await getProducts();
    
    // Group reviews by product
    const reviewsByProduct = {};
    
    allReviews.forEach((review, index) => {
      const reviewData = review.get({ plain: true });
      console.log(`📝 Review ${index}: ID=${reviewData.id}, Product=${reviewData.productId}`);
      
      const product = allProducts.find(p => p.id === reviewData.productId);
      
      if (!reviewsByProduct[reviewData.productId]) {
        reviewsByProduct[reviewData.productId] = {
          productId: reviewData.productId,
          productName: product ? product.name : "Unknown Product",
          manufacturer: product ? product.manufacturer : "Unknown",
          reviews: []
        };
      }
      
      const reviewObj = {
        id: reviewData.id,
        userName: reviewData.userName,
        userId: reviewData.userId,
        message: reviewData.message,
        rating: reviewData.rating,
        date: reviewData.date,
        createdAt: reviewData.createdAt
      };
      
      console.log(`✅ Review ID: ${reviewObj.id} - Type: ${typeof reviewObj.id}`);
      reviewsByProduct[reviewData.productId].reviews.push(reviewObj);
    });

    // Convert to array and sort by most recent
    const groupedReviews = Object.values(reviewsByProduct)
      .sort((a, b) => {
        const aDate = new Date(a.reviews[0]?.createdAt || 0);
        const bDate = new Date(b.reviews[0]?.createdAt || 0);
        return bDate - aDate;
      });

    console.log("📋 Admin Reviews - Total Reviews:", allReviews.length);
    console.log("📦 Products with reviews:", groupedReviews.length);

    res.render("admin/reviews", {
      reviewsByProduct: groupedReviews,
      totalReviews: allReviews.length
    });

  } catch (err) {
    console.log("❌ Admin reviews error:", err);
    res.render("admin/reviews", { reviewsByProduct: [], totalReviews: 0 });
  }
});

// Delete review endpoint
router.post("/review/delete/:id", adminAuth, async (req, res) => {
  try {
    const reviewId = req.params.id;
    
    console.log(`🗑️ Deleting review with ID: ${reviewId}`);
    
    if (!reviewId || reviewId === 'null' || reviewId === 'undefined') {
      return res.json({ success: false, message: "Invalid review ID" });
    }
    
    const result = await Review.destroy({
      where: { id: reviewId }
    });

    console.log(`✅ Review deleted. Rows affected: ${result}`);
    
    res.json({ success: true, message: "Review deleted successfully", rowsDeleted: result });

  } catch (err) {
    console.log("❌ Delete review error:", err.message);
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
