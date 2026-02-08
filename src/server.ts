import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import matchRoutes from "./routes/match-routes";
import adminRoutes from "./routes/admin-routes";

const app = express();
const PORT = process.env.PORT || 10000;

// CORS — allow frontend origin
app.use((req, res, next) => {
  const origin = process.env.FRONTEND_URL || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(bodyParser.json());

// Mount match routes
app.use("/match", matchRoutes);

// Mount admin routes
app.use("/admin", adminRoutes);

// Health-check
app.get("/", (req, res) => res.send("Fantasy Sports Game API is running"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
