// --- ADVANCED CPU & GPU LOGIC ---
const checkCpuGpuRelationship = (targetCpu, targetGpu, errors, warnings) => {
    if (!targetCpu || !targetGpu) {
        if (targetCpu && !targetCpu.has_apu && !targetGpu) {
            warnings.push("Display Warning: This CPU has no integrated graphics. You will need a dedicated GPU to see anything on screen.");
        }
        return;
    }

    // 1. PERFORMANCE TIERING (BOTTLENECK)
    const activeCpuClock = targetCpu.boost_clock || targetCpu.core_clock || 3.0; 
    const activeGpuClock = targetGpu.boost_clock || targetGpu.core_clock || 1500; 
    const cpuScore = targetCpu.core_count * activeCpuClock;
    const gpuScore = targetGpu.memory * (activeGpuClock / 1000);
    const ratio = cpuScore / gpuScore;

    if (ratio < 0.45) {
        errors.push("Severe Performance Mismatch: This CPU is too weak for the selected GPU and will cause significant stuttering in games.");
    } else if (ratio < 0.7) {
        warnings.push("Minor Bottleneck: The CPU may limit the full potential of this GPU in CPU-intensive tasks.");
    } else if (ratio > 4.0) {
        warnings.push("Efficiency Warning: This high-end CPU is significantly faster than the selected GPU; the GPU will be the system's primary limit.");
    }

    // 2. POWER DENSITY & THERMAL BALANCE
    if (targetCpu.tdp + targetGpu.tdp > 450) {
        warnings.push("High Thermal Load: Both your CPU and GPU generate significant heat. Ensure your Case has excellent airflow and fans.");
    }
};

export const checkCompatibility = (part, selections) => {
    const currentParts = Object.values(selections).filter(Boolean);
    
    const cpu = currentParts.find(p => p.category === "CPU");
    const cooler = currentParts.find(p => p.category === "CPUCooler");
    const mobo = currentParts.find(p => p.category === "Motherboard");
    const ram = currentParts.find(p => p.category === "Memory");
    const storage = currentParts.find(p => p.category === "Storage");
    const psu = currentParts.find(p => p.category === "PowerSupply");
    const gpu = currentParts.find(p => p.category === "VideoCard");
    const pcCase = currentParts.find(p => p.category === "Case");

    const errors = [];
    const warnings = [];

    // =================================================================
    // 1. MOTHERBOARD RULES
    // =================================================================
    if (part.category === "Motherboard") {
        if (cpu && part.socket !== cpu.socket) {
            errors.push(`Socket mismatch: CPU needs ${cpu.socket} but board has ${part.socket}.`);
        }
        if (pcCase && !pcCase.supported_mobo_form_factors.includes(part.form_factor)) {
            errors.push(`Case fit issue: Selected case does not support ${part.form_factor} motherboards.`);
        }
        if (ram) {
            if (part.memory_gen !== ram.speed[0]) {
                errors.push(`Memory Gen mismatch: Board uses ${part.memory_gen} but RAM is ${ram.speed[0]}.`);
            }
            if (part.memory_slots < ram.modules[0]) {
                errors.push(`Not enough slots: Board has ${part.memory_slots} slots but RAM kit requires ${ram.modules[0]}.`);
            }
        }
        if (cooler && !cooler.supported_sockets.includes(part.socket)) {
            errors.push(`Cooler fit issue: Selected cooler does not mount onto a ${part.socket} motherboard.`);
        }
    }

    // =================================================================
    // 2. CPU RULES
    // =================================================================
    if (part.category === "CPU") {
        if (mobo && part.socket !== mobo.socket) {
            errors.push(`Socket mismatch: Board needs ${mobo.socket} socket.`);
        }
        if (ram && !part.supported_memory.includes(ram.speed[0])) {
            errors.push(`Memory limitation: This CPU does not support ${ram.speed[0]} configurations.`);
        }
        if (cooler && !cooler.supported_sockets.includes(part.socket)) {
            errors.push(`Cooler mounting issue: Selected cooler does not support this CPU's ${part.socket} footprint.`);
        }
        if (cooler && cooler.max_tdp_cooling < part.tdp) {
            warnings.push(`Thermal Warning: Selected cooler (${cooler.max_tdp_cooling}W) is rated below CPU TDP (${part.tdp}W).`);
        }
        if (psu) {
            const gpuDraw = gpu ? gpu.tdp : 0;
            const currentDraw = part.tdp + gpuDraw + 100;
            if (psu.wattage < currentDraw) {
                errors.push(`Power Limit: Adding this CPU drives total draw to ~${currentDraw}W, exceeding your ${psu.wattage}W PSU.`);
            }
        }
        checkCpuGpuRelationship(part, gpu, errors, warnings);
    }

    // =================================================================
    // 3. CPU COOLER RULES
    // =================================================================
    if (part.category === "CPUCooler") {
        if (cpu) {
            if (!part.supported_sockets.includes(cpu.socket)) {
                errors.push(`Mounting mismatch: This cooler does not support the CPU's ${cpu.socket} socket.`);
            }
            if (part.max_tdp_cooling < cpu.tdp) {
                warnings.push(`Thermal Warning: Cooler (${part.max_tdp_cooling}W dissipation) is below CPU TDP (${cpu.tdp}W).`);
            }
        }
        if (mobo && !part.supported_sockets.includes(mobo.socket)) {
            errors.push(`Mounting mismatch: This cooler cannot attach to the selected ${mobo.socket} motherboard.`);
        }
        if (pcCase) {
            if (part.type === "Air" && part.height > pcCase.max_cpu_cooler_height) {
                errors.push(`Clearance issue: Cooler height (${part.height}mm) exceeds case clearance limit (${pcCase.max_cpu_cooler_height}mm).`);
            }
            if (part.type === "Liquid" && part.radiator_size > 0 && !pcCase.supported_radiators.includes(part.radiator_size)) {
                errors.push(`Liquid layout restriction: Selected case does not support ${part.radiator_size}mm radiator arrays.`);
            }
        }
    }

    // =================================================================
    // 4. MEMORY (RAM) RULES
    // =================================================================
    if (part.category === "Memory") {
        if (mobo) {
            if (part.speed[0] !== mobo.memory_gen) {
                errors.push(`Generation mismatch: RAM is ${part.speed[0]} but Motherboard relies on ${mobo.memory_gen}.`);
            }
            if (part.modules[0] > mobo.memory_slots) {
                errors.push(`Physical limitation: RAM kit requires ${part.modules[0]} slots, but board only features ${mobo.memory_slots}.`);
            }
        }
        if (cpu && !cpu.supported_memory.includes(part.speed[0])) {
            errors.push(`Architecture mismatch: Selected CPU does not support ${part.speed[0]} memory generations.`);
        }
    }

    // =================================================================
    // 5. GPU RULES (VIDEOCARD)
    // =================================================================
    if (part.category === "VideoCard") {
        if (pcCase && part.length > pcCase.max_gpu_length) {
            errors.push(`Clearance issue: GPU length (${part.length}mm) exceeds case limit of ${pcCase.max_gpu_length}mm.`);
        }
        if (psu) {
            const cpuDraw = cpu ? cpu.tdp : 0;
            const currentDraw = cpuDraw + part.tdp + 100;
            if (psu.wattage < currentDraw) {
                errors.push(`Power Limit: Adding this GPU pushes system load to ~${currentDraw}W, exceeding your ${psu.wattage}W PSU.`);
            }
            if (psu.wattage < part.recommended_psu_wattage) {
                warnings.push(`PSU Warning: GPU suggests an overall build recommendation of ${part.recommended_psu_wattage}W (Current PSU: ${psu.wattage}W).`);
            }
        }
        checkCpuGpuRelationship(cpu, part, errors, warnings);
    }

    // =================================================================
    // 6. CASE RULES
    // =================================================================
    if (part.category === "Case") {
        if (mobo && !part.supported_mobo_form_factors.includes(mobo.form_factor)) {
            errors.push(`Form factor block: This case does not support ${mobo.form_factor} motherboard sizing.`);
        }
        if (gpu && part.max_gpu_length < gpu.length) {
            errors.push(`Clearance issue: GPU size (${gpu.length}mm) exceeds this case's max length allowance (${part.max_gpu_length}mm).`);
        }
        if (cooler) {
            if (cooler.type === "Air" && part.max_cpu_cooler_height < cooler.height) {
                errors.push(`Clearance issue: Case clearance width blocks your ${cooler.height}mm tall air cooler.`);
            }
            if (cooler.type === "Liquid" && cooler.radiator_size > 0 && !part.supported_radiators.includes(cooler.radiator_size)) {
                errors.push(`Liquid layout restriction: This case cannot house a ${cooler.radiator_size}mm radiator array.`);
            }
        }
        if (psu && part.psu_form_factor !== psu.type) {
            errors.push(`Chassis fit issue: Case accepts ${part.psu_form_factor} power supplies, but selected unit is ${psu.type}.`);
        }
    }

    // =================================================================
    // 7. POWER SUPPLY RULES
    // =================================================================
    if (part.category === "PowerSupply") {
        if (pcCase && part.type !== pcCase.psu_form_factor) {
            errors.push(`Chassis fit issue: Selected ${part.type} supply does not match case requirements (${pcCase.psu_form_factor}).`);
        }
        
        let estimatedDraw = 100; 
        if (cpu) estimatedDraw += cpu.tdp;
        if (gpu) estimatedDraw += gpu.tdp;

        if ((cpu || gpu) && part.wattage < estimatedDraw) {
            errors.push(`Insufficient Power: Current selections draw ~${estimatedDraw}W (Selected PSU capacity: ${part.wattage}W).`);
        }
        if (gpu && part.wattage < gpu.recommended_psu_wattage) {
            warnings.push(`Wattage Warning: Selected ${part.wattage}W PSU is lower than the recommended ${gpu.recommended_psu_wattage}W build baseline.`);
        }
    }

    // =================================================================
    // 8. STORAGE RULES
    // =================================================================
    if (part.category === "Storage") {
        if (mobo && part.form_factor === "M.2 2280" && mobo.m2_slots === 0) {
            errors.push(`Slot limitation: This M.2 NVMe SSD requires an M.2 expansion trace, but the selected motherboard has 0 slots.`);
        }
    }

    // --- STYLE/AESTHETIC EXTENSION ---
    const activeColors = [cpu, cooler, mobo, ram, gpu, pcCase, psu].filter(p => p && p.color).map(p => p.color);
    if (part.color && activeColors.length > 2) {
        const mismatchCount = activeColors.filter(c => c !== part.color).length;
        if (mismatchCount > 3) {
            warnings.push(`Style Warning: Color theme alert (${part.color}) might look uncoordinated with the rest of your components.`);
        }
    }

    // =================================================================
    // FINAL COMPILATION RETURN
    // =================================================================
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