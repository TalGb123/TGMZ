import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ServerContext } from "../../App";
import "../css/Register.css";   


const Register = ()=>{
    const {server} = useContext(ServerContext)
    const navigate = useNavigate();

    const [id, setId] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [birthday, setBirthday] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [serverMsg, setServerMsg] = useState("");
    const [errors, setErrors] = useState({});

    const isValidIsraeliID = (id) => {
        let strId = String(id).trim();
        if (strId.length > 9 || strId.length < 5) return false;
        // Pad with zeros if less than 9 digits
        strId = strId.padStart(9, '0'); 
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            let num = Number(strId[i]);
            let step = num * ((i % 2) + 1);
            if (step > 9) step -= 9;
            sum += step;
        }
        return sum % 10 === 0;
    };

    const isOver21 = (dateString) => {
        if (!dateString) return false;
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 21;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!id) newErrors.id = "ID is required";
        if (!name) newErrors.name = "Name is required";
        if (!email) newErrors.email = "Email is required";
        if (!phone) newErrors.phone = "Phone is required";
        if (!birthday) newErrors.birthday = "Birthday is required";
        if (!password) newErrors.password = "Password is required";

        if (id) {
            if (!/^\d+$/.test(id)) {
                newErrors.id = "ID must contain numbers only";
            } else if (!isValidIsraeliID(id)) {
                newErrors.id = "Invalid Israeli ID (Check digit error)";
            }
        }
        if (email) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@(walla|gmail)\.(com|co\.il)$/;
            if (!emailRegex.test(email)) {
                newErrors.email = "Must be a Gmail or Walla address (.com or .co.il)";
            }
        }
        if (phone) {
            const cleanPhone = phone.replace(/-/g, ""); 
            if (!/^05\d{8}$/.test(cleanPhone)) {
                newErrors.phone = "Must start with 05 and contain 10 digits";
            }
        }
        if (birthday) {
            if (!isOver21(birthday)) {
                newErrors.birthday = "You must be over 21 to register";
            }
        }
        if (password) {
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
            if (!passRegex.test(password)) {
                newErrors.password = "Must have 8+ chars, Uppercase, Lowercase, Number & Symbol";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const RegisterHandler = async () => {
        setServerMsg("");
        if (!validateForm()) {
            return;
        }
        setLoading(true);
        try {
            const response = await server.post('/users/register', {
                id, name, email, phone, birthday, password
            })
            setServerMsg("✅ Registration Successful! Redirecting to login...");
            setTimeout(() => {
                navigate('/login'); 
            }, 2000);
        } 
        catch (error) {
            console.error('Error registering:', error);
            if (error.response && error.response.status === 409) {
                setServerMsg("❌ User ID already exists.");
            } else {
                setServerMsg("❌ Registration Failed. Try again.");
            }
            setLoading(false);
        } 
    }
    return (
        <div className="register-container">
            <h1>Page Register</h1>
            
            {/* ID Input */}
            <input 
                className="register-input" // Optional: Add class for styling
                type="text" 
                placeholder="ID (Teudat Zehut)" 
                onChange={(e) => setId(e.target.value)} 
            />
            {/* 3. Use className="error-msg" */}
            {errors.id && <span className="error-msg">{errors.id}</span>}

            {/* Name Input */}
            <input 
                className="register-input"
                type="text" 
                placeholder="Full Name" 
                onChange={(e) => setName(e.target.value)} 
            />
            {errors.name && <span className="error-msg">{errors.name}</span>}

            {/* Email Input */}
            <input 
                className="register-input"
                type="text" 
                placeholder="Email (Gmail/Walla only)" 
                onChange={(e) => setEmail(e.target.value)} 
            />
            {errors.email && <span className="error-msg">{errors.email}</span>}

            {/* Phone Input */}
            <input 
                className="register-input"
                type="text" 
                placeholder="Phone (05...)" 
                onChange={(e) => setPhone(e.target.value)} 
            />
            {errors.phone && <span className="error-msg">{errors.phone}</span>}

            {/* Birthday Input */}
            <div style={{display:'flex', flexDirection:'column'}}>
                <label style={{fontSize: '0.8rem'}}>Birthday:</label>
                <input 
                    className="register-input"
                    type="date" 
                    onChange={(e) => setBirthday(e.target.value)} 
                />
            </div>
            {errors.birthday && <span className="error-msg">{errors.birthday}</span>}

            {/* Password Input */}
            <input 
                className="register-input"
                type="password" 
                placeholder="Password" 
                onChange={(e) => setPassword(e.target.value)} 
            />
            {errors.password && <span className="error-msg">{errors.password}</span>}

            {/* Server Message with dynamic class */}
            {serverMsg && (
                <div className={`server-msg ${serverMsg.includes("✅") ? "success" : "error"}`}>
                    {serverMsg}
                </div>
            )}

            <button onClick={RegisterHandler} disabled={loading}>
                {loading ? "Processing..." : "Register"}
            </button>
        </div>
    );
}

export default Register