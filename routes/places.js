import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// 🔹 Ottieni tutti i luoghi
router.get("/", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM places ORDER BY ePlace ASC");
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Crea un nuovo luogo
router.post("/", async (req, res) => {
    const { ePlace } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO places (ePlace) VALUES (?)",
            [ePlace]
        );
        res.status(201).json({ id: result.insertId, message: "Luogo creato!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
