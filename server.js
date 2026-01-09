const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const products= require('./models/productData')
const Review = require('./models/review');

const session = require('express-session');
const User = require('./models/User');
const Order = require('./models/order');
const app = express();

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
const MONGO_URI = 'mongodb://127.0.0.1:27017/akc_auto_parts';

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
app.get('/', (req, res) => res.render('index'));
app.get("/signin", (req, res) => res.render("signin", { popup: "" }));
app.get("/signup", (req, res) => res.render("signup", { popup: "" }));
app.get('/cart', (req, res) => {
  res.render('cart', { isLoggedIn: req.session.user ? true : false });
});
app.get('/registration', (req, res) => res.render('registration'));
app.get("/product", (req, res) => {
    const id = req.query.id;
    const product = products.find(p => p.id === id);
    res.render("product", { product });
});

app.get("/reviews/:productId", async (req, res) => {
  const { productId } = req.params;

  const reviews = await Review.find({ productId }).sort({ date: -1 });

  res.json(reviews);
});

const productList = products;

app.get("/my-orders", async (req, res) => {
  if (!req.session.user) return res.redirect("/signin");

  let orders = await Order.find({
    userId: req.session.user.id
  }).sort({ createdAt: -1 }).lean();

  orders = orders.map(order => {
    const deliveryDate = new Date(order.createdAt);
    deliveryDate.setDate(deliveryDate.getDate() + 4);
    order.deliveryDate = deliveryDate.toDateString();
    return order;
  });

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

    if (!paymentMethod || !["COD", "UPI"].includes(paymentMethod)) {
      return res.json({ success: false, message: "Invalid payment method" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

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

    const order = new Order({
      userId: req.session.user.id,
      customerName: name,
      address,
      city,
      state,
      phone,
      pin,
      totalPrice: total,
      paymentMethod,
      paymentStatus: "Pending Verification", // ✅ FIXED
      status: "Pending",
      items: safeItems
    });

    await order.save();

    console.log("✅ ORDER SAVED:", order._id);
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
