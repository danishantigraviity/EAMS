const Notification = require('../models/Notification');

exports.getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ isRead: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    res.json({
      success: true,
      data: notifications,
      total,
      unreadCount,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) { next(error); }
};

exports.createNotification = async (req, res, next) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (error) { next(error); }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.json({ success: true, data: notification });
  } catch (error) { next(error); }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) { next(error); }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) { next(error); }
};
