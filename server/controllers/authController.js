const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone, employeeId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = new User({
      name,
      email,
      passwordHash: password, // pre-save hook hashes it
      role: role || 'employee',
      department: department || null,
      phone: phone || null,
      employeeId: employeeId || null,
    });

    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens = [refreshToken];
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash +refreshTokens');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          profileImage: user.profileImage,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required.' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    // Rotate: remove old, add new
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    const newAccessToken = generateAccessToken(user._id);

    res.json({
      success: true,
      message: 'Token refreshed.',
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }
    next(error);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists
      return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    user.otpHash = otpHash;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to: user.email,
      subject: 'EAMS - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #5C6BC0;">Password Reset OTP</h2>
          <p>Hello ${user.name},</p>
          <p>Your OTP for password reset is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #5C6BC0; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP expires in <strong>5 minutes</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'OTP sent to your email address.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verify-otp
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select('+otpHash +otpExpiry');

    if (!user || !user.otpHash || !user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired.' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    const isMatch = await bcrypt.compare(otp, user.otpHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = await bcrypt.hash(resetToken, 10);
    user.passwordResetExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'OTP verified.',
      data: { resetToken, email },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpiry');

    if (!user || !user.passwordResetToken || !user.passwordResetExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    if (new Date() > user.passwordResetExpiry) {
      return res.status(400).json({ success: false, message: 'Reset token has expired.' });
    }

    const isMatch = await bcrypt.compare(resetToken, user.passwordResetToken);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid reset token.' });
    }

    user.passwordHash = newPassword; // pre-save hook will hash
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.refreshTokens = [];
    await user.save();

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user._id).select('+refreshTokens');

    if (user && refreshToken) {
      user.refreshTokens = (user.refreshTokens || []).filter((t) => t !== refreshToken);
      await user.save({ validateBeforeSave: false });
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('department', 'name code');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/update-profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updates = { name, phone };
    if (req.file) updates.profileImage = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).populate('department', 'name code');

    res.json({ success: true, message: 'Profile updated.', data: user });
  } catch (error) {
    next(error);
  }
};
