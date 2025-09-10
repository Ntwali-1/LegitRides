const mongoose = require('mongoose')
const Joi = require('joi')

const allowedProvince = ['Western','Eastern','Northern','Southern','Kigali']
const allowedDistricts = [ "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana","Gasabo", "Kicukiro", "Nyarugenge","Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo","Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango","Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro"]
const allowedPaymentMethods = ["Cash","MoMo"]

const tripRequestSchema = mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  province:{type:String,enum:{values:allowedProvince,message:'Enter a valid province...'},required:true},
  district:{type:String,enum:{values:allowedDistricts,message:'Enter a valid district...'},required:true},
  pickupLocation:{
    type:{
      type:String,
      enum:['Point'],
      required:true
    },
    coordinates: {
      type: [Number],    
      required: true
    }
  },
  destinationLocation:{
    type:{
      type:String,
      enum:['Point'],
      required:true
    },
    coordinates: {
      type: [Number],     
      required: true
    }
  },
  paymentMethod:{
    type:String,
    enum:{values:allowedPaymentMethods,message:"Payment method not allowed here..."},
    required:true
  },
  tripType:{
    type:String,
    enum:['now','schedule'],
    required:true
  },
  tripTime:{
    type:Date,
    required:function (){ return this.tripType === 'schedule' },
    default:function (){ return this.tripType === 'now' ? new Date() : undefined }
  },
  status:{
    type:String,
    enum:['pending','confirmed','completed','cancelled','exchanged'],
    default:'pending'
  },
  exchangeable:{ type:Boolean, default:false },
  completedAt:{ type:Date }
})

tripRequestSchema.index({ pickupLocation: '2dsphere' })
tripRequestSchema.index({ destinationLocation: '2dsphere' })

const TripRequest = mongoose.model('TripRequest',tripRequestSchema);

module.exports = {
  TripRequest
}
