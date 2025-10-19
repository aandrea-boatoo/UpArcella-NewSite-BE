import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// chiama il singolo commento

router.get("/today", async (req, res) => {
    try {
        const [result] = await db.query(`SELECT 
            id, 
            title,
            comment,
            DATE_FORMAT(postDay, '%d-%m-%Y') AS postDay
            FROM daylyShare WHERE postDay = CURRENT_DATE`);

        if (result.length === 0) {
            return res.status(404).json({ error: "Commento non trovato" })
        }
        const daylyShare = result[0];
        res.json(daylyShare);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// crea nuovo commento
router.post("/", async (req, res) => {
    const { daylyShare } = req.body;
    try {
        const [result] = await db.query("INSERT INTO daylyShare (title, comment, postDay) VALUES (?, ?, ?)", [daylyShare]);
        res.status(201).json({ id: result.insertId, message: "commento pubblicato" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router