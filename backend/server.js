const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { getProducts } = require('./models/productData');
const Review = require('./models/review');

const session = require('express-session');
const User = require('./models/user');
const Order = require('./models/order');
const app = express();
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser()); // 🔥 REQUIRED
app.use(require("./middleware/language")); // 🔥 REQUIRED

// routes BELOW this
app.use("/", require("./routes/index"));


app.use(session({
  secret: "AKC_SECRET_KEY_123",
  resave: false,
  saveUninitialized: true
}));

app.use(session({
  secret: "AKC_SECRET_KEY_123",
  resave: false,
  saveUninitialized: true
}));

// Make session available in all EJS pages
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});


// ====== MongoDB Connection ======
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ====== Express Setup ======
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});
app.use('/admin', require('./routes/admin'));
app.use('/admin', require('./routes/admindashboard'));
app.use('/admin', require('./routes/adminproduct'));
app.use('/admin', require('./routes/adminorders'));


// ====== PAGES ======
app.get('/', (req, res) => {
  res.render('index');
});

app.get("/signin", (req, res) => res.render("signin", { popup: "" }));
app.get("/signup", (req, res) => res.render("signup", { popup: "" }));
app.get('/cart', (req, res) => {
  res.render('cart', { isLoggedIn: req.session.user ? true : false });
});
app.get('/registration', (req, res) => res.render('registration'));
app.get("/product", async (req, res) => {
  const id = req.query.id;

  const products = await getProducts(); // Google Sheet data
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.send("Product not found");
  }

  res.render("product", { product });
});


app.get("/reviews/:productId", async (req, res) => {
  const { productId } = req.params;

  const reviews = await Review.find({ productId }).sort({ date: -1 });

  res.json(reviews);
});


app.get("/my-orders", async (req, res) => {
  if (!req.session.user) return res.redirect("/signin");

  const orders = await Order.find({
    userId: req.session.user.id
  }).sort({ createdAt: -1 });

  res.render("myOrders", { orders });
});



app.post("/cancel-order/:id", async (req, res) => {
  try {
    const orderId = req.params.id;

    await Order.findByIdAndUpdate(orderId, {
      status: "Cancelled"
    });

    res.json({ success: true });

  } catch (err) {
    console.log("Cancel Order Error:", err);
    res.json({ success: false });
  }
});


app.post("/order", async (req, res) => {
  try {
    // 🔐 Login check
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

    // ✅ Payment validation
    if (!paymentMethod || !["COD", "UPI"].includes(paymentMethod)) {
      return res.json({ success: false, message: "Invalid payment method" });
    }

    // ✅ Cart validation
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    // 🔒 Fetch products from backend
    const products = await getProducts();

    const safeItems = [];

    for (let cartItem of items) {
      const product = products.find(p => p.id === cartItem.id);
      if (!product) continue;

      safeItems.push({
        id: product.id,
        name: product.name,        // ⭐ important for admin page
        price: product.price,
        qty: Number(cartItem.qty)
      });
    }

    // ❌ No valid items
    if (safeItems.length === 0) {
      return res.json({ success: false, message: "Invalid cart items" });
    }

    // ✅ Create order
    const order = new Order({
      userId: req.session.user.id,

      customerName: name,
      address,
      city,
      state,
      phone,
      pin,

      items: safeItems,

      totalPrice: total,

      paymentMethod,
      paymentStatus: paymentMethod === "COD"
        ? "Cash On Delivery"
        : "Pending UPI Verification",

      status: "Pending"
    });

    await order.save();

    console.log("✅ ORDER SAVED:", order._id);

    // ✅ Clear cart after order
    req.session.cart = [];

    res.json({ success: true });

  } catch (err) {
    console.error("❌ ORDER ERROR:", err);
    res.json({ success: false, message: err.message });
  }
});






app.get("/rating/:productId", async (req, res) => {
  const productId = req.params.productId;
  const reviews = await Review.find({ productId });

  if (reviews.length === 0) {
    return res.json({ avg: 0, count: 0 });
  }

  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  res.json({
    avg: avg.toFixed(1),
    count: reviews.length
  });
});

app.post("/review", async (req, res) => {
  try {
    const { productId, message, rating } = req.body;

    if (!req.session.user) {
      return res.json({ success: false });
    }

    await Review.create({
      productId,
      userName: req.session.user.name,
      message,
      rating: Number(rating),
      date: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});

// ====== AUTH ======
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  // Find user with BOTH email + password
  const user = await User.findOne({ email, password });

  if (!user) {
    return res.render("signin", { popup: "failed" });
  }

  // Store FULL user information in session
  req.session.user = {
    id: user._id,
    name: user.name,   // <-- Name will now be correct
    email: user.email
  };

  return res.render("signin", { popup: "success" });
});

app.get("/signout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});


app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) return res.render("signup", { popup: "exists" });

  await User.create({ name, email, password });
  return res.render("signup", { popup: "success" });
});

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/signin');
  }
  next();
}
// ====== START SERVER ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚗 Server running at http://localhost:${PORT}`));
