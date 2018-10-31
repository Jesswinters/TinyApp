const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

// Home page
app.get('/', (req, res) => {
  res.send('Hello!');
});

// Base URLs page
app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies.username,
  };
  res.render('urls_index', templateVars);
});

// Renders when adding a new long URL
app.get('/urls/new', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies.username,
  };
  res.render('urls_new', templateVars);
});

// Displays corresponding short URL that matches :id
app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    username: req.cookies.username,
  };
  res.render('urls_show', templateVars);
});

// Login URL
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls/');
});

// Logout URL
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls/');
});

// Update URL
app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls/');
});

// Delete URL
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// Redirects to long URL based on short URL
app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = `${urlDatabase[shortURL]}`;
  res.redirect(longURL);
});

// Posts new random string for short URL when adding a new long URL
app.post('/urls', (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Function to generate random string for short URL
const generateRandomString = () => {
  let randomString = '';
  let possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 6; i++) {
    randomString += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }

  return randomString;
};
