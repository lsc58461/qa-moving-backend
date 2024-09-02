import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt.js";

const prisma = new PrismaClient();

async function createEstimate(req, res) {
  try {
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

    const mover = await prisma.mover.findUnique({
      where: {
        moverId: userInfo.id,
      },
    });

    if (!mover) {
      return res.status(404).json({ message: "이사업자가 아닙니다." });
    }

    const { movingInfoId, price, comment } = req.body;

    if (!movingInfoId) {
      return res.status(400).json({ message: "movingInfoId가 필요합니다." });
    }

    if (!price) {
      return res.status(400).json({ message: "price가 필요합니다." });
    }

    if (!comment) {
      return res.status(400).json({ message: "comment가 필요합니다." });
    }

    const movingInfo = await prisma.movingInfo.findUnique({
      where: {
        id: movingInfoId,
      },
    });

    if (!movingInfo) {
      return res
        .status(404)
        .json({ message: "존재하지 않는 이사 정보입니다." });
    }

    if (movingInfo.estimateCount >= 5) {
      return res
        .status(400)
        .json({ message: "이사 견적은 5개까지만 가능합니다." });
    }

    await prisma.estimate.create({
      data: {
        price,
        comment,
        movingInfoId,
        moverId: mover.moverId,
        customerId: movingInfo.customerId,
      },
    });

    await prisma.movingInfo.update({
      where: {
        id: movingInfoId,
      },
      data: {
        estimateCount: {
          increment: 1,
        },
      },
    });

    res.json({ message: "견적 전송 성공" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

async function moverEstimateList(req, res) {
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

  const mover = await prisma.mover.findUnique({
    where: {
      moverId: userInfo.id,
    },
  });

  if (!mover) {
    return res.status(404).json({ message: "이사업자가 아닙니다." });
  }

  const { orderBy, movingType = "[]", page = 1, size = 8 } = req.query;

  if (orderBy && orderBy !== "requestDesc") {
    return res
      .status(400)
      .json({ message: "orderBy는 requestDesc만 가능합니다." });
  }

  let parsedMovingType = JSON.parse(movingType);

  const validMovingTypes = ["SMALL", "HOME", "OFFICE"];

  if (parsedMovingType.length === 0) {
    // movingType이 빈 배열일 경우 모든 타입을 허용
    parsedMovingType = validMovingTypes;
  } else if (
    !parsedMovingType.every((type) => validMovingTypes.includes(type))
  ) {
    return res
      .status(400)
      .json({ message: "movingType은 SMALL, HOME, OFFICE만 가능합니다." });
  }

  if (isNaN(+page) || isNaN(+size)) {
    return res.status(400).json({ message: "page와 size는 숫자여야 합니다." });
  }

  const serviceableAreas = await prisma.serviceableArea.findMany({
    where: {
      moverId: mover.moverId,
    },
    select: {
      area: true,
    },
  });

  if (!serviceableAreas || serviceableAreas.length === 0) {
    return res.status(404).json({ message: "서비스 가능한 지역이 없습니다." });
  }

  const movingInfos = await prisma.movingInfo.findMany({
    where: {
      serviceableArea: {
        in: serviceableAreas.map((area) => area.area),
      },
      movingType: {
        in: parsedMovingType,
      },
    },
    orderBy:
      orderBy === "requestDesc" ? { createdAt: "desc" } : { movingDate: "asc" },
    skip: (+page - 1) * +size,
    take: +size,
    omit: { isConfirmed: true, isDone: true },
  });

  console.log(parsedMovingType);

  const totalElement = await prisma.movingInfo.count({
    where: {
      serviceableArea: {
        in: serviceableAreas.map((area) => area.area),
      },
      movingType: {
        in: parsedMovingType,
      },
    },
  });

  const totalPages = Math.ceil(totalElement / +size);

  const designatedEstimateRequests =
    await prisma.designatedEstimateRequest.findMany({
      where: {
        moverId: mover.moverId,
      },
    });

  const movingInfo = await Promise.all(
    movingInfos.map(async (info) => {
      let isDesignated = false;

      if (
        designatedEstimateRequests.some(
          (request) => request.movingInfoId === info.id
        )
      ) {
        isDesignated = true;
      }

      const customer = await prisma.userInfo.findUnique({
        where: { id: info.customerId },
        select: { name: true },
      });

      return {
        movingInfoId: info.id,
        movingType: info.movingType,
        isDesignated,
        customerName: customer ? customer.name : "Unknown",
        movingDate: info.movingDate,
        startAddress: info.startAddress,
        endAddress: info.endAddress,
        estimateCount: info.estimateCount,
        createdAt: info.createdAt,
      };
    })
  );

  res.json({
    totalElement,
    currentPage: +page,
    totalPages,
    movingInfo,
  });
}

async function detailEstimate(req, res) {
  try {
    const { estimateId } = req.params;

    if (!estimateId) {
      return res.status(400).json({ message: "estimateId가 필요합니다." });
    }

    const estimate = await prisma.estimate.findUnique({
      where: {
        id: estimateId,
      },
    });

    if (!estimate) {
      return res.status(404).json({ message: "존재하지 않는 견적입니다." });
    }

    const mover = await prisma.mover.findUnique({
      where: {
        moverId: estimate.moverId,
      },
    });

    if (!mover) {
      return res.status(404).json({ message: "존재하지 않는 이사업자입니다." });
    }

    const userInfo = await prisma.userInfo.findUnique({
      where: {
        id: mover.moverId,
      },
    });

    const {
      career,
      confirmedCount,
      oneLineIntroduction,
      detailDescription,
      serviceableArea,
    } = mover;

    const serviceArea = await prisma.serviceableArea.findMany({
      where: {
        moverId: mover.moverId,
      },
      select: {
        area: true,
      },
    });

    const serviceType = await prisma.serviceType.findMany({
      where: {
        moverId: mover.moverId,
      },
      select: {
        type: true,
      },
    });

    const review = await prisma.review.findMany({
      where: {
        moverId: mover.moverId,
      },
    });

    const rating =
      review.reduce((acc, cur) => acc + cur.rating, 0) / review.length;

    const reviewCount = review.length;

    const favorite = await prisma.favorite.findMany({
      where: {
        moverId: mover.moverId,
      },
    });

    const favoriteCount = favorite.length;

    const moverInfo = {
      name: userInfo.name,
      career,
      confirmedCount,
      serviceArea: serviceArea.map((area) => area.area),
      serviceType: serviceType.map((type) => type.type),
      oneLineIntroduction,
      detailDescription,
      serviceableArea,
      rating,
      reviewCount,
      favoriteCount,
    };

    const estimateInfo = {
      price: estimate.price,
      comment: estimate.comment,
    };

    res.json({ moverInfo, estimateInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

async function confirmEstimate(req, res) {
  try {
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
      return res.status(404).json({ message: "고객이 아닙니다." });
    }

    if (!customer.openMovingInfoId) {
      return res.status(400).json({ message: "열린 이사 정보가 없습니다." });
    }

    const movingInfo = await prisma.movingInfo.findUnique({
      where: {
        id: customer.openMovingInfoId,
      },
    });

    if (!movingInfo) {
      return res
        .status(404)
        .json({ message: "존재하지 않는 이사 정보입니다." });
    }

    if (movingInfo.isConfirmed) {
      return res.status(400).json({ message: "이미 확정된 견적입니다." });
    }

    const { estimateId } = req.params;

    if (!estimateId) {
      return res.status(400).json({ message: "estimateId가 필요합니다." });
    }

    const estimate = await prisma.estimate.findUnique({
      where: {
        id: estimateId,
      },
    });

    if (!estimate) {
      return res.status(404).json({ message: "존재하지 않는 견적입니다." });
    }

    if (estimate.isConfirmed) {
      return res.status(400).json({ message: "이미 확정된 견적입니다." });
    }

    await prisma.movingInfo.update({
      where: {
        id: customer.openMovingInfoId,
      },
      data: {
        moverId: estimate.moverId,
        isConfirmed: true,
      },
    });

    await prisma.estimate.update({
      where: {
        id: estimateId,
      },
      data: {
        isConfirmed: true,
      },
    });

    res.json({ message: "견적 확정 성공" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

async function confirmEstimateList(req, res) {
  try {
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

    const { page = 1, size = 8 } = req.query;

    if (isNaN(+page) || isNaN(+size)) {
      return res
        .status(400)
        .json({ message: "page와 size는 숫자여야 합니다." });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        customerId: userInfo.id,
      },
    });

    const userType = customer ? "customer" : "mover";

    const confirmEstimates = await prisma.estimate.findMany({
      where: {
        [`${userType}Id`]: userInfo.id,
        isConfirmed: true,
      },
      skip: (+page - 1) * +size,
      take: +size,
    });

    const totalElement = await prisma.estimate.count({
      where: {
        [`${userType}Id`]: userInfo.id,
        isConfirmed: true,
      },
    });

    const totalPages = Math.ceil(totalElement / +size);

    const confirmEstimateList = confirmEstimates.map((estimate) => {
      return {
        estimateId: estimate.id,
        price: estimate.price,
        comment: estimate.comment,
        movingInfoId: estimate.movingInfoId,
        createdAt: estimate.createdAt,
      };
    });

    res.json({
      totalElement,
      currentPage: +page,
      totalPages,
      confirmEstimateList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

async function createDesignatedEstimate(req, res) {
  try {
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

    const { moverId } = req.body;

    if (!moverId) {
      return res.status(400).json({ message: "moverId가 필요합니다." });
    }

    const mover = await prisma.mover.findUnique({
      where: {
        moverId,
      },
    });

    if (!mover) {
      return res.status(404).json({ message: "존재하지 않는 이사업자입니다." });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        customerId: userInfo.id,
      },
    });

    if (!customer) {
      return res.status(404).json({ message: "고객 정보가 없습니다." });
    }

    if (!customer.openMovingInfoId) {
      return res.status(400).json({ message: "열린 이사 정보가 없습니다." });
    }

    const movingInfo = await prisma.movingInfo.findUnique({
      where: {
        id: customer.openMovingInfoId,
      },
    });

    if (!movingInfo) {
      return res
        .status(404)
        .json({ message: "존재하지 않는 이사 정보입니다." });
    }

    if (movingInfo.isConfirmed && movingInfo.isDone) {
      return res.status(400).json({ message: "이미 종료된 견적입니다." });
    }

    if (movingInfo.designatedCount >= 3) {
      return res
        .status(400)
        .json({ message: "지정 견적은 3개까지만 가능합니다." });
    }

    await prisma.designatedEstimateRequest.create({
      data: {
        customerId: customer.customerId,
        movingInfoId: movingInfo.id,
        moverId,
      },
    });

    await prisma.movingInfo.update({
      where: {
        id: customer.openMovingInfoId,
      },
      data: {
        designatedCount: {
          increment: 1,
        },
      },
    });

    res.json({ message: "지정 견적 요청 성공" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

export {
  createEstimate,
  moverEstimateList,
  detailEstimate,
  confirmEstimate,
  createDesignatedEstimate,
  confirmEstimateList,
};
