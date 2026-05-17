import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const PharmacyDashboard = () => {
  const [activeTab, setActiveTab] = useState('dash');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [inventory, setInventory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  // Beautiful status notifications states to purge window.alert
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modal states for inventory operations
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'restock'
  const [formData, setFormData] = useState({
    name: '',
    category: 'Pain Relief',
    sku: '',
    stock: 0,
    unit: 'Strip',
    mrp: 0,
    expiry: ''
  });
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/medicines');
      setInventory(res.data);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    }
  };

  const fetchData = async () => {
    try {
      const res = await api.get('/prescriptions');
      setPrescriptions(res.data);
      await fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  // Compute stock alerts dynamically from real inventory
  const alerts = inventory
    .filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock')
    .map((item, idx) => ({
      _id: item._id,
      id: `ALT-${idx + 1}`,
      item: item.name,
      type: item.status,
      severity: item.status === 'Out of Stock' ? 'High' : 'Medium',
      date: 'Today',
      rawItem: item
    }));

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, showProfileMenu, showMedicineModal]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const dispensePrescription = async (id) => {
    try {
      await api.put(`/prescriptions/${id}`, { status: 'Dispensed' });
      fetchData();
      setSuccessMessage('Prescription Dispensed Successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to dispense prescription');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({
      name: '',
      category: 'Pain Relief',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      stock: 50,
      unit: 'Strip',
      mrp: 20.00,
      expiry: '31/12/2025'
    });
    setShowMedicineModal(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setCurrentId(item._id);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku,
      stock: item.stock,
      unit: item.unit,
      mrp: item.mrp,
      expiry: item.expiry
    });
    setShowMedicineModal(true);
  };

  const handleOpenRestock = (item) => {
    setModalMode('restock');
    setCurrentId(item._id);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku,
      stock: item.stock,
      unit: item.unit,
      mrp: item.mrp,
      expiry: item.expiry
    });
    setShowMedicineModal(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await api.post('/medicines', formData);
        setSuccessMessage('Medicine added successfully');
      } else {
        await api.put(`/medicines/${currentId}`, formData);
        setSuccessMessage('Medicine updated successfully');
      }
      setShowMedicineModal(false);
      fetchInventory();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Failed to save medicine');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await api.delete(`/medicines/${id}`);
        setSuccessMessage('Medicine deleted successfully');
        fetchInventory();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error(err);
        setErrorMessage('Failed to delete medicine');
        setTimeout(() => setErrorMessage(''), 3000);
      }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '17px', fontWeight: 950, color: 'var(--primary)', letterSpacing: '-0.5px' }}>MediCore</span>
            <span style={{ fontSize: '10px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: '99px', fontWeight: 700 }} className="desktop-only-inline">
              Pharmacy Portal
            </span>
          </div>
          <div id="liveClock" className="desktop-only-flex" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 16px', borderRadius: '99px', fontWeight: 700, fontSize: '14px' }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
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
        {successMessage && <div style={{ color: 'green', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><i data-lucide="check-circle"></i>{successMessage}</div>}
        {errorMessage && <div style={{ color: 'red', background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '12px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><i data-lucide="alert-triangle"></i>{errorMessage}</div>}

        {activeTab === 'dash' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="dashboard-header" style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1A1D23' }}>Pharmacy Overview</h1>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '14px' }}>Real-time inventory and metrics.</p>
            </div>

            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="kpi-card" onClick={() => setActiveTab('inventory')} style={{ cursor: 'pointer' }}>
                <div className="kpi-icon-box" style={{ background: '#EFF6FF', color: '#3B82F6' }}><i data-lucide="package"></i></div>
                <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Total Items</div><div style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D23' }}>{inventory.length}</div></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-box" style={{ background: '#ECFDF5', color: '#10B981' }}><i data-lucide="check-circle"></i></div>
                <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>In Stock</div><div style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D23' }}>{inventory.filter(item => item.status === 'In Stock').length}</div></div>
              </div>
              <div className="kpi-card" onClick={() => setActiveTab('stock-alerts')} style={{ cursor: 'pointer' }}>
                <div className="kpi-icon-box" style={{ background: '#FFFBEB', color: '#F59E0B' }}><i data-lucide="alert-triangle"></i></div>
                <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Low Stock</div><div style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D23' }}>{inventory.filter(item => item.status === 'Low Stock').length}</div></div>
              </div>
              <div className="kpi-card" onClick={() => setActiveTab('stock-alerts')} style={{ cursor: 'pointer' }}>
                <div className="kpi-icon-box" style={{ background: '#FEF2F2', color: '#EF4444' }}><i data-lucide="package-x"></i></div>
                <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Out of Stock</div><div style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D23' }}>{inventory.filter(item => item.status === 'Out of Stock').length}</div></div>
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
              <button className="btn btn-primary" onClick={handleOpenAdd}><i data-lucide="plus"></i> Add Item</button>
            </div>
            <div className="glass-card">
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0 }}>
                  <thead>
                    <tr><th>Medicine</th><th>Stock</th><th>Status</th><th>Expiry</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {inventory.map(inv => (
                      <tr key={inv._id}>
                        <td><div style={{ fontWeight: 700 }}>{inv.name}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inv.category}</div></td>
                        <td><b style={{ color: inv.stock > 20 ? 'var(--success)' : 'var(--danger)' }}>{inv.stock} {inv.unit}</b></td>
                        <td><span className={`status-badge ${inv.stock > 20 ? 'available' : 'critical'}`}>{inv.status}</span></td>
                        <td>{inv.expiry}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleOpenEdit(inv)}>Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--danger)', borderColor: '#FECACA' }} onClick={() => handleDeleteMedicine(inv._id)}>Delete</button>
                          </div>
                        </td>
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
                        <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleOpenRestock(a.rawItem)}>Resolve</button></td>
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

      {/* Unified Manage Medicine Modal */}
      {showMedicineModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1300, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowMedicineModal(false)}>
          <div className="modal-box glass-card" style={{ width: '90%', maxWidth: '500px', background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1D23', margin: 0 }}>
                {modalMode === 'add' ? 'Add New Medicine' : modalMode === 'restock' ? 'Restock Medicine' : 'Edit Medicine Details'}
              </h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }} onClick={() => setShowMedicineModal(false)}>
                <i data-lucide="x" style={{ width: '20px', height: '20px' }}></i>
              </button>
            </div>

            <form onSubmit={handleSaveMedicine}>
              {modalMode !== 'restock' ? (
                <>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>Medicine Name</label>
                    <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>Category</label>
                      <select className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px' }}>
                        <option value="Pain Relief">Pain Relief</option>
                        <option value="Antibiotic">Antibiotic</option>
                        <option value="Anti-Allergic">Anti-Allergic</option>
                        <option value="Antacid">Antacid</option>
                        <option value="Cough Syrup">Cough Syrup</option>
                        <option value="Vitamins">Vitamins</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>SKU Code</label>
                      <input type="text" className="form-control" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} required style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>Unit Type</label>
                      <select className="form-control" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} required style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px' }}>
                        <option value="Strip">Strip</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Bottle">Bottle</option>
                        <option value="Tablet">Tablet</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>MRP (₹)</label>
                      <input type="number" step="0.01" className="form-control" value={formData.mrp} onChange={e => setFormData({...formData, mrp: Number(e.target.value)})} required style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px' }} />
                    </div>
                  </div>
                </>
              ) : null}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>
                    {modalMode === 'restock' ? 'New Stock Quantity' : 'Initial Stock'}
                  </label>
                  <input type="number" className="form-control" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} required style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px' }} />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>Expiry Date</label>
                  <input type="text" className="form-control" placeholder="DD/MM/YYYY" value={formData.expiry} onChange={e => setFormData({...formData, expiry: e.target.value})} required style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '10px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', height: '48px', borderRadius: '12px' }} onClick={() => setShowMedicineModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', height: '48px', borderRadius: '12px', background: 'var(--primary)' }}>
                  {modalMode === 'add' ? 'Add Medicine' : modalMode === 'restock' ? 'Verify Restock' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PharmacyDashboard;
