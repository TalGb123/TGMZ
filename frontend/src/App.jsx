import { useState, createContext } from 'react'
import './index.css'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './components/jsx/login.jsx'
import SpecBuilder from './components/jsx/spec-builder.jsx'
import Register from './components/jsx/register.jsx'
import axios from 'axios'
import BuildSummary from './components/jsx/summary.jsx'

export const ServerContext = createContext()

function App() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null); 

  const [theme, setTheme] = useState('light')

  const server = axios.create({
    baseURL: `http://localhost:${import.meta.env.VITE_SERVER_PORT}`
  })

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  }

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  return (
    <div className={`app-container ${theme}`}>
      <ServerContext.Provider value={{ server, user, setUser}}>
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/">🖥️ TGMZ</Link>
          </div>
          
          <ul className="nav-menu">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/spec-builder">Build PC</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/about">About</Link></li>
          </ul>
          
          <div className="nav-right">
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'light' ? '☀️' : '🌙'}
            </button>
            {user ? (
                // IF LOGGED IN: Show Name + Logout
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>Hello, {user.name}</span>
                    <button onClick={handleLogout} className="nav-btn" style={{backgroundColor: 'red'}}>
                        Logout
                    </button>
                </div>
            ) : (
                // IF GUEST: Show Login + Register
                <>
                    <Link to="/login" className="nav-btn login-btn">Login</Link>
                    <Link to="/register" className="nav-btn register-btn">Register</Link>
                </>
            )}
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Login navigate={navigate} />} />
            <Route path="/login" element={<Login navigate={navigate} />} />
            <Route path="/register" element={<Register navigate={navigate} />} />
            <Route path="/spec-builder" element={<SpecBuilder navigate={navigate} />} />
            <Route path="/build/:id" element={<BuildSummary />} />
          </Routes>
        </main>
      </ServerContext.Provider>
    </div>
  )
}

export default App
