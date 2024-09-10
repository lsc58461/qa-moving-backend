import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt.js";

const prisma = new PrismaClient();

async function reviewList(req, res) {
  try {
    const { moverId } = req.params;

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

    const { page = 1, size = 5 } = req.query;

    if (isNaN(+page) || isNaN(+size)) {
      return res
        .status(400)
        .json({ message: "page와 size는 숫자여야 합니다." });
    }

    const reviews = await prisma.review.findMany({
      where: {
        moverId,
      },
      skip: (+page - 1) * +size,
      take: +size,
    });

    const totalElements = await prisma.review.count({
      where: {
        moverId,
      },
    });

    const totalPage = Math.ceil(reviews.length / size);

    res.json({
      totalElement: totalElements,
      currentPage: +page,
      totalPage,
      reviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

async function customerReviewList(req, res) {
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

    const { page = 1, size = 6, filterBy } = req.query;

    if (isNaN(+page) || isNaN(+size)) {
      return res
        .status(400)
        .json({ message: "page와 size는 숫자여야 합니다." });
    }

    if (filterBy !== "pendingReview" && filterBy !== "myReview") {
      return res.status(400).json({
        message: "filterBy는 pendingReview 또는 myReview이어야 합니다.",
      });
    }

    const estimates = await prisma.estimate.findMany({
      where: {
        customerId: customer.customerId,
        reviewId: filterBy === "pendingReview" ? null : { not: null },
      },
      include: {
        movingInfo: true,
      },
    });

    const totalElements = await prisma.estimate.count({
      where: {
        customerId: customer.customerId,
        reviewId: filterBy === "pendingReview" ? null : { not: null },
      },
    });

    const totalPage = Math.ceil(totalElements / size);

    const reviews = await Promise.all(
      estimates.map(async (estimate) => {
        const designatedEstimateRequest =
          await prisma.designatedEstimateRequest.findFirst({
            where: {
              movingInfoId: estimate.movingInfoId,
              moverId: estimate.moverId,
            },
          });

        const isDesignated =
          estimate.moverId === designatedEstimateRequest.moverId;

        const user = await prisma.userInfo.findUnique({
          where: {
            id: estimate.moverId,
          },
        });

        const review =
          filterBy === "myReview" &&
          (await prisma.review.findFirst({
            where: {
              estimateId: estimate.id,
              customerId: customer.customerId,
            },
          }));

        return {
          moverId: estimate.moverId,
          movingType: estimate.movingInfo.movingType,
          isDesignated: isDesignated,
          moverProfileImageUrl: user.profileImageUrl,
          moverName: user.name,
          movingDate: estimate.movingInfo.movingDate,
          price: estimate.price,
          ...(review && {
            review: {
              reviewId: review.id,
              rating: review.rating,
              comment: review.comment,
              createdAt: review.createdAt,
            },
          }),
        };
      })
    );

    res.json({
      totalElement: totalElements,
      currentPage: +page,
      totalPage,
      reviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

async function createReview(req, res) {
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

    const { estimateId, rating, comment } = req.body;

    if (!estimateId || !rating || !comment) {
      return res.status(400).json({ message: "필수 정보가 없습니다." });
    }

    const estimate = await prisma.estimate.findUnique({
      where: {
        id: estimateId,
      },
    });

    if (!estimate) {
      return res.status(400).json({ message: "견적 정보가 없습니다." });
    }

    if (!estimate.isConfirmed) {
      return res.status(400).json({ message: "견적이 확정되지 않았습니다." });
    }

    const review = await prisma.review.findFirst({
      where: {
        estimateId,
        customerId: customer.customerId,
      },
    });

    if (review) {
      return res.status(400).json({ message: "이미 리뷰를 작성했습니다." });
    }

    const createReview = await prisma.review.create({
      data: {
        estimateId,
        movingInfoId: estimate.movingInfoId,
        customerId: customer.customerId,
        moverId: estimate.moverId,
        rating,
        comment,
      },
    });

    await prisma.estimate.update({
      where: {
        id: estimateId,
      },
      data: {
        reviewId: createReview.id,
      },
    });

    res.json({ message: "리뷰가 작성되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

async function updateReview(req, res) {
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

    const { reviewId } = req.params;

    if (!reviewId) {
      return res.status(400).json({ message: "리뷰 아이디가 없습니다." });
    }

    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

    if (!review) {
      return res.status(400).json({ message: "리뷰 정보가 없습니다." });
    }

    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: "필수 정보가 없습니다." });
    }

    await prisma.review.update({
      where: {
        id: reviewId,
      },
      data: {
        rating,
        comment,
      },
    });

    res.json({ message: "리뷰가 수정되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

async function deleteReview(req, res) {
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

    const { reviewId } = req.params;

    if (!reviewId) {
      return res.status(400).json({ message: "리뷰 아이디가 없습니다." });
    }

    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

    if (!review) {
      return res.status(400).json({ message: "리뷰 정보가 없습니다." });
    }

    await prisma.review.delete({
      where: {
        id: reviewId,
      },
    });

    res.json({ message: "리뷰가 삭제되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

export {
  reviewList,
  customerReviewList,
  createReview,
  updateReview,
  deleteReview,
};
