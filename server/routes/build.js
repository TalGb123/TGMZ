import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { Build } from '../models/buildModel.js';
import { CPU, VideoCard, Motherboard, Memory, Storage, Case, PowerSupply, CPUCooler } from '../models/productModel.js';
import { PerformanceProfile } from '../models/performanceModel.js';

const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function getGpuBudgetLimits(totalBudget, usage = []) {
    let minPct = 0.30;
    let maxPct = 0.50;

    if (totalBudget < 4000) {
        minPct = 0.25;
        maxPct = 0.40;
    } else if (totalBudget >= 4000 && totalBudget <= 8500) {
        minPct = 0.35;
        maxPct = 0.50;
    } else {
        minPct = 0.40;
        maxPct = 0.60;
    }

    if (usage.includes("Training AI Models") || usage.includes("Gaming")) {
        minPct += 0.05;
        maxPct = Math.min(maxPct + 0.05, 0.65);
    } else if (usage.includes("Content Creation") && !usage.includes("Gaming")) {
        minPct -= 0.05;
        maxPct -= 0.05;
    }

    return {
        minPrice: Math.round(totalBudget * minPct),
        maxPrice: Math.round(totalBudget * maxPct)
    };
}

router.post('/', async (req, res) => {
    try {
        const newBuild = new Build(req.body);
        const savedBuild = await newBuild.save();
    
        res.status(201).json({ 
            message: "Build Saved!", 
            id: savedBuild.buildID,
            build: savedBuild 
        });
    } 
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save build" });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const build = await Build.findOne({ buildID: Number(req.params.id) });
        if (!build) {
            return res.status(404).json({ message: "Build not found" });
        }
        res.json(build);
    } 
    catch (error) {
        res.status(500).json({ error: "Invalid ID format" });
    }
});

router.post('/generate', async (req, res) => {
    try {
        const { budget, requireGPU, requireAPU, needsWifi, allowedColors, maxNoiseLevel, minGpuVRAM, minCpuCores, usage = [] } = req.body;
        const totalBudget = Number(budget) || 999999;

        const colorQuery = allowedColors && allowedColors.length > 0 ? { color: { $in: allowedColors } } : {};
        const basePriceQuery = { price: { $lte: totalBudget } };

        // 1. SMART GPU CEILING LOGIC
        let gpus = [];
        if (requireGPU) {
            const { maxPrice: gpuMaxPrice } = getGpuBudgetLimits(totalBudget, usage);
            
            // Attempt 1: Target VRAM
            gpus = await VideoCard.find({
                price: { $lte: gpuMaxPrice },
                ...(minGpuVRAM > 0 && { memory: { $gte: minGpuVRAM } }),
                ...colorQuery
            }).lean();

            // Attempt 2: Fallback to 8GB
            if (gpus.length === 0 && minGpuVRAM > 8) {
                gpus = await VideoCard.find({
                    price: { $lte: gpuMaxPrice },
                    memory: { $gte: 8 },
                    ...colorQuery
                }).lean();
            }

            // Attempt 3: Any GPU under ceiling
            if (gpus.length === 0) {
                gpus = await VideoCard.find({
                    price: { $lte: gpuMaxPrice },
                    ...colorQuery
                }).lean();
            }
        }

        // 2. QUERY REMAINING COMPONENTS
        const [cpus, motherboards, cases, coolers, ram, storage, psus, performanceTiers] = await Promise.all([
            CPU.find({ 
                ...basePriceQuery, 
                ...(requireAPU && { has_apu: true }),
                ...(minCpuCores > 0 && { core_count: { $gte: minCpuCores } })
            }).lean(),
            Motherboard.find({ ...basePriceQuery, ...(needsWifi && { has_wifi_bluetooth: true }), ...colorQuery }).lean(),
            Case.find({ ...basePriceQuery, ...colorQuery }).lean(),
            CPUCooler.find({ ...basePriceQuery, ...(maxNoiseLevel && { noise_level: { $lte: maxNoiseLevel } }), ...colorQuery }).lean(),
            Memory.find({ ...basePriceQuery, ...colorQuery }).lean(),
            Storage.find({ ...basePriceQuery }).lean(),
            PowerSupply.find({ ...basePriceQuery, ...colorQuery }).lean(),
            PerformanceProfile.find({}).lean() 
        ]);

        const componentCatalog = { performanceTiers, cpus, gpus, motherboards, cases, coolers, ram, storage, psus };

        const buildResponseSchema = {
            type: Type.OBJECT,
            properties: {
                reasoning: { 
                    type: Type.STRING, 
                    description: "An explanation of why these components were selected based on performance and budget." 
                },
                selectedIds: {
                    type: Type.OBJECT,
                    properties: {
                        cpu: { type: Type.STRING },
                        cpu_cooler: { type: Type.STRING },
                        motherboard: { type: Type.STRING },
                        ram: { type: Type.STRING },
                        storage: { type: Type.STRING },
                        psu: { type: Type.STRING },
                        gpu: { type: Type.STRING, description: "The _id of the video card, or an empty string if requireGPU is false" },
                        case: { type: Type.STRING }
                    },
                    required: ["cpu", "cpu_cooler", "motherboard", "ram", "storage", "psu", "case"]
                }
            },
            required: ["reasoning", "selectedIds"]
        };

        const systemInstruction = `
            You are an expert PC hardware component selection agent. Select exactly ONE component from each category list in the input catalog.
            
            CRITICAL CONSTRAINTS:
            1. Return IDs only: For the 'selectedIds' object, you must provide ONLY the exact '_id' string of the chosen component document. Do not alter the ID string.
            2. Strict Pricing: The total combined price of all chosen parts MUST be less than or equal to ${totalBudget} ILS. There is an absolute zero-tolerance policy for overrunning the budget.
            3. Mechanical Compatibility Rules:
               - The CPU 'socket' must match the Motherboard 'socket' exactly.
               - The CPU Cooler 'supported_sockets' must contain the CPU's 'socket'.
               - The Motherboard 'memory_gen' must equal the RAM's speed array element index 0 value (e.g., DDR5).
               - If a liquid cooler is selected, its 'radiator_size' must be in the Case's 'supported_radiators'.
               - The Case 'max_gpu_length' must be >= the selected GPU 'length'.
               - The PSU 'wattage' must be greater than the combined TDP load of the CPU and GPU plus a 100W headroom buffer.
            4. Performance Logic: Use the 'performanceTiers' data to maximize capabilities for the user's workload intent.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: `Max Budget: ${totalBudget} ILS\n\nCatalog Array Data: ${JSON.stringify(componentCatalog)}` }] }
            ],
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: buildResponseSchema,
                temperature: 0.1
            }
        });

        const aiResult = JSON.parse(response.text);
        const chosenIds = aiResult.selectedIds;

        const allItems = [
            ...cpus, ...(gpus || []), ...motherboards, 
            ...cases, ...coolers, ...ram, ...storage, ...psus
        ];

        const findPart = (id) => allItems.find(item => item._id.toString() === id) || null;

        const finalBuildResponse = {
            reasoning: aiResult.reasoning,
            selectedParts: {
                cpu: findPart(chosenIds.cpu),
                cpu_cooler: findPart(chosenIds.cpu_cooler),
                motherboard: findPart(chosenIds.motherboard),
                ram: findPart(chosenIds.ram),
                storage: findPart(chosenIds.storage),
                psu: findPart(chosenIds.psu),
                gpu: chosenIds.gpu ? findPart(chosenIds.gpu) : null,
                case: findPart(chosenIds.case)
            }
        };

        res.json(finalBuildResponse);

    } 
    catch (error) {
        console.error("Gemini Generation Failure:", error);
        res.status(500).json({ error: "Failed to assemble hardware parts via Gemini" });
    }
});

export default router;