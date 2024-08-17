import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import {
  refresh,
  signin,
  signout,
  signup,
} from "./prisma/controllers/auth.controller.js";

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Auth
app.post("/auth/signup", signup);

app.post("/auth/signin", signin);

app.post("/auth/signout", signout);

app.post("/auth/refresh", refresh);

app.get("/auth2/authorize/:socialType", () => {});

// // User
// app.get("/users/:userId", () => {});

// app.put("/users/:userId", () => {});

// // Notifications
// app.get("/notifications", () => {});

// app.get("/notifications/:notificationId", () => {});

// app.get("/notifications/unread-count", () => {});

// // MovingInfo
// app.post("/users/:userId/moving-info", () => {});

// app.get("/users/:userId/moving-info", () => {});

// app.get("/moving-info/:movingInfoId/estimates", () => {});

// listen
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
