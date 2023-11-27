const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  restrict: (req, res, next) => {
    let { authorization } = req.headers;
    let token = req.query.token || authorization;

    if (!token) {
      return res.status(401).json({
        status: false,
        message: 'Unauthorized',
        err: 'missing token!',
        data: null,
      });
    }

    jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: false,
          message: 'Unauthorized',
          err: err.message,
          data: null,
        });
      }

      req.user = await prisma.users.findUnique({
        where: {
          id: decoded.id,
        },
        select: {
          id: true,
          username: true,
          email: true,
          password: true,
          notification: true,
        },
      });

      next();
    });
  },
};
