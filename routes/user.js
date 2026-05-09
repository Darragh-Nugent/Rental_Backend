import express from 'express';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { error } from 'console';
import authorisation from '../middleware/authorisation.js';

const router = express.Router();

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
      // 2.1 If user does exist, verify if passwords match
      const { hash } = users[0];
      return argon2.verify(hash, password);
    })
    .then(match => {
      if (match) {
        // 2.1.1 If passwords match, return JWT
        const expiresIn = 60 * 60 * 10;
        const exp = Math.floor(Date.now() / 1000) + expiresIn;
        const token = jwt.sign({ exp, email }, process.env.JWT_SECRET);
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
});

router.post('/debugLogin', (req, res, next) => {
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
      // 2.1 If user does exist, verify if passwords match
      const { hash } = users[0];
      return argon2.verify(hash, password);
    })
    .then(match => {
      if (match) {
        // 2.1.1 If passwords match, return JWT
        const expiresIn = 1;
        const exp = Math.floor(Date.now() / 1000) + expiresIn;
        const token = jwt.sign({ exp, email }, process.env.JWT_SECRET);
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
      return req.db.from("users").insert({
        "email": email,
        "hash": hash
      });
    })
    .then(() => {
      res.status(201).json({ success: true, message: "User created" });
    })
    .catch(e => {
      res.status(500).json({ success: false, message: e.message });
    });
});

router.get("/:email/profile", authorisation, (req, res) => {
  req.db.from("users").select("*").where("email", "=", req.params.email)
    .then(rows => {
      if (rows.length === 0) {
        throw new Error("User not found");
      }

      let profile = rows[0];
      let data;
      if (req.params.tokenEmail === profile.email) {
        data = {
          "email": profile.email,
          "firstName": profile.firstName,
          "lastName": profile.lastName,
          "dob": profile.dob,
          "address": profile.address
        };
      } else {
        data = {
          "email": profile.email,
          "firstName": profile.firstName,
          "lastName": profile.lastName,
        };
      }

      return data;
    })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch(e => {
      if (e.message === "User not found") {
        res.status(404).json({ error: true, message: e.message });
      } else {
        res.status(500).json({ error: true, message: e.message });
      }
    });
});

const checkIfDate = (date) => {
  // Created using altered varsion of this online regex generator https://regex101.com/r/z4KHFC/1
  const reg = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  return date.match(reg);
}

router.put("/:email/profile", authorisation, (req, res) => {
  try {
    // Authorisation check
    if (req.params.tokenEmail !== req.params.email) {
      return res.status(403).json({
        error: true,
        message: "Forbidden"
      });
    }

    const { firstName, lastName, dob, address } = req.body ?? {};

    // Required fields check
    if (!firstName || !lastName || !dob || !address) {
      return res.status(400).json({
        error: true,
        message: "Request body incomplete: firstName, lastName, dob and address are required."
      });
    }

    // Type validation
    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof dob !== "string" ||
      typeof address !== "string"
    ) {
      return res.status(400).json({
        error: true,
        message: "Request body invalid: firstName, lastName, dob and address must be strings."
      });
    }

    // Date validation
    if (!checkIfDate(dob)) {
      return res.status(400).json({
        error: true,
        message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
      });
    }

    // Check user exists
    const rows = req.db.from("users").select("email").where("email", "=", req.params.email);

    if (rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: "User not found"
      });
    }

    // Update user
    req.db
      .from("users")
      .update({
        firstName,
        lastName,
        dob,
        address
      })
      .where("email", "=", req.params.email)
      .then(() => {
        return res.status(200).json({
          email: req.params.email,
          firstName,
          lastName,
          dob,
          address
        })
      })
  } catch (e) {
    return res.status(500).json({
      error: true,
      message: e.message
    });
  }
});

export default router;
