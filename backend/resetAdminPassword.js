require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const User = require('./models/user');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

async function resetAdminPassword() {
    try {
        console.log('🔗 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');

        const adminEmail = 'admin@gmail.com';
        const newPassword = 'admin123';

        console.log('🔐 Hashing password with bcrypt...');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log('✅ Password hashed');

        console.log('🔄 Updating admin password...');
        const [updatedCount] = await User.update(
            { password: hashedPassword },
            { where: { email: adminEmail, role: 'admin' } }
        );

        if (updatedCount === 0) {
            console.error('❌ Admin user not found');
            process.exit(1);
        }

        console.log('\n✨ SUCCESS!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email: admin@gmail.com');
        console.log('🔑 Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\nYou can now login!');

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

resetAdminPassword();
