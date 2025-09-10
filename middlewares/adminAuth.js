const adminAuth = (req, res, next) => {
  if (!req.client) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim()) : []
  
  if (adminEmails.length === 0) {
    return res.status(500).json({ message: 'Admin configuration not found' })
  }

  if (!adminEmails.includes(req.client.email)) {
    return res.status(403).json({ message: 'Admin access required' })
  }

  next()
}

module.exports = adminAuth
