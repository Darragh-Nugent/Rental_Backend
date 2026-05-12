import express from 'express';

import * as rentalModel from '../models/rentalsModel.js';
import * as ratingModel from '../models/ratingsModel.js';
import { errorResponse } from '../utils/utils.js';

const calculateAverageRating = (ratings) => {
    console.log(ratings);
    return ratings.reduce((accumulator, current) =>
        accumulator + current.rating, 0) / ratings.length;
};

const isNonNegativeInt = (number) => {
    return Number.isInteger(number) || number >= 0;
}

export async function getStates(req, res) {
    try {
        const rows = await rentalModel.GetStates(req.db);
        let states = [];
        rows.forEach(row => {
            states.push(row.state)
        });
        return res.status(200).json(states);
    } catch (e) {
        res.status(500).json({
            error: true,
            message: e.message
        });
    }
}

export async function getPropertyTypes(req, res) {
    try {
        const rows = await rentalModel.GetPropertyTypes(req.db);
        let propertyTypes = [];
        rows.forEach(row => {
            propertyTypes.push(row.propertyType)
        });
        return res.status(200).json(propertyTypes);
    } catch (e) {
        res.status(500).json({
            error: true,
            message: e.message
        });
    }
}

export async function searchRentals(req, res) {
    const searchParams = req.query;

    let searchConditions = {};
    let ratingConditions = {};
    let sortOption = "";
    let sortDir = "asc";
    let pageNum = 1;

    if (searchParams.suburb) {
        searchConditions.suburb = searchParams.suburb;
    }
    if (searchParams.state) {
        searchConditions.state = searchParams.state;
    }
    if (searchParams.postcode) {
        const postcode = searchParams.postcode;
        if (!isNonNegativeInt(postcode) || postcode > 9999) {
            return res.status(400).json(
                errorResponse("Invalid postcode parameter. Must be an integer in the range of 0000-9999."
                ));
        }
        searchConditions.postcode = postcode;
    }
    if (searchParams.minimumRent) {
        const minimumRent = searchParams.minimumRent;
        if (!isNonNegativeInt(minimumRent)) {
            return res.status(400).json(
                errorResponse("Invalid minimumRent parameter. Must be a non-negative integer."
                ));
        }
        searchConditions.minimumRent = minimumRent;
    }
    if (searchParams.maximumRent) {
        const maximumRent = searchParams.maximumRent;
        if (!isNonNegativeInt(maximumRent)) {
            return res.status(400).json(
                errorResponse("Invalid maximumRent parameter. Must be a non-negative integer."
                ));
        }
        searchConditions.maximumRent = maximumRent;
    }
    if (searchParams.minimumBathrooms) {
        const minimumBathrooms = searchParams.minimumBathrooms;
        if (!isNonNegativeInt(minimumBathrooms)) {
            return res.status(400).json(
                errorResponse("Invalid minimumBathrooms parameter. Must be a non-negative integer."
                ));
        }
        searchConditions.minimumBathrooms = minimumBathrooms;
    }
    if (searchParams.maximumBathrooms) {
        const maximumBathrooms = searchParams.maximumBathrooms;
        if (!isNonNegativeInt(maximumBathrooms)) {
            return res.status(400).json(
                errorResponse("Invalid maximumBathrooms parameter. Must be a non-negative integer."
                ));
        }
        searchConditions.maximumBathrooms = maximumBathrooms;
    }
    if (searchParams.minimumBedrooms) {
        const minimumBedrooms = searchParams.minimumBedrooms;
        if (!isNonNegativeInt(minimumBedrooms)) {
            return res.status(400).json(
                errorResponse("Invalid minimumBedrooms parameter. Must be a non-negative integer."
                ));
        }
        searchConditions.minimumBedrooms = minimumBedrooms;
    }
    if (searchParams.maximumBedrooms) {
        const maximumBedrooms = searchParams.maximumBedrooms;
        if (!isNonNegativeInt(maximumBedrooms)) {
            return res.status(400).json(
                errorResponse("Invalid maximumBedrooms parameter. Must be a non-negative integer."
                ));
        }
        searchConditions.maximumBedrooms = maximumBedrooms;
    }
    if (searchParams.minimumParking) {
        const minimumParking = searchParams.minimumParking;
        if (!isNonNegativeInt(minimumParking)) {
            return res.status(400).json(
                errorResponse("Invalid minimumParking parameter. Must be a non-negative integer."
                ));
        }
        searchConditions.minimumParking = minimumParking;
    }
    if (searchParams.maximumParking) {
        const maximumParking = searchParams.maximumParking;
        if (!isNonNegativeInt(maximumParking)) {
            return res.status(400).json(
                errorResponse("Invalid maximumParking parameter. Must be a non-negative integer."
                ));
        }
        ratingConditions.maximumParking = maximumParking;
    }

    // For rating conditions, add to seporate conditions object
    if (searchParams.minimumRating) {
        const minimumRating = searchParams.minimumRating;
        if (!isNonNegativeInt(minimumRating)) {
            return res.status(400).json(
                errorResponse("Invalid minimumRating parameter. Must be a non-negative integer."
                ));
        }
        ratingConditions.minimumRating = minimumRating;
    }
    if (searchParams.maximumRating) {
        const maximumRating = searchParams.maximumRating;
        if (!isNonNegativeInt(maximumRating)) {
            return res.status(400).json(
                errorResponse("Invalid maximumRating parameter. Must be a non-negative integer."
                ));
        }
        searchConditions.maximumRating = maximumRating;
    }

    const sortOptions = [
        "suburb",
        "state",
        "postcode",
        "minimumRent",
        "maximumRent",
        "minimumBathrooms",
        "maximumBathrooms",
        "minimumBedrooms",
        "maximumBedroom",
        "minimumParking",
        "maximumParking",
        "propertyTypes",
        "minimumRating",
        "maximumRating",
    ];

    if (searchParams.sortBy) {
        if (!sortOptions.includes(searchParams.sortBy)) {
            return res.status(400).json(
                errorResponse("Invalid sortBy parameter. Must refer to a valid sortable property.")
            );
        }
        sortOption = searchParams.sortBy;
    }

    if (searchParams.orderBy) {
        if (!searchParams.sortBy) {
            return res.status(400).json(
                errorResponse("Invalid sortOrder parameter. sortBy must be specified.")
            );
        }
        if (!["asc", "desc"].includes(searchParams.orderBy)) {
            return res.status(400).json(
                errorResponse("Invalid sortOrder parameter. Must be 'asc' or 'desc'.")
            );
        }
        sortDir = searchParams.orderBy;
    }

    if (!searchParams.page || !isNonNegativeInt(searchParams.page) || searchParams.page < 1) {
        return res.status(400).json(
            errorResponse("Invalid page parameter. Must be an integer greater than or equal to 1.")
        );
    }
    pageNum = searchParams.page;

    const searchData = {
        searchConditions: searchConditions,
        sortOption: sortOption,
        sortDir: sortDir,
        pageNum: pageNum
    };

    const rows = await rentalModel.SearchProperties(req.db, searchData);

    let filteredRows = []
    for (const row of rows) {
        const propertyId = row.id;

        const ratingRows = await ratingModel.GetRatings(req.db, propertyId);
        const average_rating = calculateAverageRating(ratingRows);

        if (Object.keys(ratingConditions).length > 0) {
            if (ratingConditions.minimumRating && average_rating < ratingConditions.minimumRating
                || ratingConditions.maximumRating && average_rating > ratingConditions.maximumRating
            ) {
                continue;
            }
        }
        row.averageRating = average_rating === null ? 0 : average_rating;
        filteredRows.push(row);
    }

    res.status(200).json(filteredRows);
}

export async function getRentalFromId(req, res) {
    const id = req.params.id;
    try {
        const rows = await rentalModel.GetProperty(req.db, id);
        if (rows.length !== 1) {
            return res.status(404).json({
                error: "true",
                message: "No rental exists with this ID."
            });
        }

        const ratings = await ratingModel.GetRatings(req.db, id);
        const averageRating = calculateAverageRating(ratings);

        const property = rows[0];
        property.reviews = ratings;
        property.averageRating = averageRating;
        return res.status(200).json(rows[0]);
    } catch (e) {
        res.status(500).json({
            error: true,
            message: e.message
        });
    }
}