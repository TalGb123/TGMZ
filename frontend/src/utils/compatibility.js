export const compatibilityRules = {
    cpuToSocket: {
        "Zen 5": "AM5", "Zen 4": "AM5", "Zen 3": "AM4", "Zen 2": "AM4", "Zen": "AM4",
        "Raptor Lake": "LGA1700", "Alder Lake": "LGA1700", "Arrow Lake": "LGA1851",
        "Coffee Lake": "LGA1151", "Coffee Lake Refresh": "LGA1151", "Haswell": "LGA1150",
        "Ivy Bridge": "LGA1155", "Sandy Bridge": "LGA1155", "Bulldozer": "AM3+",
        "Piledriver": "AM3+", "Nehalem": "LGA1366", "Westmere": "LGA1366",
        "K10": "AM3", "Wolfdale": "LGA775", "Yorkfield": "LGA775",
        "Puma+": "FM2+", "Jaguar": "AM1"
    },
    caseToMobo: {
        "ATX Full Tower": ["ATX", "Micro ATX", "Mini ITX", "EATX", "XL ATX"],
        "ATX Mid Tower": ["ATX", "Micro ATX", "Mini ITX", "EATX"],
        "ATX Desktop": ["ATX", "Micro ATX", "Mini ITX"],
        "ATX Test Bench": ["ATX", "Micro ATX", "Mini ITX", "EATX"],
        "MicroATX Mid Tower": ["Micro ATX", "Mini ITX"],
        "MicroATX Mini Tower": ["Micro ATX", "Mini ITX"],
        "MicroATX Desktop": ["Micro ATX", "Mini ITX"],
        "MicroATX Slim": ["Micro ATX", "Mini ITX"],
        "Mini ITX Tower": ["Mini ITX", "Thin Mini ITX", "Mini DTX"],
        "Mini ITX Desktop": ["Mini ITX", "Thin Mini ITX", "Mini DTX"],
        "Mini ITX Test Bench": ["Mini ITX", "Thin Mini ITX", "Mini DTX"],
        "HTPC": ["Micro ATX", "Mini ITX", "Thin Mini ITX"]
    },
    caseToPsu: {
        "ATX Full Tower": ["ATX"],
        "ATX Mid Tower": ["ATX"],
        "ATX Desktop": ["ATX"],
        "ATX Test Bench": ["ATX"],
        "MicroATX Mid Tower": ["ATX"],
        "MicroATX Mini Tower": ["ATX"],
        "MicroATX Desktop": ["ATX", "SFX"], // Some smaller desktops need SFX
        "MicroATX Slim": ["SFX", "TFX", "Flex ATX"],
        "Mini ITX Tower": ["SFX", "Mini ITX", "ATX"], // Some ITX towers fit full ATX
        "Mini ITX Desktop": ["SFX", "Mini ITX", "Flex ATX"],
        "Mini ITX Test Bench": ["ATX", "SFX", "Mini ITX"],
        "HTPC": ["SFX", "TFX", "Flex ATX"]
    }
};

export const checkCompatibility = (part, selections) => {
    // Helper to get currently selected parts
    // (Assuming ID 1 is CPU, 3 is Motherboard, 8 is Case)
    const cpu = selections[1];
    const mobo = selections[3];
    const ram = selections[4];
    const psu = selections[6];
    const gpu = selections[7];
    const pcCase = selections[8];

    const errors = [];   // For RED physical incompatibilities
    const warnings = []; // For YELLOW bottleneck/performance issues

    // --- MOTHERBOARD RULES ---
    if (part.category === "Motherboard") {
        if (cpu) {
            const requiredSocket = compatibilityRules.cpuToSocket[cpu.microarchitecture];
            if (requiredSocket && part.socket !== requiredSocket) {
                errors.push(`Requires ${requiredSocket} socket for selected CPU.`);
            }
        }
        if (pcCase) {
            const supportedSizes = compatibilityRules.caseToMobo[pcCase.type] || [];
            if (supportedSizes.length > 0 && !supportedSizes.includes(part.form_factor)) {
                errors.push(`Form factor ${part.form_factor} will not fit in selected case.`);
            }
        }
        if (ram && Array.isArray(ram.modules) && ram.modules.length === 2) {
            const numSticks = ram.modules[0];
            const totalCapacity = numSticks * ram.modules[1];
            if (part.memory_slots < numSticks) {
                errors.push(`Not enough RAM slots for your selected ${numSticks}-stick kit.`);
            }
            if (part.max_memory < totalCapacity) {
                errors.push(`Motherboard max memory (${part.max_memory}GB) is too low for your ${totalCapacity}GB RAM kit.`);
            }
        }
    }

    // --- CPU RULES ---
    if (part.category === "CPU" && mobo) {
        const requiredSocket = compatibilityRules.cpuToSocket[part.microarchitecture];
        if (requiredSocket && requiredSocket !== mobo.socket) {
            errors.push(`Incompatible with selected motherboard (needs ${requiredSocket}).`);
        }
    }

    if (part.category === "CPU" && gpu) {
        // Calculate scores
        const gpuClockGHz = gpu.core_clock > 100 ? gpu.core_clock / 1000 : gpu.core_clock;
        const gpuScore = gpu.memory * gpuClockGHz;
        const cpuScore = part.core_count * part.boost_clock;

        const ratio = cpuScore / gpuScore;

        if (ratio > 3.0) {
            // CPU score is massively higher than a very weak GPU
            warnings.push(`Severe Bottleneck: This high-end CPU is overkill for the selected weak GPU.`);
        }
    }

    //--- GPU RULES ---
    if (part.category === "VideoCard" && cpu) {
        // Calculate scores
        const cpuScore = cpu.core_count * cpu.boost_clock;
        const gpuClockGHz = part.core_clock > 100 ? part.core_clock / 1000 : part.core_clock; // Convert MHz to GHz if needed
        const gpuScore = part.memory * gpuClockGHz;

        // Check the ratio between them
        const ratio = cpuScore / gpuScore;

        if (ratio < 0.4) {
            // CPU score is way lower than GPU score
            warnings.push(`Severe Bottleneck: The selected CPU is too weak for this high-end GPU.`);
        }
    }

    // --- MEMORY RULES ---
    if (part.category === "Memory" && mobo) {
        if (Array.isArray(part.modules) && part.modules.length === 2) {
            const numSticks = part.modules[0];
            const totalCapacity = numSticks * part.modules[1];
            if (numSticks > mobo.memory_slots) {
                errors.push(`Motherboard only has ${mobo.memory_slots} RAM slots (kit has ${numSticks}).`);
            }
            if (totalCapacity > mobo.max_memory) {
                errors.push(`Exceeds motherboard max memory limit of ${mobo.max_memory}GB.`);
            }
        }
    }

    // --- CASE RULES ---
    if (part.category === "Case") {
        if (mobo) {
            const supportedSizes = compatibilityRules.caseToMobo[part.type] || [];
            if (supportedSizes.length > 0 && !supportedSizes.includes(mobo.form_factor)) {
                errors.push(`Cannot fit selected ${mobo.form_factor} motherboard.`);
            }
        }
        if (psu) {
            const supportedPsus = compatibilityRules.caseToPsu[part.type] || [];
            if (supportedPsus.length > 0 && !supportedPsus.includes(psu.type)) {
                errors.push(`This case cannot fit your selected ${psu.type} power supply.`);
            }
        }
    }

    // --- POWER SUPPLY RULES ---
    if (part.category === "PowerSupply" && pcCase) {
        const supportedPsus = compatibilityRules.caseToPsu[pcCase.type] || [];
        if (supportedPsus.length > 0 && !supportedPsus.includes(part.type)) {
            errors.push(`A ${part.type} power supply will not fit in the selected ${pcCase.type} case.`);
        }
    }

    // --- FINAL EVALUATION ---
    // 1. If there are ANY red errors, it fails completely (Red wins).
    if (errors.length > 0) {
        // We combine errors AND warnings so the user sees everything if they hover
        const allIssues = [...errors, ...warnings].map(r => `• ${r}`).join('\n');
        return { isCompatible: false, isWarning: false, reason: allIssues };
    }

    // 2. If there are NO red errors, but there ARE yellow warnings
    if (warnings.length > 0) {
        const warningReasons = warnings.map(r => `• ${r}`).join('\n');
        return { isCompatible: true, isWarning: true, reason: warningReasons };
    }

    // 3. Perfect match
    return { isCompatible: true, isWarning: false, reason: null };
};