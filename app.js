// app.js

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const crypto = require('crypto');

const authRoutes = require('./routes/authRoutes');

const app = express();

// Générer une clé secrète forte pour la session (64 bytes hexadécimaux)
const sessionSecret = crypto.randomBytes(64).toString('hex');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configuration du middleware de session AVANT les routes
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
    httpOnly: true,               // Protège contre les accès JS côté client
    secure: false                 // mettre true en prod avec HTTPS
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

// Utilisation des routes authentification et inscription
app.use("/", authRoutes);

module.exports = app;
