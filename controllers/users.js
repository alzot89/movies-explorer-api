require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFoundError = require('../errors/not-found-error');
const ErrorInRequest = require('../errors/error-in-request');
const AuthError = require('../errors/auth-error');
const ConflictError = require('../errors/conflict-error');

const createUser = (req, res, next) => {
  const data = { ...req.body };
  bcrypt.hash(data.password, 10)
    .then((hash) => User.create({
      ...data,
      password: hash,
    }))
    .then((user) => res.send({
      _id: user._id,
      name: user.name,
      email: user.email,
    }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ErrorInRequest(`${Object.values(err.errors).map((error) => error.message).join(', ')}`));
      } else if (err.name === 'MongoError' && err.code === 11000) {
        next(new ConflictError('такой пользователь уже существует'));
      } else {
        next(err);
      }
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        process.env.NODE_ENV === 'production' ? process.env.JWT_SECRET : 'dev-secret',
        { expiresIn: '7d' },
      );
      res
        .cookie('jwt', token, {
          maxAge: 3600000 * 24 * 7,
          httpOnly: true,
          path: '/',
          sameSite: 'none',
        })
        .send({ message: 'вы успешно авторизовались' });
    })
    .catch((err) => {
      next(new AuthError(err.message));
    });
};

const logout = (req, res) => {
  res.clearCookie('jwt').send({ message: 'Вы вышли из аккаунта' });
};

const getUser = (req, res, next) => {
  User.findById(req.user._id)
    .orFail(new NotFoundError('нет пользователя с таким id'))
    .then((user) => { res.send(user); })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new ErrorInRequest('некорректный id пользователя'));
      } else {
        next(err);
      }
    });
};

const updateUser = (req, res, next) => {
  const { name, email } = req.body;
  User.findByIdAndUpdate(req.user._id, { name, email }, {
    new: true,
    runValidators: true,
  })
    .orFail(new NotFoundError('нет пользователя с таким id'))
    .then((user) => { res.send(user); })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new ErrorInRequest('в полях ввода должен быть текст'));
      } else if (err.name === 'ValidationError') {
        next(new ErrorInRequest(`${Object.values(err.errors).map((error) => error.message).join(', ')}`));
      } else {
        next(err);
      }
    });
};

module.exports = {
  getUser,
  createUser,
  updateUser,
  login,
  logout,
};
