import express from 'express';
import {authorisation} from '../middleware/authorisation.js';
import noQueryParameters from '../middleware/middleware.js';
import * as rentalController from '../controllers/rentalController.js';

const router = express.Router();

router.get("/states", noQueryParameters, rentalController.getStates);
router.get("/property-types", noQueryParameters, rentalController.getPropertyTypes);
router.get("/search", rentalController.searchRentals);
router.get("/:id", noQueryParameters, rentalController.getRentalFromId);

export default router;