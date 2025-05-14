const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const Routes = require('./routes');

dotenv.config();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
res.redirect('/signup');
});

app.use('/', Routes);

app.listen(3600, () => {
console.log('World Tour app running on http://localhost:3600');
});