export const buildFilter = (answers, dbColors) => {
    const { usage = [], budget, needsWifi, preferences = [], gameTypes = [], resolution, quality, contentTypes = [], aiTasks = [], generalTask, storage, sizePreference } = answers;

    // 1. Base Requirements Object
    const requirements = {
        budget: Number(budget) || 0,
        requireGPU: true,
        requireAPU: false,
        needsWifi: needsWifi === true,
        allowedColors: [],
        maxNoiseLevel: null,
        wantsRGB: preferences.includes("RGB Needed"),
        usage,
        gameTypes,
        resolution,
        quality,
        contentTypes,
        aiTasks,
        generalTask,
        storagePreference: storage,
        sizePreference,
        minGpuVRAM: 0,
        minCpuCores: 0
    };

    // 2. USAGE LOGIC
    if (usage.length === 1 && usage.includes("General Use")) {
        requirements.requireGPU = false;
        requirements.requireAPU = true;
        requirements.minCpuCores = 4;
    } 
    else {
        if (usage.includes("Gaming")) {
            requirements.minGpuVRAM = Math.max(requirements.minGpuVRAM, 8); // At least 8GB for modern gaming
            requirements.minCpuCores = Math.max(requirements.minCpuCores, 6);
            if (resolution === '4K') requirements.minGpuVRAM = Math.max(requirements.minGpuVRAM, 16);
            if (resolution === '1440p') requirements.minGpuVRAM = Math.max(requirements.minGpuVRAM, 12);
        }
        if (usage.includes("Content Creation")) {
            requirements.minCpuCores = Math.max(requirements.minCpuCores, 8); // Needs multi-threading
        }
        if (usage.includes("Training AI Models")) {
            requirements.minGpuVRAM = Math.max(requirements.minGpuVRAM, 12); // AI is incredibly VRAM hungry
            requirements.minCpuCores = Math.max(requirements.minCpuCores, 8);
            if (aiTasks.includes("Large Language Models (LLMs)")) requirements.minGpuVRAM = Math.max(requirements.minGpuVRAM, 16);
        }
    }

    // 3. COLOR LOGIC (Expanded for real-world databases)
    const wantsWhite = preferences.includes("White PC Build");
    const wantsBlack = preferences.includes("Black PC Build");

    if ((wantsWhite || wantsBlack) && !(wantsWhite && wantsBlack) && dbColors.length > 0) {
        requirements.allowedColors = dbColors.filter(color => {
            if (!color) return false;
            const lower = color.toLowerCase();
            
            if (wantsWhite) {
                return lower.includes("white") || lower.includes("silver") || lower.includes("snow") || lower.includes("clear");
            }
            if (wantsBlack) {
                return lower.includes("black") || lower.includes("gray") || lower.includes("grey") || lower.includes("carbon") || lower.includes("gunmetal");
            }
            return false;
        });
    }

    // 4. ACOUSTIC LOGIC
    if (preferences.includes("Quiet PC")) {
        requirements.maxNoiseLevel = 28.5; 
    }

    return requirements;
};