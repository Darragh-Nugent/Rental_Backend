import express from 'express';
import authorisation from '../middleware/authorisation.js';
import { errorResponse } from '../utils/utils.js';

const router = express.Router();

router.post('/debugEraseRatings', (req, res) => {
  req.db
    .from("ratings")
    .del()
    .then(res.status(200).json({ message: `"All ratings successfully erased.` }));
})

router.get('/', authorisation, (req, res) => {
  req.db
    .from('ratings')
    .join('users', 'ratings.userId', '=', 'users.userId')
    .select("ratings.propertyId", "ratings.rating", "ratings.comment", "ratings.dateTime")
    .where("users.email", '=', req.params.tokenEmail)
    .then(rows => {
      res.status(200).json(rows)
    })
    .catch(e => {
      return res.status(500).json({
        error: true,
        message: e.message
      });
    });
});

// router.post("rentals/:id", authorisation, (req, res) => {
//   const body = req.body;

//   if (!body.rating || body.rating < 1 || body.rating > 5) {
//     return res.status(400)
//     .json(errorResponse("Invalid rating. Rating must be an integer value between 1 and 5."));
//   }

//   body.dateTime = new DateTime(DateTime.now());

//   req.db.from("ratings").insert(body);
// })


export default router;