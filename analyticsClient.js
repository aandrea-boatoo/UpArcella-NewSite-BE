// analyticsClient.js
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const propertyId = "509122291"; // 🔸 Sostituisci con il tuo ID proprietà GA4

const analyticsDataClient = new BetaAnalyticsDataClient({
    keyFilename: "analytics-key.json",
});

// 🔹 Pagine da escludere da views e durata sessione
const EXCLUDED_PATHS = ["/owner", "/auth"];

/**
 * Ottiene statistiche generali e giornaliere dal tuo account GA4.
 * @param {string} range - Intervallo (es. "7daysAgo", "30daysAgo", "90daysAgo")
 */
export async function getAnalyticsStats(range = "7daysAgo") {
    try {
        // ---- 1️⃣ Report per metriche generali e top pagine ----
        const [summary] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: range, endDate: "today" }],
            metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
            dimensions: [{ name: "pagePath" }],
            orderBys: [{ desc: true, metric: { metricName: "screenPageViews" } }],
            limit: 100, // prendiamo più righe per filtrare
        });

        // Filtra pagine escluse
        const filteredRows = summary.rows?.filter(
            (r) => !EXCLUDED_PATHS.includes(r.dimensionValues[0].value)
        ) || [];

        const totalViews = filteredRows.reduce(
            (sum, r) => sum + parseInt(r.metricValues[0].value),
            0
        );
        const uniqueVisitors = filteredRows.reduce(
            (sum, r) => sum + parseInt(r.metricValues[1].value),
            0
        );

        const topPages = filteredRows
            .sort(
                (a, b) =>
                    parseInt(b.metricValues[0].value) -
                    parseInt(a.metricValues[0].value)
            )
            .slice(0, 5)
            .map((r) => ({
                path: r.dimensionValues[0].value,
                views: parseInt(r.metricValues[0].value),
            }));

        // ---- 2️⃣ Report per views giornaliere (per grafico) ----
        const [daily] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: range, endDate: "today" }],
            metrics: [{ name: "screenPageViews" }],
            dimensions: [{ name: "date" }],
            orderBys: [{ dimension: { dimensionName: "date" } }],
        });

        const viewsOverTime =
            daily.rows?.map((r) => {
                const dateStr = r.dimensionValues[0].value; // es. "20251013"
                const formattedDate = `${dateStr.slice(6, 8)}/${dateStr.slice(4, 6)}`;
                return {
                    day: formattedDate,
                    views: parseInt(r.metricValues[0].value),
                };
            }) || [];

        // ---- 3️⃣ Report per sessioni, bounce rate e durata media ----
        const [sessionReport] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: range, endDate: "today" }],
            metrics: [
                { name: "sessions" },
                { name: "bounceRate" },
                { name: "averageSessionDuration" },
            ],
            dimensions: [{ name: "deviceCategory" }],
        });

        const deviceCounts = {};
        let totalSessions = 0;
        let weightedBounce = 0;
        let weightedDuration = 0;

        sessionReport.rows?.forEach((row) => {
            const device = row.dimensionValues[0].value; // desktop / mobile / tablet
            const sessions = parseInt(row.metricValues[0].value);
            const bounce = parseFloat(row.metricValues[1].value);
            const duration = parseFloat(row.metricValues[2].value); // in secondi

            deviceCounts[device] = (deviceCounts[device] || 0) + sessions;
            totalSessions += sessions;
            weightedBounce += bounce * sessions;
            weightedDuration += duration * sessions;
        });

        // Percentuali device
        const devicePercentages = {};
        Object.keys(deviceCounts).forEach((device) => {
            devicePercentages[device] = (
                (deviceCounts[device] / totalSessions) *
                100
            ).toFixed(1);
        });

        // Bounce rate medio e durata media sessione (senza decimali)
        const bounceRate =
            totalSessions > 0 ? (weightedBounce / totalSessions).toFixed(1) : 0;
        const averageSessionDuration =
            totalSessions > 0
                ? Math.round(weightedDuration / totalSessions) // ⬅️ arrotondato ai secondi
                : 0;

        return {
            totalViews,
            uniqueVisitors,
            topPages,
            viewsOverTime,
            totalSessions,
            bounceRate,
            devicePercentages,
            averageSessionDuration,
        };
    } catch (err) {
        console.error("❌ Errore Google Analytics:", err);
        throw new Error("Errore nel recupero dati da Google Analytics");
    }
}
