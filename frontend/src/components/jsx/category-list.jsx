import React, { useState, useEffect, useContext, useMemo } from "react";
import { ServerContext } from "../../App";
import partsData from "../../assets/parts.json"; 
import "../css/category-list.css"; 

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
        } else if (typeof clone.rpm === "number") {
        clone.rpmMin = clone.rpmMax = clone.rpm;
        }
        if (Array.isArray(clone.noise_level)) {
        clone.noiseMin = Math.min(...clone.noise_level);
        clone.noiseMax = Math.max(...clone.noise_level);
        } else if (typeof clone.noise_level === "number") {
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

const CategoryList = ({ category, onSelect }) => {
    const { server } = useContext(ServerContext);
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("");
    const [advFilters, setAdvFilters] = useState({ minPrice: "", maxPrice: "", values: {} });
    const [sortBy, setSortBy] = useState(""); 
    const filterDefs = FILTERS[category] || [];

    useEffect(() => {
        const fetchParts = async () => {
        setLoading(true);
        try {
            const response = await server.get(`/products/category/${category}`);
            const normalized = response.data.map(normalizePart);
            setParts(normalized);
            setError(null);
        } catch (err) {
            setError("Could not load parts from server.");
        } finally {
            setLoading(false);
        }
        };
        if (category) fetchParts();
    }, [category, server]);

    const optionsMap = useMemo(() => {
        const map = {};
        filterDefs.forEach(f => {
        if (f.type === "select") {
            map[f.key] = Array.from(new Set(parts.map(p => p[f.key]).filter(v => v !== null && v !== undefined)));
        }
        });
        return map;
    }, [parts, filterDefs]);

    const filteredParts = parts.filter(p => {
        const nameOk = p.name.toLowerCase().includes(filter.toLowerCase());
        const priceOk =
        (!advFilters.minPrice || p.price >= Number(advFilters.minPrice)) &&
        (!advFilters.maxPrice || p.price <= Number(advFilters.maxPrice));
        
        const rangeOk = filterDefs.filter(f => f.type === "range" && f.key !== "price").every(f => {
        const min = advFilters.values[`${f.key}Min`];
        const max = advFilters.values[`${f.key}Max`];
        return (!min || p[f.key] >= Number(min)) && (!max || p[f.key] <= Number(max));
        });
        
        const selectsOk = filterDefs.filter(f => f.type === "select").every(f => {
        const val = advFilters.values[f.key];
        return !val || String(p[f.key]) === String(val);
        });
        
        return nameOk && priceOk && rangeOk && selectsOk;
    });

        const sortedParts = [...filteredParts].sort((a, b) => {
        const aHasPrice = a.price != null && a.price > 0;
        const bHasPrice = b.price != null && b.price > 0;
        
        if (!aHasPrice && bHasPrice) return 1;
        if (aHasPrice && !bHasPrice) return -1;
        if (!aHasPrice && !bHasPrice) return 0;
        
        switch (sortBy) {
            case "price-asc":
                return a.price - b.price;
            case "price-desc":
                return b.price - a.price;
            case "name-asc":
                return a.name.localeCompare(b.name);
            case "name-desc":
                return b.name.localeCompare(a.name);
            default:
                return 0;
        }
    });

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
                    {sortedParts.length > 0 ? (
                      sortedParts.map((part, index) => (
                        <tr key={part._id || index}>
                          <td><img src={part.image || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081"} alt={part.name} className="part-image" /></td>
                          <td style={{ fontWeight: '500' }}>{part.name}</td>
                          <td className="part-price-cell">₪{part.price}</td>
                          <td style={{ textAlign: "right" }}>
                            <button onClick={() => onSelect(part)} className="add-btn">Add</button>
                          </td>
                        </tr>
                      ))
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
                        {(optionsMap[f.key] || []).map(opt => (
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