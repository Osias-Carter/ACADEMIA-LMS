const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');


const authRoutes = require('./routes/authRoutes');
const coursRoutes = require('./routes/coursRoutes'); 


const app = express();

app.use(
  session({
    secret:
      'zertughyrrzszesduythfruytexudzdfghuzyrtfguhytrzsedfghuytrzsedfghuytrzsedfghuytrzsedfg',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

// Routes existantes
app.use('/', authRoutes);
app.use('/', coursRoutes);


module.exports = app;
