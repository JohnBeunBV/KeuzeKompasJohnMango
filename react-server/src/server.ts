import rateLimit from "express-rate-limit";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
import {connectDB} from "./infrastructure/db";
import vkmsRouter from "./application/vkms/vkm.routes";
import authRouter from "./application/auth/auth.routes";
import adminRouter from "./application/admin/admin.routes";
import teacherRouter from "./application/teacher/teacher.routes";

import {seedAdminUser} from "./application/seed/admin.seed";
import * as path from "path";


export const app = express();
app.use(helmet());
const PORT = process.env.PORT || 5000;

// 🔹 Middleware
app.use(cors());
app.use(express.json());

// 🔹 Database connectie
if (process.env.NODE_ENV !== 'test') {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI environment variable is missing");
    }

    connectDB(process.env.MONGO_URI).then(() => {
        seedAdminUser();
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    });
}
// 🔹 Rate limiter (5 minuten, max 100 requests per IP)
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Te veel requests, probeer over 5 minuten opnieuw." },
});

// 🔹 Pas limiter toe op alle /api/ routes
app.use("/api/", apiLimiter);

// 🔹 API Routes
app.use("/api/auth", authRouter);
app.use("/api/vkms", vkmsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/teacher", teacherRouter);

// 🔹 Debug logging van alle routes
app._router?.stack.forEach((middleware: any) => {
    if (middleware.route) {
        console.log("Route:", middleware.route.path, "Methods:", middleware.route.methods);
    } else if (middleware.name === "router") {
        middleware.handle.stack.forEach((handler: any) => {
            if (handler.route) {
                console.log("Route:", handler.route.path, "Methods:", handler.route.methods);
            }
        });
    }
});

// 🔹 Serve React frontend build (Vite output = react-app/dist)
const clientBuildPath = path.join(__dirname, "../../react-app/dist");
app.use(express.static(clientBuildPath));

// 🔹 Alle andere routes → React index.html
app.get("/^\/.*$/", (_req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
});

// 🔹 Server starten
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default app;