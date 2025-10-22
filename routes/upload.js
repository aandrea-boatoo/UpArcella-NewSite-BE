import express from 'express';
import multer from 'multer';
import path from 'path';
const router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage });

router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "nessun file caricato" })
    }
    const imgUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    res.json({ imgUrl })
});

export default router