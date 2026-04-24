import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CategoryList from "./category-list"; 
import "../css/products.css";

const hardwareCategories = [
    { name: "CPU", dbName: "CPU" },
    { name: "CPU Cooler", dbName: "CPUCooler" },
    { name: "Motherboard", dbName: "Motherboard" },
    { name: "RAM", dbName: "Memory" },
    { name: "Storage", dbName: "Storage" },
    { name: "GPU", dbName: "VideoCard" },
    { name: "Power Supply", dbName: "PowerSupply" },
    { name: "Case", dbName: "Case" }
];

const Products = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const activeCategory = searchParams.get("category");

    const setCategory = (dbName) => {
        navigate(`/products?category=${dbName}`);
    };

    return (
        <div className="products-page-container">
            {!activeCategory ? (
                <>
                    <h2 style={{ textAlign: "center", marginBottom: "40px" }}>Browse Products by Category</h2>
                    <div className="category-bubbles-grid">
                        {hardwareCategories.map((cat, idx) => (
                            <div 
                                key={idx} 
                                className="category-bubble"
                                onClick={() => setCategory(cat.dbName)}
                            >
                                {cat.name}
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h2>{hardwareCategories.find(c => c.dbName === activeCategory)?.name || "Products"}</h2>
                        <button className="back-btn" onClick={() => navigate("/products")}>
                            ← Back to Categories
                        </button>
                    </div>

                    {/* Notice the viewMode="grid" prop! */}
                    <div className="products-table-container">
                        <CategoryList 
                            category={activeCategory} 
                            viewMode="grid" 
                            onSelect={(part) => console.log("Added to cart:", part)} 
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default Products;