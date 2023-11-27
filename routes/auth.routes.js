const { Router } = require('express');
const { register, login, forgotPassword, resetPassword } = require('../controllers/auth.controllers');
const { restrict } = require('../middlewares/auth.middlewares');

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', restrict, resetPassword);

module.exports = authRouter;
