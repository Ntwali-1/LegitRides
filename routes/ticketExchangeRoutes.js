const express = require('express')
const router = express.Router()
const clientAuth = require('../middlewares/clientAuth')
const verifiedStatus = require('../middlewares/verifiedStatus')
const {
  createExchangeListing,
  browseExchangeListings,
  requestExchange,
  respondToExchangeRequest,
  getMyExchanges,
  getPendingRequests
} = require('../controllers/ticketExchangeController')

router.post('/api/exchanges', clientAuth, verifiedStatus, createExchangeListing)
router.get('/api/exchanges', clientAuth, verifiedStatus, browseExchangeListings)

router.post('/api/exchanges/:id/request', clientAuth, verifiedStatus, requestExchange)
router.put('/api/exchange-requests/:id/respond', clientAuth, verifiedStatus, respondToExchangeRequest)

router.get('/api/my-exchanges', clientAuth, verifiedStatus, getMyExchanges)
router.get('/api/pending-exchange-requests', clientAuth, verifiedStatus, getPendingRequests)

module.exports = router
