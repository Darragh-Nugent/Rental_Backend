import express from 'express';
import knex from 'knex';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path'
import https from 'node:https';
import fs from 'node:fs';
import YAML from 'yaml';
import knexConfig from './knexfile.js';
import swaggerUI from 'swagger-ui-express';

// import swaggerDocument from './docs/rentals-openapi.json' with { type: 'json' };
import 'dotenv/config';

import userRouter from './routes/userRoute.js';
import ratingsRouter from './routes/ratingsRoute.js';
import rentalRouter from './routes/rentalRoute.js'


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

app.use('/user', userRouter);
app.use('/ratings', ratingsRouter);
app.use('/rentals', rentalRouter);

const swaggerDocument = YAML.parse(
  fs.readFileSync('./docs/rentals-openapi.yaml', 'utf8')
);

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

const credentials = {
  key: fs.readFileSync('./certs/selfsigned.key'),
  cert: fs.readFileSync('./certs/selfsigned.crt')
};

https.createServer(credentials, app).listen(port, () => {
  console.log(`Server listening on https://localhost:${port}`);
});