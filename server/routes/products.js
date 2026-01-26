import express from 'express';
import { Product } from '../models/productModel.js'; 

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/category/:type', async (req, res) => {
    try {
        const category = req.params.type;
        // Since you used discriminators, 'category' or 'kind' usually holds the type
        // Or we can query by the discriminator key if set up, 
        // but simplest is filtering by the 'category' field if your seed data has it.
        // Assuming your Discriminator key is 'category':
        const products = await Product.find({ category: category });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;