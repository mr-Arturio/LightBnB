const { Pool } = require('pg');

const pool = new Pool({
  user: 'labber',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

module.exports = {
  pool: pool,
  query: (text, params, callback) => {
    return pool.query(text, params, callback)
  },
}