const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail, getHtml } = require('../utils/nodemailer');
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  register: async (req, res, next) => {
    try {
      let { username, email, password, password_confirmation } = req.body;
      if (password != password_confirmation) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          err: 'please ensure that the password and password confirmation match!',
          data: null,
        });
      }

      let userExist = await prisma.users.findUnique({ where: { email } });
      if (userExist) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          err: 'user has already been used!',
          data: null,
        });
      }

      let encryptedPassword = await bcrypt.hash(password, 10);
      let user = await prisma.users.create({
        data: {
          username,
          email,
          password: encryptedPassword,
          notification: {
            create: {
              title: `Hai ${username}!`,
              body: 'Welcome!, ようこそ！, 환영!',
            },
          },
        },
      });

      res.redirect('/login');
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      let { email, password } = req.body;

      let user = await prisma.users.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          err: 'invalid email or password!',
          data: null,
        });
      }

      let isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          err: 'invalid email or password!',
          data: null,
        });
      }

      let token = jwt.sign({ id: user.id }, JWT_SECRET_KEY);
      res.redirect(`/user/notifications?token=${token}`);
    } catch (err) {
      next(err);
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      let { email } = req.body;
      let user = await prisma.users.findUnique({ where: { email } });

      if (!user) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          error: 'Email not found',
        });
      }

      let token = jwt.sign({ id: user.id }, JWT_SECRET_KEY);
      let url = `http://localhost:3000/reset-password?token=${token}`;

      let html = await getHtml('verify.ejs', {
        username: user.username,
        url,
      });
      sendEmail(email, 'Update Password', html);

      res.status(200).json({
        status: true,
        message: 'email has been sent',
        err: null,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      let user = req.user;
      let { new_password, confirm_new_password } = req.body;

      if (new_password !== confirm_new_password) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          error: "New Password doesn't match",
        });
      }

      let encryptedPassword = await bcrypt.hash(new_password, 10);

      await prisma.users.update({
        where: {
          id: user.id,
        },
        data: {
          password: encryptedPassword,
        },
      });

      let notification = await prisma.notifications.create({
        data: {
          title: 'Update Password',
          body: 'password update successfully',
          user_id: user.id,
        },
        select: {
          title: true,
          body: true,
        },
      });

      req.io.emit(`notification_${user.id}`, notification);

      res.status(200).json({
        status: true,
        message: 'Password has been updated',
        error: null,
        data: null,
      });
    } catch (err) {
      next(err);
    }
  },
};
