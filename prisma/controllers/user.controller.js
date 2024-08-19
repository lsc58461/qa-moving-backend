import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt.js";

const prisma = new PrismaClient({
  omit: { userInfo: { password: true, refreshToken: true } },
});

async function usersInfo(req, res) {
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    return res.status(400).json({ message: "액세스 토큰이 없습니다." });
  }

  const decoded = verifyAccessToken(accessToken);

  if (!decoded) {
    return res.status(400).json({ message: "유효하지 않은 토큰입니다." });
  }

  const users = await prisma.userInfo.findMany();
  res.json({ users });
}

async function userInfo(req, res) {
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    return res.status(400).json({ message: "액세스 토큰이 없습니다." });
  }

  const decoded = verifyAccessToken(accessToken);

  if (!decoded) {
    return res.status(400).json({ message: "유효하지 않은 토큰입니다." });
  }

  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "유저 아이디가 없습니다." });
  }

  const user = await prisma.userInfo.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(400).json({ message: "유저 정보가 없습니다." });
  }

  res.json({ ...user });
}

export { usersInfo, userInfo };
