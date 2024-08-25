import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt.js";

const prisma = new PrismaClient();

// 이사 정보 등록
async function createMovingInfo(req, res) {
  const accessToken = req.headers.authorization.split(" ")[1];

  if (!accessToken) {
    return res.status(400).json({ message: "accessToken이 필요합니다." });
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
    return res.status(404).json({ message: "존재하지 않는 유저입니다." });
  }

  const customer = await prisma.customer.findUnique({
    where: {
      customerId: userInfo.id,
    },
  });

  if (customer.openMovingInfoId) {
    return res.status(400).json({ message: "진행 중인 이사 정보가 있습니다." });
  }

  const { movingType, movingDate, startAddress, endAddress } = req.body;

  if (!movingType) {
    return res.status(400).json({ message: "movingType이 필요합니다." });
  }

  if (
    movingType !== "SMALL" &&
    movingType !== "HOME" &&
    movingType !== "OFFICE"
  ) {
    return res.status(400).json({
      message: "movingType은 SMALL, HOME, OFFICE 중 하나여야 합니다.",
    });
  }

  if (!movingDate) {
    return res.status(400).json({ message: "movingDate가 필요합니다." });
  }

  if (!startAddress) {
    return res.status(400).json({ message: "startAddress가 필요합니다." });
  }

  if (!endAddress) {
    return res.status(400).json({ message: "endAddress가 필요합니다." });
  }

  if (isNaN(Date.parse(movingDate))) {
    return res
      .status(400)
      .json({ message: "movingDate가 올바른 ISO 8601 날짜 형식이 아닙니다." });
  }

  if (new Date(movingDate) < new Date()) {
    return res
      .status(400)
      .json({ message: "이사 날짜는 오늘 이후여야 합니다." });
  }

  const createMovingInfo = await prisma.movingInfo.create({
    data: {
      customerId: userInfo.id,
      movingType,
      movingDate,
      startAddress,
      endAddress,
    },
  });

  await prisma.customer.update({
    where: {
      customerId: userInfo.id,
    },
    data: {
      openMovingInfoId: createMovingInfo.id,
    },
  });

  res.json({ message: "이사 정보 생성 성공", data: createMovingInfo });
}

// 받은 견적 조회
async function movingInfoList(req, res) {
  const accessToken = req.headers.authorization.split(" ")[1];

  if (!accessToken) {
    return res.status(400).json({ message: "accessToken이 필요합니다." });
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
    return res.status(404).json({ message: "존재하지 않는 유저입니다." });
  }

  const customer = await prisma.customer.findUnique({
    where: {
      customerId: userInfo.id,
    },
  });

  if (!customer) {
    return res.status(404).json({ message: "존재하지 않는 고객입니다." });
  }

  if (!customer.openMovingInfoId) {
    return res.status(404).json({ message: "등록된 이사 정보가 없습니다." });
  }

  const { filterBy, page = 0, size = 8 } = req.query;

  if (filterBy !== "estimate" && filterBy !== "pastEstimate") {
    return res.status(400).json({
      message: "filterBy는 estimate, pastEstimate 중 하나여야 합니다.",
    });
  }

  if (isNaN(+page) || isNaN(+size)) {
    return res.status(400).json({ message: "page와 size는 숫자여야 합니다." });
  }

  if (filterBy === "estimate") {
    const estimate = await prisma.estimate.findMany({
      where: {
        movingInfoId: customer.openMovingInfoId,
      },
      skip: +page * +size,
      take: +size,
    });

    if (estimate.length === 0) {
      return res.status(404).json({ message: "받은 견적이 없습니다." });
    }

    res.json({ estimate });
  }

  if (filterBy === "pastEstimate") {
    const estimate = await prisma.estimate.findMany({
      where: {
        customerId: userInfo.id,
        movingInfoId: {
          not: customer.openMovingInfoId,
        },
      },
      skip: +page * +size,
      take: +size,
    });

    if (estimate.length === 0) {
      return res.status(404).json({ message: "과거 받은 견적이 없습니다." });
    }

    res.json({ estimate });
  }
}

export { createMovingInfo, movingInfoList };
