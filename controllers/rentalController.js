import express from 'express';

import * as rentalModel from '../models/rentalsModel.js';
import * as ratingModel from '../models/ratingsModel.js';
import * as userModel from '../models/userModel.js';
import { errorResponse } from '../utils/utils.js';

const RESULTS_PER_PAGE = 10;

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

// Formats minimum and maximum fields to be used in the SQL query
function getRangedData(requestField, modelField, searchParams) {
    let minimum = 0;
    let maximum = 99999999;

    // Check and validate minimum field
    if (searchParams["minimum" + requestField]) {
        minimum = searchParams["minimum" + requestField];
        if (!isNonNegativeInt(minimum)) {
            throw new Error(
                `Invalid minimum${requestField} parameter. Must be a non-negative integer.`
            );
        }
    }
    // Check and validate maximum field
    if (searchParams["maximum" + requestField]) {
        maximum = searchParams["maximum" + requestField];
        if (!isNonNegativeInt(maximum)) {
            throw new Error(
                `Invalid maximum${requestField} parameter. Must be a non-negative integer.`
            );
        }
    }
    return {
        field: modelField,
        range: [minimum, maximum]
    };
}

export async function searchRentals(req, res) {
    const searchParams = req.query;
    let searchConditions = {}; // General "WHERE _ = _" conditions
    let rangeConditions = []; // For "WHERE _ BETWEEN _ AND _" conditions
    let setConditions = []; // For "WHERE _ in _" conditions
    let sortOption = ""; // Field to sort with
    let sortDir = "asc";
    let pageNum = 1;

    try {
        // Vaidate filtering
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

        if (searchParams.propertyTypes) {
            const propertyTypes = Array.isArray(searchParams.propertyTypes)
                ? searchParams.propertyTypes
                : [searchParams.propertyTypes];

            setConditions.push({
                field: "propertyType",
                set: propertyTypes
            });
        }

        try {
            if (searchParams.minimumRent || searchParams.maximumRent) {
                rangeConditions.push(getRangedData("Rent", "rent", searchParams));
            }
            if (searchParams.minimumBedrooms || searchParams.maximumBedrooms) {
                rangeConditions.push(getRangedData("Bedrooms", "bedrooms", searchParams));
            }
            if (searchParams.minimumBathrooms || searchParams.maximumBathrooms) {
                rangeConditions.push(getRangedData("Bathrooms", "bathrooms", searchParams));
            }
            if (searchParams.minimumParking || searchParams.maximumParking) {
                rangeConditions.push(getRangedData("Parking", "parkingSpaces", searchParams));
            }
            if (searchParams.minimumRating || searchParams.maximumRating) {
                rangeConditions.push(getRangedData("Rating", "averageRating", searchParams));
            }
        } catch (e) {
            return res.status(400).json(errorResponse(e.message));
        }

        // Validate sorting
        const sortOptions = [
            "suburb",
            "state",
            "postcode",
            "rent",
            "bathrooms",
            "bedrooms",
            "parkingSpaces",
            "propertyType",
            "averageRating",
            "numRatings",
            "latitude",
            "longitude"
        ];
        if (searchParams.sortBy) {
            if (!sortOptions.includes(searchParams.sortBy)) {
                return res.status(400).json(
                    errorResponse("Invalid sortBy parameter. Must refer to a valid sortable property.")
                );
            }
            sortOption = searchParams.sortBy;
        }

        if (searchParams.sortOrder) {
            if (!searchParams.sortBy) {
                return res.status(400).json(
                    errorResponse("Invalid sortOrder parameter. sortBy must be specified.")
                );
            }
            if (!["asc", "desc"].includes(searchParams.sortOrder)) {
                return res.status(400).json(
                    errorResponse("Invalid sortOrder parameter. Must be 'asc' or 'desc'.")
                );
            }
            sortDir = searchParams.sortOrder;
        }

        // Validate pagination
        if (searchParams.page != undefined &&
            !isNonNegativeInt(searchParams.page)
            || searchParams.page < 1) {
            return res.status(400).json(
                errorResponse("Invalid page parameter. Must be an integer greater than or equal to 1.")
            );
        }
        pageNum = searchParams.page == undefined ? 1 : parseInt(searchParams.page, 10);

        // Search for the rentals
        const searchData = {
            searchConditions: searchConditions,
            setConditions: setConditions,
            rangeConditions: rangeConditions,
            sortOption: sortOption,
            sortDir: sortDir,
            pageNum: pageNum
        };
        const [rows, total] = await rentalModel.SearchProperties(req.db, searchData);

        // Parse fields number that are defaulted to strings
        rows.forEach(row => {
            row.longitude = parseFloat(row.longitude);
            row.latitude = parseFloat(row.latitude);
            row.averageRating = parseFloat(row.averageRating);
        })

        // Create response data
        const paginationData = {
            perPage: RESULTS_PER_PAGE,
            currentPage: pageNum,
            from: RESULTS_PER_PAGE * (pageNum - 1),
            to: RESULTS_PER_PAGE * (pageNum - 1) + rows.length,
            total: total,
            lastPage: Math.ceil(total / RESULTS_PER_PAGE),
            prevPage: pageNum == 1 ? null : pageNum - 1,
            nextPage: pageNum + RESULTS_PER_PAGE >= total / RESULTS_PER_PAGE ? null : pageNum + 1
        };

        const responseData = {
            data: rows,
            pagination: paginationData
        };

        res.status(200).json(responseData);

    } catch (e) {
        res.status(500).json(errorResponse(e.message));
    }
}

export async function getRentalFromId(req, res) {
    const id = req.params.id;
    try {
        // Validate property
        const rows = await rentalModel.GetProperty(req.db, id);
        if (rows.length !== 1) {
            return res.status(404).json(errorResponse("No rental exists with this ID."));
        }

        // Get ratings and average rating
        const ratingRows = await ratingModel.GetAllRatingsFromPropertyId(req.db, id);
        const averageRating = parseFloat(await ratingModel.GetAvgRatingsFromPropertyId(req.db, id));
        let numRatings = 0;
        const reviews = [];

        // Check reviews exist
        if (ratingRows.length > 0) {
            numRatings = ratingRows.length;

            //Remove unneeded fields
            ratingRows.map(row => {
                row.userId = undefined;
                row.comment = row.comment == null ? undefined : row.comment;
                return row;
            })
        }

        const property = rows[0];
        property.averageRating = averageRating;
        property.numRatings = numRatings;
        property.reviews = ratingRows;

        property.longitude = parseFloat(property.longitude);
        property.latitude = parseFloat(property.latitude);

        return res.status(200).json(rows[0]);

    } catch (e) {
        res.status(500).json({
            error: true,
            message: e.message
        });
    }
}