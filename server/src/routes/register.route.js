import { Router } from "express";
import { hashPassword } from '../modules/bcrypt.js';
import Amount from '../dao/Amount.dao.js';
const amount = new Amount();
import User from '../dao/User.dao.js';
import { generateAccessToken } from "../modules/JWT.js";
const user = new User();
const router = Router();

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if(!username || !email || !password) {
            return res.status(401).json({success: false, message: 'Some fields are missing'})
        }
        const findUser = await user.getUserByEmail(email);
        console.log(findUser)
        if (findUser) {
            res.status(409).json({success: false, message: "User already exist"});
            return;
        } 
        const hashedPassword = await hashPassword(password, 10);
        const userData = {
            username,
            email,
            password: hashedPassword
        }
        const newUser = await user.save(userData);
        await amount.save({amountArray: [], userId: newUser._id});
        const tokenData = {id: newUser._id, email, username};
        const accessToken = generateAccessToken(tokenData);
        res.status(200).json({success: true, message: 'User registered', username, accessToken });        
    } catch (err) {
        console.error(err)
    }
});
export default router;