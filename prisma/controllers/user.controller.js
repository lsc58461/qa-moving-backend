import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt.js";

const prisma = new PrismaClient({
  omit: { userInfo: { password: true, refreshToken: true } },
});

async function getUsersInfo(req, res) {
  try {
    const accessToken = req.headers.authorization.split(" ")[1];

    if (!accessToken) {
      return res.status(400).json({ message: "액세스 토큰이 없습니다." });
    }

    const decoded = verifyAccessToken(accessToken);

    if (!decoded) {
      return res.status(400).json({ message: "유효하지 않은 토큰입니다." });
    }

    const users = await prisma.userInfo.findMany();
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

async function getUserInfo(req, res) {
  try {
    const accessToken = req.headers.authorization.split(" ")[1];

    if (!accessToken) {
      return res.status(400).json({ message: "액세스 토큰이 없습니다." });
    }

    const decoded = verifyAccessToken(accessToken);

    if (!decoded) {
      return res.status(400).json({ message: "유효하지 않은 토큰입니다." });
    }

    const user = await prisma.userInfo.findUnique({
      where: {
        email: decoded.email,
      },
    });

    if (!user) {
      return res.status(400).json({ message: "유저 정보가 없습니다." });
    }

    if (user.userType === "CUSTOMER") {
      const customer = await prisma.customer.findUnique({
        where: {
          customerId: user.id,
        },
      });

      if (!customer) {
        return res.status(400).json({ message: "고객 정보가 없습니다." });
      }

      return res.json({ ...user, ...customer });
    }

    if (user.userType === "MOVER") {
      const mover = await prisma.mover.findUnique({
        where: {
          moverId: user.id,
        },
      });

      if (!mover) {
        return res.status(400).json({ message: "이사업체 정보가 없습니다." });
      }

      return res.json({ ...user, ...mover });
    }

    res.status(400).json({ message: "유저 타입이 없습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

export { getUsersInfo, getUserInfo };
