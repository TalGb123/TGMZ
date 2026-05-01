import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CategoryList from "./category-list";
import Questionnaire from "./questionnaire";
import { ServerContext } from "../../App";      
import "../css/spec-builder.css"; 


const SpecBuilder = () => {
      const { server } = useContext(ServerContext);   
      const location = useLocation();
      const navigate = useNavigate();

      const hwList = [
            { id: 1, name: "CPU", dbName: "CPU", schemaKey: "cpu" },
            { id: 2, name: "CPU Cooler", dbName: "CPUCooler", schemaKey: "cpu_cooler" },
            { id: 3, name: "Motherboard", dbName: "Motherboard", schemaKey: "motherboard" },
            { id: 4, name: "RAM", dbName: "Memory", schemaKey: "ram" },
            { id: 5, name: "Storage", dbName: "Storage", schemaKey: "storage" },
            { id: 6, name: "Power Supply", dbName: "PowerSupply", schemaKey: "psu" },
            { id: 7, name: "GPU", dbName: "VideoCard", schemaKey: "gpu" },
            { id: 8, name: "Case", dbName: "Case", schemaKey: "case" }
      ];

      const [activeCategory, setActiveCategory] = useState(null);
      const [selections, setSelections] = useState({});

      const [searchId, setSearchId] = useState("");
      const [msg, setMsg] = useState("");

      const [isQuestionnaireActive, setIsQuestionnaireActive] = useState(false);

      useEffect(() => {
            const handleKeyDown = (e) => {
                  if (e.key === "Escape") {
                        if (isQuestionnaireActive) {
                              setIsQuestionnaireActive(false);
                        } else if (activeCategory) {
                              setActiveCategory(null);
                        }
                  }
            };
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
      }, [isQuestionnaireActive, activeCategory]);

      useEffect(() => {
      const editId = location.state?.editBuildId;
      if (!editId) return;

      const loadBuild = async () => {
            try {
                  const res = await server.get(`/builds/${editId}`);
                  const buildData = res.data;
                  const newSelections = {};
                  hwList.forEach(item => {
                  if (buildData[item.schemaKey]) {
                        newSelections[item.id] = buildData[item.schemaKey];
                  }
                  });
                  setSelections(newSelections);
            } catch (err) {
                  console.error(err);
            }
      };
      loadBuild();
      }, [location.state]);

      const handleSelect = (part) => {
            setSelections(prev => ({ ...prev, [activeCategory]: part }));
            setActiveCategory(null); 
      };

      const handleSave = async () => {
            if (Object.keys(selections).length === 0) {
                  setMsg("❌ Cannot save an empty build.");
                  return;
            }

            setMsg("Saving...");
            const payload = {};
            hwList.forEach(item => {
                  if (selections[item.id]) {
                        payload[item.schemaKey] = selections[item.id];
                  }
            });
            try {
                  const res = await server.post('/builds', payload);
                  setMsg(`✅ Saved! Build ID: ${res.data.id}`);
                  navigate(`/build/${res.data.id}`);
            } 
            catch (err) {
                  console.error(err);
                  setMsg("❌ Error saving build.");
            }
      };

      const handleSearch = async () => {
            const cleanId = searchId.trim();
            if (!cleanId) {
                  setMsg("⚠️ Please enter a Build ID.");
                  return;
            }
            setMsg("Loading...");
            try {
                  navigate(`/build/${cleanId}`);
                  setMsg("✅ Build Loaded Successfully!");
            } catch (err) {
                  console.error(err);
                  setMsg("❌ Build not found or invalid ID.");
            }
      };

      const handleClear = (id) => {
            setSelections(prev => {
                  const newSelections = { ...prev };
                  delete newSelections[id]; // Removes the key (e.g., id 1 for CPU)
                  return newSelections;
            });
      };

      const totalPrice = Object.values(selections).reduce((sum, item) => sum + (item.price || 0), 0);
      const activeCategoryName = hwList.find(c => c.id === activeCategory)?.name;

     return (
            <div className="spec-builder-container">
                  {/* HEADER AREA: Title & Search */}
                  <div className="spec-header-row">
                        <h2>
                              PC Spec Builder 
                        </h2>

                        <div className="search-container">
                              <input 
                                    className="search-input"
                                    type="text" 
                                    placeholder="Enter Build ID..." 
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                              />
                              <button className="search-btn" onClick={handleSearch}>Load</button>
                        </div>

                        <div className="products-container">
                              {/* Button to Trigger the "Modal" */}
                              <button 
                                    className="questionnaire-btn" 
                                    onClick={() => setIsQuestionnaireActive(true)}
                              >
                                    Open Questionnaire
                              </button>

                              {/* Render the separate component and pass the close function */}
                              {isQuestionnaireActive && (
                                    <Questionnaire onClose={() => setIsQuestionnaireActive(false)} />
                              )}
                        </div>
                  </div>

                  {/* FEEDBACK MESSAGE */}
                  {msg && (
                        <div className={`feedback-msg ${msg.includes("✅") ? "success" : "error"}`}>
                              {msg}
                        </div>
                  )}

                  {/* GRID AREA */}
                  <div className="spec-grid">
                  {hwList.map(item => {
                        const selected = selections[item.id];
                        return (
                              <div key={item.id} className="spec-card">
                                    <div className="card-header">{item.name}</div>
                                    <div className="card-body">
                                          {selected ? (
                                                <>
                                                <div className="part-name">{selected.name}</div>
                                                <div className="part-price">${selected.price}</div>
                                                <div className="part-image"><img src={selected.image} alt={selected.name} /></div>
                                                </>
                                          ) : (
                                                <span className="placeholder-text">None Selected</span>
                                          )}
                                    </div>
                                    <div className="card-footer">
                                          <button onClick={() => setActiveCategory(item.id)}>
                                                {selected ? "Change" : "Choose"}
                                          </button>
                                          {selected && (
                                                <button 
                                                      className="clear-btn" 
                                                      onClick={() => handleClear(item.id)}
                                                >
                                                      Clear
                                                </button>
                                          )}
                                    </div>
                              </div>
                        );
                  })}
                  </div>

                  {/* TOTAL BAR */}
                  <div className="total-bar">
                        Total: ${totalPrice}
                  </div>
                  
                  {/* SAVE BUTTON AREA */}
                  <div className="save-container">
                        <button onClick={handleSave} className="save-btn">
                              💾 Save This Build
                        </button>
                  </div>

                  {/* Modal Overlay (Unchanged) */}
                  {activeCategory && (
                  <div className="modal-overlay">
                        <div className="modal-content">
                              <div className="modal-header">
                              <h3>Choose {activeCategoryName}</h3>
                              <button className="close-btn" onClick={() => setActiveCategory(null)}>Close</button>
                              </div>
                              
                              <CategoryList 
                              category={hwList.find(c => c.id === activeCategory)?.dbName}
                              onSelect={handleSelect} 
                              selections={selections}
                              />
                        </div>
                  </div>
                  )}
            </div>
      );
};    

export default SpecBuilder;