import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [staff, setStaff] = useState([]);
  const [newStaff, setNewStaff] = useState({ staff_id: '', password: '', role: 'doctor', name: '', max_slots: 10 });
  
  // Hospital-wide Supply Chain Alerts state
  const [inventoryAlerts, setInventoryAlerts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [selectedStaffToRevoke, setSelectedStaffToRevoke] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const inputStyle = {
    width: '100%',
    height: '48px',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '0 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1E293B',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 800,
    color: '#475569',
    marginBottom: '8px',
    fontFamily: "'Outfit', sans-serif"
  };

  const btnStyle = {
    width: '100%',
    height: '48px',
    background: '#2563EB',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '24px',
    transition: 'all 0.2s ease',
  };

  useEffect(() => {
    fetchStaff();
    fetchInventoryAlerts();
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, showProfileMenu, showAddStaffModal, showRevokeConfirm]);

  const fetchInventoryAlerts = async () => {
    try {
      const response = await api.get('/admin/inventory-alerts');
      setInventoryAlerts(response.data);
    } catch (err) {
      console.error('Failed to load inventory alerts', err);
    }
  };

  const handleAdminRestock = async (alertItem) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (alertItem.department === 'Pharmacy') {
        const currentQty = alertItem.rawItem.stock || 0;
        await api.put(`/medicines/${alertItem._id}`, { stock: currentQty + 100 });
      } else {
        await api.put(`/lab-inventory/${alertItem._id}`, { isRestock: true, addQty: 100 });
      }
      setSuccess(`Successfully replenished stock for ${alertItem.name}!`);
      fetchInventoryAlerts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to replenish stock');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

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
      setNewStaff({ staff_id: '', password: '', role: 'doctor', name: '', max_slots: 10 });
      setShowAddStaffModal(false);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add staff');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/users/${id}`);
      setSuccess('Access revoked successfully!');
      fetchStaff();
      setShowRevokeConfirm(false);
      setSelectedStaffToRevoke(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to revoke staff access');
      setShowRevokeConfirm(false);
    } finally {
      setLoading(false);
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
          <a href="#" className={`nav-link ${activeTab === 'supply' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('supply'); }}>
            <i data-lucide="package-search"></i> Supply Chain
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '17px', fontWeight: 950, color: 'var(--primary)', letterSpacing: '-0.5px' }}>MediCore</span>
            <span style={{ fontSize: '10px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: '99px', fontWeight: 700 }} className="desktop-only-inline">
              Admin Console
            </span>
          </div>
          <div id="liveClock" className="desktop-only-flex" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 16px', borderRadius: '99px', fontWeight: 700, fontSize: '14px' }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', cursor: 'pointer', position: 'relative' }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }} className="desktop-only-flex">
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D23' }}>{user.name || 'Admin Chief'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hospital Owner</div>
          </div>
          <img src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=100&h=100" alt="Admin" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
          
          {showProfileMenu && (
            <div className="glass-card animate-in" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '180px', zIndex: 1200, padding: '12px' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '8px 12px', marginBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontWeight: 800, fontSize: '13px' }}>{user.name || 'Admin Chief'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email || 'admin@medicore.com'}</div>
              </div>
              <div className="dropdown-item" onClick={() => { setActiveTab('analytics'); setShowProfileMenu(false); }}><i data-lucide="user"></i> Analytics</div>
              <div className="dropdown-item" onClick={() => { setActiveTab('config'); setShowProfileMenu(false); }}><i data-lucide="settings"></i> Settings</div>
              <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '8px', paddingTop: '8px' }}>
                <div className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}><i data-lucide="log-out"></i> Logout</div>
              </div>
            </div>
          )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>Hospital Staffing</h1>
              <button className="btn btn-primary mobile-only-flex" onClick={() => setShowAddStaffModal(true)} style={{ gap: '8px' }}>
                <i data-lucide="plus" style={{ width: '16px' }}></i> Add Staff
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }} className="mobile-stack">
              <div className="glass-card desktop-only-flex" style={{ flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '16px' }}>Add New Staff Account</h3>
                {error && <div style={{ color: 'red', marginBottom: '12px', background: '#FEF2F2', padding: '8px', borderRadius: '8px' }}>{error}</div>}
                {success && <div style={{ color: 'green', marginBottom: '12px', background: '#ECFDF5', padding: '8px', borderRadius: '8px' }}>{success}</div>}
                <form onSubmit={handleAddStaff}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Name</label>
                    <input type="text" style={inputStyle} value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="e.g. Dr. Jane Smith" required />
                  </div>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Staff ID (Username)</label>
                    <input type="text" style={inputStyle} value={newStaff.staff_id} onChange={e => setNewStaff({...newStaff, staff_id: e.target.value})} placeholder="e.g. janesmith" required />
                  </div>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Password</label>
                    <input type="password" style={inputStyle} value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} placeholder="••••••••" required />
                  </div>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Role</label>
                    <select style={inputStyle} value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}>
                      <option value="doctor">Doctor</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="lab">Laboratory</option>
                      <option value="pharmacy">Pharmacy</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {newStaff.role === 'doctor' && (
                    <div className="form-group" style={{ animation: 'fadeIn 0.2s ease-out', marginBottom: '16px' }}>
                      <label style={labelStyle}>Daily Max Slots Control</label>
                      <input type="number" style={inputStyle} min="1" max="100" value={newStaff.max_slots} onChange={e => setNewStaff({...newStaff, max_slots: Number(e.target.value)})} required />
                    </div>
                  )}
                  <button type="submit" disabled={loading} style={btnStyle}>
                    {loading ? 'Adding...' : 'Create Account'}
                  </button>
                </form>
              </div>

              <div className="glass-card">
                <h3 style={{ marginBottom: '16px' }}>Registered Staff Roster</h3>
                <div className="table-wrapper">
                  <table className="elite-table">
                    <thead>
                      <tr><th>Name</th><th>Staff ID</th><th>Role</th><th>Daily Max Slots</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {staff.map(user => (
                        <tr key={user._id || user.id}>
                          <td><b>{user.name}</b></td>
                          <td>{user.staff_id}</td>
                          <td><span className="status-badge available" style={{ textTransform: 'capitalize' }}>{user.role}</span></td>
                          <td><b>{user.role === 'doctor' ? (user.max_slots || 10) : '-'}</b></td>
                          <td>
                            {user.role !== 'admin' && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '12px', borderColor: '#FCA5A5', color: '#EF4444' }} 
                                onClick={() => {
                                  setSelectedStaffToRevoke({ id: user._id || user.id, name: user.name });
                                  setShowRevokeConfirm(true);
                                }}
                              >
                                Revoke Access
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Mobile dialog overlay for adding staff */}
            {showAddStaffModal && (
              <div className="modal-overlay" onClick={() => setShowAddStaffModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                <div className="glass-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', padding: '24px', position: 'relative', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>Add New Staff Account</h3>
                    <button onClick={() => setShowAddStaffModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><i data-lucide="x" style={{ width: '20px' }}></i></button>
                  </div>
                  {error && <div style={{ color: 'red', marginBottom: '12px', background: '#FEF2F2', padding: '8px', borderRadius: '8px' }}>{error}</div>}
                  {success && <div style={{ color: 'green', marginBottom: '12px', background: '#ECFDF5', padding: '8px', borderRadius: '8px' }}>{success}</div>}
                  <form onSubmit={handleAddStaff}>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Name</label>
                      <input type="text" style={inputStyle} value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="e.g. Dr. Jane Smith" required />
                    </div>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Staff ID (Username)</label>
                      <input type="text" style={inputStyle} value={newStaff.staff_id} onChange={e => setNewStaff({...newStaff, staff_id: e.target.value})} placeholder="e.g. janesmith" required />
                    </div>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Password</label>
                      <input type="password" style={inputStyle} value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} placeholder="••••••••" required />
                    </div>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Role</label>
                      <select style={inputStyle} value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}>
                        <option value="doctor">Doctor</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="lab">Laboratory</option>
                        <option value="pharmacy">Pharmacy</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    {newStaff.role === 'doctor' && (
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Daily Max Slots Control</label>
                        <input type="number" style={inputStyle} min="1" max="100" value={newStaff.max_slots} onChange={e => setNewStaff({...newStaff, max_slots: Number(e.target.value)})} required />
                      </div>
                    )}
                    <button type="submit" disabled={loading} style={btnStyle}>
                      {loading ? 'Adding...' : 'Create Account'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'supply' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>Supply Chain & Replenishment</h1>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Centralized hospital inventory health monitor</p>
            </div>

            {success && <div style={{ color: 'green', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><i data-lucide="check-circle"></i>{success}</div>}
            {error && <div style={{ color: 'red', background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '12px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><i data-lucide="alert-triangle"></i>{error}</div>}

            <div className="glass-card" style={{ padding: 0 }}>
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, fontWeight: 800 }}>Critical Stock Warnings</h3>
              </div>
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Current Stock</th>
                      <th>Alert Status</th>
                      <th>Replenishment Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryAlerts.map(alert => (
                      <tr key={`${alert.department}-${alert._id}`}>
                        <td>
                          <span style={{ 
                            background: alert.department === 'Pharmacy' ? '#EFF6FF' : '#F5F3FF', 
                            color: alert.department === 'Pharmacy' ? '#2563EB' : '#7C3AED',
                            padding: '4px 10px',
                            borderRadius: '99px',
                            fontWeight: 700,
                            fontSize: '11px',
                            textTransform: 'uppercase'
                          }}>
                            {alert.department}
                          </span>
                        </td>
                        <td><b>{alert.name}</b></td>
                        <td>{alert.category}</td>
                        <td style={{ fontWeight: 700, color: '#EF4444' }}>{alert.stock}</td>
                        <td>
                          <span className="status-badge critical">
                            {alert.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-primary" 
                            disabled={loading}
                            style={{ padding: '6px 14px', fontSize: '12px', background: '#10B981', borderColor: '#10B981' }}
                            onClick={() => handleAdminRestock(alert)}
                          >
                            Approve & Restock (+100)
                          </button>
                        </td>
                      </tr>
                    ))}
                    {inventoryAlerts.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontWeight: 600 }}>
                          <i data-lucide="shield-check" style={{ width: '48px', height: '48px', color: '#10B981', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }}></i>
                          All hospital departments are fully supplied! No active warnings.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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

      <div className="mobile-bottom-nav">
        <div className={`mob-nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><i data-lucide="bar-chart-3"></i><span>Analytics</span></div>
        <div className={`mob-nav-item ${activeTab === 'workforce' ? 'active' : ''}`} onClick={() => setActiveTab('workforce')}><i data-lucide="users"></i><span>Workforce</span></div>
        <div className={`mob-nav-item ${activeTab === 'supply' ? 'active' : ''}`} onClick={() => setActiveTab('supply')}><i data-lucide="package-search"></i><span>Supply</span></div>
        <div className={`mob-nav-item ${activeTab === 'financials' ? 'active' : ''}`} onClick={() => setActiveTab('financials')}><i data-lucide="landmark"></i><span>Financials</span></div>
        <div className={`mob-nav-item ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}><i data-lucide="settings"></i><span>Config</span></div>
      </div>

      {/* Premium Revoke Confirmation Modal */}
      {showRevokeConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.2s ease-out' }}>
          <div className="glass-card" style={{ width: '440px', padding: '32px', background: 'white', borderRadius: '16px', border: '1px solid #FCA5A5', boxShadow: '0 20px 25px -5px rgba(220, 38, 38, 0.1)' }}>
            
            {/* Warning Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i data-lucide="shield-alert" style={{ width: '28px', height: '28px' }}></i>
              </div>
            </div>

            <h3 style={{ textAlign: 'center', margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>Revoke Staff Access</h3>
            <p style={{ textAlign: 'center', margin: '0 0 24px 0', fontSize: '14px', color: '#64748B', lineHeight: '20px', fontWeight: 500 }}>
              Are you sure you want to permanently revoke system access for <b style={{ color: '#1E293B' }}>{selectedStaffToRevoke?.name}</b>?<br />
              This staff member will no longer be able to log in.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, height: '44px', justifyContent: 'center', fontWeight: 700, borderRadius: '10px' }}
                onClick={() => {
                  setShowRevokeConfirm(false);
                  setSelectedStaffToRevoke(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, height: '44px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                onClick={() => handleDeleteStaff(selectedStaffToRevoke?.id)}
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
