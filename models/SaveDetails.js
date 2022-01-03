const mongoose = require('mongoose')

const saveDetailsSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    jobRole: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    facebookProfile: {
      type: String,
      required: true,
    },
    linkedinProfile: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)
const SavedDetail = mongoose.model('SavedDetail', saveDetailsSchema)
module.exports = SavedDetail
