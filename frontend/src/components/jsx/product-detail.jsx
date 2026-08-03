import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ServerContext } from '../../App';
import '../css/products.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { server } = useContext(ServerContext);
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await server.get(`/products/single/${id}`);
                setProduct(response.data);
            } catch (err) {
                setError('Failed to load product details.');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, server]);

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading product...</div>;
    if (error) return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>{error}</div>;
    if (!product) return null;

    const hiddenFields = ['_id', '__v', 'image', 'name', 'price', 'brand', 'category', 'inStock'];

    return (
        <div className="products-page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button className="back-btn" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
                ← Back
            </button>
            
            <div style={{ display: 'flex', gap: '40px', backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: '8px' }}>
                {/* Product Image */}
                <div style={{ flex: '1', minWidth: '300px' }}>
                    <img 
                        src={product.image || 'https://via.placeholder.com/300'} 
                        alt={product.name} 
                        style={{ width: '100%', borderRadius: '8px', objectFit: 'contain' }}
                    />
                </div>

                <div style={{ flex: '2' }}>
                    <span style={{ textTransform: 'uppercase', color: 'gray', fontSize: '0.9rem' }}>{product.category}</span>
                    <h1 style={{ marginTop: '5px', marginBottom: '15px' }}>{product.name}</h1>
                    <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>₪{product.price}</h2>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <span style={{ 
                            padding: '5px 10px', 
                            borderRadius: '15px', 
                            backgroundColor: product.inStock ? '#4CAF50' : '#f44336',
                            color: 'white',
                            fontSize: '0.85rem'
                        }}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                    </div>

                    <h3>Specifications</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Brand</td>
                                <td style={{ padding: '8px 0' }}>{product.brand}</td>
                            </tr>
                            {Object.entries(product).map(([key, value]) => {
                                if (hiddenFields.includes(key)) return null;
                                
                                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                const formattedValue = Array.isArray(value) ? value.join(', ') : String(value);

                                return (
                                    <tr key={key} style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{formattedKey}</td>
                                        <td style={{ padding: '8px 0' }}>{formattedValue}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;