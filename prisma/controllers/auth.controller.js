import isEmail from "is-email";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
} from "../utils/jwt.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function signup(req, res) {
  const { userType, name, email, phoneNumber, password } = req.body;

  if (!userType || !name || !email || !phoneNumber || !password) {
    return res.status(400).json({ message: "필수 항목을 입력해주세요." });
  }

  if (userType !== "CUSTOMER" && userType !== "MOVER") {
    return res.status(400).json({
      message:
        "유저 타입이 올바르지 않습니다. userType은 CUSTOMER 또는 MOVER이어야 합니다.",
    });
  }

  if (isEmail(email) === false) {
    return res
      .status(400)
      .json({ message: "이메일 형식이 올바르지 않습니다." });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const createUserInfo = await prisma.userInfo.create({
    data: {
      userType,
      name,
      email,
      phoneNumber,
      password: hash,
    },
  });

  res.json({ message: "유저 생성 성공", data: createUserInfo });
}

async function signin(req, res) {
  const { email, password } = req.body;

  const userInfo = await prisma.userInfo.findUnique({
    where: {
      email,
    },
  });

  if (!userInfo) {
    return res.status(400).json({ message: "유저 정보가 없습니다." });
  }

  const comparePassword = bcrypt.compareSync(password, userInfo.password);

  if (!comparePassword) {
    return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
  }

  const payload = {
    userType: userInfo.userType,
    name: userInfo.name,
    email: userInfo.email,
    phoneNumber: userInfo.phoneNumber,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken();

  await prisma.userInfo.update({
    where: {
      email,
    },
    data: {
      refreshToken,
    },
  });

  res.json({ accessToken, refreshToken });
}

async function signout(req, res) {
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

  if (!userInfo) {
    return res.status(400).json({ message: "유저 정보가 없습니다." });
  }

  await prisma.userInfo.update({
    where: {
      email: decoded.email,
    },
    data: {
      refreshToken: null,
    },
  });

  res.json({ message: "로그아웃 성공" });
}

async function refresh(req, res) {
  const { email: requestEmail, refreshToken: requestRefreshToken } = req.body;

  const userInfo = await prisma.userInfo.findUnique({
    where: {
      email: requestEmail,
    },
  });

  if (!userInfo) {
    return res.status(400).json({ message: "유저 정보가 없습니다." });
  }

  const { userType, name, email, phoneNumber, refreshToken } = userInfo;

  if (refreshToken !== requestRefreshToken) {
    return res
      .status(400)
      .json({ message: "리프레시 토큰이 일치하지 않습니다." });
  }

  const payload = {
    userType,
    name,
    email,
    phoneNumber,
  };

  const accessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken();

  await prisma.userInfo.update({
    where: {
      email,
    },
    data: {
      refreshToken: newRefreshToken,
    },
  });

  res.json({ accessToken, newRefreshToken });
}

export { signup, signin, signout, refresh };
