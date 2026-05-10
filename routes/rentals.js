import express from 'express';
import authorisation from '../middleware/authorisation.js';

const router = express.Router();

router.get("/states", (req, res) => {
    try {
        if (Object.keys(req.query).length !== 0) {
            return res.status(400).json({
                error: "true",
                message: "Invalid query parameters: " + Object.keys(req.query)[0] + ". Query parameters are not permitted."
            });
        }
        req.db.from("data").distinct("state").orderBy("state")
            .then((rows) => {
                let states = [];
                rows.forEach(row => {
                    states.push(row.state)
                });
                return res.status(200).json(states);
            });
    } catch (e) {
        res.status(500).json({
            error: true,
            message: e.message
        });
    }
});

router.get("/property-types", (req, res) => {
    try {
        if (Object.keys(req.query).length !== 0) {
            return res.status(400).json({
                error: "true",
                message: "Invalid query parameters: " + Object.keys(req.query)[0] + ". Query parameters are not permitted."
            });
        }
        req.db.from("data").distinct("propertyType").orderBy("propertyType")
            .then((rows) => {
                let propertyTypes = [];
                rows.forEach(row => {
                    propertyTypes.push(row.propertyType)
                });
                return res.status(200).json(propertyTypes);
            });
    } catch (e) {
        res.status(500).json({
            error: true,
            message: e.message
        });
    }
});

export default router;