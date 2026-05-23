import express from 'express';
import { Product, CPU, Motherboard, Storage, CPUCooler, Memory, Case } from '../models/productModel.js';
import { PerformanceProfile } from '../models/performanceModel.js';

const router = express.Router();

router.get('/form-options', async (req, res) => {
    try {
        const [
            brands, sockets, gpuChipsets, cpuChipsets, moboFormFactors,
            memoryGens, storageFormFactors, driveTypes,
            radiatorSizes, caseRadiators
        ] = await Promise.all([
            Product.distinct('brand'),
            Product.distinct('socket'),
            PerformanceProfile.distinct('id_name', { category: 'GPU' }),
            PerformanceProfile.distinct('id_name', { category: 'CPU' }),
            Motherboard.distinct('form_factor'),
            Product.distinct('memory_gen'), 
            Storage.distinct('form_factor'),
            Storage.distinct('drive_type'),
            CPUCooler.distinct('radiator_size'),
            Case.distinct('supported_radiators')
        ]);

        res.json({
            brands: brands.filter(Boolean).sort(),
            sockets: sockets.filter(Boolean).sort(),
            gpuChipsets: gpuChipsets.filter(Boolean).sort(),
            cpuChipsets: cpuChipsets.filter(Boolean).sort(),
            moboFormFactors: moboFormFactors.filter(Boolean).sort(),
            memoryGens: memoryGens.filter(Boolean).sort(),
            storageFormFactors: storageFormFactors.filter(Boolean).sort(),
            driveTypes: driveTypes.filter(Boolean).sort(),
            radiatorSizes: radiatorSizes.filter(Boolean).sort((a,b) => a-b),
            caseRadiators: caseRadiators.filter(Boolean).sort((a,b) => a-b)
        });
    } catch (error) {
        console.error("Error generating form options:", error);
        res.status(500).json({ error: "Failed to fetch form options" });
    }
});

export default router;