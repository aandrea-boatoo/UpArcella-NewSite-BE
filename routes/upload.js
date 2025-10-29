import express from 'express';
import multer from 'multer';
import path from 'path';
const router = express.Router();
const storageEvent = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/eventImg");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});
const storageGroup = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/groupImg");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});

const uploadEvent = multer({ storage: storageEvent });
const uploadGroup = multer({ storage: storageGroup });

router.post('/event', uploadEvent.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "nessun file caricato" })
    }
    const imgUrl = `http://localhost:3000/uploads/eventImg/${req.file.filename}`;
    res.json({ imgUrl })
});
router.post('/group', uploadGroup.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "nessun file caricato" })
    }
    const imgUrl = `http://localhost:3000/uploads/groupImg/${req.file.filename}`;
    res.json({ imgUrl })
});

export default router