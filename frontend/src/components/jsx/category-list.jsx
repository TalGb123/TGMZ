import React, { useState, useContext } from "react";
import partsData from "../../assets/parts.json"; 
import "../css/category-list.css"; 

const CategoryList = ({ category, onSelect }) => {
    const [filter, setFilter] = useState("");
    
    // Safety check in case partsData[category] is undefined
    const parts = partsData[category] || [];

    const filteredParts = parts.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="category-list-container">
            <input 
                type="text" 
                placeholder="Filter parts..." 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="filter-input"
            />
            
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
                    {filteredParts.length > 0 ? (
                        filteredParts.map((part, index) => (
                            <tr key={index}>
                                <td>
                                    {/* Added a placeholder in case image is missing */}
                                    <img 
                                        src={part.image || "https://via.placeholder.com/60"} 
                                        alt={part.name} 
                                        className="part-image"
                                    />
                                </td>
                                <td style={{fontWeight: '500'}}>{part.name}</td>
                                <td className="part-price-cell">${part.price}</td>
                                <td style={{ textAlign: "right" }}>
                                    <button 
                                        onClick={() => onSelect(part)}
                                        className="add-btn"
                                    >
                                        Add
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="no-parts">
                                No parts found for {category}.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default CategoryList;