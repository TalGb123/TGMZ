import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import '../css/profile.css';
import { ServerContext } from '../../App.jsx';

const SavedBuildAccordion = ({ savedBuild, server, user, setUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(savedBuild.buildName);
    
    const buildData = savedBuild.buildRef;

    const handleRename = async () => {
        try {
            const res = await server.patch(`/users/${user.id}/rename-build`, {
                buildRef: buildData._id,
                newName: editName
            });
            setUser(res.data.user); 
            setIsEditing(false);
        } catch (error) {
            alert("Failed to rename build");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Remove this build from your profile?")) return;
        try {
            const res = await server.delete(`/users/${user.id}/remove-build/${buildData._id}`);
            setUser(res.data.user); 
        } catch (error) {
            alert("Failed to remove build");
        }
    };

    return (
        <div className="accordion-card">
            <div className="accordion-header">
                <div className="accordion-title-area">
                    <button onClick={() => setIsOpen(!isOpen)} className="accordion-toggle-btn">
                        {isOpen ? "▼" : "▶"}
                    </button>
                    
                    {isEditing ? (
                        <div style={{ display: "flex", gap: "5px" }}>
                            <input 
                                value={editName} 
                                onChange={(e) => setEditName(e.target.value)} 
                                style={{ padding: "4px", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#333", color: "white" }} 
                            />
                            <button onClick={handleRename} className="accordion-btn btn-view">Save</button>
                            <button onClick={() => setIsEditing(false)} className="accordion-btn btn-rename">Cancel</button>
                        </div>
                    ) : (
                        <strong style={{ fontSize: "1.1rem" }}>{savedBuild.buildName}</strong>
                    )}
                </div>

                <div className="accordion-actions">
                    <Link to={`/build/${buildData.buildID}`}>
                        <button className="accordion-btn btn-view">View/Load</button>
                    </Link>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="accordion-btn btn-rename">Rename</button>
                    )}
                    <button onClick={handleDelete} className="accordion-btn btn-delete">Delete</button>
                </div>
            </div>

            {/* EXPANDABLE CONTENT - NOW DYNAMIC */}
            {isOpen && (
                <div className="accordion-content">
                    {/* Maps through only the parts that actually exist in this build */}
                    {[
                        { key: 'cpu', label: 'CPU' },
                        { key: 'cpu_cooler', label: 'Cooler' },
                        { key: 'motherboard', label: 'Motherboard' },
                        { key: 'ram', label: 'RAM' },
                        { key: 'storage', label: 'Storage' },
                        { key: 'gpu', label: 'GPU' },
                        { key: 'power_supply', label: 'PSU' },
                        { key: 'case', label: 'Case' }
                    ].map(hw => 
                        buildData[hw.key] ? (
                            <div key={hw.key}><strong>{hw.label}:</strong> {buildData[hw.key].name}</div>
                        ) : null
                    )}
                    
                    {/* NEW: Display the Shareable Build ID */}
                    <div style={{ marginTop: "12px", color: "#7289da", fontWeight: "bold" }}>
                        Build ID: #{buildData.buildID}
                    </div>

                    <div className="accordion-date" style={{ marginTop: "5px" }}>
                        Saved on: {new Date(savedBuild.savedAt).toLocaleDateString()}
                    </div>
                </div>
            )}
        </div>
    );
};

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
    
    const [showPassword, setShowPassword] = useState(false);

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
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            value={userData.password} 
                            onChange={handleInputChange} 
                            style={{ flex: 1 }} 
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                padding: '8px 15px',
                                backgroundColor: '#5865F2',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    {errors.password && <span className="error-msg" style={{color: '#f04747', fontSize: '12px'}}>{errors.password}</span>}
                </div>

                <button type="submit" className="save-btn" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Save Changes'}
                </button>
            </form>

            <hr style={{ margin: "30px 0", borderColor: "#444" }}/>
            
            <h3>My Saved Builds</h3>
            {userData.savedBuilds && userData.savedBuilds.length > 0 ? (
                <div>
                    {userData.savedBuilds.map((savedBuild, index) => (
                        savedBuild.buildRef ? (
                            <SavedBuildAccordion 
                                key={index} 
                                savedBuild={savedBuild} 
                                server={server} 
                                user={user} 
                                setUser={setUser} 
                            />
                        ) : null
                    ))}
                </div>
            ) : (
                <p style={{ color: "#aaa" }}>You haven't saved any builds yet.</p>
            )}
        </div>
    );
}