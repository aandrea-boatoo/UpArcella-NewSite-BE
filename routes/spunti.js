import express from "express";
import db from "../db/connection.js";

const router = express.Router();

//chiamara tutti gli spunti
router.get("/", async (req, res) => {
    try {
        const [result] = await db.query(`SELECT 
            id, 
            title, 
            subtitle, 
            description, 
            DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at 
            FROM spuntis 
            ORDER BY created_at DESC`);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// chiama il singolo spunto

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(`SELECT 
            id, 
            title, 
            subtitle, 
            description, 
            DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at 
            FROM spuntis WHERE id = ?`, [id]);

        if (result.length === 0) {
            return res.status(404).json({ error: "Spunto non trovato" })
        }
        const spunto = result[0];
        res.json(spunto);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// crea nuovo spunto
router.post("/", async (req, res) => {
    const { title, subtitle, description } = req.body;
    try {
        const [result] = await db.query("INSERT INTO spuntis (title, subtitle, description) VALUES (?, ?, ?)", [title, subtitle, description]);
        res.status(201).json({ id: result.insertId, message: "spunto pubblicato" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// elimina spunto
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query("DELETE FROM spuntis WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Spunto non trovato" })
        }
        res.json({ message: "Spunto eliminato con successo" });
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
});

export default router