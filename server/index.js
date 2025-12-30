import express from 'express';
import cors from 'cors';
import 'dotenv/config.js';
import { ScrapeHardware } from './hardware-scrap.js';
import mongoose from 'mongoose';  
import { User } from './models/user.js';

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));


app.get('/', (req, res) => {
res.send('Server is running!');
});

app.get('/login', async (req, res) => {
    const { id, pass } = req.query; 
    
    try {
        // Find user in DB
        const user = await User.findOne({ id: id });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check password (In real world, use bcrypt to compare hashes)
        if (user.password !== pass) {
            return res.status(401).json({ message: "Wrong password" });
        }

        res.status(200).json({ message: "Login successful", user: user });

    } catch (error) {
        res.status(500).json({ error: "Server error during login" });
    }
});

app.post('/register', async (req, res) => {
    // React sends JSON body
    const { id, name, email, phone, birthday, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ id });
        if (existingUser) {
            return res.status(400).json({ message: "User ID already taken" });
        }

        // Create new user
        const newUser = new User({ id, name, email, phone, birthday, password });
        await newUser.save(); // Save to MongoDB

        console.log("New User Registered:", id);
        res.status(201).json({ message: "User created successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error registering user" });
    }
});

app.get('/hardwarescrap', async (req, res) => {
  try {
    const scrap = await ScrapeHardware('https://tms.co.il/index.php?route=product/configurator');
    res.json(scrap);
  } catch (err) {
    console.error('Scraping endpoint error:', err); 
    res.status(500).json({ error: 'Failed to scrape TMS' });
  } 
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
