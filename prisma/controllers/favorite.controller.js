import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt.js";

const prisma = new PrismaClient();

async function favorite(req, res) {
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
      return res.status(400).json({ message: "고객만 이용 가능합니다." });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        customerId: user.id,
      },
    });

    if (!customer) {
      return res.status(400).json({ message: "고객 정보가 없습니다." });
    }

    const { customerId } = customer;

    const { moverId } = req.body;

    if (!moverId) {
      return res.status(400).json({ message: "이사업체 아이디가 없습니다." });
    }

    const mover = await prisma.mover.findUnique({
      where: {
        moverId,
      },
    });

    if (!mover) {
      return res.status(400).json({ message: "이사업체 정보가 없습니다." });
    }

    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        customerId,
        moverId,
      },
    });

    if (existingFavorite) {
      return res.status(400).json({ message: "이미 찜한 이사업체입니다." });
    }

    await prisma.favorite.create({
      data: {
        customerId,
        moverId,
      },
    });

    res.json({ message: "이사업체를 찜했습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

async function favoriteList(req, res) {
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

    const customer = await prisma.customer.findUnique({
      where: {
        customerId: user.id,
      },
    });

    if (!customer) {
      return res.status(400).json({ message: "고객 정보가 없습니다." });
    }

    const { page = 1, size = 8, moverName = "" } = req.query;

    if (isNaN(+page) || isNaN(+size)) {
      return res
        .status(400)
        .json({ message: "page와 size는 숫자여야 합니다." });
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        customerId: customer.customerId,
      },
    });

    const moverIds = favorites.map((favorite) => favorite.moverId);

    const movers = await prisma.mover.findMany({
      where: {
        moverId: {
          in: moverIds,
        },
        mover: {
          name: {
            contains: moverName,
          },
        },
      },
      include: {
        Favorite: {
          where: {
            customerId: customer.customerId,
          },
        },
        mover: {
          select: {
            name: true,
            profileImageUrl: true,
          },
        },
        ServiceType: true,
      },
      skip: (+page - 1) * +size,
      take: +size,
    });

    const totalElements = await prisma.mover.count({
      where: {
        moverId: {
          in: moverIds,
        },
        mover: {
          name: {
            contains: moverName,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalElements / +size);

    const moversWithDetails = await Promise.all(
      movers.map(async (mover) => {
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

        const rating = await prisma.review.aggregate({
          where: {
            moverId: mover.moverId,
          },
          _avg: {
            rating: true,
          },
        });

        const formattedRating = rating._avg.rating
          ? +rating._avg.rating.toFixed(1)
          : 0;
        console.log(mover);
        return {
          favoriteId: mover.Favorite[0].id,
          moverId: mover.moverId,
          movingType: mover.ServiceType.map((serviceType) => serviceType.type),
          moverProfileImageUrl: mover.mover.profileImageUrl,
          moverName: mover.mover.name,
          rating: formattedRating,
          reviewCount,
          favoriteCount,
          career: mover.career,
          confirmedCount: mover.confirmedCount,
        };
      })
    );

    res.json({
      totalElement: totalElements,
      currentPage: +page,
      totalPages,
      movers: moversWithDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

async function favoriteDelete(req, res) {
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

    const customer = await prisma.customer.findUnique({
      where: {
        customerId: user.id,
      },
    });

    if (!customer) {
      return res.status(400).json({ message: "고객 정보가 없습니다." });
    }

    const { favoriteId } = req.params;

    if (!favoriteId) {
      return res.status(400).json({ message: "찜 아이디가 없습니다." });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        id: favoriteId,
      },
    });

    if (!favorite) {
      return res.status(400).json({ message: "찜 정보가 없습니다." });
    }

    await prisma.favorite.delete({
      where: {
        id: favoriteId,
      },
    });

    res.json({ message: "찜을 취소했습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

export { favorite, favoriteList, favoriteDelete };
