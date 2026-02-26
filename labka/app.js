const express = require('express');
const path = require('path');
const logger = require('morgan');

// Імпортуємо наш роутер
const studentsRouter = require('./routes/students');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Використовуємо роутер.
// Всі шляхи всередині studentsRouter тепер будуть починатися з /student
app.use('/student', studentsRouter);

app.listen(8083, () => console.log('Сервер: http://localhost:8083'));

module.exports = app;