import * as dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import {
  refresh,
  signin,
  signout,
  signup,
} from "./prisma/controllers/auth.controller.js";
import {
  getUserInfo,
  getUsersInfo,
} from "./prisma/controllers/user.controller.js";
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
import {
  confirmEstimate,
  confirmEstimateList,
  createDesignatedEstimate,
  createEstimate,
  detailEstimate,
  moverEstimateList,
} from "./prisma/controllers/estimate.controller.js";
import {
  favorite,
  favoriteDelete,
  favoriteList,
} from "./prisma/controllers/favorite.controller.js";
import {
  createReview,
  customerReviewList,
  deleteReview,
  reviewList,
  updateReview,
} from "./prisma/controllers/review.controller.js";
import {
  moverList,
  updateMoverInfo,
  updateMoverProfile,
} from "./prisma/controllers/mover.controller.js";

const port = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

// Auth
app.post("/auth/signup", signup);

app.post("/auth/signin", signin);

app.post("/auth/signout", signout);

app.post("/auth/refresh", refresh);

app.get("/auth2/authorize/:socialType", () => {});

// User
app.get("/users", getUsersInfo);

app.get("/user", getUserInfo);

// Notifications
app.get("/notifications", notifications);

app.post("/notifications", sendNotification);

app.get("/notifications/unread-count", unreadNotificationsCount);

app.get("/notifications/:notificationId", notification);

// MovingInfo
app.post("/users/moving-info", createMovingInfo);

app.get("/moving-info/:movingInfoId/estimates", movingInfoList);

// Estimate
app.post("/estimate", createDesignatedEstimate);

app.post("/estimates", createEstimate);

app.get("/estimates", moverEstimateList);

app.get("/estimates/confirm", confirmEstimateList);

app.get("/estimates/:estimateId", detailEstimate);

app.post("/estimates/:estimateId/confirm", confirmEstimate);

// Mover
app.get("/movers", moverList);

app.put("/mover", updateMoverInfo);

app.put("/mover/profile", updateMoverProfile);

// Favorite
app.post("/favorite", favorite);

app.get("/favorites", favoriteList);

app.delete("/favorites/:favoriteId", favoriteDelete);

// Review
app.get("/movers/:moverId/reviews", reviewList);

app.get("/reviews", customerReviewList);

app.post("/reviews", createReview);

app.put("/reviews/:reviewId", updateReview);

app.delete("/reviews/:reviewId", deleteReview);

// listen
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
