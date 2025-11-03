import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// chiamata tutti album

router.get("/", async (req, res) => {
    try {
        const [result] = await db.query(`SELECT
            id,
            title,
            link,
            time,
            createdAt
            FROM fotoalbum
            ORDER BY createdAt DESC`);
        res.json(result)
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})


// creazione link all'album

router.post("/", async (req, res) => {
    const { title, link, time } = req.body;
    try {
        const [result] = await db.query(`INSERT INTO fotoalbum (title, link, time) VALUES (?, ?, ?)`, [title, link, time]);
        res.status(201).json({ id: result.insertId, message: "album pubblicato" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;