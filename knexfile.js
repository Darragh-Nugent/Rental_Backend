import 'dotenv/config';

export default {
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    user: 'rentalsuser',
    password: process.env.MYSQL_PASS,
    database: 'rentals',
    dateStrings: true
  },
};

