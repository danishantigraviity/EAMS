const mongoose = require('mongoose');

const ocrDataSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    extractedText: {
      type: String,
      required: [true, 'Extracted text is required'],
    },
    parsedData: {
      vendor: {
        type: String,
        default: '',
        trim: true,
      },
      amount: {
        type: Number,
        default: null,
      },
      purchaseDate: {
        type: Date,
        default: null,
      },
      serialNumber: {
        type: String,
        default: '',
        trim: true,
      },
    },
    status: {
      type: String,
      enum: ['draft', 'processed'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ocrDataSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('OcrData', ocrDataSchema);
