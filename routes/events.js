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
        ANY_VALUE(p.ePlace) AS place,
        REPLACE(
        CONCAT(
        '[', 
        GROUP_CONCAT(DISTINCT CONCAT ('"', t.title, '"') SEPARATOR ','),
        ']'
        ),
        ',]', ']'
        ) AS tags,
        GROUP_CONCAT(
        DISTINCT
        CASE
        WHEN d.id IS NULL THEN NULL
        WHEN TIME(ANY_VALUE(d.eDateTime)) = '00:00:00'
        THEN DATE_FORMAT(ANY_VALUE(d.eDateTime), '%d/%m/%Y')
        ELSE DATE_FORMAT(ANY_VALUE(d.eDateTime), '%d/%m/%Y %h:%i')
        END 
        ORDER BY d.eDateTime SEPARATOR ', '
        ) AS dates
      FROM events e
      LEFT JOIN places p ON e.places_id = p.id
      LEFT JOIN tags_connection tc ON e.id = tc.events_id
      LEFT JOIN tags t ON tc.tags_id_tags = t.id_tags
      LEFT JOIN dates_connection dc ON e.id = dc.events_id
      LEFT JOIN dates d ON dc.dates_id = d.id
      GROUP BY e.id
      ORDER BY ANY_VALUE(d.eDateTime) ASC;
    `);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Ottieni tutti i MAIN eventi con date, luogo e tag
router.get("/main", async (req, res) => {
    try {
        const [results] = await db.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.createdAt,
        e.imgUrl,
        ANY_VALUE(p.ePlace) AS place,
        REPLACE(
        CONCAT(
        '[', 
        GROUP_CONCAT(DISTINCT CONCAT ('"', t.title, '"') SEPARATOR ','),
        ']'
        ),
        ',]', ']'
        ) AS tags,
        GROUP_CONCAT(
        DISTINCT
        CASE
        WHEN d.id IS NULL THEN NULL
        WHEN TIME(ANY_VALUE(d.eDateTime)) = '00:00:00'
        THEN DATE_FORMAT(ANY_VALUE(d.eDateTime), '%d/%m/%Y')
        ELSE DATE_FORMAT(ANY_VALUE(d.eDateTime), '%d/%m/%Y %h:%i')
        END 
        ORDER BY d.eDateTime SEPARATOR ', '
        ) AS dates
      FROM events e
      LEFT JOIN places p ON e.places_id = p.id
      LEFT JOIN tags_connection tc ON e.id = tc.events_id
      LEFT JOIN tags t ON tc.tags_id_tags = t.id_tags
      LEFT JOIN dates_connection dc ON e.id = dc.events_id
      LEFT JOIN dates d ON dc.dates_id = d.id
      WHERE main_list = 1
      GROUP BY e.id
      ORDER BY ANY_VALUE(d.eDateTime) ASC;
    `);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 🔹 Ottieni tutti i second eventi con date, luogo e tag
router.get("/ordinary", async (req, res) => {
    try {
        const [results] = await db.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.createdAt,
        e.imgUrl,
        ANY_VALUE(p.ePlace) AS place,
        REPLACE(
        CONCAT(
        '[', 
        GROUP_CONCAT(DISTINCT CONCAT ('"', t.title, '"') SEPARATOR ','),
        ']'
        ),
        ',]', ']'
        ) AS tags,
        GROUP_CONCAT(
        DISTINCT
        CASE
        WHEN d.id IS NULL THEN NULL
        WHEN TIME(ANY_VALUE(d.eDateTime)) = '00:00:00'
        THEN DATE_FORMAT(ANY_VALUE(d.eDateTime), '%d/%m/%Y')
        ELSE DATE_FORMAT(ANY_VALUE(d.eDateTime), '%d/%m/%Y %h:%i')
        END 
        ORDER BY d.eDateTime SEPARATOR ', '
        ) AS dates
      FROM events e
      LEFT JOIN places p ON e.places_id = p.id
      LEFT JOIN tags_connection tc ON e.id = tc.events_id
      LEFT JOIN tags t ON tc.tags_id_tags = t.id_tags
      LEFT JOIN dates_connection dc ON e.id = dc.events_id
      LEFT JOIN dates d ON dc.dates_id = d.id
      WHERE main_list = 0
      GROUP BY e.id
      ORDER BY ANY_VALUE(d.eDateTime) ASC;
    `);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// 🔹 Ottieni un singolo evento per ID (con luogo, tag e date)
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [results] = await db.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.createdAt,
        e.imgUrl AS imgUrl,
        p.ePlace AS place,
        REPLACE(
        CONCAT(
        '[', 
        GROUP_CONCAT(DISTINCT CONCAT ('"', t.title, '"') SEPARATOR ','),
        ']'
        ),
        ',]', ']'
        ) AS tags,
        GROUP_CONCAT(
        DISTINCT
            CASE
            WHEN d.id IS NULL THEN 'Data non precisata'
            WHEN TIME(ANY_VALUE(d.eDateTime)) = '00:00:00'
            THEN DATE_FORMAT(ANY_VALUE(d.eDateTime), '%d/%m/%Y')
            ELSE DATE_FORMAT(ANY_VALUE(d.eDateTime), '%d/%m/%Y %h:%i')
            END
            ORDER BY d.eDateTime SEPARATOR ', '
            )
        AS dates,
        w.title AS orgGroup,
        w.groupDescription AS groupDes,
        w.imgUrl AS groupImg
      FROM events e
      LEFT JOIN places p ON e.places_id = p.id
      LEFT JOIN tags_connection tc ON e.id = tc.events_id
      LEFT JOIN tags t ON tc.tags_id_tags = t.id_tags
      LEFT JOIN dates_connection dc ON e.id = dc.events_id
      LEFT JOIN dates d ON dc.dates_id = d.id
      LEFT JOIN who w ON e.who_id = w.id
      WHERE e.id = ?
      GROUP BY e.id;
    `, [id]);

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
    const { title, description, places_id, imgUrl } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO events (title, description, places_id, imgUrl, createdAt)
       VALUES (?, ?, ?, ?, NOW())`,
            [title, description, places_id, imgUrl]
        );
        res.status(201).json({ id: result.insertId, message: "Evento creato!" });
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

// 🔹 Aggiungi una data a un evento
router.post("/:id/dates", async (req, res) => {
    const { id } = req.params;
    const { dates_id } = req.body;
    try {
        await db.query(
            `INSERT INTO dates_connection (events_id, dates_id)
       VALUES (?, ?)`,
            [id, dates_id]
        );
        res.status(201).json({ message: "Data aggiunta all'evento!" });
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

        // 🔸 2. Elimina connessioni con DATES
        await db.query("DELETE FROM dates_connection WHERE events_id = ?", [id]);

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