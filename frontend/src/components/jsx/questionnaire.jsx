import { useState } from "react";
import "../css/questionnaire.css";

const Questionnaire = ({ onClose }) => {
    // State for all questions
    const [usage, setUsage] = useState([]);
    const [budget, setBudget] = useState("");
    const [needsWifi, setNeedsWifi] = useState(null); // null means nothing selected yet
    const [preferences, setPreferences] = useState([]);

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
                        <button className="submit-btn" onClick={() => console.log({ usage, budget, needsWifi, preferences })}>
                            See Recommendations
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Questionnaire;