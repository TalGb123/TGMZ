import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { ServerContext } from "../../App";
import { useNavigate } from "react-router-dom";
import "../css/inventory.css";

const CATEGORIES = ["CPU", "CPUCooler", "Motherboard", "Memory", "Storage", "VideoCard", "PowerSupply", "Case"];

const CATEGORY_PROPS = {
  CPU: [
    { name: "brand", type: "datalist", dynamicKey: "brands", label: "Brand", required: true },
    { name: "socket", type: "datalist", dynamicKey: "sockets", label: "Socket", required: true },
    { name: "supported_memory", type: "multi-select", dynamicKey: "memoryGens", options: ["DDR4", "DDR5"], label: "Memory Supported", required: true },
    { name: "has_apu", type: "select", options: ["true", "false"], label: "Has APU" },
    { name: "tdp", type: "number", label: "TDP (W)" },
    { name: "core_count", type: "number", label: "Core Count", required: true },
    { name: "core_clock", type: "number", label: "Core Clock (GHz)", required: true, step: "0.1" },
    { name: "boost_clock", type: "number", label: "Boost Clock (GHz)", step: "0.1" },
  ],
  CPUCooler: [
    { name: "brand", type: "datalist", dynamicKey: "brands", label: "Brand", required: true },
    { name: "type", type: "select", options: ["Air", "Liquid"], label: "Type" },
    { name: "radiator_size", type: "datalist", dynamicKey: "radiatorSizes", label: "Radiator Size (mm) (0 if Air)" },
    { name: "supported_sockets", type: "multi-select", dynamicKey: "sockets", label: "Supported Sockets" },
    { name: "max_tdp_cooling", type: "number", label: "TDP Rating (W)" },
    { name: "height", type: "number", label: "Height (mm)" },
    { name: "noise_level", type: "number", label: "Noise Level (dB)", step: "0.1" },
  ],
  Motherboard: [
    { name: "brand", type: "datalist", dynamicKey: "brands", label: "Brand", required: true },
    { name: "socket", type: "datalist", dynamicKey: "sockets", label: "Socket", required: true },
    { name: "form_factor", type: "datalist", dynamicKey: "moboFormFactors", label: "Form Factor", required: true },
    { name: "memory_gen", type: "datalist", dynamicKey: "memoryGens", label: "Memory Gen" },
    { name: "has_wifi_bluetooth", type: "select", options: ["true", "false"], label: "Has Bluetooth & WiFi" },
    { name: "memory_slots", type: "number", label: "Memory Slots", required: true },
    { name: "m2_slots", type: "number", label: "SSD NVMe Slots" },
    { name: "connections", type: "connection-builder", label: "Rear I/O Connections" },
    { name: "vrm_tier", type: "number", label: "VRM Tier (1-5)", required: true }
  ],
  Memory: [
    { name: "brand", type: "datalist", dynamicKey: "brands", label: "Brand", required: true },
    { name: "memory_gen", type: "datalist", dynamicKey: "memoryGens", label: "Memory Generation", required: true },
    { name: "speed_mhz", type: "number", label: "Speed (MHz)", required: true },
    { name: "cas_latency", type: "number", label: "CAS Latency", required: true },
    { name: "module_sticks", type: "number", label: "Stick Amount (e.g. 2)", required: true },
    { name: "module_capacity", type: "number", label: "Capacity Per Stick (GB)", required: true },
  ],
  Storage: [
    { name: "brand", type: "datalist", dynamicKey: "brands", label: "Brand", required: true },
    { name: "capacity", type: "number", label: "Capacity (GB)", required: true },
    { name: "drive_type", type: "datalist", dynamicKey: "driveTypes", label: "Drive Type" },
    { name: "form_factor", type: "datalist", dynamicKey: "storageFormFactors", label: "Form Factor" },
  ],
  PowerSupply: [
    { name: "brand", type: "datalist", dynamicKey: "brands", label: "Brand", required: true },
    { name: "wattage", type: "number", label: "Wattage (W)", required: true },
    { name: "efficiency", type: "select", options: ["80+ White", "80+ Bronze", "80+ Silver", "80+ Gold", "80+ Platinum", "80+ Titanium"], label: "Efficiency Rating" },
    { name: "type", type: "select", options: ["ATX", "SFX"], label: "Type" },
    { name: "modular", type: "select", options: ["Full", "Semi", "No"], label: "Modular" },
  ],
  VideoCard: [
    { name: "brand", type: "datalist", dynamicKey: "brands", label: "Brand", required: true },
    { name: "chipset", type: "datalist", dynamicKey: "gpuChipsets", label: "Chipset", required: true },
    { name: "memory", type: "number", label: "Memory (GB)" },
    { name: "tdp", type: "number", label: "TDP (W)" },
    { name: "length", type: "number", label: "Length (mm)" },
    { name: "core_clock", type: "number", label: "Core Clock (MHz)" },
    { name: "boost_clock", type: "number", label: "Boost Clock (MHz)" },
    { name: "slots_required", type: "number", label: "Slots Required", step: "0.1" },
    { name: "recommended_psu_wattage", type: "number", label: "Recommended PSU Wattage (W)" },
  ],
  Case: [
    { name: "brand", type: "datalist", dynamicKey: "brands", label: "Brand", required: true },
    { name: "type", type: "datalist", dynamicKey: "moboFormFactors", label: "Type (e.g. Mid Tower)" },
    { name: "supported_mobo_form_factors", type: "multi-select", dynamicKey: "moboFormFactors", options: ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"], label: "Supported Motherboards", required: true },
    { name: "max_gpu_length", type: "number", label: "GPU Length (mm)", required: true },
    { name: "max_cpu_cooler_height", type: "number", label: "CPU Cooler Height (mm)", required: true },
    { name: "psu_form_factor", type: "select", options: ["ATX", "SFX"], label: "PSU Form Factor", required: true },
    { name: "supported_radiators", type: "multi-select", dynamicKey: "caseRadiators", options: [120, 240, 280, 360, 420], label: "Supported Radiators" },
    { name: "sidepanel_material", type: "text", label: "Side Panel Material" },
  ]
};

const COMMON_CONNECTIONS = [
  "USB-A 2.0", 
  "USB-A 3.2 Gen 1 (5Gbps)", 
  "USB-A 3.2 Gen 2 (10Gbps)",
  "USB-C 3.2 Gen 2 (10Gbps)", 
  "USB-C 3.2 Gen 2x2 (20Gbps)", 
  "Thunderbolt 4 / USB4",
  "RJ45 1GbE LAN", 
  "RJ45 2.5GbE LAN", 
  "RJ45 10GbE LAN",
  "Wi-Fi Antenna Ports", 
  "HDMI", 
  "DisplayPort",
  "Audio Jacks (3.5mm)", 
  "Optical S/PDIF Out",
  "BIOS Flashback Button", 
  "Clear CMOS Button"
];

export default function Inventory() {
  const { server, user } = useContext(ServerContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("CPU");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [modalCategory, setModalCategory] = useState("CPU");
  const [dbOptions, setDbOptions] = useState({
    brands: [],
    sockets: [],
    gpuChipsets: [],
    cpuChipsets: [],
    moboFormFactors: [],
    memoryGens: [],
    storageFormFactors: [],
    driveTypes: [],
    caseRadiators: []
  });

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchDbOptions = async () => {
      try {
        const res = await server.get('/options/form-options');
        setDbOptions(res.data);
      } catch (err) {
        console.error("Failed to load dynamic selector profiles:", err);
      }
    };

    if (user?.isAdmin) {
      fetchDbOptions();
    }
  }, [server, user]);

  const fetchProducts = async (pageNum, reset = false) => {
    try {
      setLoading(true);
      const res = await server.get(`/products/inventory`, {
        params: { category, search, page: pageNum, limit: 10 }
      });
      
      const newProducts = res.data.products;
      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
      }
      
      setHasMore(pageNum < res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
  }, [category]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchProducts(1, true);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, false);
    }
  };

  const handleEdit = (item) => {
    let normalizedItem = { ...item };

    if (item.category === "Memory") {
      if (Array.isArray(item.speed)) {
        normalizedItem.memory_gen = item.speed[0] || "";
        normalizedItem.speed_mhz = item.speed[1] || "";
        normalizedItem.cas_latency = item.speed[2] || "";
      }
      
      if (Array.isArray(item.modules) && item.modules.length >= 2) {
        normalizedItem.module_sticks = item.modules[0];
        normalizedItem.module_capacity = item.modules[1];
      }
    }

    setEditingItem(normalizedItem);
    setFormData(normalizedItem);
    setModalCategory(item.category || category || "CPU");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await server.delete(`/products/${id}`);
        setProducts(products.filter(p => p._id !== id));
      } 
      catch (err) {
        console.error(err);
        alert("Failed to delete item.");
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, category: modalCategory };
      
      if (modalCategory === "Memory") {
        payload.speed = [
          formData.memory_gen,
          Number(formData.speed_mhz),
          Number(formData.cas_latency)
        ];
        
        payload.modules = [
          Number(formData.module_sticks), 
          Number(formData.module_capacity)
        ];

        delete payload.module_sticks;
        delete payload.module_capacity;
      }

      if (modalCategory === "Case" && Array.isArray(payload.supported_radiators)) {
        payload.supported_radiators = payload.supported_radiators.map(Number).filter(n => !isNaN(n));
      }

      if (modalCategory === "Storage" && payload.drive_type) {
        payload.type = payload.drive_type;
      }

      if (editingItem && editingItem._id) {
        const res = await server.put(`/products/${editingItem._id}`, payload);
        setProducts(products.map(p => p._id === editingItem._id ? res.data : p));
      } else {
        const res = await server.post(`/products`, payload);
        if (!category || category === modalCategory) {
          setProducts([res.data, ...products]);
        }
      }
      closeModal();
    } 
    catch (err) {
      console.error("Save failed:", err);
      const backendError = err.response?.data?.message || "Make sure all required fields are present.";
      alert(`Failed to save: ${backendError}`);
    }
  };

  const handleMultiSelectChange = (name, value, isChecked) => {
    setFormData(prev => {
      let currentList = [];
      if (Array.isArray(prev[name])) {
        currentList = prev[name];
      } 
      else if (typeof prev[name] === 'string') {
        currentList = prev[name].split(',').map(s => s.trim()).filter(Boolean);
      }

      if (isChecked) {
        return { ...prev, [name]: [...new Set([...currentList, value])] };
      } 
      else {
        return { ...prev, [name]: currentList.filter(item => item.toString() !== value.toString()) };
      }
    });
  };

  const handleConnectionChange = (propName, type, count) => {
    setFormData(prev => {
        const currentArr = Array.isArray(prev[propName]) ? prev[propName] : [];
        const currentObj = {};
        
        currentArr.forEach(c => {
            const space = c.indexOf(' ');
            if (space > 0 && !isNaN(c.slice(0, space).trim())) {
              currentObj[c.slice(space + 1).trim()] = c.slice(0, space).trim();
            } 
            else {
              currentObj[c.trim()] = "1";
            }
        });

        if (!count || count === '0' || count === 0) {
          delete currentObj[type];
        } 
        else {
          currentObj[type] = count;
        }

        const newArr = Object.entries(currentObj).map(([k, v]) => `${v} ${k}`);
        return { ...prev, [propName]: newArr };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!user?.isAdmin) return null;

  return (
    <div className="inventory-container">
      <h2>Inventory Management</h2>
      <div className="inventory-controls">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        
        <input 
          type="text" 
          placeholder="Search by Name..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="search-bar"
        />
        
        <button className="add-btn" onClick={() => { 
          setEditingItem(null); 
          setFormData({}); 
          setModalCategory(category || "CPU");
          setShowModal(true); 
        }}>
          + Add New Item
        </button>
      </div>

      <div className="inventory-list">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>In Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>${product.price}</td>
                <td>{product.inStock ? "Yes" : "No"}</td>
                <td className="actions-cell">
                  <button onClick={() => handleEdit(product)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(product._id)} className="delete-btn">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="loading-text">Loading...</p>}
        {!loading && hasMore && (
          <button className="load-more-btn" onClick={loadMore}>Load More</button>
        )}
      </div>

      {showModal && (
        <div className="inventory-modal-overlay">
          <div className="inventory-modal-content">
            <h3>{editingItem ? "Edit Item" : "Add New Item"}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={modalCategory} 
                  onChange={(e) => {
                    setModalCategory(e.target.value);
                    if (!editingItem) setFormData({});
                  }}
                  disabled={!!editingItem}
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Name (Required)</label>
                <input type="text" name="name" value={formData.name || ""} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input type="text" name="image" value={formData.image || ""} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input type="text" name="color" value={formData.color || ""} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input type="number" name="price" value={formData.price || ""} onChange={handleInputChange} step="0.01" />
              </div>
              <div className="form-group">
                <label>In Stock</label>
                <select name="inStock" value={formData.inStock !== undefined ? formData.inStock : true} onChange={(e) => setFormData(prev => ({...prev, inStock: e.target.value === 'true'}))}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <hr style={{ margin: "20px 0", borderColor: "var(--border-color, #ccc)" }} />
              <h4 style={{ marginBottom: "15px" }}>{modalCategory} Specific Properties</h4>
              
              {CATEGORY_PROPS[modalCategory]?.map((prop) => {
                let currentSelections = [];
                if (prop.type === "multi-select") {
                  if (Array.isArray(formData[prop.name])) {
                    currentSelections = formData[prop.name].map(String);
                  } else if (typeof formData[prop.name] === 'string') {
                    currentSelections = formData[prop.name].split(',').map(s => s.trim()).filter(Boolean);
                  }
                }

                let availableOptions = [];
                if (prop.options) availableOptions = [...prop.options];
                if (prop.dynamicKey && dbOptions[prop.dynamicKey]) {
                  availableOptions = [...availableOptions, ...dbOptions[prop.dynamicKey]];
                }
                if (prop.type === "multi-select") {
                  const combinedAsStrings = [...availableOptions, ...currentSelections].map(String);
                  availableOptions = [...new Set(combinedAsStrings)]; 
                }

                return (
                  <div className="form-group" key={prop.name}>
                    <label>{prop.label} {prop.required && "(Required)"}</label>
                    
                    {prop.type === "multi-select" ? (
                      <div style={{ border: "1px solid var(--border-color, #ccc)", padding: "10px", borderRadius: "4px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "10px", maxHeight: "150px", overflowY: "auto" }}>
                          {availableOptions.map(opt => (
                            <label key={opt} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.95em", backgroundColor: "rgba(0,0,0,0.1)", padding: "4px 8px", borderRadius: "4px" }}>
                              <input
                                type="checkbox"
                                checked={currentSelections.includes(opt.toString())}
                                onChange={(e) => handleMultiSelectChange(prop.name, opt.toString(), e.target.checked)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Type custom & press Enter to add..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (e.target.value.trim()) {
                                handleMultiSelectChange(prop.name, e.target.value.trim(), true);
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    ) : prop.type === "connection-builder" ? (
                      <div style={{ border: "1px solid var(--border-color, #ccc)", padding: "10px", borderRadius: "4px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxHeight: "300px", overflowY: "auto", marginBottom: "10px" }}>
                          {(() => {
                            const currentObj = {};
                            if (Array.isArray(formData[prop.name])) {
                              formData[prop.name].forEach(c => {
                                const space = c.indexOf(' ');
                                if (space > 0 && !isNaN(c.slice(0, space).trim())) {
                                  currentObj[c.slice(space + 1).trim()] = c.slice(0, space).trim();
                                } 
                                else {
                                  currentObj[c.trim()] = "1";
                                }
                              });
                            }

                            const allTypes = [...new Set([...COMMON_CONNECTIONS, ...Object.keys(currentObj)])];

                            return allTypes.map(connType => (
                              <div key={connType} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={currentObj[connType] || ""}
                                  style={{ width: "60px", padding: "4px" }}
                                  onChange={(e) => handleConnectionChange(prop.name, connType, e.target.value)}
                                />
                                <span style={{ fontSize: "0.85em" }}>{connType}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    ) : prop.type === "select" ? (
                      <select
                        name={prop.name}
                        value={formData[prop.name] !== undefined ? formData[prop.name].toString() : ""}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val === "true") val = true;
                          if (val === "false") val = false;
                          handleInputChange({ target: { name: prop.name, value: val } });
                        }}
                        required={prop.required}
                      >
                        <option value="">Select...</option>
                        {availableOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : prop.type === "datalist" ? (
                      <>
                        <input
                          list={`${prop.name}-list`}
                          name={prop.name}
                          value={formData[prop.name] ?? ""}
                          onChange={handleInputChange}
                          required={prop.required}
                        />
                        <datalist id={`${prop.name}-list`}>
                          {availableOptions.map(opt => <option key={opt} value={opt} />)}
                        </datalist>
                      </>
                    ) : (
                      <input 
                        type={prop.type} 
                        name={prop.name} 
                        step={prop.step}
                        value={formData[prop.name] ?? ""} 
                        onChange={handleInputChange} 
                        required={prop.required} 
                      />
                    )}
                  </div>
                );
              })}

              <div className="modal-actions">
                <button type="submit" className="save-btn">Save</button>
                <button type="button" onClick={closeModal} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}