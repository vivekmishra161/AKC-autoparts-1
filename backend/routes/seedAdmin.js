// seedAdmin.js
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

// Adjust table/columns to match your existing User model
const User = sequelize.define('User', {
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING,    // or passwordHash if you use hashing
  role: DataTypes.STRING
}, {
  tableName: 'Users',            // change if your table name is different
  timestamps: true
});

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // ADD THIS LINE BELOW:
    await sequelize.sync(); 
    console.log('Tables synchronized/created');

    const email = 'admin@gmail.com';    // choose your admin email
    const password = 'admin123';          // TEMP password, change later

    const [admin, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        name: 'Super Admin',
        email,
        password,         // if you hash, put hash here
        role: 'admin'
      }
    });

    console.log(created ? 'Admin created:' : 'Admin already exists:', admin.toJSON());
  } catch (err) {
    console.error('Seed error', err);
  } finally {
    await sequelize.close();
  }
}

createAdmin();
