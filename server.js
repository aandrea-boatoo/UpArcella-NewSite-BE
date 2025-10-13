import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db/connection.js";
import eventsRouter from "./routes/events.js";
import tagsRouter from "./routes/tags.js";
import placesRouter from "./routes/places.js";
import datesRouter from "./routes/dates.js";
import spuntiRouter from "./routes/spunti.js"

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


// rotte

app.use("/events", eventsRouter);
app.use("/tags", tagsRouter);
app.use("/places", placesRouter);
app.use("/dates", datesRouter);
app.use("/spunti", spuntiRouter)
// Connessione e avvio
const PORT = process.env.PORT || 3000;

try {
    await db.connect();
    console.log("Connesso al database MySQL");
    app.listen(PORT, () => { console.log(`server avviato su http://localhost:${PORT}`) });
} catch {
    console.error("Errore connessione db:", err);
}

