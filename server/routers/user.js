import express from 'express';
import { User } from '../models/userModel.js';

const router = express.Router();

router.get('/login', async (req, res) => {
    const { id, pass } = req.query; 
    try {
        const user = await User.findOne({ id: id });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.password !== pass) {
            return res.status(401).json({ message: "Wrong password" });
        }
        res.status(200).json({ message: "Login successful", user: user });
    } 
    catch (error) {
        res.status(500).json({ error: "Server error during login" });
    }
});

router.post('/register', async (req, res) => {
    const { id, name, email, phone, birthday, password } = req.body;
    try {
        const existingUser = await User.findOne({ id });
        if (existingUser) {
            return res.status(400).json({ message: "User ID already taken" });
        }
        const newUser = new User({ id, name, email, phone, birthday, password });
        await newUser.save(); 
        console.log("New User Registered:", id);
        res.status(201).json({ message: "User created successfully" });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error registering user" });
    }
});

export default router;