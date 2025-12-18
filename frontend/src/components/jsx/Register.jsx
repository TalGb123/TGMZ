import { useState } from "react";


const Register = ()=>{

    const [id, setId] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [birthday, setBirthday] = useState("");
    const [password, setPassword] = useState("");

    const RegisterHandler = async (id,name,email,phone,birthday,password) => {
        try {
            const response = await fetch(`http://10.69.0.142:3000/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name, email, phone, birthday, password })
            })
        } catch (error) {
            console.error('Error registering:', error);
        }
    }

    return(<div style={{display:'flex',flexDirection:'column'}}>
        <h1>Page Register</h1>
        <input type="text" placeholder="id" onChange={(e) => setId(e.target.value)} />
        <input type="text"  placeholder="name" onChange={(e) => setName(e.target.value)} />
        <input type="text"  placeholder="email" onChange={(e) => setEmail(e.target.value)} />
        <input type="text"  placeholder="phone" onChange={(e) => setPhone(e.target.value)} />
        <input type="text" placeholder="birthday" onChange={(e) => setBirthday(e.target.value)} />
        <input type="text"  placeholder="password" onChange={(e) => setPassword(e.target.value)} />
        <button onClick={()=>{
            RegisterHandler(id,name,email,phone,birthday,password);
        }}>Register</button>

            
    </div>)
}
export default Register