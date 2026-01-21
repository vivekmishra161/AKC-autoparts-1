const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const Order = require('../../models/order');
const bcrypt = require('bcryptjs');

// ============================================
// ✅ ADMIN LOGIN PAGE - GET
// ============================================
router.get('/login', (req, res) => {
    // If already logged in, redirect to dashboard
    if (req.session.user && req.session.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
    }

    // Render login page with no errors
    res.render('admin/login', {
        error: null,
        success: null,
        email: ''
    });
});

// ============================================
// ✅ ADMIN LOGIN HANDLER - POST
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        // ✅ STEP 1: Validation - Check if fields are provided
        if (!email || !email.trim()) {
            console.log('[LOGIN] Email field is empty');
            return res.render('admin/login', {
                error: '📧 Email address is required',
                success: null,
                email: ''
            });
        }

        if (!password) {
            console.log('[LOGIN] Password field is empty');
            return res.render('admin/login', {
                error: '🔑 Password is required',
                success: null,
                email: email.trim()
            });
        }

        // ✅ STEP 2: Validation - Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            console.log('[LOGIN] Invalid email format:', email);
            return res.render('admin/login', {
                error: '❌ Please enter a valid email address',
                success: null,
                email: email.trim()
            });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password;

        console.log(`\n[LOGIN ATTEMPT] Email: ${trimmedEmail}`);

        // ✅ STEP 3: Query database for admin user
        const admin = await User.findOne({
            where: {
                email: trimmedEmail,
                role: 'admin'
            }
        });

        // ✅ STEP 4: Check if admin user exists
        if (!admin) {
            console.log(`[LOGIN FAILED] Admin user not found: ${trimmedEmail}`);
            return res.render('admin/login', {
                error: '⚠️ Invalid email or password',
                success: null,
                email: trimmedEmail
            });
        }

        console.log(`[LOGIN] Admin user found: ${admin.email}`);
        console.log(`[LOGIN] Password in DB: ${admin.password ? 'EXISTS' : 'MISSING'}`);
        console.log(`[LOGIN] Password type: ${typeof admin.password}`);

        // ✅ STEP 5: Password Comparison - Handle BOTH plaintext and bcrypt
        let passwordMatch = false;

        try {
            // Check if password in DB looks like a bcrypt hash
            if (admin.password && (admin.password.startsWith('$2a$') || 
                                   admin.password.startsWith('$2b$') || 
                                   admin.password.startsWith('$2y$'))) {
                // Password is hashed - use bcrypt.compare()
                console.log('[LOGIN] Password is hashed, using bcrypt comparison');
                passwordMatch = await bcrypt.compare(trimmedPassword, admin.password);
                console.log('[LOGIN] Bcrypt comparison result:', passwordMatch);
            } else {
                // Password is plaintext - use direct comparison
                console.log('[LOGIN] Password is plaintext, using direct comparison');
                passwordMatch = (trimmedPassword === admin.password);
                console.log('[LOGIN] Direct comparison result:', passwordMatch);
            }
        } catch (compareErr) {
            console.error('[LOGIN] Password comparison error:', compareErr.message);
            passwordMatch = false;
        }

        // ✅ STEP 6: Check password match result
        if (!passwordMatch) {
            console.log(`[LOGIN FAILED] Password mismatch for: ${trimmedEmail}`);
            return res.render('admin/login', {
                error: '⚠️ Invalid email or password',
                success: null,
                email: trimmedEmail
            });
        }

        // ✅ STEP 7: Password is correct - Create session
        console.log(`[LOGIN SUCCESS] Admin logged in: ${trimmedEmail}`);

        req.session.user = {
            id: admin.id,
            name: admin.name || 'Admin',
            email: admin.email,
            role: admin.role,
            loginTime: new Date()
        };

        // Remember me: Set longer session expiration
        if (rememberMe) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            console.log('[LOGIN] Remember me enabled - 30 day session');
        } else {
            req.session.cookie.maxAge = 60 * 60 * 1000; // 1 hour
        }

        console.log('[LOGIN] Session created, redirecting to dashboard\n');

        // ✅ STEP 8: Success - Redirect to dashboard
        return res.redirect('/admin/dashboard');

    } catch (err) {
        console.error('[LOGIN ERROR]', {
            message: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });

        return res.render('admin/login', {
            error: '🚨 Server error. Please try again later.',
            success: null,
            email: req.body.email || ''
        });
    }
});

// ============================================
// ✅ ADMIN LOGOUT
// ============================================
router.get('/logout', (req, res) => {
    try {
        const userEmail = req.session.user?.email || 'Unknown';
        console.log(`[LOGOUT] Admin logged out: ${userEmail}`);

        req.session.destroy((err) => {
            if (err) {
                console.error('[LOGOUT ERROR]', err);
                return res.redirect('/admin/login');
            }

            res.clearCookie('connect.sid');
            return res.redirect('/admin/login');
        });
    } catch (err) {
        console.error('[LOGOUT ERROR]', err);
        return res.redirect('/admin/login');
    }
});

// ============================================
// ✅ ADMIN DASHBOARD
// ============================================
router.get('/dashboard', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        console.warn('[UNAUTHORIZED] Attempted access to dashboard');
        return res.redirect('/admin/login');
    }

    try {
        res.render('admin/dashboard', {
            user: req.session.user,
            error: null,
            success: null
        });
    } catch (err) {
        console.error('[DASHBOARD ERROR]', err);
        return res.status(500).json({
            success: false,
            message: 'Error loading dashboard'
        });
    }
});

// ============================================
// ✅ UPDATE ORDER STATUS
// ============================================
router.post('/update-order-status', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { orderId, status } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and status are required'
            });
        }

        const result = await Order.update(
            { status },
            { where: { id: orderId } }
        );

        if (result[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        console.log(`[ORDER UPDATE] Order ${orderId} status updated to ${status}`);

        res.json({
            success: true,
            message: 'Order status updated successfully'
        });

    } catch (err) {
        console.error('[ORDER UPDATE ERROR]', err);
        res.status(500).json({
            success: false,
            message: 'Error updating order status'
        });
    }
});

// ============================================
// ✅ GET ALL USERS (Admin only)
// ============================================
router.get('/users', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const users = await User.findAll({
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['password'] }
        });

        res.render('admin/users', {
            users: users,
            user: req.session.user
        });

    } catch (err) {
        console.error('[GET USERS ERROR]', err);
        res.status(500).render('admin/users', {
            users: [],
            user: req.session.user,
            error: 'Error loading users'
        });
    }
});

// ============================================
// ✅ GET ALL ORDERS (Admin only)
// ============================================
router.get('/orders', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const orders = await Order.findAll({
            order: [['createdAt', 'DESC']]
        });

        res.render('admin/orders', {
            orders: orders,
            user: req.session.user
        });

    } catch (err) {
        console.error('[GET ORDERS ERROR]', err);
        res.status(500).render('admin/orders', {
            orders: [],
            user: req.session.user,
            error: 'Error loading orders'
        });
    }
});

// ============================================
// ✅ HEALTH CHECK
// ============================================
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Admin routes are healthy',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

