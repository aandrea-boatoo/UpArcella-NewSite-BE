import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// Ottieni tutti gli eventi con date luogo e tag
router.get("/", async (req, res) => {
    try {
        const [results] = await db.query(`
      SELECT 
    e.id,
    e.title,
    e.description,
    e.createdAt,
    e.imgUrl,
    e.place,
    -- Tags come array JSON
    CONCAT(
        '[', 
        GROUP_CONCAT(DISTINCT CONCAT('"', t.title, '"') SEPARATOR ','), 
        ']'
    ) AS tags,
    -- Dates formattate
    GROUP_CONCAT(
        DISTINCT
        CASE
           WHEN e.eDateTime IS NULL THEN 'Data non precisata'
            WHEN TIME(ANY_VALUE(e.eDateTime)) = '00:00:00'
                THEN DATE_FORMAT(ANY_VALUE(e.eDateTime), '%Y-%m-%d')
            ELSE DATE_FORMAT(ANY_VALUE(e.eDateTime), '%Y-%m-%d %H:%i')
        END
    ) AS dates
FROM events e
LEFT JOIN tags_connection tc ON e.id = tc.events_id
LEFT JOIN tags t ON tc.tags_id_tags = t.id_tags
GROUP BY e.id
ORDER BY MIN(e.eDateTime) ASC;
    `);
        const eventsWithFullUrl = results.map((e) => ({
            ...e,
            imgUrl: e.imgUrl ? `${e.imgUrl}` : null,
        }))
        res.json(eventsWithFullUrl);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Ottieni un singolo evento per ID (con luogo, tag e date)
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
  SELECT 
    e.id,
    e.title,
    e.description,
    e.createdAt,
    e.imgUrl,
    e.place,
    CONCAT(
        '[', 
        GROUP_CONCAT(DISTINCT CONCAT('"', t.title, '"') SEPARATOR ','), 
        ']'
    ) AS tags,
    GROUP_CONCAT(
        DISTINCT
        CASE
            WHEN e.eDateTime IS NULL THEN 'Data non precisata'
            WHEN TIME(ANY_VALUE(e.eDateTime)) = '00:00:00'
                THEN DATE_FORMAT(ANY_VALUE(e.eDateTime), '%Y-%m-%d')
            ELSE DATE_FORMAT(ANY_VALUE(e.eDateTime), '%Y-%m-%d %H:%i')
        END
    ) AS dates,
    w.title AS orgGroup,
    w.groupDescription AS groupDes,
    w.imgUrl AS groupImg
  FROM events e
  LEFT JOIN tags_connection tc ON e.id = tc.events_id
  LEFT JOIN tags t ON tc.tags_id_tags = t.id_tags
  LEFT JOIN who w ON e.who_id = w.id
  WHERE e.id = ?`;

        const [results] = await db.query(query, [id]);


        if (results.length === 0) {
            return res.status(404).json({ error: "Evento non trovato" });
        }

        const event = results[0];
        res.json(event);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Crea un nuovo evento
router.post("/", async (req, res) => {
    const { title, description, place, eDateTime, imgUrl, who_id, tags_id_tags } = req.body;

    try {
        // 1️⃣ Inserisci l'evento
        const [result] = await db.query(
            `INSERT INTO events (title, description, place, eDateTime, imgUrl, createdAt, who_id)
             VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
            [title, description, place, eDateTime, imgUrl, who_id]
        );

        const eventId = result.insertId;

        // 2️⃣ Se ci sono tag, collegali
        if (Array.isArray(tags_id_tags) && tags_id_tags.length > 0) {
            const values = tags_id_tags.map(tagId => [eventId, tagId]);
            await db.query(
                `INSERT INTO tags_connection (events_id, tags_id_tags) VALUES ?`,
                [values]
            );
        }

        res.status(201).json({ id: eventId, message: "Evento creato!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 🔹 Aggiungi un tag a un evento
router.post("/:id/tags", async (req, res) => {
    const { id } = req.params;
    const { tags_id_tags } = req.body;
    try {
        await db.query(
            `INSERT INTO tags_connection (events_id, tags_id_tags)
       VALUES (?, ?)`,
            [id, tags_id_tags]
        );
        res.status(201).json({ message: "Tag aggiunto all'evento!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Elimina un evento e le sue connessioni (tags + dates)
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // 🔸 1. Elimina connessioni con TAGS
        await db.query("DELETE FROM tags_connection WHERE events_id = ?", [id]);

        // 🔸 3. Elimina l'EVENTO
        const [result] = await db.query("DELETE FROM events WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Evento non trovato" });
        }

        res.json({ message: "Evento eliminato con successo!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



export default router;