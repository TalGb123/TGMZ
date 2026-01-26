    import express from 'express';
    import { User } from '../models/userModel.js';

    const router = express.Router();

    router.post('/register', async (req, res) => {
        const { id, name, email, phone, birthday, password } = req.body;
        if(!id || !name || !email || !password) {
           return res.status(400).json({ message: "Missing required fields" });
        }
        try {
            const existingUser = await User.findOne({ id });
            if (existingUser) {
                return res.status(409).json({ message: "User ID already exists" });
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


    router.get('/login', async (req, res) => {
        const { id, pass } = req.query; 
        if(!id || !pass) {
        return res.status(400).json({ message: "Missing id or password" });
    }
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

    router.get('/:id', async (req, res) => {
        try {
            const user = await User.findOne({ id: req.params.id });
            if (!user) return res.status(404).json({ message: "User not found" });
            res.status(200).json(user);
        } 
        catch (error) {
            res.status(500).json({ error: "Server error during getting user" });
        }
    });

    router.patch('/:id', async (req, res) => {
        const updates = req.body;
        const { id } = req.params;

        if (updates.id) {
            return res.status(400).json({ message: "Cannot update ID" });
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        try {
            const updatedUser = await User.findOneAndUpdate({ id: id }, updates, { new: true });
            
            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(200).json({ message: "User updated", user: updatedUser });
        } 
        catch (error) {
            res.status(500).json({ error: "Server error during an update operation" });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            const deletedUser = await User.findOneAndDelete({ id: req.params.id });
            
            if (!deletedUser) {
                return res.status(404).json({ message: "User not found" });
            }

            // Requirement: Delete related data
            // If you had a 'Cart' or 'Orders' model, you would delete them here:
            // await Cart.deleteMany({ userId: req.params.id });

            res.status(200).json({ message: "User and related data deleted" });
        } 
        catch (error) {
            res.status(500).json({ error: "Server error during deletion" });
        }
    });

    router.get('/', async (req, res) => {
        try {
            const users = await User.find({});
            res.status(200).json(users);
        } 
        catch (error) {
            res.status(500).json({ error: "Server error during fetching users" });
        }
    });
    
    export default router;