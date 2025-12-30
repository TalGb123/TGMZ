import { useNavigate } from "react-router-dom"
import { useState, useContext } from "react"
import axios from "axios"
import { ServerContext } from "../../App.jsx"

const Login = () => {
    const navigate = useNavigate()
    const {server} = useContext(ServerContext)

    const [id, setId] = useState("");
    const [pass, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const LoginHandler = async (id, pass) => {
        setLoading(true)
        setError(null)

        const response = await server.get(`/login`, {
            params: { id, pass }
        }).then((response) => {
            if(response.status === 200){
                // Login successful
                setLoading(false)
                navigate('/spec-builder', { replace: true })
            }
            setLoading(false)
        }).catch((error) => {
            setLoading(false)
            console.log(error)
        });

       
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1>Page Login</h1>
            <input type="text" placeholder="id" onChange={(e) => setId(e.target.value)} />
            <input type="password" placeholder="password" onChange={(e) => setPassword(e.target.value)} />
            <button onClick={() => LoginHandler(id, pass)} disabled={loading}>
                {loading ? 'Checking...' : 'Login to gallery'}
            </button>
            <button onClick={() => navigate('/register', { replace: true })}>Register</button>
            {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </div>
    )
}
export default Login