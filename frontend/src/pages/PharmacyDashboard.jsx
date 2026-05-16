import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const PharmacyDashboard = () => {
  const [activeTab, setActiveTab] = useState('dash');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [inventory, setInventory] = useState([
    { id: 1, name: "Paracetamol 650mg", category: "Pain Relief", sku: "PAR-650", stock: 250, unit: "Strip", mrp: 25.00, status: "In Stock", expiry: "30/06/2025" },
    { id: 2, name: "Azithromycin 500mg", category: "Antibiotic", sku: "AZI-500", stock: 0, unit: "Strip", mrp: 55.00, status: "Out of Stock", expiry: "--" },
    { id: 3, name: "Cetirizine 10mg", category: "Anti-Allergic", sku: "CET-10", stock: 12, unit: "Strip", mrp: 18.00, status: "Low Stock", expiry: "15/08/2024" },
    { id: 4, name: "Pantoprazole 40mg", category: "Antacid", sku: "PAN-40", stock: 145, unit: "Strip", mrp: 45.00, status: "In Stock", expiry: "22/12/2025" },
    { id: 5, name: "Amoxicillin 250mg", category: "Antibiotic", sku: "AMX-250", stock: 50, unit: "Capsule", mrp: 35.00, status: "In Stock", expiry: "10/11/2024" }
  ]);

  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/prescriptions');
      setPrescriptions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const [alerts, setAlerts] = useState([
    { id: "ALT-1", item: "Azithromycin 500mg", type: "Out of Stock", severity: "High", date: "Today" },
    { id: "ALT-2", item: "Cetirizine 10mg", type: "Low Stock", severity: "Medium", date: "Yesterday" },
    { id: "ALT-3", item: "Cough Syrup 100ml", type: "Expiring Soon", severity: "Medium", date: "2 Days Ago" }
  ]);

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, showProfileMenu]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const dispensePrescription = async (id) => {
    try {
      await api.put(`/prescriptions/${id}`, { status: 'Dispensed' });
      fetchData();
      alert('Prescription Dispensed Successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to dispense prescription');
    }
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo">
          <i data-lucide="heart-pulse" style={{ color: 'var(--primary)' }}></i>
          <span>MediCore</span>
        </div>
        <nav>
          <a href="#" className={`nav-link ${activeTab === 'dash' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dash'); }}><i data-lucide="layout-grid"></i> Overview</a>
          <a href="#" className={`nav-link ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('prescriptions'); }}><i data-lucide="file-text"></i> Prescriptions</a>
          <a href="#" className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('inventory'); }}><i data-lucide="package"></i> Inventory</a>
          <a href="#" className={`nav-link ${activeTab === 'stock-alerts' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('stock-alerts'); }}><i data-lucide="alert-triangle"></i> Stock Alerts</a>
          <a href="#" className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('reports'); }}><i data-lucide="bar-chart-2"></i> Reports</a>
          <a href="#" className="nav-link" style={{ marginTop: 'auto', color: 'var(--danger)' }} onClick={(e) => { e.preventDefault(); handleLogout(); }}><i data-lucide="log-out"></i> Logout</a>
        </nav>
      </div>

      <div className="top-nav">
        <div id="liveClock" className="desktop-only-flex" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 16px', borderRadius: '99px', fontWeight: 700, fontSize: '14px' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', cursor: 'pointer', position: 'relative' }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }} className="desktop-only-flex">
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D23' }}>{user.name || 'Pharmacist'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Staff ID: #PH-202</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            {user.name ? user.name.substring(0, 2).toUpperCase() : 'PH'}
          </div>

          {showProfileMenu && (
            <div className="glass-card animate-in" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '220px', zIndex: 1200, padding: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '8px 12px', marginBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontWeight: 800, fontSize: '13px' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
              <div className="dropdown-item" onClick={() => { setActiveTab('dash'); setShowProfileMenu(false); }} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}><i data-lucide="user" style={{ width: '16px' }}></i> My Profile</div>
              <div className="dropdown-item" onClick={() => { setActiveTab('reports'); setShowProfileMenu(false); }} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}><i data-lucide="settings" style={{ width: '16px' }}></i> Settings</div>
              <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '8px', paddingTop: '8px' }}>
                <div className="dropdown-item" onClick={handleLogout} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--danger)', cursor: 'pointer' }}><i data-lucide="log-out" style={{ width: '16px' }}></i> Logout</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="main-content">
        {activeTab === 'dash' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="dashboard-header" style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1A1D23' }}>Pharmacy Overview</h1>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '14px' }}>Real-time inventory and metrics.</p>
            </div>

            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="kpi-card" onClick={() => setActiveTab('inventory')} style={{ cursor: 'pointer' }}>
                <div className="kpi-icon-box" style={{ background: '#EFF6FF', color: '#3B82F6' }}><i data-lucide="package"></i></div>
                <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Total Items</div><div style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D23' }}>1,245</div></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-box" style={{ background: '#ECFDF5', color: '#10B981' }}><i data-lucide="check-circle"></i></div>
                <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>In Stock</div><div style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D23' }}>985</div></div>
              </div>
              <div className="kpi-card" onClick={() => setActiveTab('stock-alerts')} style={{ cursor: 'pointer' }}>
                <div className="kpi-icon-box" style={{ background: '#FFFBEB', color: '#F59E0B' }}><i data-lucide="alert-triangle"></i></div>
                <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Low Stock</div><div style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D23' }}>12</div></div>
              </div>
              <div className="kpi-card" onClick={() => setActiveTab('stock-alerts')} style={{ cursor: 'pointer' }}>
                <div className="kpi-icon-box" style={{ background: '#FEF2F2', color: '#EF4444' }}><i data-lucide="package-x"></i></div>
                <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Out of Stock</div><div style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D23' }}>8</div></div>
              </div>
            </div>

            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
              <div>
                <div className="glass-card" style={{ marginBottom: '32px' }}>
                  <div className="flex-between" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Prescriptions Queue</h3>
                    <div style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} onClick={() => setActiveTab('prescriptions')}>View All →</div>
                  </div>
                  <div className="table-responsive">
                    <table className="elite-table" style={{ margin: 0 }}>
                      <thead style={{ background: '#F8FAFC' }}>
                        <tr><th>Prescription ID</th><th>Patient</th><th>Status</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {prescriptions.filter(p => p.status === 'Pending').map(p => (
                          <tr key={p._id}>
                            <td><b style={{ color: 'var(--primary)' }}>#{p._id.substring(18).toUpperCase()}</b></td>
                            <td><div style={{ fontWeight: 700 }}>{p.patientId?.name || 'Unknown'}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.patientId?.gender}</div></td>
                            <td><span className="status-badge pending" style={{ fontSize: '11px' }}>{p.status}</span></td>
                            <td><button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={() => dispensePrescription(p._id)}>Dispense</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div>
                 <div className="glass-card">
                   <div className="flex-between" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                     <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Stock Alerts</h3>
                     <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }} onClick={() => setActiveTab('stock-alerts')}>All →</span>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {alerts.slice(0,3).map(a => (
                       <div key={a.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '12px', borderLeft: `3px solid ${a.severity === 'High' ? 'var(--danger)' : 'var(--warning)'}` }}>
                         <div style={{ flex: 1 }}>
                           <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D23' }}>{a.item}</div>
                           <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{a.type} • {a.date}</div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="dashboard-header" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Prescriptions</h2>
            </div>
            <div className="glass-card">
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0 }}>
                  <thead style={{ background: '#F8FAFC' }}>
                    <tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {prescriptions.map(p => (
                      <tr key={p._id}>
                        <td><b style={{ color: 'var(--primary)' }}>#{p._id.substring(18).toUpperCase()}</b></td>
                        <td><div style={{ fontWeight: 700 }}>{p.patientId?.name}</div></td>
                        <td>{p.doctorId?.name}</td>
                        <td><span className={`status-badge ${p.status === 'Pending' ? 'pending' : 'available'}`}>{p.status}</span></td>
                        <td>
                          {p.status === 'Pending' ? (
                            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => dispensePrescription(p._id)}>Dispense</button>
                          ) : (
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}><i data-lucide="printer" style={{ width: '12px' }}></i> Print</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Inventory</h2>
              <button className="btn btn-primary"><i data-lucide="plus"></i> Add Item</button>
            </div>
            <div className="glass-card">
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0 }}>
                  <thead>
                    <tr><th>Medicine</th><th>Stock</th><th>Status</th><th>Expiry</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {inventory.map(inv => (
                      <tr key={inv.id}>
                        <td><div style={{ fontWeight: 700 }}>{inv.name}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inv.category}</div></td>
                        <td><b style={{ color: inv.stock > 20 ? 'var(--success)' : 'var(--danger)' }}>{inv.stock} {inv.unit}</b></td>
                        <td><span className={`status-badge ${inv.stock > 20 ? 'available' : 'critical'}`}>{inv.status}</span></td>
                        <td>{inv.expiry}</td>
                        <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stock-alerts' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="dashboard-header" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Stock Alerts</h2>
            </div>
            <div className="glass-card">
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0 }}>
                  <thead style={{ background: '#F8FAFC' }}>
                    <tr><th>Item</th><th>Type</th><th>Severity</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {alerts.map(a => (
                      <tr key={a.id}>
                        <td><span style={{ fontWeight: 700 }}>{a.item}</span></td>
                        <td>{a.type}</td>
                        <td><span className={`status-badge ${a.severity === 'High' ? 'critical' : 'pending'}`}>{a.severity}</span></td>
                        <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>Resolve</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Reports</h2>
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <i data-lucide="bar-chart" style={{ width: '48px', height: '48px', marginBottom: '16px', color: 'var(--primary)' }}></i>
              <h3>Generate Analytics</h3>
              <p className="text-muted">Select report parameters to proceed.</p>
              <button className="btn btn-primary" style={{ marginTop: '20px' }}><i data-lucide="download"></i> Download CSV</button>
            </div>
          </div>
        )}
      </div>

      <div className="mobile-bottom-nav">
        <div className={`mob-nav-item ${activeTab === 'dash' ? 'active' : ''}`} onClick={() => setActiveTab('dash')}><i data-lucide="layout-grid"></i><span>Home</span></div>
        <div className={`mob-nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}><i data-lucide="file-text"></i><span>Orders</span></div>
        <div className={`mob-nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}><i data-lucide="package"></i><span>Items</span></div>
        <div className={`mob-nav-item ${activeTab === 'stock-alerts' ? 'active' : ''}`} onClick={() => setActiveTab('stock-alerts')}><i data-lucide="alert-triangle"></i><span>Alerts</span></div>
      </div>
    </>
  );
};

export default PharmacyDashboard;
