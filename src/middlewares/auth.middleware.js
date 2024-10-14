import userSchema from "../routes/zodSchema/userSchema.js";
import { User } from "../schema/user.Schema.js";

export const signup = async (req, res) => {
    try {
        const validationResult = userSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({ errors: validationResult.error.errors });
        }
        const { email, password, username, phone } = req.body;
        if (!email || !password || !username || !phone) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res
                .status(400)
                .json({ success: false, message: "Username or Email already exists" });
        }

        let newUser = new User({
            email,
            password,
            username,
            phone,
        });
        await newUser.save();
        const token = newUser.generateJwtToken();
        return res.status(200).json({
            success: true,
            message: "User created successfully",
            token: token,
        });
    } catch (e) {
        return res
            .status(500)
            .json({ success: false, message: "Server Error Occured" });
    }
};

export const login = async (req, res) => {
    try {

        const { username, email, password } = req.body;

        if (!password || (!username && !email)) {
            return res
                .status(400)
                .json({ success: false, message: "All fields are required" });
        }

        const user = await User.findOne({ $or: [{ username }, { email }] });
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "User not found" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch)
            return res
                .status(400)
                .json({ success: false, message: "Wrong password" });

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token: user.generateJwtToken(),
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: e });
    }
};
