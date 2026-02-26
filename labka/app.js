const express = require('express');
const path = require('path');
const logger = require('morgan');

const studentsRouter = require('./routes/students');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));


app.use('/student', studentsRouter);

app.listen(8083, () => console.log('Сервер: http://localhost:8083'));

module.exports = app;