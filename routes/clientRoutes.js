const express = require('express')
const router =  express.Router();
const clientAuth = require('../middlewares/clientAuth')
const verifiedStatus = require('../middlewares/verifiedStatus')
const { clientSignup, clientVerify, clientLogin, clientProfile, getClientProfile, updateClientProfile, deleteClientProfile, tripRequest } = require('../controllers/clientController')

router.post('/api/client-signup',clientSignup)
router.post('/api/client-verify',clientVerify)
router.post('/api/client-login',clientLogin)
router.post('/api/client-profile',clientAuth,verifiedStatus,clientProfile)
router.get('/api/client-profile',clientAuth,verifiedStatus,getClientProfile)
router.put('/api/client-profile',clientAuth,verifiedStatus,updateClientProfile)
router.delete('/api/client-profile',clientAuth,verifiedStatus,deleteClientProfile)
router.post('/api/trip-request',clientAuth,verifiedStatus,tripRequest)

module.exports = router;