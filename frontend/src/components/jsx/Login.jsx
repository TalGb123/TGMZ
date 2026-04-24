import { useNavigate } from "react-router-dom"
import { useState, useContext } from "react"
import axios from "axios"
import { ServerContext } from "../../App.jsx"
import "../css/Login.css";

const Login = () => {
    const navigate = useNavigate()
    const {server, setUser} = useContext(ServerContext)

    const [identifier, setIdentifier] = useState(""); // Can be ID or Email
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState("");

    const validateForm = () => {
        const newErrors = {};
        if (!identifier.trim()) {
            newErrors.identifier = "Please enter your ID or Email";
        }
        if (!password.trim()) {
            newErrors.password = "Please enter your password";
        }
        setFieldErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const LoginHandler = async (id, pass) => {
        setFieldErrors({});
        setGeneralError("");

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try{
            const response = await server.get(`/users/login`, {
            params: {
                id: identifier,
                pass: password
            }
        });

            if (response.status === 200) {
                setUser(response.data.user);

                // Login Successful
                setLoading(false);
                navigate('/spec-builder', { replace: true });
            }
        }
        catch (error) {
            setLoading(false);
            console.error(error);

            if (error.response && (error.response.status === 404 || error.response.status === 401)) {
                setGeneralError("❌ Wrong email/id and/or password");
            } else {
                setGeneralError("❌ Server Error. Please try again later.");
            }
        }
    }

    return (
        <form className="login-container" onSubmit={(e) => { e.preventDefault(); LoginHandler(); }}>
            <h1>Page Login</h1>
            
            {/* Identifier Input (ID or Email) */}
            <input 
                className="login-input"
                type="text" 
                placeholder="ID or Email" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)} 
            />
            {/* Specific error for empty ID/Email */}
            {fieldErrors.identifier && <span className="error-msg">{fieldErrors.identifier}</span>}

            {/* Password Input */}
            <input 
                className="login-input"
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
            />
            {/* Specific error for empty Password */}
            {fieldErrors.password && <span className="error-msg">{fieldErrors.password}</span>}

            {/* General Error Message (The Red Box for wrong credentials) */}
            {generalError && (
                <div className="general-error">
                    {generalError}
                </div>
            )}

            <button 
                type="submit"
                className="login-btn"
                disabled={loading}
            >
                {loading ? 'Checking...' : 'Login'}
            </button>

            <button 
                type="button"
                className="secondary-btn" 
                onClick={() => navigate('/register', { replace: true })}
            >
                Don't have an account? Register
            </button>
        </form>
    );
}
export default Login