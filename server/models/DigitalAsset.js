const mongoose = require('mongoose');

const digitalAssetSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      default: 'document',
    },
    description: {
      type: String,
      default: '',
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    extractedFiles: [
      {
        path: String,
        size: Number,
        isDirectory: Boolean,
      }
    ],
    extractedPath: {
      type: String,
      default: '',
    },
    versionHistory: [
      {
        version: Number,
        fileName: String,
        originalName: String,
        fileUrl: String,
        publicId: String,
        fileSize: Number,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      }
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

digitalAssetSchema.index({ uploadedBy: 1 });
digitalAssetSchema.index({ category: 1 });
digitalAssetSchema.index({ tags: 1 });
digitalAssetSchema.index({ fileName: 'text', tags: 'text' });

module.exports = mongoose.model('DigitalAsset', digitalAssetSchema);
