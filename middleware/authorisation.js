import jwt from 'jsonwebtoken';

export const authorisation = (req, res, next) => {
  if (!("authorization" in req.headers) || !req.headers.authorization.match(/^Bearer /)) {
    res.status(401).json({ error: true, message: "Authorization header ('Bearer token') not found" });
    return;
  }
  const token = req.headers.authorization.replace(/^Bearer /, "");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.params.tokenEmail = decoded.email;
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      res.status(401).json({ error: true, message: "JWT token has expired" });
    } else {
      res.status(401).json({ error: true, message: "Invalid JWT token" });
    }
    return;
  }

  next();
};

export const optionalAuthorisation = (req, res, next) => {
  if (!("authorization" in req.headers) || !req.headers.authorization.match(/^Bearer /)) {
    req.tokenEmail = null;
  } else {
    const token = req.headers.authorization.replace(/^Bearer /, "");
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.params.tokenEmail = decoded.email;
    } catch (e) {
      req.tokenEmail = null;
    }
  }

  next();
}
