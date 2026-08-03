import express from 'express';
import { Product } from '../models/productModel.js'; 

const router = express.Router();

// Get inventory lazy loaded
router.get('/inventory', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 20 } = req.query;
        let filter = {};
        
        if (category) {
            filter.category = category;
        }
        
        if (search) {
            // Search by name
            filter.name = { $regex: search, $options: 'i' };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const products = await Product.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const totalItems = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / limit);

        res.json({
            products,
            currentPage: parseInt(page),
            totalPages,
            totalItems
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new product
router.post('/', async (req, res) => {
    try {
        const newProduct = await Product.create(req.body);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

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

router.get('/single/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;