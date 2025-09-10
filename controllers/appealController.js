const { Appeal, appealValidator, appealResponseValidator } = require('../models/appealModel')
const { TripRequest } = require('../models/tripRequestModel')
const { notifyAppealSubmitted, notifyAppealStatus } = require('../utils/notificationService')

const createAppeal = async (req, res) => {
  const { error } = appealValidator.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  try {
    const { tripId, category, subject, description, evidenceUrls, priority } = req.body

    const trip = await TripRequest.findOne({ _id: tripId, client: req.client.id })
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or not authorized' })
    }

    const existingAppeal = await Appeal.findOne({ trip: tripId, client: req.client.id })
    if (existingAppeal) {
      return res.status(400).json({ message: 'Appeal already exists for this trip' })
    }

    const appeal = new Appeal({
      client: req.client.id,
      trip: tripId,
      category,
      subject,
      description,
      evidenceUrls: evidenceUrls || [],
      priority: priority || 'medium'
    })

    const saved = await appeal.save()
    
    await notifyAppealSubmitted(req.client.email, subject, saved._id)
    
    return res.status(201).json({
      message: 'Appeal created successfully',
      data: saved
    })

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const getMyAppeals = async (req, res) => {
  try {
    const appeals = await Appeal.find({ client: req.client.id })
      .populate('trip', 'province district tripTime status')
      .sort({ createdAt: -1 })

    return res.json({
      message: 'Appeals retrieved successfully',
      data: appeals
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const getAppealById = async (req, res) => {
  try {
    const appeal = await Appeal.findOne({ 
      _id: req.params.id, 
      client: req.client.id 
    }).populate('trip')

    if (!appeal) {
      return res.status(404).json({ message: 'Appeal not found' })
    }

    return res.json({
      message: 'Appeal retrieved successfully',
      data: appeal
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const getAllAppeals = async (req, res) => {
  try {
    const { status, category, priority } = req.query
    const filter = {}
    
    if (status) filter.status = status
    if (category) filter.category = category
    if (priority) filter.priority = priority

    const appeals = await Appeal.find(filter)
      .populate('client', 'name email phone')
      .populate('trip', 'province district tripTime status')
      .sort({ createdAt: -1 })

    return res.json({
      message: 'Appeals retrieved successfully',
      data: appeals
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const respondToAppeal = async (req, res) => {
  const { error } = appealResponseValidator.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  try {
    const { status, message, resolution } = req.body
    const appealId = req.params.id

    const appeal = await Appeal.findById(appealId).populate('client', 'email')
    if (!appeal) {
      return res.status(404).json({ message: 'Appeal not found' })
    }

    appeal.status = status
    appeal.adminResponse = {
      message,
      respondedBy: req.client.email,
      respondedAt: new Date()
    }
    if (resolution) {
      appeal.resolution = resolution
    }

    const updated = await appeal.save()

    await notifyAppealStatus(appeal.client.email, status, message)

    return res.json({
      message: 'Appeal response sent successfully',
      data: updated
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  createAppeal,
  getMyAppeals,
  getAppealById,
  getAllAppeals,
  respondToAppeal
}
