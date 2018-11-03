const express = require('express');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use('/public', express.static(__dirname + '/public'));
// Override with POST having ?_method=DELETE
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.use((req, res, next) => {
  // If using _method, change into DELETE method
  if (req.query._method === 'DELETE') {
    req.method = 'DELETE';
    req.url = req.path;
  }

  next(); 
});

/*-----------------------------
Tiny App functions
-------------------------------*/

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

const findUser = (users, email) => {
  for (let user_Id in users) {
    const currentUser = users[user_Id];

    if (currentUser.email === email) {
      return currentUser;
    }
  }
};

const hashPassword = (password) => {
  return bcrypt.hashSync(password, saltRounds);
};

const validatePassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};

/*-----------------------------
URL and user "databases"
-------------------------------*/

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
    password: hashPassword('purple-monkey-dinosaur'),
  },
  'user2RandomID': {
    id: 'user2RandomID', 
    email: 'user2@example.com', 
    password: hashPassword('dishwasher-funk'),
  }
};

/*-----------------------------
GET and POST functions
-------------------------------*/

// Home page
app.get('/', (req, res) => {
  const user_id = req.session.user_id;		
  let user = users[user_id];

  if (!user) {
    res.redirect('/login');
    return;
  } else {
    res.redirect('/urls');
    return;
  }
});

// Login get
app.get('/login', (req, res) => {
  const user_id = req.session.user_id;		
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

  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  } else {
    res.render('urls_login', templateVars);
  }
});

// Login post
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  let user = findUser(users, email);

  if (!user) {
    return res.status(403).send('Email not found.');
  }

  let validatedPassword = validatePassword(password, user.password);

  if (!validatedPassword) {
    return res.status(403).send('Incorrect password.');
  }

  req.session.user_id = user.id;
  res.redirect('/urls');
  return;
});

// Register URL
app.get('/register', (req, res) => {
  const user_id = req.session.user_id;
  let user = users[user_id];

  if (!user) {
    user = {};
  }

  let templateVars = {
    urls: urlDatabase,
    id: user.id,
    email: user.email,
    user_id: user_id,
  };

  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  } else {
    res.render('urls_register', templateVars);
  }
});

// Post to register
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = hashPassword(password);
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
    'password': hashedPassword,
  };

  req.session.user_id = id;
  res.redirect('/urls');
  return;
});

// Logout URL
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
  return;
});

// Base URLs page
app.get('/urls', (req, res) => {
  const user_id = req.session.user_id;
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
  const user_id = req.session.user_id;
  let user = users[user_id];

  if (!user) {
    user = {};

    // Redirect to login page if user is not logged in
    res.redirect('/login');
    return;
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
  const user_id = req.session.user_id;
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

  if (urlDatabase[templateVars.shortURL].userId === req.session.user_id) {
    matchFound = true;
  }

  if (!matchFound) {
    res.redirect('/urls');
    return;
  } else {
    res.render('urls_show', templateVars);
  }
});

// Update URL
app.post('/urls/:id', (req, res) => {
  for (let userId in users) {
    if (userId === req.session.user_id) {
      urlDatabase[req.params.id] = {
        url: req.body.longURL,
        userId: userId,
      };

      res.redirect(`/urls/${req.params.id}`);
      return;
    }

    res.redirect('/urls'); 
    return;
  }
});

// Delete URL - deletes URL if user is logged in
app.delete('/urls/:id', (req, res) => {
  const user_id = req.session.user_id;

  for (let id in urlDatabase) {
    if (user_id === urlDatabase[id].userId) {
      delete urlDatabase[req.params.id];
    }
  }

  res.redirect('/urls');
  return;
});

// Delete URL - handle GET request if user is not logged in
app.get('/urls/:id/delete', (req, res) => {
  res.redirect('/urls');
  return;
});

// Redirects to long URL based on short URL
app.get('/u/:shortURL', (req, res) => {
  const user_id = req.session.user_id;
  let user = users[user_id];

  if (!user) {
    user = {};
  }

  // Return 404 error if shortURL doesn't exist
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404).send('URL not found.');
  } else {
    res.redirect(urlDatabase[req.params.shortURL].url);
    return;
  }
});

// Posts new random string for short URL when adding a new long URL
app.post('/urls', (req, res) => {
  let id = generateRandomString(6);
  let longURL = req.body.longURL;
  let userId = req.session.user_id;

  urlDatabase[id] = {
    userId: userId,
    url: longURL
  };

  res.redirect(`/urls/${id}`);
  return;
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
