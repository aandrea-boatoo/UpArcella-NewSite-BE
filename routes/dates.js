import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// 🔹 Ottieni tutte le date
router.get("/", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM dates ORDER BY eDateTime ASC");
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Crea una nuova data
router.post("/", async (req, res) => {
    const { eDateTime } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO dates (eDateTime) VALUES (?)",
            [eDateTime]
        );
        res.status(201).json({ id: result.insertId, message: "Data aggiunta!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;