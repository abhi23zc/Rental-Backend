import { Router } from "express";
import { User } from "../schema/user.Schema.js";
import { login, signup } from "../middlewares/auth.middleware.js";
import { isAuthenticated } from "../middlewares/authenticate.js";


const router = Router();

router.post('/login', login)

router.post('/signup', signup)

router.get('/profile', isAuthenticated, (req, res) => {
    try {
        return res.status(200).json({ success: true, user: req.user });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error Occured" });
    }
})

export const authRouter = router