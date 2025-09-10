const calculateExchangeFee = (tripTime, askingPrice = 0) => {
  const now = new Date()
  const tripDate = new Date(tripTime)
  const hoursUntilTrip = (tripDate - now) / (1000 * 60 * 60)
  
  let baseFee = 1000 // Base fee in RWF (Rwandan Francs)
  let urgencyMultiplier = 1
  
  // Urgency-based pricing
  if (hoursUntilTrip < 2) {
    urgencyMultiplier = 2.0 // 100% increase for very urgent exchanges
  } else if (hoursUntilTrip < 6) {
    urgencyMultiplier = 1.5 // 50% increase for urgent exchanges
  } else if (hoursUntilTrip < 24) {
    urgencyMultiplier = 1.2 // 20% increase for same-day exchanges
  }
  
  // Price-based percentage (if there's an asking price)
  let priceFee = 0
  if (askingPrice > 0) {
    priceFee = askingPrice * 0.05 // 5% of asking price
  }
  
  const totalFee = Math.round((baseFee * urgencyMultiplier) + priceFee)
  
  return {
    baseFee,
    urgencyMultiplier,
    priceFee,
    totalFee,
    hoursUntilTrip: Math.max(0, hoursUntilTrip)
  }
}

module.exports = { calculateExchangeFee }
