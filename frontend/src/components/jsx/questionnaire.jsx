import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../css/questionnaire.css";
import { buildFilter } from "../../utils/build-filter.js";
import { ServerContext } from "../../App";

const Questionnaire = ({ onClose, onBuildGenerated }) => {
    const { server } = useContext(ServerContext);

    const [usage, setUsage] = useState([]);
    const [budget, setBudget] = useState("");
    const [needsWifi, setNeedsWifi] = useState(null);
    const [sizePreference, setSizePreference] = useState("No Preference");
    const [preferences, setPreferences] = useState([]);

    const [gameTypes, setGameTypes] = useState([]);
    const [resolution, setResolution] = useState(null);
    const [quality, setQuality] = useState(null);

    const [contentTypes, setContentTypes] = useState([]);
    const [aiTasks, setAiTasks] = useState([]);
    const [generalTask, setGeneralTask] = useState(null);
    const [storage, setStorage] = useState(null);

    const toggleGameType = (option) => setGameTypes(prev => prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option]);
    const toggleContent = (option) => setContentTypes(prev => prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option]);
    const toggleAi = (option) => setAiTasks(prev => prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option]);

    const [dbColors, setDbColors] = useState([]);   
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await server.get('/options/form-options');
                if (res.data && res.data.colors) {
                    setDbColors(res.data.colors);
                }
            } catch (err) {
                console.error("Failed to fetch distinct colors from DB", err);
            }
        };
        fetchOptions();
    }, [server]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && onClose) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Handlers for multi-select buttons
    const toggleUsage = (option) => {
        setUsage(prev => 
            prev.includes(option) 
                ? prev.filter(item => item !== option) 
                : [...prev, option]
        );
    };

    const togglePreference = (option) => {
        setPreferences(prev => 
            prev.includes(option) 
                ? prev.filter(item => item !== option) 
                : [...prev, option]
        );
    };

    return (
        <div className="modal-overlay">
            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <h3>Generating Your AI Build...</h3>
                    <p>Contacting Gemini, please wait.</p>
                </div>
            )}
            <div className="modal-content">
                <div className="modal-header">
                    <h2>PC Builder Questionnaire</h2>
                    <button className="close-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
                
                <div className="questionnaire-body">
                    <h4>Welcome to the PC Builder Questionnaire! This tool will help us understand your preferences and requirements.</h4>
                    
                    {/* 1. STICKY BUDGET PANEL */}
                    <div className="sticky-budget-panel">
                        <div className="question" style={{ marginBottom: 0 }}>
                            <label>1. What is your max budget for this PC build? (₪)</label>
                            <div className="budget-input-row">
                                <input 
                                    type="number" 
                                    className="q-input"
                                    placeholder="Enter budget in ₪ (e.g. 5000)" 
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    min="0"
                                />
                                {/* Placeholder for your future live price estimator */}
                                <div className="estimated-price-placeholder">
                                    Est. Price: 0 ₪
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SCROLLABLE AREA FOR THE REST OF THE QUESTIONS */}
                    <div className="questionnaire-scroll-area">
                        <div className="questionnaire-questions">
                            
                            {/* 2. Usage (Multi-select) */}
                            <div className="question">
                                <label>2. What is your primary use for this PC? (Select multiple if needed)</label>
                                <div className="button-group">
                                    {["Gaming", "Content Creation", "Training AI Models", "General Use"].map(option => (
                                        <button 
                                            key={option}
                                            className={`q-btn ${usage.includes(option) ? 'selected' : ''}`}
                                            onClick={() => toggleUsage(option)}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* --- CONDITIONAL GAMING SUB-QUESTIONS --- */}
                            {usage.includes("Gaming") && (
                                <div className="gaming-sub-questions">
                                    <div className="question sub-question">
                                        <label>↳ What types of games?</label>
                                        <div className="button-group mini">
                                            {["Esports/Shooters", "AAA/Heavy Story", "Indie/Casual", "Simulators"].map(option => (
                                                <button key={option} className={`q-btn mini-btn ${gameTypes.includes(option) ? 'selected' : ''}`} onClick={() => toggleGameType(option)}>{option}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="question sub-question">
                                        <label>↳ Target Resolution?</label>
                                        <div className="button-group mini">
                                            {["1080p", "1440p", "4K"].map(option => (
                                                <button key={option} className={`q-btn mini-btn ${resolution === option ? 'selected' : ''}`} onClick={() => setResolution(option)}>{option}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="question sub-question">
                                        <label>↳ Preferred Quality Settings?</label>
                                        <div className="button-group mini">
                                            {["Low/Competitive", "Medium", "High", "Ultra"].map(option => (
                                                <button key={option} className={`q-btn mini-btn ${quality === option ? 'selected' : ''}`} onClick={() => setQuality(option)}>{option}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- CONDITIONAL CONTENT CREATION SUB-QUESTIONS --- */}
                            {usage.includes("Content Creation") && (
                                <div className="gaming-sub-questions">
                                    <div className="question sub-question">
                                        <label>↳ What kind of content are you creating?</label>
                                        <div className="button-group mini">
                                            {["Video Editing", "3D Rendering/Animation", "Music Production", "Graphic Design/Photos"].map(option => (
                                                <button key={option} className={`q-btn mini-btn ${contentTypes.includes(option) ? 'selected' : ''}`} onClick={() => toggleContent(option)}>{option}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- CONDITIONAL AI SUB-QUESTIONS --- */}
                            {usage.includes("Training AI Models") && (
                                <div className="gaming-sub-questions">
                                    <div className="question sub-question">
                                        <label>↳ What type of AI workloads?</label>
                                        <div className="button-group mini">
                                            {["Large Language Models (LLMs)", "Image/Video Generation", "Data Science/Machine Learning"].map(option => (
                                                <button key={option} className={`q-btn mini-btn ${aiTasks.includes(option) ? 'selected' : ''}`} onClick={() => toggleAi(option)}>{option}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- CONDITIONAL GENERAL USE SUB-QUESTIONS --- */}
                            {usage.includes("General Use") && (
                                <div className="gaming-sub-questions">
                                    <div className="question sub-question">
                                        <label>↳ How intensive is your daily use?</label>
                                        <div className="button-group mini">
                                            {["Light (Web, Office, Movies)", "Heavy Multitasking (Lots of tabs/apps)"].map(option => (
                                                <button key={option} className={`q-btn mini-btn ${generalTask === option ? 'selected' : ''}`} onClick={() => setGeneralTask(option)}>{option}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. STORAGE REPLACEMENT */}
                            <div className="question">
                                <label>3. How much storage space do you need?</label>
                                <div className="button-group">
                                    {["500GB (Basic)", "1TB (Standard)", "2TB (Comfortable)", "4TB+ (Massive)"].map(option => (
                                        <button 
                                            key={option}
                                            className={`q-btn mini-btn ${storage === option ? 'selected' : ''}`}
                                            onClick={() => setStorage(option)}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 4. WiFi + Bluetooth */}
                            <div className="question">
                                <label>4. Do you need built-in WiFi & Bluetooth?</label>
                                <div className="button-group">
                                    <button 
                                        className={`q-btn mini-btn ${needsWifi === true ? 'selected' : ''}`}
                                        onClick={() => setNeedsWifi(true)}
                                    >
                                        Yes
                                    </button>
                                    <button 
                                        className={`q-btn mini-btn ${needsWifi === false ? 'selected' : ''}`}
                                        onClick={() => setNeedsWifi(false)}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>

                            {/* 5. Physical Size Preference */}
                            <div className="question">
                                <label>5. Do you have a preference for the physical size of the PC?</label>
                                <div className="button-group">
                                    {["Compact (Mini-ITX)", "Standard (Mid-Tower)", "Large (Full-Tower)", "No Preference"].map(option => (
                                        <button 
                                            key={option}
                                            className={`q-btn mini-btn ${sizePreference === option ? 'selected' : ''}`}
                                            onClick={() => setSizePreference(option)}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 4. Preferences (Multi-select) */}
                            <div className="question">
                                <label>4. Any specific preferences? (Select all that apply)</label>
                                <div className="button-group mini">
                                    {["Quiet PC", "White PC Build", "Black PC Build", "RGB Needed"].map(option => (
                                        <button 
                                            key={option}
                                            className={`q-btn mini-btn ${preferences.includes(option) ? 'selected' : ''}`}
                                            onClick={() => togglePreference(option)}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div> 
                    {/* End Scrollable Area */}
                    
                    {/* Submit logic */}
                    <div className="questionnaire-footer">
                        <button 
                            className="submit-btn" 
                            onClick={async () => {
                                const rawAnswers = { usage, budget, needsWifi, preferences, gameTypes, resolution, quality, contentTypes, aiTasks, generalTask, storage, sizePreference };
                                const strictFilters = buildFilter(rawAnswers, dbColors);
                                
                                setIsLoading(true);
                                try {
                                    // 1. Fetch the generated build from the server
                                    const res = await server.post('/builds/generate', strictFilters);
                                    
                                    console.log("Full Gemini JSON Response:", res.data);

                                    // 2. Pass the data back to SpecBuilder to populate the UI
                                    if (onBuildGenerated) {
                                        onBuildGenerated(res.data);
                                    }
                                    
                                } catch (err) {
                                    console.error("Failed to fetch candidates from DB:", err);
                                    alert("Failed to generate build. Check the console for details.");
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? "Generating Build..." : "Generate Build"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Questionnaire;