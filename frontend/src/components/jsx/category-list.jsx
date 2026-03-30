import React, { useState, useEffect, useContext, useMemo } from "react";
import { ServerContext } from "../../App";
import partsData from "../../assets/parts.json"; 
import "../css/category-list.css";
import { checkCompatibility } from "../../utils/compatibility.js";

const normalizePart = (p) => {
    const clone = { ...p };

    if (clone.category === "Memory" && Array.isArray(clone.speed)) {
        clone.speedMain = clone.speed.length > 1 ? clone.speed[1] : clone.speed[0];
    }

    if (clone.category === "Memory" && clone.speedMain) {
        if (clone.speedMain >= 4800) clone.ddrGen = "DDR5";
        else if (clone.speedMain >= 2400) clone.ddrGen = "DDR4";
        else clone.ddrGen = "DDR3";
    }

    if (clone.category === "Memory" && Array.isArray(clone.modules) && clone.modules.length >= 2) {
        const [count, size] = clone.modules;
        clone.modulesLabel = `${count}x${size}`;
    }

    if (clone.category === "CPUCooler") {
        if (Array.isArray(clone.rpm)) {
            clone.rpmMin = Math.min(...clone.rpm);
            clone.rpmMax = Math.max(...clone.rpm);
        }   
        else if (typeof clone.rpm === "number") {
            clone.rpmMin = clone.rpmMax = clone.rpm;
        }
        if (Array.isArray(clone.noise_level)) {
            clone.noiseMin = Math.min(...clone.noise_level);
            clone.noiseMax = Math.max(...clone.noise_level);
        } 
        else if (typeof clone.noise_level === "number") {
            clone.noiseMin = clone.noiseMax = clone.noise_level;
        }
    }
    return clone;
};

const FILTERS = {
    CPU: [
        { key: "price", type: "range", label: "Price" },
        { key: "core_count", type: "select", label: "Core Count" },
        { key: "core_clock", type: "range", label: "Clock (GHz)" },
        { key: "tdp", type: "range", label: "TDP (W)" },
    ],
    CPUCooler: [
        { key: "price", type: "range", label: "Price" },
        { key: "rpmMin", type: "range", label: "RPM (min)" },
        { key: "rpmMax", type: "range", label: "RPM (max)" },
        { key: "noiseMin", type: "range", label: "Noise (min dB)" },
        { key: "noiseMax", type: "range", label: "Noise (max dB)" },
    ],
    Motherboard: [
        { key: "price", type: "range", label: "Price" },
        { key: "socket", type: "select", label: "Socket" },
        { key: "form_factor", type: "select", label: "Form Factor" },
        { key: "max_memory", type: "range", label: "Max Memory (GB)" },
    ],
    Memory: [
        { key: "price", type: "range", label: "Price" },
        { key: "ddrGen", type: "select", label: "DDR" },
        { key: "speedMain", type: "select", label: "Speed" },
        { key: "modulesLabel", type: "select", label: "Modules" },
        { key: "price_per_gb", type: "range", label: "Price/GB" },
        { key: "cas_latency", type: "range", label: "CAS Latency" },
    ],
    Storage: [
        { key: "price", type: "range", label: "Price" },
        { key: "capacity", type: "select", label: "Capacity" },
        { key: "drive_type", type: "select", label: "Type" },
        { key: "cache", type: "range", label: "Cache (MB)" },
    ],
    PowerSupply: [
        { key: "price", type: "range", label: "Price" },
        { key: "wattage", type: "range", label: "Wattage" },
        { key: "efficiency", type: "select", label: "Efficiency" },
        { key: "modular", type: "select", label: "Modular" },
    ],
    VideoCard: [
        { key: "price", type: "range", label: "Price" },
        { key: "chipset", type: "select", label: "Chipset" },
        { key: "memory", type: "select", label: "Memory" },
        { key: "core_clock", type: "range", label: "Core Clock (MHz)" },
    ],
    Case: [
        { key: "price", type: "range", label: "Price" },
        { key: "type", type: "select", label: "Type" },
        { key: "color", type: "select", label: "Color" },
        { key: "side_panel", type: "select", label: "Side Panel" },
    ],
};

const CategoryList = ({ category, onSelect, selections = {} }) => {
    const { server } = useContext(ServerContext);
    const [parts, setParts] = useState([]);

    const [globalOptions, setGlobalOptions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("");
    const [advFilters, setAdvFilters] = useState({ minPrice: "", maxPrice: "", values: {} });
    const [sortBy, setSortBy] = useState(""); 
    const filterDefs = FILTERS[category] || [];

    // ... (Your useEffects for fetchInitialOptions and fetchParts remain exactly the same) ...
    useEffect(() => {
        const fetchInitialOptions = async () => {
            try {
                const response = await server.get(`/products/category/${category}`);
                const normalized = response.data.map(normalizePart);
                
                const map = {};
                filterDefs.forEach(f => {
                    if (f.type === "select") {
                        map[f.key] = Array.from(new Set(normalized.map(p => p[f.key]).filter(v => v !== null && v !== undefined)));
                    }
                });
                setGlobalOptions(map);
            } 
            catch (err) {
                console.error("Could not load initial options map", err);
            }
        };
        if (category) fetchInitialOptions();
    }, [category, server]);

    useEffect(() => {
        let isCancelled = false;
        const fetchParts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                
                if (filter.trim()) params.append('name', filter);
                if (advFilters.minPrice) params.append('minPrice', advFilters.minPrice);
                if (advFilters.maxPrice) params.append('maxPrice', advFilters.maxPrice);
                if (sortBy) params.append('sortBy', sortBy);

                for (const [key, value] of Object.entries(advFilters.values)) {
                    if (value) params.append(key, value);
                }

                const response = await server.get(`/products/category/${category}?${params.toString()}`);
                
                if (!isCancelled) {
                    const normalized = response.data.map(normalizePart);
                    setParts(normalized);
                    setError(null);
                }
            } 
            catch (err) {
                if (!isCancelled) setError("Could not load parts from server.");
            } 
            finally {
                if (!isCancelled) setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
           if (category) fetchParts();
        }, 300);

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [category, server, filter, advFilters, sortBy]);


    // --- 4. APPLY COMPATIBILITY AND SORT ---
    const processedParts = useMemo(() => {
        if (!parts) return [];
        
        return parts.map(part => {
            const compat = checkCompatibility(part, selections);
            return { ...part, ...compat };
        }).sort((a, b) => {
            // Assign a score: 1 for Perfect, 2 for Yellow Warning, 3 for Red Error
            const getScore = (p) => {
                if (!p.isCompatible) return 3; // Red
                if (p.isWarning) return 2;     // Yellow
                return 1;                      // Clean
            };
            return getScore(a) - getScore(b);
        });
    }, [parts, selections]);


    if (loading) return <div className="loading-spinner">Loading from Server...</div>;
    if (error) return <div className="error-msg">{error}</div>;

    return (
        <div className="category-list-layout">
            <div className="parts-panel">
                <div className="search-sort-bar">
                    {/* ... (Search and Sort UI unchanged) ... */}
                    <input
                        type="text"
                        placeholder="Filter parts..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="filter-input"
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="">Sort by...</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="name-asc">Name: A-Z</option>
                        <option value="name-desc">Name: Z-A</option>
                    </select>
                </div>
                
                <div className="table-wrapper">
                <table className="parts-table">
                    <thead>
                    <tr>
                        <th>Image</th>
                        <th>Part Name</th>
                        <th>Price</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                </table>
                <div className="parts-scroll">
                        <table className="parts-table">
                            <tbody>
                                {processedParts.length > 0 ? (
                                processedParts.map((part, index) => {
                                    
                                    // Determine styling based on the status
                                    let bgColor = "transparent";
                                    let rowOpacity = 1;
                                    let icon = null;

                                    if (!part.isCompatible) {
                                        // Hard Error (Red)
                                        bgColor = "rgba(255, 0, 0, 0.05)";
                                        rowOpacity = 0.5;
                                        icon = "❌";
                                    } else if (part.isWarning) {
                                        // Soft Warning (Yellow)
                                        bgColor = "rgba(255, 165, 0, 0.15)";
                                        rowOpacity = 0.85; // Less transparent than red
                                        icon = "⚠️";
                                    }

                                    return (
                                        <tr 
                                            key={part._id || index} 
                                            style={{ opacity: rowOpacity, backgroundColor: bgColor }}
                                        >
                                        <td><img src={part.image || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081"} alt={part.name} className="part-image" /></td>
                                        
                                        <td style={{ fontWeight: '500' }}>
                                            {part.name}
                                            {(icon) && (
                                                <span 
                                                    title={part.reason} 
                                                    style={{ cursor: "help", marginLeft: "8px", fontSize: "1.2em" }}
                                                >
                                                    {icon}
                                                </span>
                                            )}
                                        </td>
                                        
                                        <td className="part-price-cell">${part.price}</td>
                                        <td style={{ textAlign: "right" }}>
                                            <button onClick={() => onSelect(part)} className="add-btn">Add</button>
                                        </td>
                                        </tr>
                                    );
                                })
                                ) : (
                                <tr><td colSpan={4} className="no-parts">No parts found for {category}.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
            </div>
        </div>

        {filterDefs.length > 0 && (
            <div className="filters-panel">
                {/* ... (Filters sidebar unchanged) ... */}
                <h4>Filters</h4>
                <div className="filters-scrollable">
                    {filterDefs.map(f =>
                        f.type === "range" && f.key === "price" ? (
                            <div key="price" className="filter-row">
                                <label>{f.label || "Price"}</label>
                                <div className="price-range">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={advFilters.minPrice}
                                        onChange={e => setAdvFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={advFilters.maxPrice}
                                        onChange={e => setAdvFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                                    />
                                </div>
                            </div>
                        ) : f.type === "range" ? (
                            <div key={f.key} className="filter-row">
                                <label>{f.label || f.key}</label>
                                <div className="price-range">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={advFilters.values[`${f.key}Min`] || ""}
                                        onChange={e => setAdvFilters(prev => ({
                                            ...prev,
                                            values: { ...prev.values, [`${f.key}Min`]: e.target.value }
                                        }))}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={advFilters.values[`${f.key}Max`] || ""}
                                        onChange={e => setAdvFilters(prev => ({
                                            ...prev,
                                            values: { ...prev.values, [`${f.key}Max`]: e.target.value }
                                        }))}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div key={f.key} className="filter-row">
                            <label>{f.label || f.key}</label>
                            <select
                                value={advFilters.values[f.key] || ""}
                                onChange={e =>
                                setAdvFilters(prev => ({
                                    ...prev,
                                    values: { ...prev.values, [f.key]: e.target.value }
                                }))
                                }
                            >
                                <option value="">All</option>
                                {(globalOptions[f.key] || []).map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                                </select>
                            </div>
                        )
                    )}
                </div>
                <button
                    type="button"
                    className="clear-filters-btn"
                    onClick={() => setAdvFilters({ minPrice: "", maxPrice: "", values: {} })}
                >
                    Clear filters
                </button>
            </div>
            )}
        </div>
    );
}

export default CategoryList;