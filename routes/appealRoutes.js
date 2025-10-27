const express = require('express')
const router = express.Router()
const clientAuth = require('../middlewares/clientAuth')
const verifiedStatus = require('../middlewares/verifiedStatus')
const adminAuth = require('../middlewares/adminAuth')
const { 
  createAppeal, 
  getMyAppeals, 
  getAppealById, 
  getAllAppeals, 
  respondToAppeal 
} = require('../controllers/appealController')

router.post('/api/appeals', clientAuth, verifiedStatus, createAppeal)
router.get('/api/appeals', clientAuth, verifiedStatus, getMyAppeals)
router.get('/api/appeals/:id', clientAuth, verifiedStatus, getAppealById)

router.get('/api/admin/appeals', clientAuth, adminAuth, getAllAppeals)
router.put('/api/admin/appeals/:id/respond', clientAuth, adminAuth, respondToAppeal)

module.exports = router
