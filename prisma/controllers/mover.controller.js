import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { verifyAccessToken } from "../utils/jwt.js";
import SERVICEABLE_AREAS from "../constants/serviceableAreas.js";

const prisma = new PrismaClient();

async function moverList(req, res) {
  try {
    const {
      page = 1,
      size = 8,
      orderBy,
      moverName,
      movingArea = "[]",
      movingType,
    } = req.query;

    if (isNaN(+page) || isNaN(+size)) {
      return res
        .status(400)
        .json({ message: "page와 size는 숫자여야 합니다." });
    }

    if (
      orderBy &&
      !["ratingDesc", "careerDesc", "confirmCountDesc"].includes(orderBy)
    ) {
      return res.status(400).json({
        message:
          "orderBy는 ratingDesc, careerDesc, confirmCountDesc 중 하나여야 합니다.",
      });
    }

    const parsedMovingArea = JSON.parse(movingArea);

    if (parsedMovingArea && !Array.isArray(parsedMovingArea)) {
      return res
        .status(400)
        .json({ message: "movingArea는 배열이어야 합니다." });
    }

    if (
      parsedMovingArea &&
      parsedMovingArea.length > 0 &&
      !parsedMovingArea.every((area) => SERVICEABLE_AREAS.includes(area))
    ) {
      return res
        .status(400)
        .json({ message: "movingArea에 없는 지역이 포함되어 있습니다." });
    }

    if (movingType && !["SMALL", "HOME", "OFFICE"].includes(movingType)) {
      return res.status(400).json({
        message: "movingType은 SMALL, HOME, OFFICE 중 하나여야 합니다.",
      });
    }

    const moversList = await prisma.mover.findMany({
      where: {
        AND: [
          moverName && {
            mover: {
              name: {
                contains: moverName,
              },
            },
          },
          parsedMovingArea.length > 0 && {
            ServiceableArea: {
              some: {
                area: {
                  in: parsedMovingArea,
                },
              },
            },
          },
          movingType && {
            ServiceType: {
              some: {
                type: movingType,
              },
            },
          },
        ].filter(Boolean),
      },
      include: {
        mover: true,
        ServiceType: true,
        ServiceableArea: true,
      },
      orderBy:
        orderBy &&
        {
          ratingDesc: {
            rating: "desc",
          },
          careerDesc: {
            career: "desc",
          },
          confirmCountDesc: {
            confirmedCount: "desc",
          },
        }[orderBy],
      skip: (+page - 1) * +size,
      take: +size,
    });

    const totalElements = await prisma.mover.count({
      where: {
        AND: [
          moverName && {
            mover: {
              name: {
                contains: moverName,
              },
            },
          },
          parsedMovingArea.length > 0 && {
            ServiceableArea: {
              some: {
                area: {
                  in: parsedMovingArea,
                },
              },
            },
          },
          movingType && {
            ServiceType: {
              some: {
                type: movingType,
              },
            },
          },
        ].filter(Boolean),
      },
    });

    const totalPage = Math.ceil(totalElements / size);

    const movers = await Promise.all(
      moversList.map(async (mover) => {
        const movingType = mover.ServiceType.map((type) => type.type);

        const reviewCount = await prisma.review.count({
          where: {
            moverId: mover.moverId,
          },
        });

        const favoriteCount = await prisma.favorite.count({
          where: {
            moverId: mover.moverId,
          },
        });

        return {
          moverId: mover.moverId,
          movingType: movingType,
          moverProfileImageUrl: mover.mover.profileImageUrl,
          moverName: mover.mover.name,
          oneLineIntroduction: mover.oneLineIntroduction,
          rating: mover.rating,
          reviewCount,
          favoriteCount,
          career: mover.career,
          confirmedCount: mover.confirmedCount,
          createdAt: mover.createdAt,
        };
      })
    );

    res.json({
      totalElement: totalElements,
      currentPage: +page,
      totalPage,
      movers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

async function updateMoverInfo(req, res) {
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

    if (user.userType !== "MOVER") {
      return res
        .status(400)
        .json({ message: "기사님만 사용가능한 기능입니다." });
    }

    const { name, phoneNumber, password } = req.body;

    if (!name || !phoneNumber || !password) {
      return res
        .status(400)
        .json({ message: "name, phoneNumber, password는 필수입니다." });
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
      },
    });

    res.json({ message: "기사님 기본정보가 수정되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

async function updateMoverProfile(req, res) {
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

    if (user.userType !== "MOVER") {
      return res
        .status(400)
        .json({ message: "기사님만 사용가능한 기능입니다." });
    }

    const {
      profileImageUrl = null,
      career,
      oneLineIntroduction,
      detailDescription,
      serviceType,
      serviceableArea,
    } = req.body;

    if (
      !career ||
      !oneLineIntroduction ||
      !detailDescription ||
      !serviceType ||
      !serviceableArea
    ) {
      return res.status(400).json({
        message:
          "career, oneLineIntroduction, detailDescription, serviceType, serviceableArea는 필수입니다.",
      });
    }

    if (!Array.isArray(serviceType)) {
      return res
        .status(400)
        .json({ message: "serviceType은 배열이어야 합니다." });
    }

    if (
      !serviceType.every((type) => ["SMALL", "HOME", "OFFICE"].includes(type))
    ) {
      return res.status(400).json({
        message: "serviceType은 SMALL, HOME, OFFICE 중 하나여야 합니다.",
      });
    }

    if (!Array.isArray(serviceableArea)) {
      return res
        .status(400)
        .json({ message: "serviceableArea은 배열이어야 합니다." });
    }

    if (!serviceableArea.every((area) => SERVICEABLE_AREAS.includes(area))) {
      return res
        .status(400)
        .json({ message: "serviceableArea에 없는 지역이 포함되어 있습니다." });
    }

    const mover = await prisma.mover.findUnique({
      where: {
        moverId: user.id,
      },
      include: {
        ServiceType: true,
        ServiceableArea: true,
      },
    });

    if (!mover) {
      return res.status(400).json({ message: "기사님 정보가 없습니다." });
    }

    await prisma.serviceType.deleteMany({
      where: {
        moverId: user.id,
      },
    });

    await prisma.serviceableArea.deleteMany({
      where: {
        moverId: user.id,
      },
    });

    if (profileImageUrl) {
      await prisma.userInfo.update({
        where: {
          id: user.id,
        },
        data: {
          profileImageUrl,
        },
      });
    }

    await prisma.mover.update({
      where: {
        moverId: user.id,
      },
      data: {
        career,
        oneLineIntroduction,
        detailDescription,
      },
    });

    await Promise.all(
      serviceType.map(async (type) => {
        await prisma.serviceType.create({
          data: {
            type,
            moverId: user.id,
          },
        });
      })
    );

    await Promise.all(
      serviceableArea.map(async (area) => {
        await prisma.serviceableArea.create({
          data: {
            area,
            moverId: user.id,
          },
        });
      })
    );

    res.json({ message: "기사님 프로필이 수정되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

export { moverList, updateMoverInfo, updateMoverProfile };
