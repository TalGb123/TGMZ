import express from 'express';
import cors from 'cors';
import 'dotenv/config.js';
import { ScrapeHardware } from './hardware-scrap.js';

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT;

app.get('/', (req, res) => {
  res.send('Hello World!');
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
