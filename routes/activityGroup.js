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
    const { title, des, contacts, subTitle, imgUrl } = req.body;
    try {
        const [result] = await db.query(`INSERT INTO activitygroup (title, des, contacts, subTitle, imgUrl) VALUES (?, ?, ?, ?, ?);`, [title, des, contacts, subTitle, imgUrl]);
        res.status(201).json({ id: result.insertId, message: "gruppo creato" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// modifica gruppo
// modifica dell'evento

router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const { title, des, imgUrl, subTitle, contacts } = req.body;

    try {
        // 1️⃣ Verifica se l’evento esiste
        const [existingRows] = await db.query("SELECT * FROM activitygroup WHERE id = ?", [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({ error: "Gruppo non trovato" });
        }

        const existingEvent = existingRows[0];
        // gestion imgUrl
        const baseUrl = "http://localhost:3000/";
        let filePath = existingEvent.imgUrl;
        if (existingEvent.imgUrl && filePath.startsWith(baseUrl)) {
            filePath = filePath.replace(baseUrl, ""); // -> "upload/nomeFile.jpg"
        }


        // 2️⃣ Se è arrivata una nuova immagine, cancella la vecchia (se diversa)
        if (imgUrl && existingEvent.imgUrl && imgUrl !== existingEvent.imgUrl) {
            try {
                // percorso assoluto del file nel server
                const oldImagePath = path.resolve(`./public/${filePath}`);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log(" Immagine precedente rimossa:", oldImagePath);
                }
            } catch (fileErr) {
                console.warn("Errore rimozione immagine precedente:", fileErr.message);
            }
        }

        // 3️⃣ Costruisci dinamicamente la query di UPDATE solo con i campi presenti
        const fields = [];
        const values = [];

        if (title !== undefined) { fields.push("title = ?"); values.push(title); }
        if (subTitle !== undefined) { fields.push("subTitle = ?"); values.push(subTitle); }
        if (des !== undefined) { fields.push("des = ?"); values.push(des); }
        if (imgUrl !== undefined) { fields.push("imgUrl = ?"); values.push(imgUrl); }
        if (contacts !== undefined) { fields.push("contacts = ?"); values.push(contacts); }

        if (fields.length > 0) {
            const query = `UPDATE activitygroup SET ${fields.join(", ")} WHERE id = ?`;
            values.push(id);
            await db.query(query, values);
        }


        res.json({ message: "Gruppo aggiornato con successo!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// elimina gruppo
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query("DELETE FROM activitygroup WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Gruppo non trovato" })
        }
        res.json({ message: "Gruppo eliminato con successo" });
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
});

export default router;