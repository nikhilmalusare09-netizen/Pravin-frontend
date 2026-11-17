require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const Category = require('../models/Category');
const Dish = require('../models/Dish');
const RestaurantTable = require('../models/RestaurantTable');
const { categories, dishes, initialTables } = require('./seedData');

const seedDB = async () => {
  try {
    console.log('🌱 Starting Pravin Chinese database seeding...');
    await connectDB();

    // 1. Seed or Update Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pravinchinese.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    let admin = await Admin.findOne({ email: adminEmail });

    if (!admin) {
      admin = new Admin({
        name: 'Pravin Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      await admin.save();
      console.log(`✅ Default Admin created: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log(`ℹ️ Admin account already exists: ${adminEmail}`);
    }

    // 2. Seed Categories
    console.log('🔄 Seeding Categories...');
    const categoryMap = new Map();
    for (const cat of categories) {
      let existingCat = await Category.findOne({ name: cat.name });
      if (!existingCat) {
        existingCat = await Category.create(cat);
      }
      categoryMap.set(cat.name, existingCat._id);
    }
    console.log(`✅ ${categoryMap.size} Categories ready.`);

    // 3. Seed Dishes
    console.log('🔄 Seeding Dishes...');
    let dishesInserted = 0;
    for (const d of dishes) {
      const categoryId = categoryMap.get(d.categoryName);
      const existingDish = await Dish.findOne({ name: d.name });
      if (!existingDish) {
        await Dish.create({
          name: d.name,
          description: d.description || '',
          price: d.price,
          imageUrl: d.imageUrl || '',
          category: categoryId,
          categoryName: d.categoryName,
          foodType: d.foodType,
          availability: 'AVAILABLE',
          isPopular: ['Lollypop', 'Chicken Crispy', 'Triple Schezwan Rice', 'Manchow Soup', 'Paneer Crispy', 'Hakka Noodles Veg'].includes(d.name),
        });
        dishesInserted++;
      }
    }
    const totalDishes = await Dish.countDocuments();
    console.log(`✅ Dishes seeded. New: ${dishesInserted}, Total in DB: ${totalDishes}`);

    // 4. Seed Tables
    console.log('🔄 Seeding Restaurant Tables...');
    for (const t of initialTables) {
      const existingTable = await RestaurantTable.findOne({ tableNumber: t.tableNumber });
      if (!existingTable) {
        await RestaurantTable.create(t);
      }
    }
    const totalTables = await RestaurantTable.countDocuments();
    console.log(`✅ Tables ready. Total: ${totalTables}`);

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDB();
}

module.exports = seedDB;
