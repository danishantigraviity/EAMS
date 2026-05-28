const cron = require('node-cron');
const Asset = require('../models/Asset');
const License = require('../models/License');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendLicenseExpiryEmail, sendWarrantyExpiryEmail } = require('./email');

const initCronJobs = () => {
  // Daily 9:00 AM - Check expiring licenses & warranties
  cron.schedule('0 9 * * *', async () => {
    console.log('🕐 Running daily expiry check cron job...');
    await checkExpiringLicenses();
    await checkExpiringWarranties();
  });

  console.log('✅ Cron jobs initialized');
};

const checkExpiringLicenses = async () => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringLicenses = await License.find({
      expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
      renewalReminderSent: false,
    }).populate('assignedTo', 'name email');

    for (const license of expiringLicenses) {
      // Notify all admins
      const admins = await User.find({ role: 'super_admin', isActive: true });

      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          type: 'license_expiry',
          title: 'License Expiring Soon',
          message: `${license.softwareName} license expires on ${new Date(license.expiryDate).toLocaleDateString()}`,
          resourceId: license._id,
          resourceType: 'License',
        });
        await sendLicenseExpiryEmail(admin, license).catch(console.error);
      }

      // Notify assigned users
      for (const user of license.assignedTo) {
        await Notification.create({
          userId: user._id,
          type: 'license_expiry',
          title: 'License Expiring Soon',
          message: `Your ${license.softwareName} license expires on ${new Date(license.expiryDate).toLocaleDateString()}`,
          resourceId: license._id,
          resourceType: 'License',
        });
        await sendLicenseExpiryEmail(user, license).catch(console.error);
      }

      // Mark reminder as sent
      license.renewalReminderSent = true;
      await license.save();
    }

    console.log(`✅ Processed ${expiringLicenses.length} expiring licenses`);
  } catch (error) {
    console.error('License expiry cron error:', error.message);
  }
};

const checkExpiringWarranties = async () => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringAssets = await Asset.find({
      warrantyExpiry: { $lte: thirtyDaysFromNow, $gte: new Date() },
      isDeleted: false,
    }).populate('assignedTo', 'name email').populate('department', 'name');

    const admins = await User.find({ role: 'super_admin', isActive: true });

    for (const asset of expiringAssets) {
      // Notify admins
      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          type: 'warranty_expiry',
          title: 'Warranty Expiring Soon',
          message: `${asset.name} (${asset.serialNumber}) warranty expires on ${new Date(asset.warrantyExpiry).toLocaleDateString()}`,
          resourceId: asset._id,
          resourceType: 'Asset',
        });
        await sendWarrantyExpiryEmail(admin, asset).catch(console.error);
      }

      // Notify assigned employee
      if (asset.assignedTo) {
        await Notification.create({
          userId: asset.assignedTo._id,
          type: 'warranty_expiry',
          title: 'Your Asset Warranty Expiring',
          message: `${asset.name} warranty expires on ${new Date(asset.warrantyExpiry).toLocaleDateString()}`,
          resourceId: asset._id,
          resourceType: 'Asset',
        });
        await sendWarrantyExpiryEmail(asset.assignedTo, asset).catch(console.error);
      }
    }

    console.log(`✅ Processed ${expiringAssets.length} expiring warranties`);
  } catch (error) {
    console.error('Warranty expiry cron error:', error.message);
  }
};

module.exports = { initCronJobs };
