const mongoose = require('mongoose')

const campaignSchema = new mongoose.Schema(
  {
    campaignName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    mailSend: {
      type: Number,
      default: 0,
    },
    mailDelivered: {
      type: Number,
      default: 0,
    },
    mailOpened: {
      type: Number,
      default: 0,
    },
    notDelivered: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)
const Campaign = mongoose.model('Campaign', campaignSchema)
module.exports = Campaign
