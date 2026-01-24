import express from 'express';
import cors from 'cors';
import 'dotenv/config.js';
import connectToMongoDB from './config/db.js';
import authRoutes from './routes/auth.js';
import hardwareScrapRoutes from './routes/hardwareScrap.js';

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

connectToMongoDB();

app.use('/auth', authRoutes); 
app.use('/hardware-scrap', hardwareScrapRoutes);

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});