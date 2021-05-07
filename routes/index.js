const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const { usersRouter } = require('./users');
const { moviesRouter } = require('./movies');
const auth = require('../middlewares/auth');
const { login, createUser, logout } = require('../controllers/users');
const NotFoundError = require('../errors/not-found-error');

router.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});
router.post('/signup', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }),
}), createUser);
router.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }),
}), login);
router.post('/logout', logout);
router.use('/users', auth, usersRouter);
router.use('/', auth, moviesRouter);
router.use('*', (req, res, next) => {
  next(new NotFoundError('запрашиваемый ресурс не найден'));
});

module.exports = router;
