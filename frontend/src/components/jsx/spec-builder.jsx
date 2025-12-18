import React, { useState } from "react";
import CategoryList from "./category-list";
import "../css/spec-builder.css"; 

const SpecBuilder = () => {
      const hwList = [
            { id: 1, name: "CPU" },
            { id: 2, name: "CPU Cooler" },
            { id: 3, name: "Motherboard" },
            { id: 4, name: "RAM" },
            { id: 5, name: "Storage" },
            { id: 6, name: "Power Supply" },
            { id: 7, name: "GPU" },
            { id: 8, name: "Case" }
      ];

      const [activeCategory, setActiveCategory] = useState(null);
      const [selections, setSelections] = useState({});

      const handleSelect = (part) => {
            setSelections(prev => ({ ...prev, [activeCategory]: part }));
            setActiveCategory(null); 
      };

      const totalPrice = Object.values(selections).reduce((sum, item) => sum + (item.price || 0), 0);
      const activeCategoryName = hwList.find(c => c.id === activeCategory)?.name;

      return (
            <div className="spec-builder-container">
                  <h2>PC Spec Builder</h2>

                  {/* Replaced Table with CSS Grid Container */}
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
                              </div>
                              </div>
                        );
                  })}
                  </div>

                  <div className="total-bar">
                  Total: ${totalPrice}
                  </div>

                  {/* Modal Overlay */}
                  {activeCategory && (
                  <div className="modal-overlay">
                        <div className="modal-content">
                              <div className="modal-header">
                              <h3>Choose {activeCategoryName}</h3>
                              <button className="close-btn" onClick={() => setActiveCategory(null)}>Close</button>
                              </div>
                              
                              <CategoryList 
                              category={activeCategoryName} 
                              onSelect={handleSelect} 
                              />
                        </div>
                  </div>
                  )}
            </div>
      );
};

export default SpecBuilder;