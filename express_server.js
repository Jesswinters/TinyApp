const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// Renders when adding a new long URL
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

// Displays corresponding short URL that matches :id
app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
  };
  res.render('urls_show', templateVars);
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
