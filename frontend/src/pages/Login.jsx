import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Login = () => {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        staff_id: staffId,
        password: password
      });

      const { token, user } = response.data;
      
      // Save to local storage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect based on role
      switch (user.role) {
        case 'admin': navigate('/admin'); break;
        case 'doctor': navigate('/doctor'); break;
        case 'receptionist': navigate('/receptionist'); break;
        case 'patient': navigate('/patient'); break;
        case 'lab': navigate('/lab'); break;
        case 'pharmacy': navigate('/pharmacy'); break;
        default: navigate('/'); break;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div className="glass-card" style={{ width: '400px', padding: '32px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#1A1D1F' }}>MediCore Login</h2>
        
        {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', border: '1px solid #FCA5A5' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Staff ID</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Enter Staff ID"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
