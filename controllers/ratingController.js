import * as ratingModel from "../models/ratingsModel.js";
import * as userModel from "../models/userModel.js";
import * as rentalModel from "../models/rentalsModel.js";
import { errorResponse } from '../utils/utils.js';

export async function DeleteAllRatings(req, res) {
    await ratingModel.DeleteAllRatings(req.db);
    res.status(200).json({ message: `"All ratings successfully erased.` });
}

export async function GetAllUserRatings(req, res) {
    try {
        const rows = await ratingModel.GetRatingsFromUserEmail(req.db, req.params.tokenEmail);
        res.status(200).json(rows)
    } catch (e) {
        return res.status(500).json(errorResponse(e.message));
    }
}

export async function GetRating(req, res) {
    const userRows = await userModel.getUserFromEmail(req.db, req.params.tokenEmail);
    const userId = userRows[0].userId;

    const propertyId = req.params.id
    const propertyRows = await rentalModel.GetProperty(req.db, propertyId);
    if (propertyRows.length < 1) {
        return res.status(404)
            .json(errorResponse("No rental exists with this ID."));
    }

    const ratingRows = await ratingModel.GetRatingsFromUserIdAndPropertyId(req.db,
        userId, propertyId);

    if (ratingRows.length < 1) {
        return res.status(404)
            .json(errorResponse("No rating exists with this rental ID."));
    }

    const rating = ratingRows[0];

    if (!rating.comment || rating.comment.length < 1) {
        delete rating.comment
    }

    return res.status(200).json(rating);

}

export async function PostRating(req, res) {
    const newRating = req.body;

    if (!newRating.rating || newRating.rating < 1 || newRating.rating > 5) {
        return res.status(400)
            .json(errorResponse("Invalid rating. Rating must be an integer value between 1 and 5."));
    }

    if (newRating.comment !== undefined && (newRating.comment.length < 1 || newRating.comment.length > 2000)) {
        return res.status(400)
            .json(errorResponse("Invalid comment parameter. Comment must be a string 1-2000 characters long."));
    }

    const propertyId = req.params.id;
    if (await rentalModel.GetProperty(req.db, propertyId).length < 1) {
        return res.status(404)
            .json(errorResponse("No rental exists with this ID."));
    }
    newRating.propertyId = propertyId;


    newRating.dateTime = new Date(Date.now());
    const user = await userModel.getUserFromEmail(req.db, req.params.tokenEmail);
    newRating.userId = user[0].userId;

    await ratingModel.UpsertRating(req.db, newRating);

    return res.status(201).json(newRating);
}