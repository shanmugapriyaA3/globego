const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const router = express.Router();
const usersFile = path.join(__dirname, 'users.json');
const todosFile = path.join(__dirname, 'todos.json');

router.use(express.urlencoded({ extended: true }));
router.use(cookieParser());


function loadUsers() {
  try {
    if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');
    const data = fs.readFileSync(usersFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}


function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}


function loadTodos() {
  try {
    if (!fs.existsSync(todosFile)) fs.writeFileSync(todosFile, '[]');
    const data = fs.readFileSync(todosFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}


function saveTodos(todos) {
  fs.writeFileSync(todosFile, JSON.stringify(todos, null, 2));
}


function getNextTodoId(todos) {
  const ids = todos.map(t => t.id);
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}


function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.redirect('/login');
    req.user = user;
    next();
  });
}

router.get('/', (req, res) => res.redirect('/signup'));

router.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();

  if (users.find(u => u.username === username)) {
    return res.render('signup', { error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  saveUsers(users);

  res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render('login', { error: 'Invalid name or password' });
  }

  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/index');
});

router.get('/index', authenticateToken, (req, res) => {
  res.render('index', { username: req.user.username });
});

router.get('/tours', authenticateToken, (req, res) => {
  const todos = loadTodos();
  res.render('tours', { todos });
});

router.post('/tours/add', authenticateToken, (req, res) => {
  const todos = loadTodos();
  const { place } = req.body;
  const newTodo = { id: getNextTodoId(todos), task: place };
  todos.push(newTodo);
  saveTodos(todos);
  res.redirect('/tours');
});

router.post('/tours/update', authenticateToken, (req, res) => {
  const { id, task } = req.body;
  const todos = loadTodos();
  const todo = todos.find(t => t.id == id);
  if (todo) {
    todo.task = task;
    saveTodos(todos);
  }
  res.redirect('/tours');
});

router.post('/tours/delete', authenticateToken, (req, res) => {
  const { id } = req.body;
  let todos = loadTodos();
  todos = todos.filter(t => t.id != id);
  saveTodos(todos);
  res.redirect('/tours');
});

router.get('/contact', (req, res) => res.render('contact'));

router.post('/feedback', (req, res) => {
  const { name, message } = req.body;
  console.log({ name, message });
  res.send('Form submitted successfully!');
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});


// Instagram route - redirects to Instagram profile
router.get('/instagram', (req, res) => {
  res.redirect('https://www.instagram.com/globego');
});

// Email route - opens mail client via redirect (optional)
router.get('/email', (req, res) => {
  res.redirect('mailto:globego@gmail.com');
});

// Phone route - opens dialer (works mainly on mobile)
router.get('/phone', (req, res) => {
  res.redirect('tel:+1234567890');
});


module.exports = router;