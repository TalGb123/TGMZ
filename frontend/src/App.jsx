import { useState } from 'react'
import './index.css'
import { Routes , Route, Link, useNavigate } from 'react-router-dom'
import Login from './components/jsx/Login.jsx'
import SpecBuilder from './components/jsx/spec-builder.jsx'
import Register from './components/jsx/Register.jsx'

function App() {
  const navigate = useNavigate()
  return (
    <>
    <div style={{position:''}}>
        <div style={{display:'flex',flexDirection:'row',gap:'10px',position:'fixed',top:0}}>
            <Link to="/login"replace >login</Link>
            <Link to="/register"  replace>register</Link>
            <Link to="/spec-builder" replace>spec-builder</Link>
            <button onClick={()=>{
             navigate('/',{replace:true})
            }}>Clear History</button>
        </div>
    </div>
    
    <Routes>
      <Route path='/' index element={<Login  navigate={navigate}/>} />
      <Route path='/login'  element={<Login navigate={navigate}/>}/>
      <Route path='/register' element={<Register navigate={navigate}/>}/>
      <Route path='/spec-builder' element={<SpecBuilder navigate={navigate}/>}/>
    </Routes>
    </>
  )
}

export default App
