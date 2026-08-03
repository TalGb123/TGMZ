import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ServerContext } from "../../App";
import "../css/summary.css";

const BuildSummary = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [build, setBuild] = useState(null);
    const [error, setError] = useState("");

    const { user, setUser, server } = useContext(ServerContext);

    const hwList = [
        { schemaKey: "cpu", name: "CPU" },
        { schemaKey: "cpu_cooler", name: "CPU Cooler" },
        { schemaKey: "motherboard", name: "Motherboard" },
        { schemaKey: "ram", name: "RAM" },
        { schemaKey: "storage", name: "Storage" },
        { schemaKey: "power_supply", name: "Power Supply" },
        { schemaKey: "gpu", name: "GPU" },
        { schemaKey: "case", name: "Case" },
    ];

    useEffect(() => {
        const fetchBuild = async () => {
            try {
                const res = await server.get(`/builds/${id}`);
                setBuild(res.data);
            } catch {
                setError("Build not found.");
            }
        };
        fetchBuild();
    }, [id, server]);

    if (error) return <div className="summary-container"><p className="error-msg">{error}</p></div>;
    if (!build) return <div className="summary-container"><p>Loading...</p></div>;

    const parts = hwList
        .filter(h => build[h.schemaKey])
        .map(h => ({ category: h.name, ...build[h.schemaKey] }));

    const total = parts.reduce((sum, p) => sum + (p.price || 0), 0);

    const handleSaveToProfile = async () => {
        const buildName = prompt("Enter a name for this build:", `Build #${build.buildID}`);
        if (!buildName) return;

        try {
            const response = await server.post(`/users/${user.id}/save-build`, {
                buildRef: build._id,
                buildName: buildName
            });
            
            if(response.status === 200) {
                alert("Build saved to your profile!");
                setUser(response.data.user);
            }
        } catch (error) {
            console.error("Failed to save build:", error);
            alert(error.response?.data?.message || "Failed to save build.");
        }
    };

    return (
        <div className="summary-container">
            <h2>Build #{build.buildID}</h2>

            <table className="summary-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Product</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {parts.map((p, i) => (
                        <tr key={i}>
                            <td>{p.category}</td>
                            <td>{p.name}</td>
                            <td>₪{p.price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="summary-total">Total: ₪{total}</div>

            <div className="summary-actions">
                <button onClick={() => navigate("/spec-builder", { state: { editBuildId: build.buildID } })}>Edit Build</button>
                {user && (
                    <button 
                        onClick={handleSaveToProfile} 
                        style={{ marginLeft: "10px", backgroundColor: "#28a745" }}
                    >
                        💾 Save to Profile
                    </button>
                )}
            </div>
        </div>
    );
};

export default BuildSummary;