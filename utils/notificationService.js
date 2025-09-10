const sendEmail = require('./sendEmail')

async function notifyAppealSubmitted(clientEmail, subject, appealId) {
  const text = `Your appeal has been submitted successfully.\nSubject: ${subject}\nAppeal ID: ${appealId}`
  await sendEmail(clientEmail, 'Appeal Submitted - Rwanda Rides', text)
}

async function notifyAppealStatus(clientEmail, status, message) {
  const text = `Your appeal status has been updated to: ${status}.\nMessage: ${message}`
  await sendEmail(clientEmail, 'Appeal Update - Rwanda Rides', text)
}

async function notifyExchangeRequest(ownerEmail, listingId) {
  const text = `You have a new exchange request for listing: ${listingId}.`
  await sendEmail(ownerEmail, 'New Exchange Request - Rwanda Rides', text)
}

async function notifyExchangeDecision(requesterEmail, decision) {
  const text = `Your exchange request has been ${decision}.`
  await sendEmail(requesterEmail, 'Exchange Request Update - Rwanda Rides', text)
}

async function notifyExchangeCompleted(userAEmail, userBEmail, swapInfo) {
  const textA = `Trip swap completed! You have successfully exchanged trips. Swap ID: ${swapInfo}`
  const textB = `Trip swap completed! You have successfully exchanged trips. Swap ID: ${swapInfo}`
  await sendEmail(userAEmail, 'Trip Swap Completed - Rwanda Rides', textA)
  await sendEmail(userBEmail, 'Trip Swap Completed - Rwanda Rides', textB)
}

module.exports = {
  notifyAppealSubmitted,
  notifyAppealStatus,
  notifyExchangeRequest,
  notifyExchangeDecision,
  notifyExchangeCompleted,
}
