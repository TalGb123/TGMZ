import express from 'express';
import cors from 'cors';
import 'dotenv/config.js';
import connectToMongoDB from './config/db.js';

import userRoutes from './routes/user.js';
import productRoutes from './routes/products.js';
import buildRoutes from './routes/build.js';
import optionsRouter from './routes/options.js';

//import hardwareScrapRoutes from './routes/hardwareScrap.js';

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

connectToMongoDB();

app.use('/users', userRoutes); 
app.use('/products', productRoutes);
app.use('/builds', buildRoutes);
app.use('/options', optionsRouter);

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});