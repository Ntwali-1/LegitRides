
const express = require('express');
const _ = require('lodash');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require ('bcrypt');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const clientRoutes = require('./routes/clientRoutes')
const appealRoutes = require('./routes/appealRoutes')
const ticketExchangeRoutes = require('./routes/ticketExchangeRoutes')
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json');

const app = express();
app.use(morgan('dev'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors());

app.get('/openapi.json', (req, res) => {
  res.json(swaggerDocument);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(clientRoutes)
app.use(appealRoutes)
app.use(ticketExchangeRoutes)


const port = process.env.PORT || 3010;
const uri = process.env.DBURI;

mongoose.connect(uri)
.then(()=>{
  app.listen(port,()=>{
    console.log("App listening on port "+port)
  })
})
.catch((err)=>{
  console.log("Error in db connection...",err);
})