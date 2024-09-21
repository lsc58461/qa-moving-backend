function uploadImage(req, res) {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      return res.status(400).json({ message: "액세스 토큰이 없습니다." });
    }

    const decoded = verifyAccessToken(accessToken);

    if (!decoded) {
      return res.status(400).json({ message: "유효하지 않은 토큰입니다." });
    }

    const image = req.file;
    if (!image) {
      return res.status(400).json({ message: "이미지 파일이 필요합니다." });
    }

    const imageKey = image.key;
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/moving/${imageKey}`;

    res.json({ imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
}

export { uploadImage };
