import express from 'express';
import { Product } from '../models/productModel.js'; 

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } 
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/category/:type', async (req, res) => {
    try {
        const category = req.params.type;
        const q = req.query;
        const filter = { category };

        if (q.name) {
            filter.name = { $regex: q.name, $options: 'i' };
        }

        if (q.minPrice || q.maxPrice) {
            filter.price = {};
            if (q.minPrice) filter.price.$gte = Number(q.minPrice);
            if (q.maxPrice) filter.price.$lte = Number(q.maxPrice);
        }

        const excludeParams = ['name', 'minPrice', 'maxPrice', 'sortBy'];
        Object.keys(q).forEach(key => {
            if (!excludeParams.includes(key) && q[key] !== '') {
                if (key.endsWith('Min')) {
                    const field = key.replace('Min', '');
                    filter[field] = filter[field] || {};
                    filter[field].$gte = Number(q[key]);
                } 
                else if (key.endsWith('Max')) {
                    const field = key.replace('Max', '');
                    filter[field] = filter[field] || {};
                    filter[field].$lte = Number(q[key]);
                } 
                else {
                    const numValue = Number(q[key]);
                    filter[key] = isNaN(numValue) ? q[key] : numValue;
                }
            }
        });

        let sortObj = {};
        if (q.sortBy === 'price-asc') sortObj = { price: 1, name: 1 };
        else if (q.sortBy === 'price-desc') sortObj = { price: -1, name: -1 };
        else if (q.sortBy === 'name-asc') sortObj = { name: 1 };
        else if (q.sortBy === 'name-desc') sortObj = { name: -1 };

        const products = await Product.find(filter)
                                      .sort(sortObj)
                                      .lean(); 
        res.json(products);
    } 
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;