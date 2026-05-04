import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { ServerContext } from "../../App";
import { useNavigate } from "react-router-dom";
import "../css/inventory.css";

const CATEGORIES = ["CPU", "CPUCooler", "Motherboard", "Memory", "Storage", "VideoCard", "PowerSupply", "Case"];

const CATEGORY_PROPS = {
  CPU: [
    { name: "brand", type: "text", label: "Brand" },
    { name: "socket", type: "text", label: "Socket", required: true },
    { name: "supported_memory", type: "text", label: "Memory Supported (e.g. DDR4)" },
    { name: "has_apu", type: "text", label: "Has APU" },
    { name: "tdp", type: "number", label: "TDP (W)" },
    { name: "core_count", type: "number", label: "Core Count", required: true },
    { name: "core_clock", type: "number", label: "Core Clock (GHz)", required: true, step: "0.1" },
    { name: "boost_clock", type: "number", label: "Boost Clock (GHz)", step: "0.1" },
  ],
  CPUCooler: [
    { name: "brand", type: "text", label: "Brand" },
    { name: "type", type: "text", label: "Type (e.g. Air, Liquid)" },
    { name: "radiator_size", type: "number", label: "Radiator Size (mm)" },
    { name: "supported_sockets", type: "text", label: "Supported Sockets (Comma separated)" },
    { name: "max_tdp_cooling", type: "number", label: "TDP Rating (W)" },
    { name: "height", type: "number", label: "Height (mm)" },
    { name: "noise_level", type: "text", label: "Noise Level (dB)" },
  ],
  Motherboard: [
    { name: "brand", type: "text", label: "Brand" },
    { name: "socket", type: "text", label: "Socket", required: true },
    { name: "form_factor", type: "text", label: "Form Factor", required: true },
    { name: "memory_gen", type: "text", label: "Memory Gen (e.g. DDR5)" },
    { name: "has_bluetooth_wifi", type: "text", label: "Has Bluetooth & WiFi (Yes/No)" },
    { name: "m2_slots", type: "number", label: "SSD NVMe Slots" },
    { name: "connections", type: "text", label: "Connections" },
  ],
  Memory: [
    { name: "brand", type: "text", label: "Brand" },
    { name: "speed", type: "text", label: "Speed (e.g. 3200,3600 for array)" },
    { name: "modules", type: "text", label: "Modules (e.g. 2,8 for 2x8GB)" },
    { name: "cas_latency", type: "number", label: "CAS Latency" },
  ],
  Storage: [
    { name: "brand", type: "text", label: "Brand" },
    { name: "capacity", type: "number", label: "Capacity", required: true },
    { name: "drive_type", type: "text", label: "Drive Type" },
    { name: "form_factor", type: "text", label: "Form Factor" },
  ],
  PowerSupply: [
    { name: "brand", type: "text", label: "Brand" },
    { name: "wattage", type: "number", label: "Wattage (W)", required: true },
    { name: "efficiency", type: "text", label: "Efficiency Rating" },
    { name: "type", type: "text", label: "Type (e.g. ATX)" },
    { name: "modular", type: "text", label: "Modular (Full/Semi/No)" },
  ],
  VideoCard: [
    { name: "brand", type: "text", label: "Brand" },
    { name: "chipset", type: "text", label: "Chipset", required: true },
    { name: "memory", type: "number", label: "Memory (GB)" },
    { name: "tdp", type: "number", label: "TDP (W)" },
    { name: "length", type: "number", label: "Length (mm)" },
    { name: "core_clock", type: "number", label: "Core Clock (MHz)" },
    { name: "boost_clock", type: "number", label: "Boost Clock (MHz)" },
    { name: "slots_required", type: "number", label: "Slots Required" },
    { name: "recommended_psu_wattage", type: "number", label: "Recommended PSU Wattage (W)" },
  ],
  Case: [
    { name: "brand", type: "text", label: "Brand" },
    { name: "type", type: "text", label: "Type (e.g. ATX Mid Tower)" },
    { name: "supported_mobo_form_factors", type: "text", label: "Supported Motherboard Form Factors" },
    { name: "max_gpu_length", type: "number", label: "GPU Length (mm)" },
    { name: "max_cpu_cooler_height", type: "number", label: "CPU Cooler Height (mm)" },
    { name: "psu_form_factor", type: "text", label: "PSU Form Factor" },
    { name: "supported_radiators", type: "text", label: "Supported Radiator Sizes (mm)" },
    { name: "side_panel", type: "text", label: "Side Panel" },
  ]
};

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
  }, [category]); // Fetch fresh when category changes

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
    setEditingItem(item);
    setFormData(item);
    setModalCategory(item.category || category || "CPU");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await server.delete(`/products/${id}`);
        setProducts(products.filter(p => p._id !== id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete item.");
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, category: modalCategory };
      
      // Basic split for array fields if they are typed as comma strings in the form
      if (modalCategory === "Memory") {
        if (typeof payload.speed === 'string') {
          payload.speed = payload.speed.split(',').map(s => Number(s.trim()));
        }
        if (typeof payload.modules === 'string') {
          payload.modules = payload.modules.split(',').map(s => Number(s.trim()));
        }
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
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save item. Make sure required fields are present.");
    }
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
                    if (!editingItem) setFormData({}); // clear forms when swiching category in add mode
                  }}
                  disabled={!!editingItem} // changing category on existing discriminator schema document is risky
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

              {/* Dynamic properties based on category */}
              <hr style={{ margin: "20px 0", borderColor: "var(--border-color, #ccc)" }} />
              <h4 style={{ marginBottom: "15px" }}>{modalCategory} Specific Properties</h4>
              
              {CATEGORY_PROPS[modalCategory]?.map((prop) => (
                <div className="form-group" key={prop.name}>
                  <label>{prop.label} {prop.required && "(Required)"}</label>
                  <input 
                    type={prop.type} 
                    name={prop.name} 
                    step={prop.step}
                    value={formData[prop.name] || ""} 
                    onChange={handleInputChange} 
                    required={prop.required} 
                  />
                </div>
              ))}

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