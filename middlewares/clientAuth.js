const jwt = require('jsonwebtoken')

function clientAuth(req,res,next){
  const authHeaders = req.header('authorization');
  const token = authHeaders && authHeaders.split(' ')[1];

  if(!token){
    return res.status(401).json({message:'No token provided...'});
  }
  else{
    try{
      const decoded = jwt.verify(token,process.env.JWTSECRETKEY)
      req.client = decoded;
      next();
    }catch(err){
      return res.status(400).json({message:'Invalid token...'})
    }
  }
}

module.exports = clientAuth;