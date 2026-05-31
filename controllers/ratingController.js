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
        if (!req.query.page || req.query.page < 1) {
            return res.status(400)
                .json(errorResponse("Invalid page parameter. Must be an integer greater than or equal to 1."));
        }

        // Get user ratings
        const ratingsPerPage = 20;
        const page = parseInt(req.query.page, 10);
        const rows = await ratingModel.GetRatingsFromUserEmail(req.db, req.params.tokenEmail, page);

        // Get the number of ratings
        const numRatingsRows = await ratingModel.GetNumRatingsFromEmail(req.db, req.params.tokenEmail);
        const numRatings = parseInt(numRatingsRows.count, 10);

        const pagination = {
            total: numRatings,
            lastPage: Math.ceil(numRatings / ratingsPerPage),
            prevPage: page - 1 == 0 ? null : page - 1,
            nextPage: page == Math.ceil(numRatings / ratingsPerPage) ? null : page + 1,
            perPage: 20,
            currentPage: page,
            from: ratingsPerPage * (page - 1),
            to: ratingsPerPage * (page - 1) + numRatingsRows.length
        }
        res.status(200).json({
            data: rows,
            pagination: pagination
        });
    } catch (e) {
        return res.status(500).json(errorResponse(e.message));
    }
}

export async function GetRating(req, res) {
    try {
        // Validate property
        const propertyId = req.params.id;
        const propertyRows = await rentalModel.GetProperty(req.db, propertyId);
        if (propertyRows.length < 1) {
            return res.status(404)
                .json(errorResponse("No rental exists with this ID."));
        }

        // Get userId
        const userRows = await userModel.getUserFromEmail(req.db, req.params.tokenEmail);
        const userId = userRows[0].userId;

        // Get and validate rating
        const ratingRows = await ratingModel.GetRatingsFromUserIdAndPropertyId(req.db,
             userId, propertyId);

        if (ratingRows.length < 1) {
            return res.status(404).json(errorResponse("No rating exists with this rental ID."));
        }

        const rating = ratingRows[0];

        // Check if a comment has been made
        if (!rating.comment || rating.comment.length < 1) {
            delete rating.comment
        }
        
        return res.status(200).json({
            rating: rating.rating,
            comment: rating.comment,
            dateTime: rating.dateTime
        });

    } catch (e) {
        return res.status(500).json(errorResponse(e.message));
    }
}

export async function PostRating(req, res) {
    try {
        const newRating = req.body;

        // Validate rating and comment fields
        if (!newRating.rating || newRating.rating < 1 || newRating.rating > 5) {
            return res.status(400)
                .json(errorResponse("Invalid rating. Rating must be an integer value between 1 and 5."));
        }
        if (newRating.comment !== undefined && (newRating.comment.length < 1 || newRating.comment.length > 2000)) {
            return res.status(400)
                .json(errorResponse("Invalid comment parameter. Comment must be a string 1-2000 characters long."));
        }

        // Validate the property
        const rentalRows = await rentalModel.GetProperty(req.db, req.params.id);
        if (rentalRows.length < 1) {
            return res.status(404)
                .json(errorResponse("No rental exists with this ID."))
        }
        const propertyId = req.params.id;

        newRating.propertyId = propertyId;
        newRating.dateTime = new Date(Date.now());

        // Get the user id
        const user = await userModel.getUserFromEmail(req.db, req.params.tokenEmail);
        newRating.userId = user[0].userId;

        // Upsert rating
        await ratingModel.UpsertRating(req.db, newRating);

        return res.status(201).json(newRating);

    } catch (e) {
        return res.status(500).json(errorResponse(e.message));
    }
}