import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import {
  refresh,
  signin,
  signout,
  signup,
} from "./prisma/controllers/auth.controller.js";
import { userInfo, usersInfo } from "./prisma/controllers/user.controller.js";
import {
  notification,
  notifications,
  sendNotification,
  unreadNotificationsCount,
} from "./prisma/controllers/notifications.controller.js";
import {
  createMovingInfo,
  movingInfoList,
} from "./prisma/controllers/movingInfo.controller.js";

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Auth
app.post("/auth/signup", signup);

app.post("/auth/signin", signin);

app.post("/auth/signout", signout);

app.post("/auth/refresh", refresh);

app.get("/auth2/authorize/:socialType", () => {});

// User
app.get("/users", usersInfo);

app.get("/user", userInfo);

// Notifications
app.get("/notifications", notifications);

app.post("/notifications", sendNotification);

app.get("/notifications/unread-count", unreadNotificationsCount);

app.get("/notifications/:notificationId", notification);

// MovingInfo
app.post("/users/moving-info", createMovingInfo);

app.get("/moving-info/:movingInfoId/estimates", movingInfoList);

// listen
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
