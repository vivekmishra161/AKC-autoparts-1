require('dotenv').config();
const bcrypt = require('bcryptjs');

// Get the User model
const { sequelize } = require('./models');
const User = require('./models/user');

async function resetAdminPassword() {
    try {
        console.log('🔗 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');

        const adminEmail = 'admin@gmail.com';
        const newPassword = 'admin123';

        console.log('\n🔐 Hashing new password with bcrypt...');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log('✅ Password hashed successfully');

        console.log(`\n🔄 Updating password for admin: ${adminEmail}`);
        const [updatedCount] = await User.update(
            { password: hashedPassword },
            { 
                where: { 
                    email: adminEmail,
                    role: 'admin'
                }
            }
        );

        if (updatedCount === 0) {
            console.error('❌ Admin user not found!');
            console.error('Please check if the admin exists with email: ' + adminEmail);
            process.exit(1);
        }

        console.log('\n✨ SUCCESS! Admin password has been reset');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Admin Login Credentials:');
        console.log(`   📧 Email: ${adminEmail}`);
        console.log(`   🔑 Password: ${newPassword}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✅ You can now login to the admin panel!');
        console.log('🌐 Visit: https://yourdomain.com/admin/login');

    } catch (err) {
        console.error('❌ Error resetting password:', err.message);
        if (err.stack) console.error('Stack:', err.stack);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('\n✅ Database connection closed');
    }
}

// Run the function
resetAdminPassword();
