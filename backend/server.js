require("dotenv").config();

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const Order = require("./models/order");
const Review = require("./models/review");

const sequelize = require("./config/database");
const User = require("./models/user");

const { getProducts } = require("./models/productData");

const app = express();
app.use((req, res, next) => {
  console.log("➡️ REQUEST:", req.method, req.url);
  next();
});


/* =====================
   EXPRESS CONFIG
===================== */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser());

app.use(
  session({
    secret: "AKC_SECRET_KEY_123",
    resave: false,
    saveUninitialized: false, // Change this to false
    cookie: { 
      secure: false, // Set to true ONLY if using HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

app.use(require("./middleware/language"));

app.get("/test-products", async (req, res) => {
  const { getProducts } = require("./models/productData");
  const products = await getProducts();
  res.json(products);
});

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

/* =====================
   ROUTES
===================== */
app.use("/admin", require("./routes/admin"));
app.use("/admin", require("./routes/admindashboard"));
app.use("/admin", require("./routes/adminorders"));
app.use("/admin", require("./routes/adminusers"));
app.use('/admin', require('./routes/adminproduct'));




app.use("/", require("./routes/index"));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/signin", (req, res) => res.render("signin", { popup: "" }));
app.get("/signup", (req, res) => res.render("signup", { popup: "" }));

app.get("/cart", (req, res) => {
  res.render("cart", {
    isLoggedIn: req.session.user ? true : false
  });
});

app.get("/product", async (req, res) => {
  const id = req.query.id;

  const products = await getProducts();
  const product = products.find(p => p.id === id);

  if (!product) return res.send("Product not found");

  res.render("product", { product });
});

/* =====================
   AUTH (SQL)
===================== */

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.render("signup", { popup: "exists" });
    }

    await User.create({
  name,
  email,
  password,
  role: "user"
});


    res.render("signup", { popup: "success" });
  } catch (err) {
    console.log("Signup error:", err);
    res.render("signup", { popup: "error" });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email, password }
    });

    if (!user) {
      return res.render("signin", { popup: "failed" });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    res.render("signin", { popup: "success" });
  } catch (err) {
    console.log("Signin error:", err);
    res.render("signin", { popup: "error" });
  }
});
app.get("/registration", (req, res) => {
  res.render("registration");
});

app.get("/signout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.get("/my-orders", async (req, res) => {
  try {
    if (!req.session.user) return res.redirect("/signin");

    const orders = await Order.findAll({
      where: {
        userId: req.session.user.id
      },
      order: [["createdAt", "DESC"]]
    });

    // Fetch products from Google Sheets to enrich items with name and price
    let products = [];
    try {
      products = await getProducts();
    } catch (prodErr) {
      console.log("Error fetching products:", prodErr.message);
    }

    // Enrich orders with product details
    const enrichedOrders = [];
    for (const order of orders) {
      const plainOrder = order.dataValues || order;
      let items = plainOrder.items;

      if (typeof items === "string") {
        try {
          items = JSON.parse(items);
        } catch (e) {
          items = [];
        }
      }

      // Add name and price from products
      if (items && Array.isArray(items)) {
        items = items.map(item => {
          const product = products.find(p => p.id === item.id);
          return {
            id: item.id,
            name: item.name || (product ? product.name : "Unknown"),
            price: item.price || (product ? product.price : 0),
            qty: item.qty
          };
        });
      }

      enrichedOrders.push({
        ...plainOrder,
        items
      });
    }

    res.render("myOrders", { orders: enrichedOrders });

  } catch (err) {
    console.log("My orders error:", err);
    res.render("myOrders", { orders: [] });
  }
});


app.post("/order", async (req, res) => {
  try {
    console.log("➡️ ORDER BODY:", req.body);

    if (!req.session.user) {
      return res.json({ success: false, message: "Not logged in" });
    }

    const {
      name,
      address,
      city,
      state,
      phone,
      pin,
      total,
      items,
      paymentMethod
      
    } = req.body;

    if (!items || items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    // 🔥 FETCH PRODUCTS FROM GOOGLE SHEETS
    const products = await getProducts();

    const safeItems = [];

    for (let cartItem of items) {
      const product = products.find(p => p.id === cartItem.id);

      if (!product) continue;

      safeItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: Number(cartItem.qty)
      });
    }

    if (safeItems.length === 0) {
      return res.json({ success: false, message: "Invalid cart items" });
    }

    // ✅ SAVE ORDER
    const order = await Order.create({
      userId: req.session.user.id,

      customerName: name,
      address,
      city,
      state,
      phone,
      pin,

      totalPrice: total,

      items: safeItems, // ⭐ IMPORTANT

      paymentMethod,
      paymentStatus:
        paymentMethod === "COD"
          ? "Cash On Delivery"
          : "Pending",

      status: "Pending"
    });

    console.log("✅ ORDER SAVED:", order._id || order.id);

    // optional cart clear
    req.session.cart = [];

    res.json({ success: true });

  } catch (err) {
    console.log("❌ FINAL ORDER ERROR:");
    console.log(err);

    res.json({ success: false, message: err.message });
  }
});
app.post("/cancel-order/:id", async (req, res) => {
  try {
    const orderId = req.params.id;

    await Order.update(
      { status: "Cancelled" },
      { where: { id: orderId } }
    );

    res.json({ success: true });

  } catch (err) {
    console.log("Cancel order error:", err);
    res.json({ success: false });
  }
});


/* =====================
   REVIEWS ROUTES
===================== */

// GET reviews for a specific product
app.get("/reviews/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.findAll({
      where: { productId },
      order: [["date", "DESC"]]
    });

    const plainReviews = reviews.map(r => ({
      id: r.id,
      productId: r.productId,
      userId: r.userId,
      userName: r.userName,
      message: r.message,
      rating: r.rating,
      date: r.date
    }));

    res.json(plainReviews);

  } catch (err) {
    console.log("❌ Get reviews error:", err);
    res.json([]);
  }
});

// GET average rating and count for a product
app.get("/rating/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.findAll({
      where: { productId }
    });

    if (reviews.length === 0) {
      return res.json({ avg: 0, count: 0 });
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRating / reviews.length).toFixed(1);

    res.json({ avg: avgRating, count: reviews.length });

  } catch (err) {
    console.log("❌ Get rating error:", err);
    res.json({ avg: 0, count: 0 });
  }
});

// POST a new review
app.post("/review", async (req, res) => {
  try {
    const { productId, message, rating } = req.body;

    if (!req.session.user) {
      return res.json({ success: false, message: "Please sign in to write a review" });
    }

    if (!productId || !message) {
      return res.json({ success: false, message: "Product ID and message are required" });
    }

    // Validate rating
    const ratingValue = Number(rating) || 5;
    if (ratingValue < 1 || ratingValue > 5) {
      return res.json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const review = await Review.create({
      productId,
      userId: req.session.user.id,
      userName: req.session.user.name,
      message,
      rating: ratingValue
    });

    res.json({ 
      success: true, 
      message: "Review posted successfully",
      review
    });

  } catch (err) {
    console.log("❌ Post review error:", err);
    res.json({ success: false, message: err.message });
  }
});




/* =====================
   DATABASE + SERVER
===================== */
app.get("/__debug-products", async (req, res) => {
  const { getProducts } = require("./models/productData");

  const products = await getProducts();

  res.json({
    count: products.length,
    products
  });
});

sequelize.authenticate()
  .then(async () => {
    console.log("✅ PostgreSQL connected");

    await sequelize.sync();
    console.log("✅ Tables synced");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚗 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.log("❌ Database connection error:");
    console.log(err.message);
  });
