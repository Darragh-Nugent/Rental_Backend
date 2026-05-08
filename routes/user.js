import express from 'express';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';


const router = express.Router();

export default router;

router.post('/login', (req, res, next) => {
  // 1. Retrieve email and password from req.body
  const { email, password } = req.body ?? {};

  // Verify body
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    });
    return;
  }
  // 2. Determine if user already exists in table
  req.db.from("users").select("*").where("email", "=", email)
    .then(users => {
      if (users.length === 0) {
        throw new Error("User does not exist");
      }
      console.log("User exists in table");
    });
  req.db.from("users").select("*").where("email", "=", email)
    .then(users => {
      if (users.length === 0) {
        throw new Error("User does not exist");
      }
      // 2.1 If user does exist, verify if passwords match
      const { hash } = users[0];
      return argon2.verify(hash, password);
    })
    .then(match => {
      if (match) {
        // 2.1.1 If passwords match, return JWT
        const expiresIn = 60 * 10;
        const exp = Math.floor(Date.now() / 1000) + expiresIn;
        const token = jwt.sign({ exp }, process.env.JWT_SECRET);
        res.json({
          token,
          tokenType: "Bearer",
          expiresIn
        });
      } else {
        // 2.1.2 If passwords do not match, return error response
        throw new Error("Passwords do not match");
      }
    });

  const expiresIn = 60 * 10;
  const exp = Math.floor(Date.now() / 1000) + expiresIn;
  const token = jwt.sign({ exp }, process.env.JWT_SECRET);
  res.json({
    token,
    tokenType: "Bearer",
    expiresIn
  });
});

router.post('/register', (req, res, next) => {
  // 1. Retrieve email and password from req.body
  const { email, password } = req.body ?? {};

  // Verify body
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    });
    return;
  }

  // 2. Determine if user already exists in table
  const queryUsers = req.db.from("users").select("*").where("email", "=", email);
  queryUsers.then(users => {
    if (users.length > 0) {
      // 2.1 If user does exist, return error response
      throw new Error("User already exists");
    } else {
      // 2.2 If user does not exist, insert into table
      return argon2.hash(password);
    }
  })
    .then(hash => {
      return req.db.from("users").insert({ email, hash });
    })
    .then(() => {
      res.status(201).json({ success: true, message: "User created" });
    })
    .catch(e => {
      res.status(500).json({ success: false, message: e.message });
    });
});