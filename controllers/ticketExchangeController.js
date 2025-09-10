const { ExchangeListing, ExchangeRequest, exchangeListingValidator, exchangeRequestValidator } = require('../models/ticketExchangeModel')
const { TripRequest } = require('../models/tripRequestModel')
const { calculateExchangeFee } = require('../utils/exchangeFeeCalculator')
const { notifyExchangeRequest, notifyExchangeDecision, notifyExchangeCompleted } = require('../utils/notificationService')

const createExchangeListing = async (req, res) => {
  const { error } = exchangeListingValidator.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  try {
    const { tripId, askingPrice } = req.body

    const trip = await TripRequest.findOne({ _id: tripId, client: req.client.id })
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or not authorized' })
    }

    if (!trip.exchangeable) {
      return res.status(400).json({ message: 'Trip is not marked as exchangeable' })
    }

    if (trip.status !== 'pending' && trip.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only pending or confirmed trips can be exchanged' })
    }

    const existingListing = await ExchangeListing.findOne({ trip: tripId, status: 'open' })
    if (existingListing) {
      return res.status(400).json({ message: 'Exchange listing already exists for this trip' })
    }

    const listing = new ExchangeListing({
      owner: req.client.id,
      trip: tripId,
      askingPrice: askingPrice || 0
    })

    const saved = await listing.save()
    const populated = await ExchangeListing.findById(saved._id)
      .populate('trip', 'province district pickupLocation destinationLocation tripTime')

    return res.status(201).json({
      message: 'Exchange listing created successfully',
      data: populated
    })

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const browseExchangeListings = async (req, res) => {
  try {
    const { province, district } = req.query
    const filter = { status: 'open', owner: { $ne: req.client.id } } // Exclude own listings
    
    const listings = await ExchangeListing.find(filter)
      .populate({
        path: 'trip',
        match: province ? { province } : district ? { district } : {},
        select: 'province district pickupLocation destinationLocation tripTime tripType paymentMethod'
      })
      .populate('owner', 'name')
      .sort({ createdAt: -1 })

    const filteredListings = listings.filter(listing => listing.trip !== null)

    const listingsWithFees = filteredListings.map(listing => {
      const feeInfo = calculateExchangeFee(listing.trip.tripTime, listing.askingPrice)
      return {
        ...listing.toObject(),
        exchangeFee: feeInfo
      }
    })

    return res.json({
      message: 'Exchange listings retrieved successfully',
      data: listingsWithFees
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const requestExchange = async (req, res) => {
  const { error } = exchangeRequestValidator.validate(req.body)
  if (error) {
    return res.status(400).json({ message: error.details[0].message })
  }

  try {
    const listingId = req.params.id
    const { myTripId, message, offerPrice } = req.body

    const listing = await ExchangeListing.findById(listingId)
      .populate('owner', 'email')
      .populate('trip')

    if (!listing) {
      return res.status(404).json({ message: 'Exchange listing not found' })
    }

    if (listing.status !== 'open') {
      return res.status(400).json({ message: 'Exchange listing is not available' })
    }

    if (listing.owner._id.toString() === req.client.id) {
      return res.status(400).json({ message: 'Cannot request exchange with your own listing' })
    }

    // Verify requester's trip exists, belongs to them, and is exchangeable
    const requesterTrip = await TripRequest.findOne({ _id: myTripId, client: req.client.id })
    if (!requesterTrip) {
      return res.status(404).json({ message: 'Your trip not found or not authorized' })
    }

    if (!requesterTrip.exchangeable) {
      return res.status(400).json({ message: 'Your trip is not marked as exchangeable' })
    }

    if (requesterTrip.status !== 'pending' && requesterTrip.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only pending or confirmed trips can be exchanged' })
    }

    const existingRequest = await ExchangeRequest.findOne({
      listing: listingId,
      requester: req.client.id,
      status: 'requested'
    })

    if (existingRequest) {
      return res.status(400).json({ message: 'Exchange request already exists' })
    }

    const exchangeRequest = new ExchangeRequest({
      listing: listingId,
      requester: req.client.id,
      requesterTrip: myTripId,
      message: message || '',
      offerPrice: offerPrice || 0
    })

    const saved = await exchangeRequest.save()

    listing.status = 'pending'
    await listing.save()

    await notifyExchangeRequest(listing.owner.email, listingId)

    return res.status(201).json({
      message: 'Trip swap request sent successfully',
      data: saved
    })

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const respondToExchangeRequest = async (req, res) => {
  try {
    const requestId = req.params.id
    const { decision } = req.body

    if (!['accepted', 'declined'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be either "accepted" or "declined"' })
    }

    const exchangeRequest = await ExchangeRequest.findById(requestId)
      .populate({
        path: 'listing',
        populate: { path: 'owner trip' }
      })
      .populate('requester', 'email')

    if (!exchangeRequest) {
      return res.status(404).json({ message: 'Exchange request not found' })
    }

   if (exchangeRequest.listing.owner._id.toString() !== req.client.id) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' })
    }

    if (exchangeRequest.status !== 'requested') {
      return res.status(400).json({ message: 'Exchange request already processed' })
    }

    if (decision === 'accepted') {
      // Get both trips for mutual swap
      const ownerTrip = await TripRequest.findById(exchangeRequest.listing.trip._id)
      const requesterTrip = await TripRequest.findById(exchangeRequest.requesterTrip)

      if (!requesterTrip) {
        return res.status(404).json({ message: 'Requester trip not found' })
      }

      // Perform mutual swap - exchange ownership
      const tempClientId = ownerTrip.client
      ownerTrip.client = requesterTrip.client
      requesterTrip.client = tempClientId
      
      // Update both trip statuses
      ownerTrip.status = 'exchanged'
      requesterTrip.status = 'exchanged'
      
      await ownerTrip.save()
      await requesterTrip.save()

      // Update request and listing status
      exchangeRequest.status = 'accepted'
      exchangeRequest.listing.status = 'completed'
      
      await exchangeRequest.save()
      await exchangeRequest.listing.save()

      // Send completion notifications
      await notifyExchangeCompleted(
        exchangeRequest.listing.owner.email,
        exchangeRequest.requester.email,
        `${ownerTrip._id} ↔ ${requesterTrip._id}`
      )

      return res.json({
        message: 'Trip swap completed successfully! Both trips have been exchanged.',
        data: {
          exchangeRequest,
          swappedTrips: {
            yourNewTrip: requesterTrip,
            theirNewTrip: ownerTrip
          }
        }
      })

    } else {
      exchangeRequest.status = 'declined'
      exchangeRequest.listing.status = 'open' 
      
      await exchangeRequest.save()
      await exchangeRequest.listing.save()

      await notifyExchangeDecision(exchangeRequest.requester.email, 'declined')

      return res.json({
        message: 'Exchange request declined',
        data: exchangeRequest
      })
    }

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const getMyExchanges = async (req, res) => {
  try {
    const myListings = await ExchangeListing.find({ owner: req.client.id })
      .populate('trip', 'province district tripTime status')
      .sort({ createdAt: -1 })

    const myRequests = await ExchangeRequest.find({ requester: req.client.id })
      .populate({
        path: 'listing',
        populate: { path: 'trip owner', select: 'province district tripTime status name' }
      })
      .sort({ createdAt: -1 })

    return res.json({
      message: 'Exchange history retrieved successfully',
      data: {
        listings: myListings,
        requests: myRequests
      }
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const getPendingRequests = async (req, res) => {
  try {
    const requests = await ExchangeRequest.find({ status: 'requested' })
      .populate({
        path: 'listing',
        match: { owner: req.client.id },
        populate: { path: 'trip' }
      })
      .populate('requester', 'name email')
      .populate('requesterTrip', 'province district pickupLocation destinationLocation tripTime tripType paymentMethod')
      .sort({ createdAt: -1 })

    const filteredRequests = requests.filter(request => request.listing !== null)

    return res.json({
      message: 'Pending exchange requests retrieved successfully',
      data: filteredRequests
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  createExchangeListing,
  browseExchangeListings,
  requestExchange,
  respondToExchangeRequest,
  getMyExchanges,
  getPendingRequests
}
