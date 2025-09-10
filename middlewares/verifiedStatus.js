const express = require('express')
const {Client} = require('../models/clientModel')

async function verifiedStatus(req,res,next) {
  try{
    const client = await Client.findById(req.client.id)
    if(!client || !client.isVerified){
      res.json({message:"First verify account..."})
    }

    next();
  }catch(error){

  }
}

module.exports = verifiedStatus