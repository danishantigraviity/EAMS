const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
try { dns.setDefaultResultOrder('ipv4first'); } catch(e) {}
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Department = require('./models/Department');
const AssetType = require('./models/AssetType');
const Asset = require('./models/Asset');
const LicenseType = require('./models/LicenseType');
const License = require('./models/License');

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    // 1. Seed Departments
    console.log('🌱 Seeding Departments...');
    await Department.deleteMany({});
    const depts = await Department.insertMany([
      { name: 'Information Technology', code: 'IT', description: 'IT infrastructure and support' },
      { name: 'Human Resources', code: 'HR', description: 'HR operations and talent management' },
      { name: 'Finance & Accounts', code: 'FIN', description: 'Financial tracking and bookkeeping' }
    ]);
    console.log(`✅ Seeded ${depts.length} departments.`);

    // 2. Seed Asset Types if not present
    console.log('🌱 Seeding Asset Types...');
    await AssetType.deleteMany({});
    const assetTypes = await AssetType.insertMany([
      { name: 'Laptop', code: 'laptop', category: 'IT Devices', icon: 'Laptop', description: 'Portable personal computer' },
      { name: 'Desktop', code: 'desktop', category: 'IT Devices', icon: 'Monitor', description: 'Stationary personal computer' },
      { name: 'Monitor', code: 'monitor', category: 'IT Devices', icon: 'Tv', description: 'External display screen' },
      { name: 'Chair', code: 'chair', category: 'Office Furniture', icon: 'Chair', description: 'Ergonomic seating chair' },
      { name: 'Table', code: 'table', category: 'Office Furniture', icon: 'Table', description: 'Workdesk or conference table' }
    ]);
    console.log(`✅ Seeded ${assetTypes.length} asset types.`);

    // 3. Seed License Types
    console.log('🌱 Seeding License Types...');
    await LicenseType.deleteMany({});
    const licenseTypes = await LicenseType.insertMany([
      { name: 'Subscription', code: 'subscription', icon: 'Calendar', description: 'Recurring payment license' },
      { name: 'Perpetual', code: 'perpetual', icon: 'ShieldCheck', description: 'Lifetime ownership license' }
    ]);
    console.log(`✅ Seeded ${licenseTypes.length} license types.`);

    // 4. Seed Users
    console.log('🌱 Seeding Users...');
    await User.deleteMany({});

    // Super Admin
    const superAdmin = new User({
      name: 'System Admin',
      email: 'admin@eams.com',
      passwordHash: 'Password123',
      role: 'super_admin',
      employeeId: 'ADM001',
      phone: '+91 99999 99999',
      department: depts[0]._id
    });
    await superAdmin.save();

    // Employee
    const employee = new User({
      name: 'John Doe',
      email: 'employee@eams.com',
      passwordHash: 'Password123',
      role: 'employee',
      employeeId: 'EMP101',
      phone: '+91 88888 88888',
      department: depts[1]._id
    });
    await employee.save();

    console.log('✅ Seeded users (admin@eams.com, employee@eams.com).');

    // 5. Seed Assets
    console.log('🌱 Seeding Assets...');
    await Asset.deleteMany({});
    const assets = await Asset.insertMany([
      {
        name: 'MacBook Pro 16"',
        serialNumber: 'SN-MAC-2026-987',
        type: 'laptop',
        status: 'assigned',
        vendor: 'Apple Inc.',
        cost: 195000,
        location: 'HQ - Floor 3',
        assignedTo: employee._id,
        department: depts[1]._id,
        createdBy: superAdmin._id,
        purchaseDate: new Date('2026-01-15'),
        warrantyExpiry: new Date('2029-01-15'),
        notes: 'M3 Pro, 18GB RAM, 512GB SSD'
      },
      {
        name: 'Dell UltraSharp 27"',
        serialNumber: 'SN-DELL-U27-452',
        type: 'monitor',
        status: 'available',
        vendor: 'Dell',
        cost: 32000,
        location: 'HQ - IT Lab',
        department: depts[0]._id,
        createdBy: superAdmin._id,
        purchaseDate: new Date('2026-02-10'),
        warrantyExpiry: new Date('2028-02-10'),
        notes: '4K IPS USB-C monitor'
      },
      {
        name: 'Ergonomic Mesh Chair',
        serialNumber: 'SN-CHAIR-ERG-009',
        type: 'chair',
        status: 'assigned',
        vendor: 'Featherlite',
        cost: 12500,
        location: 'HQ - Floor 1',
        assignedTo: employee._id,
        department: depts[1]._id,
        createdBy: superAdmin._id,
        purchaseDate: new Date('2025-11-20'),
        warrantyExpiry: new Date('2027-11-20')
      }
    ]);
    console.log(`✅ Seeded ${assets.length} assets.`);

    // 6. Seed Licenses
    console.log('🌱 Seeding Licenses...');
    await License.deleteMany({});
    const licenses = await License.insertMany([
      {
        softwareName: 'Microsoft Office 365 Enterprise',
        vendor: 'Microsoft',
        licenseKey: 'F3K9P-X7W4Q-M2D8J-L9R5T-V2B6N',
        licenseType: 'subscription',
        totalSeats: 100,
        usedSeats: 1,
        cost: 120000,
        createdBy: superAdmin._id,
        department: depts[1]._id,
        purchaseDate: new Date('2026-01-01'),
        expiryDate: new Date('2027-01-01'),
        assignedTo: [employee._id]
      },
      {
        softwareName: 'Adobe Creative Cloud',
        vendor: 'Adobe',
        licenseKey: 'ADOBE-CC-2026-KEYS-9871',
        licenseType: 'subscription',
        totalSeats: 10,
        usedSeats: 0,
        cost: 85000,
        createdBy: superAdmin._id,
        department: depts[1]._id,
        purchaseDate: new Date('2026-03-01'),
        expiryDate: new Date('2027-03-01')
      }
    ]);
    console.log(`✅ Seeded ${licenses.length} licenses.`);

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
}

seed();
