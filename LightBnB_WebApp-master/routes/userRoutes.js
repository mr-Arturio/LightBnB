const express = require("express");
const bcrypt = require("bcrypt");
const database = require("../db/database");
const db = require("../db/index.js")

// Define pool object using db module
const pool = db.pool;

// const { Pool } = require('pg');

// const pool = new Pool({
//   user: 'labber',
//   password: '123',
//   host: 'localhost',
//   database: 'lightbnb'
// });

const router = express.Router();

// Create a new user
router.post("/", (req, res) => {
  const user = req.body;
  user.password = bcrypt.hashSync(user.password, 12);

  const addUser = function (users) {
    return pool
      .query(
        `INSERT INTO users (name, email, password)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [users.name, users.email, users.password]
      )
      .then((result) => {
        if (result.rows.length === 0) {
          return null;
        }
        return result.rows[0];
      })
      .catch((err) => {
        console.log(err.message);
      });
};

  addUser(user)
    .then((user) => {
      if (!user) {
        return res.send({ error: "error" });
      }

      req.session.userId = user.id;
      res.send("🤗");
    })
    .catch((e) => res.send(e));
});

// Log a user in
router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const getUserWithEmail = function (pool, email) {
    return pool
      .query(
        `SELECT *
         FROM users
         WHERE email = $1`,
        [email]
      )
      .then((result) => {
        if (result.rows.length === 0) {
          return null;
        }
        return result.rows[0];
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

  getUserWithEmail(pool, email).then((user) => {
    if (!user) {
      return res.send({ error: "no user with that id" });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.send({ error: "error" });
    }

    req.session.userId = user.id;
    res.send({
      user: {
        name: user.name,
        email: user.email,
        id: user.id,
      },
    });
  });
});

// Log a user out
router.post("/logout", (req, res) => {
  req.session.userId = null;
  res.send({});
});

// Return information about the current user (based on cookie value)
router.get("/me", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.send({ message: "not logged in" });
  }

  const getUserWithId = function (usersId) {
    return pool
      .query(
        `SELECT *
         FROM users
         WHERE users.id = $1`,
        [usersId]
      )
      .then((result) => {
        if (result.rows.length === 0) {
          return null;
        }
        return result.rows[0];
      })
      .catch((err) => {
        console.log(err.message);
      });
    };

  
    getUserWithId(userId)
    .then((user) => {
      if (!user) {
        return res.send({ error: "no user with that id" });
      }

      res.send({
        user: {
          name: user.name,
          email: user.email,
          id: userId,
        },
      });
    })
    .catch((e) => res.send(e));
});

module.exports = router;