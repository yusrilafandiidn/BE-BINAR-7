require('dotenv').config();
const express = require('express');
const app = express();
const Sentry = require('@sentry/node');
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');
const { PORT, SENTRY_DSN, ENV } = process.env;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
  environment: ENV
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/user', userRouter);
app.use('/api/auth', authRouter);

app.use(Sentry.Handlers.errorHandler());

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`)
})
