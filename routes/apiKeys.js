import express from "express";

const router = express.Router();

// chiamata credere insieme
const apiKey = process.env.CREDERE_INSIEME_API_KEY;
const folderId = '1UrTjGcho1yDYbxEoI4jKhNOu1fqv-QiO';
const archiveFolderId = '1l_vpD3PddlUwHaK-Yg7gVqfT54JUGZrH';
router.get("/", async (req, res) => {
    try {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType='application/pdf'&fields=files(id,name,modifiedTime)&key=${apiKey}`
        );
        const data = await response.json();
        res.json(data.files);
    } catch (error) {
        console.error("Errore nel fetch del file Drive:", error);
        res.status(500).json({ error: "errore nel recupero del file" })
    };

})
// chiamata archivio
router.get("/archivio", async (req, res) => {
    try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${archiveFolderId}'+in+parents+and+mimeType='application/pdf'&fields=files(id,name,modifiedTime)&key=${apiKey}`)
        const data = await response.json()
        res.json(data.files);
    } catch (err) {
        console.error("Errore nel fetch archivio:", err);
        res.status(500).json({
            error: "errore nel recupero dei file archivio"
        })
    }
})

export default router;