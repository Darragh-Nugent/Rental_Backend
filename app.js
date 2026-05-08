import express from 'express';
import knex from 'knex';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path'
import fs from 'fs'
import swaggerUI from 'swagger-ui-express';

import swaggerDocument from './docs/openapi.json' with { type: 'json' };
import 'dotenv/config';
import knexConfig from './knexfile.js';
import apiRouter from './routes/api.js';
import userRouter from './routes/user.js';


const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});

const db = knex(knexConfig);
app.use((req, res, next) => {
    req.db = db;
    next();
})

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan('common'));

app.use('/api', apiRouter);
app.use('/user', userRouter);

app.use('/docs', swaggerUI.serve);
app.get('/docs', swaggerUI.setup(swaggerDocument));

morgan.token('res', (req, res) => {
  const headers = {};
  res.getHeaderNames().map(h => headers[h] = res.getHeader(h));
  return JSON.stringify(headers);
});

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.get("/knex", (req, res, next) => {
  req.db.raw("SELECT VERSION()")
  .then(version => {
    console.log(version[0][0]);
    res.send("Version logged successfully");
  })
  .catch(err => {
    console.log(err);
    throw err;
  });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
}); 