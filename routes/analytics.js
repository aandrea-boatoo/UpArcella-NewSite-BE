// routes/analytics.js
import express from "express";
import { getAnalyticsStats } from "../analyticsClient.js";

const router = express.Router();

/**
 * GET /api/stats?range=30daysAgo
 * range può essere: 7daysAgo, 30daysAgo, 90daysAgo, 365daysAgo
 */
router.get("/stats", async (req, res) => {
    try {
        const range = req.query.range || "30daysAgo";
        const stats = await getAnalyticsStats(range);
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
