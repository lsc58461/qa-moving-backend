import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt.js";

const prisma = new PrismaClient();

const NOTIFICATION_CONFIG = {
  ESTIMATE: {
    message: (moverName, movingType) =>
      `${moverName}님의 ${
        movingType === "small"
          ? "소형이사"
          : movingType === "home"
          ? "가정이사"
          : movingType === "office"
          ? "사무실이사"
          : "이사"
      } 견적이 도착했어요`,
  },
  CONFIRMED: {
    message: "요청하신 견적이 확정 되었어요",
  },
  MOVINGDAY: {
    message: "오늘은 이사하는 날이에요. 즐거운 이사 되시길 바래요!",
  },
};

cron.schedule("0 0 * * *", async () => {
  console.log("이사 당일 알림을 확인하고 있습니다...");

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usersMovingToday = await prisma.movingInfo.findMany({
      where: {
        movingDate: today,
      },
    });

    await Promise.all(
      usersMovingToday.map((user) =>
        sendNotification(
          {
            body: {
              userId: user.customerId,
              notificationType: "MOVINGDAY",
            },
          },
          { json: () => {} }
        )
      )
    );

    console.log("이사 당일 알림 전송 완료");
  } catch (error) {
    console.error("이사 당일 알림 전송 중 오류 발생:", error);
  }
});

async function sendNotification(req, res) {
  const {
    userId,
    notificationType,
    moverName = "",
    movingType = "",
  } = req.body;

  if (!userId || !notificationType) {
    return res.status(400).json({ message: "필수 항목을 입력해주세요." });
  }

  if (!NOTIFICATION_CONFIG[notificationType]) {
    return res.status(400).json({ message: "알림 타입이 올바르지 않습니다." });
  }

  if (notificationType === "ESTIMATE" && (!moverName || !movingType)) {
    return res
      .status(400)
      .json({ message: "moverName과 movingType이 없습니다." });
  }

  const message =
    notificationType === "ESTIMATE"
      ? NOTIFICATION_CONFIG[notificationType].message(moverName, movingType)
      : NOTIFICATION_CONFIG[notificationType].message;

  try {
    const createNotification = await prisma.notification.create({
      data: {
        userId,
        notificationType,
        message,
      },
    });

    res.json({ message: "알림 전송 성공", data: createNotification });
  } catch (error) {
    res.status(500).json({ message: "알림 전송 실패", error });
  }
}

async function notifications(req, res) {
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    return res.status(400).json({ message: "액세스 토큰이 없습니다." });
  }

  const decoded = verifyAccessToken(accessToken);

  if (!decoded) {
    return res.status(400).json({ message: "유효하지 않은 토큰입니다." });
  }

  const userInfo = await prisma.userInfo.findUnique({
    where: {
      email: decoded.email,
    },
  });

  console.log(userInfo);
  const { filterBy } = req.query;

  const isReadFilter =
    filterBy === "unRead" ? false : filterBy === "read" ? true : undefined;

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userInfo.id,
        ...(isReadFilter !== undefined && { isRead: isReadFilter }),
      },
    });

    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "알림 조회 실패", error });
  }
}

async function notification(req, res) {
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    return res.status(400).json({ message: "액세스 토큰이 없습니다." });
  }

  const { notificationId } = req.params;

  if (!notificationId) {
    return res.status(400).json({ message: "알림 아이디가 없습니다." });
  }

  const notification = await prisma.notification.findUnique({
    where: {
      id: notificationId,
    },
  });

  if (!notification) {
    return res.status(400).json({ message: "알림이 없습니다." });
  }

  try {
    const readNotification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });

    res.json({ notification: readNotification });
  } catch (error) {
    res.status(500).json({ message: "알림 읽기 실패", error });
  }
}

async function unreadNotificationsCount(req, res) {
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    return res.status(400).json({ message: "액세스 토큰이 없습니다." });
  }

  const decoded = verifyAccessToken(accessToken);

  if (!decoded) {
    return res.status(400).json({ message: "유효하지 않은 토큰입니다." });
  }

  const userInfo = await prisma.userInfo.findUnique({
    where: {
      email: decoded.email,
    },
  });

  try {
    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        userId: userInfo.id,
        isRead: false,
      },
    });

    res.json({ unreadCount: unreadNotificationsCount });
  } catch (error) {
    res.status(500).json({ message: "읽지 않은 알림 개수 조회 실패", error });
  }
}

export {
  sendNotification,
  notifications,
  notification,
  unreadNotificationsCount,
};
