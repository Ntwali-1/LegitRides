const { Client,clientValidator } = require('../models/clientModel')
const { ClientProfile,profileValidator } = require('../models/profileModel')
const  { genSalt, hash, compare } =   require('bcrypt');
const  { sign } = require('jsonwebtoken');
const { TripRequest } = require('../models/tripRequestModel')
const sendEmail = require('../utils/sendEmail')

const clientSignup = async (req,res)=>{
 
  const {error} = clientValidator.validate(req.body);
  if(error){
    return res.json({message:error.details[0].message})
  }

  try {
    const {name,email,password,phone} = req.body

    const salt = await genSalt(10);
    const hashed = await hash(password,salt); 


    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const data = new Client({
      name,
      email,
      password:hashed,
      phone,
      otp,
      otpExpires,
    })

    const saved = await data.save();

    await sendEmail(
      email,
      'Verify your  Rwanda Rides account',
      `
        Welcome to  Rwanda Rides \n
        Your One-Time Password (OTP) is: ${otp}\n
        It will expire in 10 minutes.\n
        If you didn't request this, please ignore this message.
      `
    )

    res.json({data:saved});
  } catch (error) {
    res.json({message:error.message});
  }
}

const clientVerify = async (req,res)=>{

  const {email,otp} = req.body

  try {
    const client = await Client.findOne({email})
  if(!client){
    return res.json({message:"First sign up..."})
  }

  if (Date.now() > client.otpExpires) {
      return res.status(400).json({ message: 'OTP has expired' });
  }

  if(client.otp !== otp){
    return res.json({message:"Invalid OTP..."})
  }

  if(client.isVerified){
    return res.json({message:"Account already verified..."})
  }


  client.otp = undefined;
  client.otpExpires = undefined;
  client.isVerified = true;

  await client.save();
  return res.json({message:'Account verified successfully...'})
  } catch (error) {
    return res.json({message:error.message})
  }
  
}

const clientLogin = async (req,res)=>{
  const client = await Client.findOne({email:req.body.email})
  if(client) {
    const match = await compare(req.body.password,client.password)
    if(match){
      const token = sign({id:client._id,name:client.name,email:client.email,phone:client.phone},process.env.JWTSECRETKEY)
      res.setHeader('Authorisation',`Bearer ${token}`).json({token})
    }else{
      res.status(401).json({message:'Invalid password...'})
    }
  }else{
    res.status(401).json({message:'Invalid email...'})
  }
}

const clientProfile = async (req,res)=>{

  const {error} = profileValidator.validate(req.body)
  if(error){
    return res.json({message:error.details[0].message})
  }

  try {

    const {name,profilePic} = req.body

    const profile = new ClientProfile({
      name,
      profilePic,
      phone:req.client.phone,
      email:req.client.email
    });

    const saved = await profile.save()
    return res.json({data:saved})

  } catch (error) {
    return res.json({message:error.message})
  }
}

const getClientProfile = async (req,res)=>{
  try {
    const profile = await ClientProfile.findOne({email:req.client.email})
    if(!profile){
      return res.json({message:"Profile not found..."})
    }
    return res.json({data:profile})
  } catch (error) {
    return res.json({message:error.message})
  }
}

const updateClientProfile = async (req,res)=>{
  try {
    const profile = await ClientProfile.findOneAndUpdate({email:req.client.email},req.body,{new:true})
    if(!profile){
      return res.json({message:"Profile not found..."})
    }
    return res.json({data:profile})
  } catch (error) {
    return res.json({message:error.message})
  }
}

const deleteClientProfile = async (req,res)=>{
  try {
    const profile = await ClientProfile.findOneAndDelete({email:req.client.email})
    if(!profile){
      return res.json({message:"Profile not found..."})
    }
    return res.json({message:"Profile deleted successfully..."})
  } catch (error) {
    return res.json({message:error.message})
  }
}

const tripRequest = async(req,res)=>{
  try {
    const {province,district,pickupLocation,destinationLocation,tripType,tripTime,paymentMethod,exchangeable} = req.body;

    const tripRequest=  new TripRequest({
      client:req.client.id,
      province,
      district,
      pickupLocation,
      destinationLocation,
      tripType,
      tripTime,
      paymentMethod,
      exchangeable: exchangeable || false
    })
    const saved = await tripRequest.save()
    return res.json({tripRequest:saved})

  } catch (error) {
    return res.json({message:error.message})
  }
}

const listTrips = async (req,res)=>{
  try {
    const filter = { client: req.client.id }
    if(req.query.status){
      filter.status = req.query.status
    }
    const trips = await TripRequest.find(filter).sort({ _id: -1 })
    return res.json({data:trips})
  } catch (error) {
    return res.json({message:error.message})
  }
}

const getTripById = async (req,res)=>{
  try {
    const trip = await TripRequest.findOne({ _id: req.params.id, client: req.client.id })
    if(!trip){
      return res.status(404).json({message:'Trip not found'})
    }
    return res.json({data:trip})
  } catch (error) {
    return res.json({message:error.message})
  }
}

const updateTrip = async (req,res)=>{
  try {
    const trip = await TripRequest.findOne({ _id: req.params.id, client: req.client.id })
    if(!trip){
      return res.status(404).json({message:'Trip not found'})
    }
    if(trip.status !== 'pending'){
      return res.status(400).json({message:'Only pending trips can be updated'})
    }
    const fields = ['province','district','pickupLocation','destinationLocation','tripType','tripTime','paymentMethod','exchangeable']
    fields.forEach(f=>{
      if(typeof req.body[f] !== 'undefined'){
        trip[f] = req.body[f]
      }
    })
    await trip.save()
    return res.json({data:trip})
  } catch (error) {
    return res.json({message:error.message})
  }
}

const cancelTrip = async (req,res)=>{
  try {
    const trip = await TripRequest.findOne({ _id: req.params.id, client: req.client.id })
    if(!trip){
      return res.status(404).json({message:'Trip not found'})
    }
    if(trip.status === 'completed'){
      return res.status(400).json({message:'Completed trip cannot be cancelled'})
    }
    if(trip.status === 'cancelled'){
      return res.json({data:trip})
    }
    trip.status = 'cancelled'
    await trip.save()
    return res.json({data:trip})
  } catch (error) {
    return res.json({message:error.message})
  }
}

const completeTrip = async (req,res)=>{
  try {
    const trip = await TripRequest.findOne({ _id: req.params.id, client: req.client.id })
    if(!trip){
      return res.status(404).json({message:'Trip not found'})
    }
    if(trip.status === 'completed'){
      return res.json({data:trip})
    }
    trip.status = 'completed'
    trip.completedAt = new Date()
    await trip.save()
    return res.json({data:trip})
  } catch (error) {
    return res.json({message:error.message})
  }
}

module.exports = {
  clientSignup,
  clientVerify,
  clientLogin,
  clientProfile,
  getClientProfile,
  updateClientProfile,
  deleteClientProfile,
  tripRequest,
  listTrips,
  getTripById,
  updateTrip,
  cancelTrip,
  completeTrip
}