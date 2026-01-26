import { useState, createContext } from 'react'
import './index.css'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './components/jsx/Login.jsx'
import SpecBuilder from './components/jsx/spec-builder.jsx'
import Register from './components/jsx/Register.jsx'
import axios from 'axios'

export const ServerContext = createContext()

function App() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState('dark')
  const server = axios.create({
    baseURL: `http://localhost:${import.meta.env.VITE_SERVER_PORT}`
  })

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  return (
    <div className={`app-container ${theme}`}>
      <ServerContext.Provider value={{ server }}>
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
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <Link to="/login" className="nav-btn login-btn">Login</Link>
            <Link to="/register" className="nav-btn register-btn">Register</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Login navigate={navigate} />} />
            <Route path="/login" element={<Login navigate={navigate} />} />
            <Route path="/register" element={<Register navigate={navigate} />} />
            <Route path="/spec-builder" element={<SpecBuilder navigate={navigate} />} />
          </Routes>
        </main>
      </ServerContext.Provider>
    </div>
  )
}

export default App
