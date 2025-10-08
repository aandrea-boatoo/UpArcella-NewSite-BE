import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// 🔹 Ottieni tutti i tag
router.get("/", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM tags ORDER BY title ASC");
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Crea un nuovo tag
router.post("/", async (req, res) => {
    const { title } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO tags (title) VALUES (?)",
            [title]
        );
        res.status(201).json({ id: result.insertId, message: "Tag creato!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;