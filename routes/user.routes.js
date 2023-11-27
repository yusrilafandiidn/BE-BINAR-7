const { Router } = require('express');
const { restrict } = require('../middlewares/auth.middlewares');

const userRouter = Router();

userRouter.get('/register', (req, res) => {
  res.render('register');
});

userRouter.get('/login', (req, res) => {
  res.render('login');
});

userRouter.get('/notifications', restrict, (req, res) => {
  res.render('notifications', { user: req.user });
});

userRouter.get('/reset-password', restrict, (req, res) => {
  res.render('reset-password', { token: req.query.token });
});

userRouter.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});

module.exports = userRouter;
