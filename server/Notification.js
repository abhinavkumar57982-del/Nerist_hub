const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['lost', 'found', 'buy', 'sell', 'service', 'rental'], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  itemId: { 
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'itemModel'
  },
  itemModel: {
    type: String,
    enum: ['LostItem', 'MarketplaceItem', 'BuyRequest', 'BikeRental', 'FoundItem']
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for faster queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);