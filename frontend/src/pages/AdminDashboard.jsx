import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [staff, setStaff] = useState([]);
  const [newStaff, setNewStaff] = useState({ staff_id: '', password: '', role: 'doctor', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchStaff();
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab]); // Re-run lucide on tab change

  const fetchStaff = async () => {
    try {
      const response = await api.get('/admin/users');
      setStaff(response.data);
    } catch (err) {
      console.error('Failed to fetch staff', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/admin/users', newStaff);
      setSuccess('Staff member added successfully!');
      setNewStaff({ staff_id: '', password: '', role: 'doctor', name: '' });
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add staff');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/admin/users/${id}`);
        fetchStaff();
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo">
          <i data-lucide="heart-pulse"></i><span>MediCore</span>
        </div>
        <nav>
          <a href="#" className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('analytics'); }}>
            <i data-lucide="bar-chart-3"></i> Analytics
          </a>
          <a href="#" className={`nav-link ${activeTab === 'workforce' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('workforce'); }}>
            <i data-lucide="users"></i> Workforce
          </a>
          <a href="#" className={`nav-link ${activeTab === 'financials' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('financials'); }}>
            <i data-lucide="landmark"></i> Financials
          </a>
          <a href="#" className={`nav-link ${activeTab === 'config' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('config'); }}>
            <i data-lucide="settings"></i> Config
          </a>
          <a href="#" className="nav-link" style={{ marginTop: 'auto', color: 'var(--danger)' }} onClick={(e) => { e.preventDefault(); handleLogout(); }}>
            <i data-lucide="log-out"></i> Logout
          </a>
        </nav>
      </div>

      <div className="top-nav">
        <div id="liveClock" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 16px', borderRadius: '99px', fontWeight: 700, fontSize: '14px' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=100&h=100" alt="Admin" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>{user.name || 'Admin Chief'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hospital Owner</div>
          </div>
        </div>
      </div>

      <div className="main-content">
        {activeTab === 'analytics' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}>Hospital Performance</h1>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon-box" style={{ background: '#E8F1FF', color: '#3B71FE' }}><i data-lucide="trending-up"></i></div>
                <div><div className="kpi-title">Monthly Revenue</div><div className="kpi-value" style={{ fontSize: '24px', fontWeight: 800 }}>₹84.2M</div></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-box" style={{ background: '#F4F1FF', color: '#8147FF' }}><i data-lucide="users"></i></div>
                <div><div className="kpi-title">Active Staff</div><div className="kpi-value" style={{ fontSize: '24px', fontWeight: 800 }}>{staff.length}</div></div>
              </div>
            </div>
            <div className="glass-card" style={{ marginTop: '32px' }}>
              <h3>Growth Insights</h3>
              <div style={{ height: '200px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid var(--border)', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <i data-lucide="pie-chart" style={{ width: '32px', height: '32px', marginRight: '12px' }}></i> Generating Real-time Analytics...
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workforce' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}>Hospital Staffing</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
              <div className="glass-card">
                <h3 style={{ marginBottom: '16px' }}>Add New Staff Account</h3>
                {error && <div style={{ color: 'red', marginBottom: '12px', background: '#FEF2F2', padding: '8px', borderRadius: '8px' }}>{error}</div>}
                {success && <div style={{ color: 'green', marginBottom: '12px', background: '#ECFDF5', padding: '8px', borderRadius: '8px' }}>{success}</div>}
                <form onSubmit={handleAddStaff}>
                  <div className="form-group">
                    <label>Name</label>
                    <input type="text" className="form-control" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Staff ID (Username)</label>
                    <input type="text" className="form-control" value={newStaff.staff_id} onChange={e => setNewStaff({...newStaff, staff_id: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" className="form-control" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select className="form-control" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}>
                      <option value="doctor">Doctor</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="lab">Laboratory</option>
                      <option value="pharmacy">Pharmacy</option>
                      <option value="patient">Patient</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                    {loading ? 'Adding...' : 'Create Account'}
                  </button>
                </form>
              </div>

              <div className="glass-card">
                <h3 style={{ marginBottom: '16px' }}>Registered Staff Roster</h3>
                <div className="table-wrapper">
                  <table className="elite-table">
                    <thead>
                      <tr><th>Name</th><th>Staff ID</th><th>Role</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {staff.map(user => (
                        <tr key={user._id || user.id}>
                          <td><b>{user.name}</b></td>
                          <td>{user.staff_id}</td>
                          <td><span className="status-badge available" style={{ textTransform: 'capitalize' }}>{user.role}</span></td>
                          <td>
                            {user.role !== 'admin' && (
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDeleteStaff(user._id || user.id)}>Revoke Access</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}>Financial Ledgers</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="glass-card">
                <h4>Operating Income</h4>
                <h2 style={{ color: 'var(--success)', fontSize: '32px', fontWeight: 800, margin: '16px 0' }}>+ ₹84,200,000</h2>
                <p className="text-muted">62% from Surgery</p>
              </div>
              <div className="glass-card">
                <h4>Monthly Burn</h4>
                <h2 style={{ color: 'var(--danger)', fontSize: '32px', fontWeight: 800, margin: '16px 0' }}>- ₹32,450,000</h2>
                <p className="text-muted">Managed via MediCore Finance</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}>System Configuration</h1>
            <div className="glass-card" style={{ maxWidth: '500px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Hospital Name</label>
                <input type="text" defaultValue="MediCore General" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: '#F8FAFC' }} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Update Global Settings</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
