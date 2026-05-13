import express from 'express';
import authorisation from '../middleware/authorisation.js';
import noQueryParameters from '../middleware/middleware.js';
import * as ratingController from "../controllers/ratingController.js";
import { errorResponse } from '../utils/utils.js';

const router = express.Router();

router.post('/debugEraseRatings', ratingController.DeleteAllRatings);

router.get('/', authorisation, ratingController.GetAllUserRatings);

router.get("/rentals/:id", authorisation, noQueryParameters, ratingController.GetRating)

router.post("/rentals/:id", authorisation, ratingController.PostRating)

export default router;