import { useState, useEffect, useContext } from "react";
import "../css/questionnaire.css";
import { buildFilter } from "../../utils/build-filter.js";
import { ServerContext } from "../../App";

const Questionnaire = ({ onClose }) => {
    const { server } = useContext(ServerContext);

    const [usage, setUsage] = useState([]);
    const [budget, setBudget] = useState("");
    const [needsWifi, setNeedsWifi] = useState(null);
    const [preferences, setPreferences] = useState([]);

    const [dbColors, setDbColors] = useState([]);   

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
            <div className="modal-content">
                <div className="modal-header">
                    <h2>PC Builder Questionnaire</h2>
                    <button className="close-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
                
                <div className="questionnaire-body">
                    <h4>Welcome to the PC Builder Questionnaire! This tool will help us understand your preferences and requirements.</h4>
                    
                    <div className="questionnaire-questions">
                        
                        {/* 1. Usage (Multi-select) */}
                        <div className="question">
                            <label>1. What is your primary use for this PC? (Select multiple if needed)</label>
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

                        {/* 2. Budget (Number Input) */}
                        <div className="question">
                            <label>2. What is your max budget for this PC build? (ILS)</label>
                            <input 
                                type="number" 
                                className="q-input"
                                placeholder="Enter budget in ILS (e.g. 5000)" 
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                min="0"
                            />
                        </div>

                        {/* 3. WiFi + Bluetooth (Boolean) */}
                        <div className="question">
                            <label>3. Do you need built-in WiFi & Bluetooth?</label>
                            <div className="button-group">
                                <button 
                                    className={`q-btn ${needsWifi === true ? 'selected' : ''}`}
                                    onClick={() => setNeedsWifi(true)}
                                >
                                    Yes
                                </button>
                                <button 
                                    className={`q-btn ${needsWifi === false ? 'selected' : ''}`}
                                    onClick={() => setNeedsWifi(false)}
                                >
                                    No
                                </button>
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
                    
                    {/* Submit logic later */}
                    <div className="questionnaire-footer">
                        <button 
                            className="submit-btn" 
                            onClick={async () => {
                                // 1. Translate the answers
                                const rawAnswers = { usage, budget, needsWifi, preferences };
                                const strictFilters = buildFilter(rawAnswers, dbColors);
                                
                                console.log("--- 1. TRANSLATED FILTERS ---", strictFilters);
                                
                                try {
                                    // 2. Ask the database for all valid parts
                                    const res = await server.post('/builds/generate', strictFilters);
                                    
                                    // 3. Verify the filters worked!
                                    console.log("--- 2. PRE-FILTERED DATABASE PAYLOAD (Ready for Gemini) ---");
                                    console.log(res.data);
                                    
                                    // (Step 4 will eventually be: send res.data + user prompt to Gemini API)
                                    alert("Check your browser console to see the filtered hardware list!");
                                    
                                } catch (err) {
                                    console.error("Failed to fetch candidates from DB:", err);
                                }
                            }}
                        >
                            Test Database Filters
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Questionnaire;