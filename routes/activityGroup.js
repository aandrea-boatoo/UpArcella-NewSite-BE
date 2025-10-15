import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// chiamare tutti i gruppi
router.get('/', async (req, res) => {
    try {
        const [result] = await db.query(
            `SELECT * FROM activitygroup`
        );
        res.json(result)
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// chiamare singolo gruppo
router.get('/:id', async (req, res) => {
    const { id } = req.params
    try {
        const [result] = await db.query(
            `SELECT * FROM activitygroup WHERE id = ?`, [id]
        );
        if (result.length === 0) {
            return res.status(404).json({ error: "Gruppo non trovato" })
        }
        const gruppo = result[0]
        res.json(gruppo)
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// crea nuovo gruppo
router.post("/", async (req, res) => {
    const { gruppo } = req.body;
    try {
        const [result] = await db.query("INSERT INTO activitygroup (title, description, contacts) VALUES (?, ?, ?)", [gruppo]);
        res.status(201).json({ id: result.insertId, message: "gruppo creato" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


export default router;