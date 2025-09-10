const mongoose = require('mongoose')
const Joi = require('joi')

const allowedCategories = [
  'overcharging', 
  'driver_behavior', 
  'trip_cancellation', 
  'service_quality', 
  'safety_concern',
  'other'
]

const appealSchema = mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'TripRequest', required: true },
  category: {
    type: String,
    enum: { values: allowedCategories, message: 'Invalid appeal category' },
    required: true
  },
  subject: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 1000 },
  evidenceUrls: [{ type: String }],
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  adminResponse: {
    message: { type: String },
    respondedBy: { type: String },
    respondedAt: { type: Date }
  },
  resolution: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

appealSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

const appealValidator = Joi.object({
  tripId: Joi.string().required(),
  category: Joi.string().valid(...allowedCategories).required(),
  subject: Joi.string().max(200).required(),
  description: Joi.string().max(1000).required(),
  evidenceUrls: Joi.array().items(Joi.string().uri()).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional()
})

const appealResponseValidator = Joi.object({
  status: Joi.string().valid('under_review', 'resolved', 'rejected').required(),
  message: Joi.string().max(500).required(),
  resolution: Joi.string().max(500).optional()
})

const Appeal = mongoose.model('Appeal', appealSchema)

module.exports = { Appeal, appealValidator, appealResponseValidator }
