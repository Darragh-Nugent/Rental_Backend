import express from 'express';
import authorisation from '../middleware/authorisation.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.send("<h1>World Cities<h1>");
});

router.get("/city", (req, res, next) => {
  req.db
    .from("city")
    .select("name", "district")
    .then(rows => {
      res.json({ error: false, message: "Success", cities: rows });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: true, message: "Error in MySQL query" });
    });
});

router.get("/city/:countryCode", (req, res, next) => {
  req.db
    .from("city")
    .select("*")
    .where("CountryCode", "=", req.params.countryCode)
    .then((rows) => {
      res.json({ error: false, message: "Success", cities: rows });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: true, message: "Error in MySQL query" });
    });
});

router.post("/update", authorisation, (req, res) => {
  if (!req.body.city || !req.body.countryCode || !req.body.pop) {
    res.status(400).json({ message: "Error: missing fields" });
    console.log(`Error on request body:`, JSON.stringify(req.body));
  } else {
    const filter = {
      "Name": req.body.city,
      "CountryCode": req.body.countryCode,
    };

    const pop = { "Population": req.body.pop };

    req.db('city').where(filter).update(pop)
      .then(_ => {
        res.status(200).json({ message: `Successfully updated ${req.body.city}` });
        console.log('Successful population update:', JSON.stringify(filter));
      })
      .catch(error => {
        res.status(500).json({ message: 'Database error - not updated' })
      })
  };

})


export default router;