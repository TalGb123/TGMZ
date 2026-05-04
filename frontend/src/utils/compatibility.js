// --- ADVANCED CPU & GPU LOGIC ---
const checkCpuGpuRelationship = (targetCpu, targetGpu, errors, warnings) => {
    if (!targetCpu || !targetGpu) {
        // VIDEO OUTPUT CHECK: If CPU has no integrated graphics and no GPU is selected
        if (targetCpu && !targetCpu.has_apu && !targetGpu) {
            warnings.push("Display Warning: This CPU has no integrated graphics. You will need a dedicated GPU to see anything on screen.");
        }
        return;
    }

    // 1. PERFORMANCE TIERING (BOTTLENECK)
    // CPU Score: core_count * boost_clock
    const cpuScore = targetCpu.core_count * targetCpu.boost_clock;
    // GPU Score: vram * (boost_clock / 1000)
    const gpuScore = targetGpu.memory * (targetGpu.boost_clock / 1000);
    
    const ratio = cpuScore / gpuScore;

    if (ratio < 0.45) {
        errors.push("Severe Performance Mismatch: This CPU is too weak for the selected GPU and will cause significant stuttering in games.");
    } else if (ratio < 0.7) {
        warnings.push("Minor Bottleneck: The CPU may limit the full potential of this GPU in CPU-intensive tasks.");
    } else if (ratio > 4.0) {
        warnings.push("Efficiency Warning: This high-end CPU is significantly faster than the selected GPU; the GPU will be the system's primary limit.");
    }

    // 2. POWER DENSITY & THERMAL BALANCE
    // If both are high-heat parts (TDP > 250 combined), warn about case airflow
    if (targetCpu.tdp + targetGpu.tdp > 450) {
        warnings.push("High Thermal Load: Both your CPU and GPU generate significant heat. Ensure your Case has excellent airflow and fans.");
    }
};

export const checkCompatibility = (part, selections) => {
    const cpu = selections[1];
    const cooler = selections[2];
    const mobo = selections[3];
    const ram = selections[4];
    const psu = selections[6];
    const gpu = selections[7];
    const pcCase = selections[8];

    const errors = [];
    const warnings = [];

    // --- MOTHERBOARD RULES ---
    if (part.category === "Motherboard") {
        if (cpu && part.socket !== cpu.socket) {
            errors.push(`Socket mismatch: CPU needs ${cpu.socket} but board has ${part.socket}.`);
        }
        if (pcCase && !pcCase.supported_mobo_form_factors.includes(part.form_factor)) {
            errors.push(`Case does not support ${part.form_factor} boards.`);
        }
        if (ram) {
            if (part.memory_gen !== ram.speed[0]) {
                errors.push(`Memory Gen mismatch: Board uses ${part.memory_gen} but RAM is ${ram.speed[0]}.`);
            }
            if (part.memory_slots < ram.modules[0]) {
                errors.push(`Not enough slots: Board has ${part.memory_slots} but kit has ${ram.modules[0]} sticks.`);
            }
        }
    }

    // --- CPU RULES ---
    if (part.category === "CPU") {
        if (mobo && part.socket !== mobo.socket) {
            errors.push(`Socket mismatch: Board needs ${mobo.socket}.`);
        }
        if (ram && !part.supported_memory.includes(ram.speed[0])) {
            errors.push(`CPU does not support ${ram.speed[0]} memory.`);
        }
        // Relationship check
        checkCpuGpuRelationship(part, gpu, errors, warnings);
    }

    // --- GPU RULES ---
    if (part.category === "VideoCard") {
        if (pcCase && part.length > pcCase.max_gpu_length) {
            errors.push(`GPU too long: ${part.length}mm (Case max: ${pcCase.max_gpu_length}mm).`);
        }
        if (psu && psu.wattage < part.recommended_psu_wattage) {
            warnings.push(`PSU Warning: GPU recommends ${part.recommended_psu_wattage}W (Current: ${psu.wattage}W).`);
        }
        // Relationship check
        checkCpuGpuRelationship(cpu, part, errors, warnings);
    }

    // --- COOLER RULES ---
    if (part.category === "CPUCooler") {
        if (cpu && !part.supported_sockets.includes(cpu.socket)) {
            errors.push(`Cooler does not support ${cpu.socket} socket.`);
        }
        if (cpu && part.max_tdp_cooling < cpu.tdp) {
            warnings.push(`Thermal Warning: Cooler (${part.max_tdp_cooling}W) is below CPU TDP (${cpu.tdp}W).`);
        }
        if (pcCase && part.height > pcCase.max_cpu_cooler_height) {
            errors.push(`Cooler too tall: ${part.height}mm (Case max: ${pcCase.max_cpu_cooler_height}mm).`);
        }
        if (part.type === "Liquid" && pcCase && !pcCase.supported_radiators.includes(part.radiator_size)) {
            errors.push(`Case does not support ${part.radiator_size}mm radiators.`);
        }
    }

    // --- PSU RULES ---
    if (part.category === "PowerSupply") {
        if (pcCase && part.type !== pcCase.psu_form_factor) {
            errors.push(`PSU type (${part.type}) mismatch for case (${pcCase.psu_form_factor}).`);
        }
        if (cpu && gpu) {
            const estimatedDraw = cpu.tdp + gpu.tdp + 100;
            if (part.wattage < estimatedDraw) {
                errors.push(`Insufficient Power: System needs ~${estimatedDraw}W (PSU is ${part.wattage}W).`);
            }
        }
    }

    // --- FINAL COMPILATION ---
    if (errors.length > 0) {
        const allIssues = [...errors, ...warnings].map(r => `• ${r}`).join('\n');
        return { isCompatible: false, isWarning: false, reason: allIssues };
    }
    if (warnings.length > 0) {
        const warningReasons = warnings.map(r => `• ${r}`).join('\n');
        return { isCompatible: true, isWarning: true, reason: warningReasons };
    }
    return { isCompatible: true, isWarning: false, reason: null };
};