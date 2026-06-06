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
        const { budget, requireGPU, requireAPU, needsWifi, allowedColors, maxNoiseLevel, minGpuVRAM, minCpuCores, usage = [], gameTypes = [], resolution, quality, contentTypes = [], aiTasks = [], generalTask, storagePreference, sizePreference } = req.body;
        const totalBudget = Number(budget) || 999999;

        // Base price query limits the maximum price of ANY single component to the total budget
        const basePriceQuery = { price: { $lte: totalBudget } };

        // 1. SMART GPU CEILING LOGIC (No Color Filtering!)
        let gpus = [];
        if (requireGPU) {
            const { maxPrice: gpuMaxPrice } = getGpuBudgetLimits(totalBudget, usage);
            
            // Attempt 1: Target VRAM within budget ceiling
            gpus = await VideoCard.find({
                price: { $lte: gpuMaxPrice },
                ...(minGpuVRAM > 0 && { memory: { $gte: minGpuVRAM } })
            }).lean();

            // Attempt 2: Fallback to 8GB if the high VRAM requirement choked the results
            if (gpus.length === 0 && minGpuVRAM > 8) {
                gpus = await VideoCard.find({
                    price: { $lte: gpuMaxPrice },
                    memory: { $gte: 8 }
                }).lean();
            }

            // Attempt 3: Extreme fallback - just get any GPU under the ceiling
            if (gpus.length === 0) {
                gpus = await VideoCard.find({
                    price: { $lte: gpuMaxPrice }
                }).lean();
            }
        }

        // 2. QUERY REMAINING COMPONENTS (No Color Filtering!)
        const [cpus, motherboards, cases, coolers, ram, storage, psus, performanceTiers] = await Promise.all([
            CPU.find({ 
                ...basePriceQuery, 
                ...(requireAPU && { has_apu: true }),
                ...(minCpuCores > 0 && { core_count: { $gte: minCpuCores } })
            }).lean(),
            Motherboard.find({ ...basePriceQuery, ...(needsWifi && { has_wifi_bluetooth: true }) }).lean(),
            Case.find({ ...basePriceQuery }).lean(), // We removed colorQuery
            CPUCooler.find({ ...basePriceQuery, ...(maxNoiseLevel && { noise_level: { $lte: maxNoiseLevel } }) }).lean(),
            Memory.find({ ...basePriceQuery }).lean(), // Removed colorQuery
            Storage.find({ ...basePriceQuery }).lean(),
            PowerSupply.find({ ...basePriceQuery }).lean(), // Removed colorQuery
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
                        power_supply: { type: Type.STRING },
                        gpu: { type: Type.STRING, description: "The _id of the video card, or an empty string if requireGPU is false" },
                        case: { type: Type.STRING }
                    },
                    required: ["cpu", "cpu_cooler", "motherboard", "ram", "storage", "power_supply", "case"]
                }
            },
            required: ["reasoning", "selectedIds"]
        };

        const systemInstruction = `
            You are an elite PC hardware architect. Your job is to select exactly ONE optimal component from each category in the provided catalog to create a balanced, fully compatible computer build.
            
            CRITICAL OUTPUT RULES:
                1. Return a JSON object with 'reasoning' and 'selectedIds'. 
                2. 'selectedIds' must contain ONLY the exact '_id' strings of the chosen documents. Never alter the IDs or return full objects.
            
            BUDGET & PRICING (AGGRESSIVE MAXIMIZATION):
                1. Baseline Budget: Start by attempting to fit the best parts under the target budget.
                2. Mandatory Upgrade Check (The "X3D" Rule): Before finalizing, you MUST calculate the remaining baseline budget PLUS the 500 ILS overrun buffer. If this combined amount allows you to upgrade the CPU to a significantly faster tier (e.g., jumping to an X3D processor) or upgrade the GPU tier, you MUST make that upgrade. Do not leave performance on the table just to stay under the baseline.
                3. Strict Overrun Limits: The 500 ILS buffer is exclusively for these massive core component leaps (GPU/CPU) or minor color matching (~150 ILS). 
                4. Ruthless Secondary Cost-Cutting: Sacrifice secondary component luxury (e.g., use cheaper standard cases, basic air coolers instead of AIOs, or Tier B PSUs instead of premium Tier A models) if those savings allow you to afford a higher-tier CPU or GPU.

            HARD MECHANICAL COMPATIBILITY (ZERO EXCEPTIONS):
                - Sockets: CPU 'socket', Motherboard 'socket', and CPU Cooler 'supported_sockets' MUST all match.
                - Memory: Motherboard 'memory_gen' MUST match the RAM's first speed array value (e.g., "DDR5"). RAM 'modules' count cannot exceed Motherboard 'memory_slots'.
                - Dimensions: GPU 'length' MUST be <= Case 'max_gpu_length'. Air Cooler 'height' MUST be <= Case 'max_cpu_cooler_height'.
                - Liquid Cooling: If Cooler 'radiator_size' > 0, that exact size MUST exist in the Case 'supported_radiators' array.
                - Storage: If selecting an M.2 NVMe SSD, Motherboard 'm2_slots' MUST be >= 1.
            
            POWER & THERMAL SAFETY (HEADROOM RULES):
                - Cooler Capacity: The CPU Cooler 'max_tdp_cooling' MUST be greater than or equal to the CPU 'tdp'.
                - PSU Wattage (Base load): PSU 'wattage' MUST be >= (CPU tdp + GPU tdp + 150W buffer).
                - PSU Headroom (Spike protection): If a GPU is selected, the PSU 'wattage' MUST be strictly greater than the GPU's 'recommended_psu_wattage' (e.g., if GPU recommends 750W, you MUST select an 850W PSU) to handle transient power spikes safely, unless budget constraints make it absolutely impossible.
            
            QUALITY & BOTTLENECK BALANCING (THE "PRO" RULES):
                - PSU Tiers: Match the PSU 'performance_tier' to the build. High-end builds (RTX 4080+, i9/R9) require Tier A or B. Mid-range builds require Tier B or C. NEVER select Tier E or F under any circumstances. Prefer high-value Tier B/A models over luxury overpriced options to protect the budget.
                - VRM Tiers: High-power CPUs (i7/i9, Ryzen 9, or TDP > 105W) require a Motherboard with 'vrm_tier' 3, 4, or 5. 
                - Motherboard Upgradability: If within the baseline budget, prioritize a motherboard with a better VRM tier to allow future drop-in CPU upgrades. Explicitly mention this strategy in your reasoning.
                - GPU vs CPU Balance: Do not severely bottleneck the system.
            
            WORKLOAD OPTIMIZATION:
                - AI Training: Strongly prioritize NVIDIA GPUs with the highest possible VRAM (12GB+ is critical). 
                - Content Creation: Prioritize CPUs with high core counts and ensure at least 32GB of RAM if the budget allows.
                - Gaming: Allocate the largest portion of the budget to the GPU. Match the GPU capability to the requested resolution.
                - Storage: Match the selected Storage 'capacity' (e.g., 1000 for 1TB) to the user's requested preference.
            
            AESTHETICS & THE "COLOR TAX":
                - If allowed colors are specified, attempt to match the components to create a cohesive theme.
                - You are authorized to spend a small premium (up to ~150 ILS) within the baseline budget to match a color theme, but never let color preferences push a build into the overrun budget.
            
            UNFULFILLED CRITICAL REQUIREMENTS:
                - If a critical user request (e.g., NVIDIA for AI) cannot be met within the budget constraints, select the absolute best alternative from the available inventory and explicitly flag this compromise at the very beginning of your 'reasoning' string.
        `;

        const userPrompt = `
            Max Budget: ${totalBudget} ILS

            === USER INTENT & WORKLOAD ===
                Primary Usage: ${usage.length > 0 ? usage.join(", ") : "General Everyday Use"}
                ${gameTypes.length > 0 ? `- Game Types: ${gameTypes.join(", ")}` : ""}
                ${resolution ? `- Target Monitor Resolution: ${resolution} (Ensure GPU is capable of this)` : ""}
                ${quality ? `- Preferred Graphical Quality: ${quality}` : ""}
                ${contentTypes.length > 0 ? `- Content Creation Tasks: ${contentTypes.join(", ")}` : ""}
                ${aiTasks.length > 0 ? `- AI Workloads: ${aiTasks.join(", ")} (CRITICAL: Prioritize High VRAM & NVIDIA)` : ""}
                ${generalTask ? `- Daily Workflow Intensity: ${generalTask}` : ""}
                ${storagePreference ? `- Storage Need: ${storagePreference} (Match this to the storage drive capacity)` : ""}
                ${sizePreference && sizePreference !== "No Preference" ? `- Case Size Preference: ${sizePreference} (Ensure Case type and Motherboard form factor scale to this size appropriately)` : ""}
                ${allowedColors && allowedColors.length > 0 ? `- Color Theme Preference: ${allowedColors.join(" or ")}` : "- Color Theme: No strict preference"}

            === HARDWARE CATALOG ===
                Below is the pre-filtered inventory available for this build. You MUST ONLY use items from this exact JSON list.

            ${JSON.stringify(componentCatalog)}`
        ;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: userPrompt }] }
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
                power_supply: findPart(chosenIds.power_supply),
                gpu: chosenIds.gpu ? findPart(chosenIds.gpu) : null,
                case: findPart(chosenIds.case)
            }
        };

        console.log(`\n=== CATALOG SENT TO GEMINI (BUDGET: ${totalBudget}) ===`);
        console.log("-> GPUs Available:");
        gpus.forEach(g => console.log(`   [₪${g.price}] ${g.name} | VRAM: ${g.memory}GB | Color: ${g.color || 'N/A'}`));
        
        console.log("-> CPUs Available:");
        cpus.forEach(c => console.log(`   [₪${c.price}] ${c.name} | Cores: ${c.core_count}`));
        
        console.log("-> Motherboards Available:");
        motherboards.forEach(m => console.log(`   [₪${m.price}] ${m.name} | VRM: ${m.vrm_tier} | Color: ${m.color || 'N/A'}`));
        console.log("=========================================================\n");

        res.json(finalBuildResponse);

    } 
    catch (error) {
        console.error("Gemini Generation Failure:", error);
        res.status(500).json({ error: "Failed to assemble hardware parts via Gemini" });
    }
});

export default router;