require('dotenv').config();

const { PORT = 3000 } = process.env;
const express = require('express');
const mongoose = require('mongoose');
const { errors } = require('celebrate');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const router = require('./routes/index');
const { requestLogger, errorLogger } = require('./middlewares/logger');

mongoose.connect('mongodb://localhost:27017/moviesdb');

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', ['http://localhost:3000', 'https://alzot.movies.nomoredomains.icu']);
  res.append('Access-Control-Expose-Headers', 'Set-Cookie');
  res.append('Access-Control-Allow-Credentials', 'true');
  res.append('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE');
  res.append('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Set-Cookie');
  next();
});
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(limiter);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(requestLogger);
app.use(router);
app.use(errorLogger);
app.use(errors());
app.use((err, req, res, next) => {
  res.status(err.statusCode).send({ message: err.message });
  if (!err.statusCode) {
    const { statusCode = 500, message } = err;
    res
      .status(statusCode)
      .send({
        message: statusCode === 500
          ? 'На сервере произошла ошибка'
          : message,
      });
  }
  next();
});

app.listen(PORT, () => {
  console.log('App start and go');
});
