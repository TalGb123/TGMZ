import React, { useState, useEffect, useContext } from "react";
import { ServerContext } from "../../App";
import partsData from "../../assets/parts.json"; 
import "../css/category-list.css"; 

// const CategoryList = ({ category, onSelect }) => {
//     const [filter, setFilter] = useState("");
    
//     // Safety check in case partsData[category] is undefined
//     const parts = partsData[category] || [];

//     const filteredParts = parts.filter(p => 
//         p.name.toLowerCase().includes(filter.toLowerCase())
//     );

//     return (
//         <div className="category-list-container">
//             <input 
//                 type="text" 
//                 placeholder="Filter parts..." 
//                 value={filter}
//                 onChange={(e) => setFilter(e.target.value)}
//                 className="filter-input"
//             />
            
//             <table className="parts-table">
//                 <thead>
//                     <tr>
//                         <th>Image</th>
//                         <th>Part Name</th>
//                         <th>Price</th>
//                         <th>Action</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {filteredParts.length > 0 ? (
//                         filteredParts.map((part, index) => (
//                             <tr key={index}>
//                                 <td>
//                                     {/* Added a placeholder in case image is missing */}
//                                     <img 
//                                         src={part.image || "https://via.placeholder.com/60"} 
//                                         alt={part.name} 
//                                         className="part-image"
//                                     />
//                                 </td>
//                                 <td style={{fontWeight: '500'}}>{part.name}</td>
//                                 <td className="part-price-cell">${part.price}</td>
//                                 <td style={{ textAlign: "right" }}>
//                                     <button 
//                                         onClick={() => onSelect(part)}
//                                         className="add-btn"
//                                     >
//                                         Add
//                                     </button>
//                                 </td>
//                             </tr>
//                         ))
//                     ) : (
//                         <tr>
//                             <td colSpan={4} className="no-parts">
//                                 No parts found for {category}.
//                             </td>
//                         </tr>
//                     )}
//                 </tbody>
//             </table>
//         </div>
//     );
// }

const CategoryList = ({ category, onSelect }) => {
    const { server } = useContext(ServerContext); // Get the axios instance
    const [parts, setParts] = useState([]); // State to hold data from DB
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("");

    // This runs every time the 'category' prop changes (e.g., switching from CPU to RAM)
    useEffect(() => {
        const fetchParts = async () => {
            setLoading(true);
            try {
                // Calls: http://localhost:3000/products/category/CPU (or Memory, etc.)
                const response = await server.get(`/products/category/${category}`);
                setParts(response.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch parts", err);
                setError("Could not load parts from server.");
            } finally {
                setLoading(false);
            }
        };

        if (category) {
            fetchParts();
        }
    }, [category, server]);

    // Client-side filtering on the data we got from server
    const filteredParts = parts.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="loading-spinner">Loading from Server...</div>;
    if (error) return <div className="error-msg">{error}</div>;

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
                            <tr key={part._id || index}> {/* Use MongoDB _id if available */}
                                <td>
                                    <img 
                                        src={part.image || "https://via.placeholder.com/60"} 
                                        alt={part.name} 
                                        className="part-image"
                                    />
                                </td>
                                <td style={{fontWeight: '500'}}>{part.name}</td>
                                <td className="part-price-cell">₪{part.price}</td>
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