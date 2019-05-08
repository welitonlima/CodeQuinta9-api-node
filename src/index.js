const express = require('express');
const bodyParser = require('body-parser');
const cors = require('./config/cors');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cors);

require('./app/controllers/index')(app);

// tortoiser 2

app.listen(3000);