const mongoose = require('mongoose')
const Joi = require('joi')

const clientSchema = mongoose.Schema(
  {
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    phone:{type:String,required:true},
    isVerified:{type:Boolean,default:false},
    otp:{type:String},
    otpExpires:{type:Date}
  }
)

const clientValidator = Joi.object({
  name:Joi.string().required(),
  email:Joi.string().email().required(),
  phone:Joi.string().pattern(/^\+?[0-9\s\-()]{7,15}$/).required(),
  password:Joi.string().required()
})

const Client = mongoose.model('Client',clientSchema)

module.exports = {Client,clientValidator}