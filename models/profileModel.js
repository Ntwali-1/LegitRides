const mongoose = require('mongoose')
const Joi = require('joi')

const profileSchema = mongoose.Schema(
  {
    name:{type:String,required:true},
    profilePic:{type:String},
    phone:{type:String,required:true},
    email:{type:String,required:true}
  }
)

const profileValidator = Joi.object({
  name:Joi.string().required(),
  profilePic:Joi.string()
    .custom((value, helpers) => {
      const isImageExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(value);
      const isValidUrl = Joi.string().uri().validate(value).error === undefined;
      
      if (!isImageExtension && !isValidUrl) {
        return helpers.message('profilePic must be an image file...');
      }
      
      return value;
    })
    .optional(),
})

const ClientProfile = mongoose.model('ClientProfile',profileSchema)

module.exports = {ClientProfile,profileValidator}