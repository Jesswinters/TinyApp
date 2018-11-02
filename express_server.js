const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use('/public', express.static(__dirname + '/public'));

const urlDatabase = {
  'b2xVn2': {
    url: 'http://www.lighthouselabs.ca',
    userId: 'userRandomID',
  },
  '9sm5xK': {
    url: 'http://www.google.com',
    userId: 'user2RandomID',
  },
};

const users = { 
  'userRandomID': {
    id: 'userRandomID', 
    email: 'user@example.com', 
    password: 'purple-monkey-dinosaur'
  },
  'user2RandomID': {
    id: 'user2RandomID', 
    email: 'user2@example.com', 
    password: 'dishwasher-funk'
  }
};

// Home page
app.get('/', (req, res) => {
  res.send('Hello!');
});

// Login get
app.get('/login', (req, res) => {
  const user_id = req.cookies.id;		
  let user = users[user_id];

  if (!user) {
    user = {};
  }

  if (!user.email) {
    email = '';
  }

  let templateVars = {
    urls: urlDatabase,
    id: user.id,
    email: user.email,
    user_id: user_id,
  };

  res.render('urls_login', templateVars);
});

// Login post
app.post('/login', (req, res) => {
  let user = null;

  for (const user_Id in users) {
    const currentUser = users[user_Id];

    if (currentUser.email === req.body.email) {
      user = currentUser;
      break;
    }

    if (currentUser.password !== req.body.password) {
      res.status(403).send('Invalid email and/or password.');
    }
  }

  if (!user) {
    res.status(403).send('Email not found.');
  }

  res.cookie('id', user.id);
  res.redirect('/urls');
});

// Register URL
app.get('/register', (req, res) => {
  let templateVars = {
    user_id: req.body.id,
    email: req.body.email,
    id: req.body.id,
  };

  res.render('urls_register', templateVars);
});

// Post to register
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let id = generateRandomString(12);

  if (!email || !password) {
    res.status(400).send('Please enter an email and/or password.');
  }

  for (const index in users) {
    if (email === users[index].email) {
      res.status(400).send('Email already exists.');
    }
  }

  users[id] = {
    'id': id,
    'email': email,
    'password': password,
  };

  let user_id = res.cookie('id', id);
  res.redirect('/urls');
});

// Logout URL
app.post('/logout', (req, res) => {
  res.clearCookie('id');
  res.redirect('/urls');
});

// Base URLs page
app.get('/urls', (req, res) => {
  const user_id = req.cookies.id;
  let user = users[user_id];

  if (!user) {
    user = {};
  }

  let urlsMatch = matchUserToUrls(user_id);

  let templateVars = {
    urls: urlsMatch,
    id: user.id,
    email: user.email,
    user_id: user_id,
  };

  res.render('urls_index', templateVars);
});

// Renders when adding a new long URL
app.get('/urls/new', (req, res) => {
  const user_id = req.cookies.id;
  let user = users[user_id];

  if (!user) {
    user = {};

    // Redirect to login page if user is not logged in
    res.redirect('/login');
  }

  let templateVars = {
    urls: urlDatabase,
    id: user.id,
    email: user.email,
    user_id: user_id,
  };

  res.render('urls_new', templateVars);
});

// Displays corresponding short URL that matches :id
app.get('/urls/:id', (req, res) => {
  const user_id = req.cookies.id;
  let user = users[user_id];
  let matchFound = false;

  if (!user) {
    user = {};
  }

  let templateVars = {
    urls: urlDatabase,
    id: user.id,
    email: user.email,
    user_id: user_id,
    shortURL: req.params.id,
  };

  if (urlDatabase[templateVars.shortURL].userId === req.cookies.id) {
    matchFound = true;
  }

  if (!matchFound) {
    res.redirect('/urls');
  } else {
    res.render('urls_show', templateVars);
  }
});

// Update URL
app.post('/urls/:id', (req, res) => {
  for (let userId in urlDatabase) {
    if (userId === req.cookies.id) {
      urlDatabase[req.params.id] = {
        url: req.body.longURL,
        userId: userId,
      };

      res.redirect(`/urls/${req.params.id}`);
    }

    res.redirect('/urls'); 
  }
});

// Delete URL
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// Redirects to long URL based on short URL
app.get('/u/:shortURL', (req, res) => {
  const user_id = req.cookies.id;
  let user = users[user_id];

  if (!user) {
    user = {};
  }

  // let shortURL = req.params.shortURL;
  let longURL = urlDatabase[req.params.shortURL].url;

  let templateVars = {
    urls : urlDatabase,
    id: user.id,
    email: user.email,
    user_id: user_id,
    shortURL: req.params.id,
  };

  res.redirect(longURL, templateVars);
});

// Posts new random string for short URL when adding a new long URL
app.post('/urls', (req, res) => {
  let id = generateRandomString(6);
  let longURL = req.body.longURL;
  let userId = req.cookies.id;

  urlDatabase[id] = {
    userId: userId,
    url: longURL
  };

  res.redirect(`/urls/${id}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Generate random string for short URL
const generateRandomString = (stringLength) => {
  let randomString = '';
  let possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < stringLength; i++) {
    randomString += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }

  return randomString;
};

const matchUserToUrls = (user_id) => {
  let matchingUrlDatabase = {};

  for (let each in urlDatabase) {
    if (urlDatabase[each].userId === user_id) {
      matchingUrlDatabase[each] = {
        url: urlDatabase[each].url,
        userID: urlDatabase[each].userId,
      };
    }
  }

  return matchingUrlDatabase;
};
