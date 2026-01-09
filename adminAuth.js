module.exports = function adminAuth(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/admin/login');
  }
  next();
};
