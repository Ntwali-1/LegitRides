const express = require('express')
const router =  express.Router();
const clientAuth = require('../middlewares/clientAuth')
const verifiedStatus = require('../middlewares/verifiedStatus')
const { clientSignup, clientVerify, clientLogin, clientProfile, tripRequest } = require('../controllers/clientController')

router.post('/api/client-signup',clientSignup)
router.post('/api/client-verify',clientVerify)
router.post('/api/client-login',clientLogin)
router.post('/api/client-profile',clientAuth,verifiedStatus,clientProfile)
router.post('/api/trip-request',clientAuth,verifiedStatus,tripRequest)

module.exports = router;