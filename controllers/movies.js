const Movie = require('../models/movie');
const NotFoundError = require('../errors/not-found-err');
const ErrorInRequest = require('../errors/error-in-request');

const getMovies = (req, res, next) => {
  Movie.find({})
    .then((movies) => res.send(movies))
    .catch(next);
};

const createMovie = (req, res, next) => {
  const data = { ...req.body };
  Movie.create({ ...data, owner: req.user._id })
    .then((movie) => res.send(movie))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ErrorInRequest(`${Object.values(err.errors).map((error) => error.message).join(', ')}`));
      } else {
        next(err);
      }
    });
};

const deleteMovie = (req, res, next) => {
  const { movieId } = req.params;
  Movie.findById(movieId)
    .orFail(new NotFoundError('нет карточки с таким id'))
    .then((movie) => {
      if (String(movie.owner) === req.user._id) {
        Movie.deleteOne(movie)
          .then(() => {
            res.send({ message: 'Пост удален' });
          })
          .catch(next);
      } else {
        res.status(403).send({ message: 'нельзя удалить чужую карточку' });
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new ErrorInRequest('некорректный id карточки'));
      } else {
        next(err);
      }
    });
};

module.exports = {
  getMovies,
  createMovie,
  deleteMovie,
};
