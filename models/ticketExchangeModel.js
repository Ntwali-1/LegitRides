const mongoose = require('mongoose')
const Joi = require('joi')

const exchangeListingSchema = mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'TripRequest', required: true },
  askingPrice: { type: Number, default: 0 }, // optional
  status: { type: String, enum: ['open', 'pending', 'accepted', 'declined', 'cancelled', 'completed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

exchangeListingSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

const exchangeRequestSchema = mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'ExchangeListing', required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  requesterTrip: { type: mongoose.Schema.Types.ObjectId, ref: 'TripRequest', required: true },
  message: { type: String },
  offerPrice: { type: Number },
  status: { type: String, enum: ['requested', 'accepted', 'declined', 'cancelled'], default: 'requested' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

exchangeRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

const exchangeListingValidator = Joi.object({
  tripId: Joi.string().required(),
  askingPrice: Joi.number().min(0).optional()
})

const exchangeRequestValidator = Joi.object({
  myTripId: Joi.string().required(),
  message: Joi.string().max(300).optional(),
  offerPrice: Joi.number().min(0).optional()
})

const ExchangeListing = mongoose.model('ExchangeListing', exchangeListingSchema)
const ExchangeRequest = mongoose.model('ExchangeRequest', exchangeRequestSchema)

module.exports = { ExchangeListing, ExchangeRequest, exchangeListingValidator, exchangeRequestValidator }
