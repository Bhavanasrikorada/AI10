const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true
    },
    agentId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    user: {
      type: String,
      default: 'Anonymous Consumer'
    },
    score: {
      type: Number,
      required: [true, 'Rating score between 1 and 5 is required'],
      min: 1,
      max: 5
    },
    tags: [{
      type: String,
      trim: true
    }],
    text: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Rating', ratingSchema);
