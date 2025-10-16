import express from "express";
import fs from "fs";
const router = express.Router();

// router per chiamare gli user
router.post("/", (req, res) => {
    const users = JSON.parse(fs.readFileSync("./users.json", "utf-8"));
    const { utente, psw } = req.body;

    const user = users.find(
        (u) => u.utente === utente && u.psw === psw
    );

    if (user) {
        res.json({ success: true, message: "Login effettuato" });
    } else {
        res.status(401).json({ success: false, message: "Credenziali errate" });
    }
});

export default router;