import fs from "fs";
import path from "path";
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
    a.title AS orgGroup,
    a.des AS groupDes,
    a.imgUrl AS groupImg
  FROM events e
  LEFT JOIN tags_connection tc ON e.id = tc.events_id
  LEFT JOIN tags t ON tc.tags_id_tags = t.id_tags
  LEFT JOIN activitygroup a ON e.who_id = a.id
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

// modifica dell'evento

router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const { title, description, place, eDateTime, imgUrl, who_id, tags_id_tags } = req.body;

    try {
        // 1️⃣ Verifica se l’evento esiste
        const [existingRows] = await db.query("SELECT * FROM events WHERE id = ?", [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({ error: "Evento non trovato" });
        }

        const existingEvent = existingRows[0];
        // gestion imgUrl
        const baseUrl = "http://localhost:3000/"; // o meglio ancora, prendi dal .env

        let filePath = existingEvent.imgUrl;
        if (filePath.startsWith(baseUrl)) {
            filePath = filePath.replace(baseUrl, ""); // -> "upload/nomeFile.jpg"
        }


        // 2️⃣ Se è arrivata una nuova immagine, cancella la vecchia (se diversa)
        if (imgUrl && existingEvent.imgUrl && imgUrl !== existingEvent.imgUrl) {
            try {
                // percorso assoluto del file nel server
                const oldImagePath = path.resolve(`./public/${filePath}`);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("🗑️ Immagine precedente rimossa:", oldImagePath);
                }
            } catch (fileErr) {
                console.warn("⚠️ Errore rimozione immagine precedente:", fileErr.message);
            }
        }

        // 3️⃣ Costruisci dinamicamente la query di UPDATE solo con i campi presenti
        const fields = [];
        const values = [];

        if (title !== undefined) { fields.push("title = ?"); values.push(title); }
        if (description !== undefined) { fields.push("description = ?"); values.push(description); }
        if (place !== undefined) { fields.push("place = ?"); values.push(place); }
        if (eDateTime !== undefined) { fields.push("eDateTime = ?"); values.push(eDateTime); }
        if (imgUrl !== undefined) { fields.push("imgUrl = ?"); values.push(imgUrl); }
        if (who_id !== undefined) { fields.push("who_id = ?"); values.push(who_id); }

        if (fields.length > 0) {
            const query = `UPDATE events SET ${fields.join(", ")} WHERE id = ?`;
            values.push(id);
            await db.query(query, values);
        }

        // 4️⃣ Gestione TAG
        if (Array.isArray(tags_id_tags)) {
            await db.query("DELETE FROM tags_connection WHERE events_id = ?", [id]);
            if (tags_id_tags.length > 0) {
                const values = tags_id_tags.map(tagId => [id, tagId]);
                await db.query(
                    `INSERT INTO tags_connection (events_id, tags_id_tags) VALUES ?`,
                    [values]
                );
            }
        }

        res.json({ message: "Evento aggiornato con successo!" });
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
        // 🔹 1. Recupera l'evento per sapere se ha un'immagine
        const [rows] = await db.query("SELECT imgUrl FROM events WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Evento non trovato" });
        }

        const event = rows[0];
        // getsione urlImg
        const baseUrl = "http://localhost:3000/"; // o meglio ancora, prendi dal .env

        let filePath = event.imgUrl;
        if (filePath.startsWith(baseUrl)) {
            filePath = filePath.replace(baseUrl, ""); // -> "upload/nomeFile.jpg"
        }

        // 🔹 2. Se ha un'immagine, prova a cancellarla dal filesystem
        if (event.imgUrl) {
            try {
                const imagePath = path.resolve(`./public/${filePath}`);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log(` Immagine eliminata: ${imagePath}`);
                }
            } catch (fileErr) {
                console.warn("Errore durante l'eliminazione dell'immagine:", fileErr.message);
            }
        }

        // 🔹 3. Elimina connessioni con TAGS
        await db.query("DELETE FROM tags_connection WHERE events_id = ?", [id]);

        // 🔹 4. Elimina l'EVENTO
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