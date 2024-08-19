import jwt from "jsonwebtoken";

const generateAccessToken = (user) => {
  const { userType, name, email, phoneNumber } = user;

  const token = jwt.sign(
    { userType, name, email, phoneNumber },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "1h",
    }
  );

  return token;
};

const verifyAccessToken = (accessToken) => {
  try {
    const verify = jwt.verify(accessToken, process.env.JWT_SECRET);

    return verify;
  } catch (error) {
    return false;
  }
};

const generateRefreshToken = () => {
  const newRefreshToken = jwt.sign({}, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d",
  });

  return newRefreshToken;
};

const verifyRefreshToken = (accessToken) => {
  return jwt.verify(accessToken, process.env.JWT_REFRESH_SECRET);
};

export {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};
