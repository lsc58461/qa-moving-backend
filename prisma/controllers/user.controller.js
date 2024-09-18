import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt.js";
import bcrypt from "bcrypt";
import SERVICEABLE_AREAS from "../constants/serviceableAreas.js";

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

async function updateUserInfo(req, res) {
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

    if (user.userType !== "CUSTOMER") {
      return res
        .status(400)
        .json({ message: "고객만 정보를 수정할 수 있습니다." });
    }

    const {
      name,
      phoneNumber,
      password,
      profileImageUrl = null,
      movingType,
      movingArea,
    } = req.body;

    if (!name || !phoneNumber || !password || !movingType || !movingArea) {
      return res.status(400).json({ message: "필수 정보를 입력해주세요." });
    }

    if (!Array.isArray(movingType)) {
      return res
        .status(400)
        .json({ message: "movingType은 배열이어야 합니다." });
    }

    if (
      !movingType.every((type) => ["SMALL", "HOME", "OFFICE"].includes(type))
    ) {
      return res.status(400).json({
        message: "movingType은 SMALL, HOME, OFFICE 중 하나여야 합니다.",
      });
    }

    if (!Array.isArray(movingArea)) {
      return res
        .status(400)
        .json({ message: "movingArea는 배열이어야 합니다." });
    }

    if (!movingArea.every((area) => SERVICEABLE_AREAS.includes(area))) {
      return res
        .status(400)
        .json({ message: "movingArea에 없는 지역이 포함되어 있습니다." });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    await prisma.userInfo.update({
      where: {
        id: user.id,
      },
      data: {
        name,
        phoneNumber,
        password: hash,
        profileImageUrl,
      },
    });

    await prisma.serviceType.deleteMany({
      where: {
        customerId: user.id,
      },
    });

    await prisma.serviceableArea.deleteMany({
      where: {
        customerId: user.id,
      },
    });

    await Promise.all(
      movingType.map(async (type) => {
        await prisma.serviceType.create({
          data: {
            type,
            customerId: user.id,
          },
        });
      })
    );

    await Promise.all(
      movingArea.map(async (area) => {
        await prisma.serviceableArea.create({
          data: {
            area,
            customerId: user.id,
          },
        });
      })
    );

    res.json({ message: "정보가 수정되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

export { getUsersInfo, getUserInfo, updateUserInfo };
