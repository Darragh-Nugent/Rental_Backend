import express from 'express';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { error } from 'console';
import * as userModel from '../models/userModel.js';
import { errorResponse } from '../utils/utils.js';

const checkIfDate = (date) => {
    // Created using altered varsion of this online regex generator https://regex101.com/r/z4KHFC/1
    const reg = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!reg.test(date)) {
        return false;
    }

    const [year, month, day] = date.split("-").map(s => parseInt(s));
    const dateObj = new Date(year, month - 1, day);
    return (
        !isNaN(dateObj) &&
        dateObj.getFullYear() === year &&
        dateObj.getMonth() === month - 1 &&
        dateObj.getDate() === day
    );
}

export async function login(req, res) {
    // 1. Retrieve email and password from req.body
    const { email, password } = req.body ?? {};

    // Verify body
    if (!email || !password) {
        res.status(400).json({
            error: true,
            message: "Request body incomplete, both email and password are required"
        });
        return;
    }
    // 2. Determine if user already exists in table
    const users = await userModel.getUserFromEmail(req.db, email);
    if (users.length === 0) {
        return res.status(401).json(errorResponse("Incorrect email or password"))
    }
    // 2.1 If user does exist, verify if passwords match
    const { hash } = users[0];
    const match = await argon2.verify(hash, password);

    if (match) {
        // 2.1.1 If passwords match, return JWT
        const expiresIn = 24 * 60 * 60;
        const exp = Math.floor(Date.now() / 1000) + expiresIn;
        const token = jwt.sign({ exp, email }, process.env.JWT_SECRET);
        res.status(200).json({
            token,
            tokenType: "Bearer",
            expiresIn
        });
    } else {
        // 2.1.2 If passwords do not match, return error response
        return res.status(401).json(errorResponse("Incorrect email or password"))
    }
}

export async function debugLogin(req, res) {
    // 1. Retrieve email and password from req.body
    const { email, password } = req.body ?? {};

    // Verify body
    if (!email || !password) {
        res.status(400).json({
            error: true,
            message: "Request body incomplete, both email and password are required"
        });
        return;
    }
    // 2. Determine if user already exists in table
    const users = await userModel.getUserFromEmail(req.db, email);

    if (users.length === 0) {
        return res.status(401).json(errorResponse("Incorrect email or password"))
    }
    // 2.1 If user does exist, verify if passwords match
    const { hash } = users[0];
    const match = await argon2.verify(hash, password);
    if (match) {
        // 2.1.1 If passwords match, return JWT
        const expiresIn = 1;
        const exp = Math.floor(Date.now() / 1000) + expiresIn;
        const token = jwt.sign({ exp, email }, process.env.JWT_SECRET);
        res.status(200).json({
            token,
            tokenType: "Bearer",
            expiresIn
        });
    } else {
        // 2.1.2 If passwords do not match, return error response
        return res.status(401).json(errorResponse("Incorrect email or password"))
    }
}

export async function register(req, res) {
    try {
        // 1. Retrieve email and password from req.body
        const { email, password } = req.body ?? {};

        // Verify body
        if (!email || !password) {
            return res.status(400).json({
                error: true,
                message: "Request body incomplete, both email and password are required"
            });
        }

        // 2. Determine if user already exists in table
        const queryUsers = await userModel.getUserFromEmail(req.db, email);
        if (queryUsers.length > 0) {
            // 2.1 If user does exist, return error response
            return res.status(409).json(errorResponse("User already exists"));
        }
        // 2.2 If user does not exist, insert into table
        const hash = await argon2.hash(password);

        await userModel.registerUser(req.db, {email, hash});
        res.status(201).json({ success: true, message: "User created" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    };
}

export async function getUserProfileFromEmail(req, res) {
    try {
        console.log("entered");
        const rows = await userModel.getUserFromEmail(req.db, req.params.email);
        console.log("finished getting user");
        if (rows.length === 0) {
            return res.status(404).json(errorResponse("User not found"))
        }

        let profile = rows[0];
        let data;
        if (req.params.tokenEmail !== null && req.params.tokenEmail === profile.email) {
            profile.dobISO = profile.dob.toISOString().split("T")[0];
            data = {
                "email": profile.email,
                "firstName": profile.firstName,
                "lastName": profile.lastName,
                "dob": profile.dobISO,
                "address": profile.address
            };
        } else {
            data = {
                "email": profile.email,
                "firstName": profile.firstName,
                "lastName": profile.lastName,
            };
        }
        return res.status(200).json(data);
    } catch (e) {
        res.status(500).json({ error: true, message: e.message });
    };
}

export async function putUserProfileFromEmail(req, res) {
    try {
        // Authorisation check
        if (req.params.tokenEmail !== null && req.params.tokenEmail !== req.params.email) {
            return res.status(403).json({
                error: true,
                message: "Forbidden"
            });
        }

        const { firstName, lastName, dob, address } = req.body ?? {};

        // Required fields check
        if (!firstName || !lastName || !dob || !address) {
            return res.status(400)
            .json(errorResponse("Request body incomplete: firstName, lastName, dob and address are required."));
        }

        // Type validation
        if (
            typeof firstName !== "string" ||
            typeof lastName !== "string" ||
            typeof dob !== "string" ||
            typeof address !== "string"
        ) {
            return res.status(400)
            .json(errorResponse("Request body invalid: firstName, lastName and address must be strings only."));
        }

        // Date validation
        if (!checkIfDate(dob)) {
            return res.status(400)
            .json(errorResponse("Invalid input: dob must be a real date in format YYYY-MM-DD."));
        }

        if (new Date(dob) > Date.now()) {
            return res.status(400)
            .json(errorResponse("Invalid input: dob must be a date in the past."));
        }

        // Check user exists
        const rows = await userModel.getUserFromEmail(req.db, req.params.email);

        if (rows.length === 0) {
            return res.status(404)
            .json(errorResponse("User not found"));
        }

        const profile = {
            email: req.params.email,
            firstName,
            lastName,
            dob,
            address
        };

        // Update user
        await userModel.putUserProfile(req.db, profile);

        return res.status(200).json(profile);
    } catch (e) {
        return res.status(500).json(errorResponse(e.message));
    }
}