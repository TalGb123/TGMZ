import express from 'express';
import { Product, CPU, CPUCooler, Motherboard, Memory, 
  Storage, VideoCard, Case, PowerSupply } from '../models/productModel.js';

const router = express.Router();

router.get('/hardwarescrap', async (req, res) => {
  try {
    const scrap = await ScrapeHardware('https://tms.co.il/index.php?route=product/configurator');
    res.json(scrap);
  } catch (err) {
    console.error('Scraping endpoint error:', err); 
    res.status(500).json({ error: 'Failed to scrape TMS' });
  } 
});

// this is not used at the moment.