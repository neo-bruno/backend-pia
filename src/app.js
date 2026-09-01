require('dotenv').config();
const express = require('express');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());
app.use('/api', routes);
app.use(errorMiddleware);

module.exports = app;
