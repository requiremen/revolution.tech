import jwt from "jsonwebtoken";

function authmiddleware(req, res, next) {
    // Expect token in Authorization header as "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(403).json({
            msg: "no token provided"
        });
    }
    const token = authHeader.split(' ')[1]; // remove "Bearer " prefix
    try {
        const decoded = jwt.verify(token, "secretkey");
        req.username = decoded.username;
        next();
    } catch (err) {
        return res.status(403).json({
            msg: "invalid token"
        });
    }
}

export default authmiddleware;
