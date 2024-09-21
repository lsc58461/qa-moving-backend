import Axios from "axios";
import { PrismaClient } from "@prisma/client";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

const prisma = new PrismaClient();

async function oauth(req, res) {
  try {
    const { socialType } = req.params;
    if (!socialType) {
      return res.status(400).json({ message: "소셜 타입이 없습니다." });
    }

    if (socialType === "kakao") {
      const { code } = req.query;
      // https://qa-moving-backend.onrender.com/oauth/kakao
      const authToken = await Axios.post(
        "https://kauth.kakao.com/oauth/token",
        {},
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
          },
          params: {
            grant_type: "authorization_code",
            client_id: process.env.KAKAO_REST_API_KEY,
            code,
            redirect_uri: "https://qa-moving-backend.onrender.com/oauth/kakao",
            client_secret: process.env.KAKAO_CLIENT_SECRET,
          },
        }
      );

      const authInfo = await Axios.post(
        "https://kapi.kakao.com/v2/user/me",
        {},
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Bearer " + authToken.data.access_token,
          },
        }
      );

      const userInfo = await prisma.userInfo.findUnique({
        where: {
          email: authInfo.data.kakao_account.email,
        },
      });

      if (!userInfo) {
        const createUser = await prisma.userInfo.create({
          data: {
            name: authInfo.data.kakao_account.profile.nickname,
            email: authInfo.data.kakao_account.email,
            profileImageUrl:
              authInfo.data.kakao_account.profile.profile_image_url,
            userType: "CUSTOMER",
          },
        });

        await prisma.customer.create({
          data: {
            customerId: createUser.id,
          },
        });
      }

      const payload = {
        userType: "CUSTOMER",
        name: authInfo.data.kakao_account.profile.nickname,
        email: authInfo.data.kakao_account.email,
      };

      const accessToken = generateAccessToken(payload);

      const refreshToken = generateRefreshToken();

      await prisma.userInfo.update({
        where: {
          email: authInfo.data.kakao_account.email,
        },
        data: {
          refreshToken,
        },
      });

      return res.json({ accessToken, refreshToken });
    }

    if (socialType === "google") {
      const { code } = req.query;

      const authToken = await Axios.post(
        "https://oauth2.googleapis.com/token",
        {},
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          params: {
            grant_type: "authorization_code",
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: "https://qa-moving-backend.onrender.com/oauth/google",
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      );

      const authInfo = await Axios.get(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        {
          headers: {
            Authorization: "Bearer " + authToken.data.access_token,
          },
        }
      );

      const userInfo = await prisma.userInfo.findUnique({
        where: {
          email: authInfo.data.email,
        },
      });

      if (!userInfo) {
        const createUser = await prisma.userInfo.create({
          data: {
            name: authInfo.data.name,
            email: authInfo.data.email,
            profileImageUrl: authInfo.data.picture,
            userType: "CUSTOMER",
          },
        });

        await prisma.customer.create({
          data: {
            customerId: createUser.id,
          },
        });
      }

      const payload = {
        userType: "CUSTOMER",
        name: authInfo.data.name,
        email: authInfo.data.email,
      };

      const accessToken = generateAccessToken(payload);

      const refreshToken = generateRefreshToken();

      await prisma.userInfo.update({
        where: {
          email: authInfo.data.email,
        },
        data: {
          refreshToken,
        },
      });

      return res.json({ accessToken, refreshToken });
    }

    if (socialType === "naver") {
      const { code, state } = req.query;

      const authToken = await Axios.post(
        "https://nid.naver.com/oauth2.0/token",
        {},
        {
          headers: {
            "Content-Type": "text/html;charset=utf-8",
          },
          params: {
            grant_type: "authorization_code",
            client_id: process.env.NAVER_CLIENT_ID,
            code,
            redirect_uri: "https://qa-moving-backend.onrender.com/oauth/naver",
            client_secret: process.env.NAVER_CLIENT_SECRET,
            state,
          },
        }
      );

      const authInfo = await Axios.get("https://openapi.naver.com/v1/nid/me", {
        headers: {
          "Content-Type": "text/json;charset=utf-8",
          Authorization: "Bearer " + authToken.data.access_token,
        },
      });

      const userInfo = await prisma.userInfo.findUnique({
        where: {
          email: authInfo.data.response.email,
        },
      });

      if (!userInfo) {
        const createUser = await prisma.userInfo.create({
          data: {
            name: authInfo.data.response.name,
            email: authInfo.data.response.email,
            profileImageUrl: authInfo.data.response.profile_image,
            userType: "CUSTOMER",
          },
        });

        await prisma.customer.create({
          data: {
            customerId: createUser.id,
          },
        });
      }

      const payload = {
        userType: "CUSTOMER",
        name: authInfo.data.response.name,
        email: authInfo.data.response.email,
      };

      const accessToken = generateAccessToken(payload);

      const refreshToken = generateRefreshToken();

      await prisma.userInfo.update({
        where: {
          email: authInfo.data.response.email,
        },
        data: {
          refreshToken,
        },
      });

      return res.json({ accessToken, refreshToken });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

export { oauth };
