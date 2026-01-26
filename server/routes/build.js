import express from 'express';
import { Build } from '../models/buildModel.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const newBuild = new Build(req.body);
        const savedBuild = await newBuild.save();
    
        res.status(201).json({ 
            message: "Build Saved!", 
            id: savedBuild._id,
            build: savedBuild 
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to save build" });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const build = await Build.findById(req.params.id);
        if (!build) {
            return res.status(404).json({ message: "Build not found" });
        }
        res.json(build);
    } catch (error) {
        res.status(500).json({ error: "Invalid ID format" });
    }
});

export default router;