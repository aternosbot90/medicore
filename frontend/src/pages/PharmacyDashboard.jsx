import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PharmacyDashboard = () => {
  const [activeTab, setActiveTab] = useState('dash');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [inventory, setInventory] = useState([
    { id: 1, name: "Paracetamol 650mg", category: "Pain Relief", sku: "PAR-650", stock: 250, unit: "Strip", mrp: 25.00, status: "In Stock", expiry: "30/06/2025" },
    { id: 2, name: "Azithromycin 500mg", category: "Antibiotic", sku: "AZI-500", stock: 0, unit: "Strip", mrp: 55.00, status: "Out of Stock", expiry: "--" },
    { id: 3, name: "Cetirizine 10mg", category: "Anti-Allergic", sku: "CET-10", stock: 12, unit: "Strip", mrp: 18.00, status: "Low Stock", expiry: "15/08/2024" },
    { id: 4, name: "Pantoprazole 40mg", category: "Antacid", sku: "PAN-40", stock: 145, unit: "Strip", mrp: 45.00, status: "In Stock", expiry: "22/12/2025" },
    { id: 5, name: "Amoxicillin 250mg", category: "Antibiotic", sku: "AMX-250", stock: 50, unit: "Capsule", mrp: 35.00, status: "In Stock", expiry: "10/11/2024" }
  ]);

  const [prescriptions, setPrescriptions] = useState([
    { id: "RX10058", patient: "Ravi Kumar", age: 33, gender: "Male", doctor: "Dr. Ankit Sharma", dept: "General Medicine", time: "10:20 AM", status: "Pending" },
    { id: "RX10059", patient: "Sneha Patel", age: 28, gender: "Female", doctor: "Dr. Priya Desai", dept: "Gynecology", time: "11:05 AM", status: "Pending" },
    { id: "RX10060", patient: "Amit Singh", age: 45, gender: "Male", doctor: "Dr. William Harrison", dept: "Cardiology", time: "11:30 AM", status: "Dispensed" },
    { id: "RX10061", patient: "Meera Reddy", age: 52, gender: "Female", doctor: "Dr. Victoria Adams", dept: "Urology", time: "12:15 PM", status: "Dispensed" }
  ]);

  const [alerts, setAlerts] = useState([
    { id: "ALT-1", item: "Azithromycin 500mg", type: "Out of Stock", severity: "High", date: "Today" },
    { id: "ALT-2", item: "Cetirizine 10mg", type: "Low Stock", severity: "Medium", date: "Yesterday" },
    { id: "ALT-3", item: "Cough Syrup 100ml", type: "Expiring Soon", severity: "Medium", date: "2 Days Ago" }
  ]);

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const dispensePrescription = (id) => {
    setPrescriptions(prescriptions.map(p => p.id === id ? { ...p, status: 'Dispensed' } : p));
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--primary)'}}>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <div style={{display: 'flex', flexDirection: 'column', lineHeight: '1.2'}}>
            <span>MediCore</span>
            <span style={{fontSize: '10px', opacity: 0.7}}>Pharmacy Unit</span>
          </div>
        </div>
        <nav>
          <a href="#" className={`nav-link ${activeTab === 'dash' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dash'); }}><i data-lucide="layout-grid"></i> Overview</a>
          <a href="#" className={`nav-link ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('prescriptions'); }}><i data-lucide="file-text"></i> Prescriptions</a>
          <a href="#" className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('inventory'); }}><i data-lucide="package"></i> Inventory</a>
          <a href="#" className={`nav-link ${activeTab === 'stock-alerts' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('stock-alerts'); }}><i data-lucide="alert-triangle"></i> Stock Alerts</a>
          <a href="#" className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('reports'); }}><i data-lucide="bar-chart-2"></i> Reports</a>
          
          <div className="sidebar-user" onClick={handleLogout} style={{cursor: 'pointer'}}>
            <img src="https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=100&h=100" className="user-avatar" alt="Profile" />
            <div className="user-info">
              <div className="name">{user.name || 'Amit Verma'}</div>
              <div className="role">Chief Pharmacist</div>
            </div>
            <i data-lucide="log-out" style={{ marginLeft: 'auto', width: '16px', color: 'var(--danger)' }}></i>
          </div>
        </nav>
      </div>

      <div className="top-nav">
        <div className="search-wrapper">
          <i data-lucide="search"></i>
          <input type="text" className="search-input" placeholder="Search by Patient, Prescription ID, Drug..." />
        </div>
        <div style={{display: 'flex', gap: '16px', alignItems: 'center', marginLeft: 'auto'}}>
          <div className="action-icon-btn" style={{position: 'relative', cursor: 'pointer', color: 'var(--text-muted)'}}>
            <i data-lucide="bell" style={{width: '20px'}}></i>
            <div style={{position: 'absolute', top: '10px', right: '12px', width: '16px', height: '16px', background: 'var(--danger)', color: 'white', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800}}>2</div>
          </div>
        </div>
      </div>

      <div className="main-content">
        {activeTab === 'dash' && (
          <div className="tab-content active" style={{animation: 'slideUp 0.4s ease-out'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1A1D23' }}>Pharmacy Overview</h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '14px' }}>Real-time inventory and prescription metrics.</p>
              </div>
            </div>

            <div className="ph-kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '32px' }}>
              <div className="kpi-card" onClick={() => setActiveTab('inventory')} style={{ cursor: 'pointer' }}>
                <div className="kpi-icon-box" style={{background: '#EFF6FF', color: '#3B82F6'}}><i data-lucide="package"></i></div>
                <div><div style={{fontSize: '11px', color: '#64748B', fontWeight: 700}}>Total Items</div><div style={{fontSize: '20px', fontWeight: 800, color: '#1A1D23'}}>1,245</div></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-box" style={{background: '#ECFDF5', color: '#10B981'}}><i data-lucide="check-circle"></i></div>
                <div><div style={{fontSize: '11px', color: '#64748B', fontWeight: 700}}>In Stock</div><div style={{fontSize: '20px', fontWeight: 800, color: '#1A1D23'}}>985</div></div>
              </div>
              <div className="kpi-card" onClick={() => setActiveTab('stock-alerts')} style={{ cursor: 'pointer' }}>
                <div className="kpi-icon-box" style={{background: '#FFFBEB', color: '#F59E0B'}}><i data-lucide="alert-triangle"></i></div>
                <div><div style={{fontSize: '11px', color: '#64748B', fontWeight: 700}}>Low Stock</div><div style={{fontSize: '20px', fontWeight: 800, color: '#1A1D23'}}>12</div></div>
              </div>
              <div className="kpi-card" onClick={() => setActiveTab('stock-alerts')} style={{ cursor: 'pointer' }}>
                <div className="kpi-icon-box" style={{background: '#FEF2F2', color: '#EF4444'}}><i data-lucide="package-x"></i></div>
                <div><div style={{fontSize: '11px', color: '#64748B', fontWeight: 700}}>Out of Stock</div><div style={{fontSize: '20px', fontWeight: 800, color: '#1A1D23'}}>8</div></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-box" style={{background: '#F5F3FF', color: '#7C3AED'}}><i data-lucide="calendar"></i></div>
                <div><div style={{fontSize: '11px', color: '#64748B', fontWeight: 700}}>Expiring Soon</div><div style={{fontSize: '20px', fontWeight: 800, color: '#1A1D23'}}>15</div></div>
              </div>
            </div>

            <div className="ph-grid" style={{ gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
              <div>
                <div className="glass-card" style={{marginBottom: '32px'}}>
                  <div className="flex-between" style={{marginBottom: '20px'}}>
                    <h3 style={{fontSize: '16px', fontWeight: 800}}>Prescriptions Queue</h3>
                    <div style={{color: 'var(--primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer'}} onClick={() => setActiveTab('prescriptions')}>View All →</div>
                  </div>
                  <table className="elite-table" style={{boxShadow: 'none', border: 'none', margin: 0}}>
                    <thead style={{background: '#F8FAFC'}}>
                      <tr><th>Prescription ID</th><th>Patient Details</th><th>Doctor</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {prescriptions.filter(p => p.status === 'Pending').map(p => (
                        <tr key={p.id}>
                          <td><b style={{color: 'var(--primary)'}}>{p.id}</b></td>
                          <td><div style={{fontWeight: 700}}>{p.patient}</div><div style={{fontSize: '11px', color: 'var(--text-muted)'}}>{p.age} Y, {p.gender}</div></td>
                          <td><div style={{fontWeight: 700}}>{p.doctor}</div><div style={{fontSize: '11px', color: 'var(--text-muted)'}}>{p.dept}</div></td>
                          <td><span className="status-badge pending" style={{fontSize: '11px'}}>{p.status}</span></td>
                          <td><button className="btn btn-primary" style={{padding: '6px 16px', fontSize: '12px'}} onClick={() => dispensePrescription(p.id)}>Dispense</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                 <div className="glass-card" style={{ marginBottom: '24px' }}>
                   <div className="flex-between" style={{ marginBottom: '20px' }}>
                     <h3 style={{fontSize: '16px', fontWeight: 800}}>Recent Alerts</h3>
                     <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }} onClick={() => setActiveTab('stock-alerts')}>All Alerts →</span>
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

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="tab-content active" style={{animation: 'slideUp 0.4s ease-out'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>All Prescriptions</h2>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <table className="elite-table" style={{ margin: 0 }}>
                <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                    <th>Prescription ID</th>
                    <th>Patient Details</th>
                    <th>Doctor</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map(p => (
                    <tr key={p.id}>
                      <td><b style={{ color: 'var(--primary)' }}>{p.id}</b></td>
                      <td><div style={{ fontWeight: 700 }}>{p.patient}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.age} Y, {p.gender}</div></td>
                      <td><div style={{ fontWeight: 700 }}>{p.doctor}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.dept}</div></td>
                      <td><div style={{ fontWeight: 700 }}>{p.time}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Today</div></td>
                      <td><span className={`status-badge ${p.status === 'Pending' ? 'pending' : 'available'}`} style={{ fontSize: '11px' }}>{p.status}</span></td>
                      <td>
                        {p.status === 'Pending' ? (
                          <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={() => dispensePrescription(p.id)}>Dispense</button>
                        ) : (
                          <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }}><i data-lucide="printer" style={{width:'14px'}}></i> Print</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="tab-content active" style={{animation: 'slideUp 0.4s ease-out'}}>
            <div className="glass-card" style={{padding: 0, overflow: 'hidden'}}>
              <div style={{padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <h3 style={{fontSize: '24px', fontWeight: 800}}>Medicine Inventory</h3>
                <div style={{display: 'flex', gap: '12px'}}>
                  <button className="btn btn-primary" style={{fontSize: '14px', height: '48px', padding: '0 24px'}}><i data-lucide="plus"></i> Add Medicine</button>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="elite-table" style={{margin: 0, border: 'none'}}>
                  <thead>
                    <tr><th>Medicine Name</th><th>Category</th><th>SKU</th><th>Stock</th><th>Unit</th><th>MRP (₹)</th><th>Status</th><th>Expiry Date</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {inventory.map(inv => (
                      <tr key={inv.id}>
                        <td><div style={{fontWeight: 700}}>{inv.name}</div></td>
                        <td>{inv.category}</td>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{inv.sku}</td>
                        <td><b style={{color: inv.stock > 20 ? 'var(--success)' : inv.stock === 0 ? 'var(--danger)' : 'var(--warning)'}}>{inv.stock}</b></td>
                        <td>{inv.unit}</td>
                        <td style={{ fontWeight: 700 }}>{inv.mrp.toFixed(2)}</td>
                        <td><span className={`status-badge ${inv.stock > 20 ? 'available' : inv.stock === 0 ? 'critical' : 'pending'}`}>{inv.status}</span></td>
                        <td style={{color: inv.stock === 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600}}>{inv.expiry}</td>
                        <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}><i data-lucide="edit-3" style={{width:'14px'}}></i> Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Stock Alerts Tab */}
        {activeTab === 'stock-alerts' && (
          <div className="tab-content active" style={{animation: 'slideUp 0.4s ease-out'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>Stock Alerts</h2>
              <button className="btn btn-primary"><i data-lucide="shopping-cart"></i> Create Purchase Order</button>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <table className="elite-table" style={{ margin: 0 }}>
                <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                    <th>Alert ID</th>
                    <th>Item Name</th>
                    <th>Alert Type</th>
                    <th>Severity</th>
                    <th>Date Raised</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{a.id}</td>
                      <td><span style={{ fontWeight: 700, color: '#1A1D23' }}>{a.item}</span></td>
                      <td style={{ fontWeight: 600 }}>{a.type}</td>
                      <td><span className={`status-badge ${a.severity === 'High' ? 'critical' : 'pending'}`}>{a.severity}</span></td>
                      <td style={{ fontWeight: 600 }}>{a.date}</td>
                      <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>Resolve</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="tab-content active" style={{animation: 'slideUp 0.4s ease-out'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>Analytics & Reports</h2>
              <button className="btn btn-primary"><i data-lucide="download"></i> Download CSV</button>
            </div>
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <i data-lucide="bar-chart" style={{ width: '48px', height: '48px', marginBottom: '16px', color: 'var(--primary)' }}></i>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D23', marginBottom: '8px' }}>Reports Generation</h3>
              <p>Select date range and report type to generate pharmacy analytics.</p>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default PharmacyDashboard;
