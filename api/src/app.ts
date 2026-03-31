import express from "express";
import cors from "cors";
import { router } from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(router);
app.use(errorMiddleware);
