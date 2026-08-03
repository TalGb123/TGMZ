import React, { useState, useEffect, useContext, useMemo } from "react";
import { ServerContext } from "../../App";
import "../css/category-list.css";
import { checkCompatibility } from "../../utils/compatibility.js";
import { Link, useNavigate } from 'react-router-dom';

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
        { key: "brand", type: "select", label: "Brand"},
        { key: "price", type: "range", label: "Price" },
        { key: "socket", type: "select", label: "Socket"},
        { key: "supported_memory", type: "select", label: "Memory Supported"},
        { key: "has_apu", type: "select", label: "Has APU"},
        { key: "tdp", type: "range", label: "TDP (W)" },
        { key: "core_count", type: "select", label: "Core Count" },
        { key: "core_clock", type: "range", label: "Clock (GHz)" },
        { key: "boost_clock", type: "range", label: "Boost Clock (GHz)" },
    ],
    CPUCooler: [
        { key: "price", type: "range", label: "Price" },
        { key: "brand", type: "select", label: "Brand"},
        { key: "type", type: "select", label: "Type"},
        { key: "radiator_size", type: "select", label: "Radiator Size (mm)"},
        { key: "supported_sockets", type: "select", label: "Supported Sockets"},
        { key: "max_tdp_cooling", type: "range", label: "TDP Rating (W)"},
        { key: "color", type: "select", label: "Color"},
        { key: "height", type: "range", label: "Height (mm)"},
        { key: "noise_level", type: "range", label: "Noise (dB)" },
    ],
    Motherboard: [
        { key: "price", type: "range", label: "Price" },
        { key: "brand", type: "select", label: "Brand"},
        { key: "socket", type: "select", label: "Socket" },
        { key: "form_factor", type: "select", label: "Form Factor" },
        { key: "memory_gen", type: "select", label: "Memory Generation" },
        { key: "has_bluetooth_wifi", type: "select", label: "Has Bluetooth & Wifi" },
        { key: "m2_slots", type: "select", label: "SSD NVME Slots" },
        { key: "connections", type: "select", label: "Connections" },
    ],
    Memory: [
        { key: "price", type: "range", label: "Price" },
        { key: "brand", type: "select", label: "Brand"},
        { key: "ddrGen", type: "select", label: "DDR" },
        { key: "speedMain", type: "select", label: "Speed" },
        { key: "modulesLabel", type: "select", label: "Modules" },
        { key: "cas_latency", type: "range", label: "CAS Latency" },
        { key: "color", type: "select", label: "Color" },
    ],
    Storage: [
        { key: "price", type: "range", label: "Price" },
        { key: "brand", type: "select", label: "Brand"},
        { key: "capacity", type: "select", label: "Capacity" },
        { key: "drive_type", type: "select", label: "Type" },
        { key: "form_factor", type: "select", label: "Form Factor" },
    ],
    PowerSupply: [
        { key: "price", type: "range", label: "Price" },
        { key: "brand", type: "select", label: "Brand"},
        { key: "wattage", type: "range", label: "Wattage" },
        { key: "efficiency", type: "select", label: "Efficiency" },
        { key: "type", type: "select", label: "Type" },
        { key: "modular", type: "select", label: "Modular" },
        { key: "color", type: "select", label: "Color" },
    ],
    VideoCard: [
        { key: "price", type: "range", label: "Price" },
        { key: "brand", type: "select", label: "Brand"},
        { key: "chipset", type: "select", label: "Chipset" },
        { key: "memory", type: "select", label: "Memory" },
        { key: "tdp", type: "range", label: "TDP (W)" },
        { key: "length", type: "range", label: "Length (mm)" },
        { key: "color", type: "select", label: "Color" },
        { key: "core_clock", type: "range", label: "Core Clock (MHz)" },
        { key: "boost_clock", type: "range", label: "Boost Clock (MHz)" },
        { key: "slots_required", type: "range", label: "Slots required" },
        { key: "recommended_psu_wattage", type: "range", label: "Recommended PSU Wattage (W)" },
    ],
    Case: [
        { key: "price", type: "range", label: "Price" },
        { key: "brand", type: "select", label: "Brand"},
        { key: "type", type: "select", label: "Type" },
        { key: "color", type: "select", label: "Color" },
        { key: "supported_mobo_form_factors", type: "select", label: "Supported Motherboard Form Factors" },
        { key: "max_gpu_length", type: "range", label: "GPU Length (mm)" },
        { key: "max_cpu_cooler_height", type: "range", label: "CPU Cooler Height (mm)" },
        { key: "psu_form_factor", type: "select", label: "PSU Form Factor" },
        { key: "supported_radiators", type: "select", label: "Supported Radiator Sizes (mm)" },
        { key: "sidepanel_material", type: "select", label: "Side Panel" },
    ],
};

const CategoryList = ({ category, onSelect, selections = {}, viewMode = "table" }) => {
    const { server } = useContext(ServerContext);
    const navigate = useNavigate();
    const [parts, setParts] = useState([]);

    const [globalOptions, setGlobalOptions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("");
    const [advFilters, setAdvFilters] = useState({ minPrice: "", maxPrice: "", values: {} });
    const [sortBy, setSortBy] = useState(""); 
    const filterDefs = FILTERS[category] || [];

    useEffect(() => {
        const fetchInitialOptions = async () => {
            try {
                const response = await server.get(`/products/category/${category}`);
                const normalized = response.data.map(normalizePart);
                
                const map = {};
                filterDefs.forEach(f => {
                    if (f.key === "has_apu" || f.key === "has_bluetooth_wifi") {
                        map[f.key] = ["true", "false"];
                    }
                    else if (f.type === "select") {
                        const valuesSet = new Set();
                        
                        normalized.forEach(p => {
                            let val = p[f.key];
                            if (val !== null && val !== undefined && val !== "") {
                                if (Array.isArray(val)) {
                                    val.forEach(v => valuesSet.add(v));
                                } else if (typeof val === "string") {
                                    if (val.toUpperCase() === "DDR4DDR5" || val.toUpperCase() === "DDR5DDR4") {
                                        valuesSet.add("DDR4");
                                        valuesSet.add("DDR5");
                                    } else if (val.includes(",")) {
                                        val.split(",").forEach(v => valuesSet.add(v.trim()));
                                    } else {
                                        valuesSet.add(val);
                                    }
                                } else if (typeof val === "boolean") {
                                    valuesSet.add(val.toString());
                                } else {
                                    valuesSet.add(val);
                                }
                            }
                        });
                        map[f.key] = Array.from(valuesSet).sort();
                    } 
                    else if (f.type === "connections_min") {
                        const keysSet = new Set();
                        normalized.forEach(p => {
                            let val = p[f.key];
                            if (Array.isArray(val)) {
                                val.forEach(connString => {
                                    const firstSpaceIdx = connString.indexOf(' ');
                                    if (firstSpaceIdx !== -1) {
                                        const typeName = connString.slice(firstSpaceIdx + 1).trim();
                                        keysSet.add(typeName);
                                    }
                                });
                            }
                        });
                        map[f.key] = Array.from(keysSet).sort();
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

    const processedParts = useMemo(() => {
        if (!parts) return [];
        
        return parts.map(part => {
            const compat = checkCompatibility(part, selections);
            return { ...part, ...compat };
        }).sort((a, b) => {
            // Assign a score: 1 for Perfect, 2 for Yellow Warning, 3 for Red Error
            const getScore = (p) => {
                if (!p.isCompatible) return 3;
                if (p.isWarning) return 2;     
                return 1;
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
                
                    <div className="parts-scroll">
                        {viewMode === "grid" ? (
                            <div className="store-grid">
                                {processedParts.length > 0 ? (
                                    processedParts.map((part, index) => (
                                        <div key={part._id || index} className="store-card">
                                            <Link to={`/product/${part._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <img 
                                                    src={part.image || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081"} 
                                                    alt={part.name} 
                                                    className="store-card-img" 
                                                />
                                                <div className="store-card-title">{part.name}</div>
                                                <div className="store-card-price">₪{part.price}</div>
                                            </Link>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-parts">No parts found for {category}.</div>
                                )}
                            </div>
                        ) : (
                            <table className="parts-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Part Name</th>
                                        <th>Price</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedParts.length > 0 ? (
                                    processedParts.map((part, index) => {
                                        let bgColor = "transparent";
                                        let rowOpacity = 1;
                                        let icon = null;

                                        if (!part.isCompatible) {
                                            bgColor = "rgba(255, 0, 0, 0.05)";
                                            rowOpacity = 0.5;
                                            icon = "❌";
                                        } 
                                        else if (part.isWarning) {
                                            bgColor = "rgba(255, 165, 0, 0.15)";
                                            rowOpacity = 0.85;
                                            icon = "⚠️";
                                        }

                                        return (
                                            <tr key={part._id || index} style={{ opacity: rowOpacity, backgroundColor: bgColor }}>
                                                <td><img src={part.image || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081"} alt={part.name} className="part-image" /></td>
                                                <td style={{ fontWeight: '500' }}>
                                                    {part.name}
                                                    {icon && <span title={part.reason} style={{ cursor: "help", marginLeft: "8px", fontSize: "1.2em" }}>{icon}</span>}
                                                </td>
                                                <td className="part-price-cell">₪{part.price}</td>
                                                <td style={{ display: "flex", justifyContent: "flex-end", gap: "8px", alignItems: "center" }}>
                                                    <Link 
                                                        to={`/product/${part._id}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="action-btn view-btn"
                                                    >
                                                        View
                                                    </Link>
                                                    <button onClick={() => onSelect(part)} className="action-btn add-btn">Add</button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                    ) : (
                                    <tr><td colSpan={4} className="no-parts">No parts found for {category}.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {filterDefs.length > 0 && (
                <div className="filters-panel">
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
                            ) : f.type === "connections_min" ? (
                                /* THIS IS THE NEW RENDER BLOCK FOR CONNECTIONS */
                                <div key={f.key} className="filter-row">
                                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>{f.label || "Connections (Min)"}</label>
                                    {(globalOptions[f.key] || []).map(connType => (
                                        <div key={connType} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "0.9em", alignItems: "center" }}>
                                            <span style={{ color: "#ccc", paddingRight: "10px" }}>{connType}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                style={{ width: "50px", padding: "4px", backgroundColor: "#333", color: "white", border: "1px solid #444", borderRadius: "4px"}}
                                                value={advFilters.values[`conn_${connType}`] || ""}
                                                onChange={e => setAdvFilters(prev => ({
                                                    ...prev,
                                                    values: { ...prev.values, [`conn_${connType}`]: e.target.value }
                                                }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Standard select for everything else */
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