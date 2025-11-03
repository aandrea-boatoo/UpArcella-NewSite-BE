import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db/connection.js";
import path from 'path';
import eventsRouter from "./routes/events.js";
import tagsRouter from "./routes/tags.js";
import spuntiRouter from "./routes/spunti.js";
import apiKeysRouter from "./routes/apiKeys.js";
import activityGroupRouter from "./routes/activityGroup.js";
import daylySharesRouter from "./routes/daylyShares.js";
import usersRouter from "./routes/users.js";
import analyticsRouter from './routes/analytics.js';
import uploadRouter from './routes/upload.js';
import messeRouter from './routes/messe.js';
import fotoalbumRouter from './routes/fotoalbum.js'

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));
// rotte

app.use("/events", eventsRouter);
app.use("/tags", tagsRouter);
app.use("/spunti", spuntiRouter);
app.use("/credereApi", apiKeysRouter);
app.use("/activityGroup", activityGroupRouter);
app.use("/daylyShare", daylySharesRouter);
app.use("/login", usersRouter);
app.use("/api", analyticsRouter);
app.use("/upload", uploadRouter);
app.use("/messe", messeRouter);
app.use("/fotoalbum", fotoalbumRouter);

// Connessione e avvio
const PORT = process.env.PORT || 3000;


try {
    await db.connect();
    console.log("Connesso al database MySQL");
    app.listen(PORT, () => { console.log(`server avviato su http://localhost:${PORT}`) });
} catch {
    console.error("Errore connessione db:", err);
}