import express from "express";
const router = express.Router();

// chiama tutti i commenti
const posti = ["Santa", "Sanbe", "Sanfi"];
const giorni = ["Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato", "Domenica"];
let orari = giorni.reduce((acc, giorno) => {
    acc[giorno] = posti.reduce((p, posto) => {
        p[posto] = "";
        return p
    }, {});
    return acc;
}, {});

router.get("/", async (req, res) => {
    try {
        const orariAggiornati = res.json(orari);
        return orariAggiornati;
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/", async (req, res) => {
    orari = req.body;
    console.log("Nuovi orari salvati:", orari);
    res.json({ success: true, message: "orari salvati" })
});
export default router;