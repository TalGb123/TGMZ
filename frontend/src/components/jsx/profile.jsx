import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import '../css/profile.css';
import { ServerContext } from '../../App.jsx';

export default function Profile() {
    const { user, setUser, server } = useContext(ServerContext);
    
    const [userData, setUserData] = useState({
        id: '',
        name: '',
        email: '',
        phone: '',
        birthday: '',
        password: '',
        savedBuilds: []
    });
    
    const [errors, setErrors] = useState({});
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setUserData({
                id: user.id || '',
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                birthday: user.birthday || '',
                password: user.password || '',
                savedBuilds: user.savedBuilds || []
            });
        }
    }, [user]);

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

        if (!userData.name) newErrors.name = "Name is required";
        if (!userData.email) newErrors.email = "Email is required";
        if (!userData.phone) newErrors.phone = "Phone is required";
        if (!userData.birthday) newErrors.birthday = "Birthday is required";
        if (!userData.password) newErrors.password = "Password is required";

        if (userData.email) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@(walla|gmail)\.(com|co\.il)$/;
            if (!emailRegex.test(userData.email)) {
                newErrors.email = "Must be a Gmail or Walla address (.com or .co.il)";
            }
        }
        if (userData.phone) {
            const cleanPhone = userData.phone.replace(/-/g, ""); 
            if (!/^05\d{8}$/.test(cleanPhone)) {
                newErrors.phone = "Must start with 05 and contain 10 digits";
            }
        }
        if (userData.birthday) {
            if (!isOver21(userData.birthday)) {
                newErrors.birthday = "You must be over 21";
            }
        }
        if (userData.password) {
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
            if (!passRegex.test(userData.password)) {
                newErrors.password = "Must have 8+ chars, Uppercase, Lowercase, Number & Symbol";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
        // Clear specific error as user types
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!user) return;
        
        if (!validateForm()) return;

        setIsLoading(true);
        setStatusMessage({ type: '', text: '' });

        const updates = {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            birthday: userData.birthday,
            password: userData.password
        };

        try {
            const response = await server.patch(`/users/${user.id}`, updates);

            if (response.status === 200) {
                setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
                setUser({ ...user, ...updates }); 
            }
        } catch (error) {
            console.error("Profile update error:", error);
            setStatusMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Failed to update profile' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return <div className="profile-container">Please login to view your profile.</div>;
    }

    return (
        <div className="profile-container">
            <h2>My Profile</h2>
            
            {statusMessage.text && (
                <div className={`message ${statusMessage.type}`}>
                    {statusMessage.text}
                </div>
            )}

            <form className="profile-form" onSubmit={handleUpdateProfile}>
                <div className="form-group">
                    <label>ID (Cannot be changed)</label>
                    <input type="text" name="id" value={userData.id} disabled />
                </div>
                
                <div className="form-group">
                    <label>Name</label>
                    <input type="text" name="name" value={userData.name} onChange={handleInputChange} />
                    {errors.name && <span className="error-msg" style={{color: '#f04747', fontSize: '12px'}}>{errors.name}</span>}
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={userData.email} onChange={handleInputChange} />
                    {errors.email && <span className="error-msg" style={{color: '#f04747', fontSize: '12px'}}>{errors.email}</span>}
                </div>

                <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" name="phone" value={userData.phone} onChange={handleInputChange} />
                    {errors.phone && <span className="error-msg" style={{color: '#f04747', fontSize: '12px'}}>{errors.phone}</span>}
                </div>

                <div className="form-group">
                    <label>Birthday</label>
                    <input type="date" name="birthday" value={userData.birthday} onChange={handleInputChange} />
                    {errors.birthday && <span className="error-msg" style={{color: '#f04747', fontSize: '12px'}}>{errors.birthday}</span>}
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input type="text" name="password" value={userData.password} onChange={handleInputChange} />
                    {errors.password && <span className="error-msg" style={{color: '#f04747', fontSize: '12px'}}>{errors.password}</span>}
                </div>

                <button type="submit" className="save-btn" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Save Changes'}
                </button>
            </form>

            <hr style={{ margin: "30px 0", borderColor: "#444" }}/>
            
            <h3>My Saved Builds</h3>
            {userData.savedBuilds && userData.savedBuilds.length > 0 ? (
                <ul style={{ listStyleType: "none", padding: 0 }}>
                    {userData.savedBuilds.map((buildId, index) => (
                        <li key={index} style={{ marginBottom: "10px" }}>
                            <Link to={`/build/${buildId}`} style={{ color: "#7289da", textDecoration: "none" }}>
                                📄 PC Build #{buildId}
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p style={{ color: "#aaa" }}>You haven't saved any builds yet.</p>
            )}
        </div>
    );
}