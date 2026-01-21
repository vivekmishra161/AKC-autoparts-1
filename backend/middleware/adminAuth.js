module.exports = function adminAuth(req, res, next) {
  console.log("➡️ Auth Check - Session User:", req.session.user ? req.session.user.email : "GUEST");
  
  if (!req.session.user || req.session.user.role !== 'admin') {
    console.warn("🚫 Unauthorized access blocked. Redirecting to login.");
    return res.redirect('/admin/login');
  }
  next();
};