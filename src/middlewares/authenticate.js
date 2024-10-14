import jwt from 'jsonwebtoken'
export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    else {
        const token = req.header('Authorization')?.replace('Bearer ', '');
      
        if (!token) {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }

        try {
            const decoded = jwt.verify(token, "zrfabhi");
            req.user = decoded;
            return next();
        } catch (error) {
            return res.status(401).json({ success: false, message: "Unauthorized 1" });
        }
    }
}