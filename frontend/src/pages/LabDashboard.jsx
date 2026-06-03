import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Safeguard React DOM reconciliation against external DOM mutations (e.g. Lucide CDN node replacement)
if (typeof window !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      return originalInsertBefore.call(this, newNode, this.firstChild);
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
}

const LabDashboard = () => {
  const [activeTab, setActiveTab] = useState('lab-dash');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeSampleForEntry, setActiveSampleForEntry] = useState(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedReqForCollection, setSelectedReqForCollection] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Real Database Lab Inventory States
  const [labInventory, setLabInventory] = useState([]);
  const [showLabInventoryModal, setShowLabInventoryModal] = useState(false);
  const [labModalMode, setLabModalMode] = useState('add'); // 'add', 'edit', 'restock'
  const [labFormData, setLabFormData] = useState({
    name: '',
    category: 'Reagents',
    stock: 50,
    unit: 'L',
    threshold: 20,
    addQty: 10
  });
  const [currentLabItemId, setCurrentLabItemId] = useState(null);

  // Success / Error messages to replace native alert boxes
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Dynamic role coverage state & listener
  const [coverageState, setCoverageState] = useState(() => {
    const saved = localStorage.getItem('medicore_pmState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed[user.name] || {};
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  useEffect(() => {
    const syncCoverage = () => {
      const saved = localStorage.getItem('medicore_pmState');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCoverageState(parsed[user.name] || {});
        } catch (e) {
          console.error(e);
        }
      }
    };
    syncCoverage();
    window.addEventListener('storage', syncCoverage);

    // Sync from backend database for cross-browser / cross-device support
    const fetchBackendCoverage = async () => {
      try {
        const response = await api.get('/auth/role-coverage');
        if (response.data) {
          localStorage.setItem('medicore_pmState', JSON.stringify(response.data));
          setCoverageState(response.data[user.name] || {});
        }
      } catch (err) {
        console.error('Failed to sync coverage from backend', err);
      }
    };
    fetchBackendCoverage();

    return () => window.removeEventListener('storage', syncCoverage);
  }, [user.name]);

  const [labRequests, setLabRequests] = useState([]);

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
    transition: 'all 0.2s ease',
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/labs');
      setLabRequests(res.data);
      
      const invRes = await api.get('/lab-inventory');
      setLabInventory(invRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, labRequests, labInventory, showCollectModal, activeSampleForEntry, showProfileMenu, showLabInventoryModal]);

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const openCollectModal = (req) => {
    setSelectedReqForCollection(req);
    setShowCollectModal(true);
  };

  const confirmCollection = async () => {
    if (!selectedReqForCollection) return;
    try {
      await api.put(`/labs/${selectedReqForCollection._id}`, { status: 'In Progress' });
      setShowCollectModal(false);
      setSelectedReqForCollection(null);
      fetchData();
      setSuccessMessage("Sample collected and sent to processing!");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to collect sample');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const processSample = (sample) => {
    setActiveSampleForEntry(sample);
    setActiveTab('lab-entry');
  };

  const finalizeResult = async () => {
    if (!activeSampleForEntry) return;
    try {
      await api.put(`/labs/${activeSampleForEntry._id}`, { status: 'Completed', results: 'Completed Analysis' });
      setSuccessMessage(`Lab results for ${activeSampleForEntry.patientId?.name || 'Patient'} verified and sent to consulting doctor!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setActiveSampleForEntry(null);
      fetchData();
      setActiveTab('lab-dash');
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to finalize result');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Lab Inventory operations
  const handleOpenAddLabItem = () => {
    setLabModalMode('add');
    setLabFormData({
      name: '',
      category: 'Reagents',
      stock: 50,
      unit: 'L',
      threshold: 20,
      addQty: 10
    });
    setShowLabInventoryModal(true);
  };

  const handleOpenEditLabItem = (item) => {
    setLabModalMode('edit');
    setCurrentLabItemId(item._id);
    setLabFormData({
      name: item.name,
      category: item.category,
      stock: item.stock,
      unit: item.unit,
      threshold: item.threshold,
      addQty: 10
    });
    setShowLabInventoryModal(true);
  };

  const handleOpenRestockLabItem = (item) => {
    setLabModalMode('restock');
    setCurrentLabItemId(item._id);
    setLabFormData({
      name: item.name,
      category: item.category,
      stock: item.stock,
      unit: item.unit,
      threshold: item.threshold,
      addQty: 10
    });
    setShowLabInventoryModal(true);
  };

  const handleSaveLabItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (labModalMode === 'add') {
        await api.post('/lab-inventory', labFormData);
        setSuccessMessage('Lab item added successfully');
      } else if (labModalMode === 'restock') {
        await api.put(`/lab-inventory/${currentLabItemId}`, { 
          isRestock: true, 
          addQty: labFormData.addQty 
        });
        setSuccessMessage('Inventory restocked successfully');
      } else {
        await api.put(`/lab-inventory/${currentLabItemId}`, labFormData);
        setSuccessMessage('Lab item updated successfully');
      }
      setShowLabInventoryModal(false);
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Failed to save item');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLabItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this lab item?')) {
      try {
        await api.delete(`/lab-inventory/${id}`);
        setSuccessMessage('Lab item deleted successfully');
        fetchData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error(err);
        setErrorMessage('Failed to delete item');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  return (
    <>
      <style>{`
        @media (max-width: 1024px) {
          .sidebar {
            height: 100% !important;
            height: 100dvh !important;
            padding-bottom: calc(32px + env(safe-area-inset-bottom, 32px)) !important;
          }
        }
      `}</style>
      <div className={"sidebar " + (mobileSidebarOpen ? "mobile-open" : "")} data-lenis-prevent>
        <div className="sidebar-logo">
          <i data-lucide="heart-pulse"></i><span>MediCore</span>
        </div>
        <nav>
          <a href="#" className={`nav-link ${activeTab === 'lab-dash' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-dash'); setMobileSidebarOpen(false); }}><i data-lucide="layout-dashboard"></i> Dashboard</a>
          <a href="#" className={`nav-link ${activeTab === 'lab-requests' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-requests'); setMobileSidebarOpen(false); }}><i data-lucide="clipboard-list"></i> Test Requests</a>
          <a href="#" className={`nav-link ${activeTab === 'lab-samples' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-samples'); setMobileSidebarOpen(false); }}><i data-lucide="test-tube-2"></i> Sample Tracking</a>
          <a href="#" className={`nav-link ${activeTab === 'lab-entry' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-entry'); setMobileSidebarOpen(false); }}><i data-lucide="edit-3"></i> Result Entry</a>
          <a href="#" className={`nav-link ${activeTab === 'lab-inventory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-inventory'); setMobileSidebarOpen(false); }}><i data-lucide="package"></i> Inventory</a>

          {/* DYNAMIC COVERAGE INTEGRATION LINKS */}
          {(Object.keys(coverageState || {}).some(k => k.startsWith('rc-') && coverageState[k]?.on)) && (
            <a href="#" className={`nav-link ${activeTab === 'receptionist_cover' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('receptionist_cover'); setMobileSidebarOpen(false); }} style={{ color: '#E11D48', fontWeight: 800 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', flexShrink: 0 }}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              Receptionist Cover
            </a>
          )}
          {(Object.keys(coverageState || {}).some(k => k.startsWith('ph-') && coverageState[k]?.on)) && (
            <a href="#" className={`nav-link ${activeTab === 'pharmacy_cover' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('pharmacy_cover'); setMobileSidebarOpen(false); }} style={{ color: '#2563EB', fontWeight: 800 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', flexShrink: 0 }}><path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Pharmacy Cover
            </a>
          )}

          <a href="#" className="nav-link" style={{ marginTop: 'auto', color: 'var(--danger)' }} onClick={(e) => { e.preventDefault(); handleLogout(); }}><i data-lucide="log-out"></i> Logout</a>
        </nav>
      </div>

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div className="mobile-backdrop" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <div className="top-nav" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Hamburger Mobile Menu Toggle Button */}
        <button 
          className="mobile-menu-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setMobileSidebarOpen(!mobileSidebarOpen);
          }}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#475569',
            padding: '8px',
            borderRadius: '8px',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            marginRight: '8px'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '17px', fontWeight: 950, color: 'var(--primary)', letterSpacing: '-0.5px' }}>MediCore</span>
            <span style={{ fontSize: '10px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: '99px', fontWeight: 700 }} className="desktop-only-inline">
              Laboratory Portal
            </span>
          </div>
          <div id="liveClock" className="desktop-only-flex" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 16px', borderRadius: '99px', fontWeight: 700, fontSize: '14px' }}>
            {currentTime}
          </div>
        </div>
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', cursor: 'pointer', position: 'relative' }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }} className="desktop-only-flex">
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D23' }}>{user.name || 'Lab Staff'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lab ID: #LB-404</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            {user.name ? user.name.substring(0, 2).toUpperCase() : 'LB'}
          </div>

          {showProfileMenu && (
            <div className="glass-card animate-in" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '220px', zIndex: 1200, padding: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '8px 12px', marginBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontWeight: 800, fontSize: '13px' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
              <div className="dropdown-item" onClick={() => { setActiveTab('lab-dash'); setShowProfileMenu(false); }} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}><i data-lucide="user" style={{ width: '16px' }}></i> My Profile</div>
              <div className="dropdown-item" onClick={() => { setActiveTab('lab-inventory'); setShowProfileMenu(false); }} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}><i data-lucide="settings" style={{ width: '16px' }}></i> Settings</div>
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

        {activeTab === 'lab-dash' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="dashboard-header" style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1E293B' }}>Lab Overview</h1>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Real-time diagnostic workflow monitor</p>
            </div>

            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="kpi-card" style={{ padding: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF2FF', color: '#4F46E5', marginBottom: '16px' }}><i data-lucide="inbox"></i></div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>New Requests</div>
                <div style={{ fontSize: '24px', fontWeight: 900 }}>{labRequests.filter(r => r.status === 'Pending').length}</div>
              </div>
              <div className="kpi-card" style={{ padding: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ECFDF5', color: '#059669', marginBottom: '16px' }}><i data-lucide="test-tubes"></i></div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>Processing</div>
                <div style={{ fontSize: '24px', fontWeight: 900 }}>{labRequests.filter(r => r.status === 'In Progress').length}</div>
              </div>
              <div className="kpi-card" style={{ padding: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFBEB', color: '#D97706', marginBottom: '16px' }}><i data-lucide="check-circle"></i></div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>Completed</div>
                <div style={{ fontSize: '24px', fontWeight: 900 }}>{labRequests.filter(s => s.status === 'Completed').length}</div>
              </div>
            </div>

            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '18px' }}>Test Queue</h3>
                  <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('lab-requests')}>View All →</div>
                </div>
                <div className="table-responsive">
                  <table className="elite-table" style={{ margin: 0 }}>
                    <thead><tr><th>Patient</th><th>Test</th><th>Action</th></tr></thead>
                    <tbody>
                      {labRequests.filter(r => r.status === 'Pending').slice(0,5).map(req => (
                        <tr key={req._id}>
                          <td><b>{req.patientId?.name}</b></td>
                          <td><span style={{ fontWeight: 600 }}>{req.testName}</span></td>
                          <td><button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => openCollectModal(req)}>Collect</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-card">
                <h3 style={{ fontWeight: 800, fontSize: '18px', marginBottom: '20px' }}>Inventory Alerts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {labInventory.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock').map(item => (
                    <div key={item._id || item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#F8FAFC', borderRadius: '12px', borderLeft: '4px solid #EF4444' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 700 }}>{item.status}: {item.stock} {item.unit}</div>
                      </div>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '10px' }} onClick={() => handleOpenRestockLabItem(item)}>Restock</button>
                    </div>
                  ))}
                  {labInventory.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock').length === 0 && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>All reagents & consumables are healthy!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lab-requests' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '24px' }}>Pending Requests</h1>
            <div className="glass-card" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0 }}>
                  <thead><tr><th>ID</th><th>Patient</th><th>Test</th><th>Ordered By</th><th>Action</th></tr></thead>
                  <tbody>
                    {labRequests.filter(r => r.status === 'Pending').map(req => (
                      <tr key={req._id}>
                        <td><b style={{ color: 'var(--primary)' }}>#{req._id.substring(18).toUpperCase()}</b></td>
                        <td><b>{req.patientId?.name}</b></td>
                        <td>{req.testName}</td>
                        <td>{req.doctorId?.name}</td>
                        <td><button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => openCollectModal(req)}>Collect</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lab-samples' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '24px' }}>Sample Tracking</h1>
            <div className="glass-card" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0 }}>
                  <thead><tr><th>Barcode</th><th>Patient</th><th>Test</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {labRequests.filter(r => r.status === 'In Progress').map(s => (
                      <tr key={s._id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{s._id.substring(18).toUpperCase()}</td>
                        <td><b>{s.patientId?.name}</b></td>
                        <td>{s.testName}</td>
                        <td><span className="status-badge pending">{s.status}</span></td>
                        <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => processSample(s)}>Process</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lab-entry' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '24px' }}>Result Entry</h1>
            {activeSampleForEntry ? (
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }} className="mobile-stack">
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{activeSampleForEntry.testName}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Patient: <b>{activeSampleForEntry.patientId?.name}</b></p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setActiveSampleForEntry(null)}>Back to List</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Hemoglobin', 'WBC Count', 'Platelets'].map(param => (
                    <div key={param} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '12px' }} className="mobile-stack">
                      <div style={{ flex: 1, fontWeight: 700 }}>{param}</div>
                      <input type="text" className="form-control" style={{ width: '120px' }} placeholder="Enter value" />
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', width: '100px' }}>Normal Range</div>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '24px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Clinical Remarks</label>
                  <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Enter pathologist remarks..."></textarea>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }} className="mobile-stack">
                  <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Save Draft</button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={finalizeResult}>Finalize Result</button>
                </div>
              </div>
            ) : (
              <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                <div className="glass-card">
                  <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Awaiting Entry</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {labRequests.filter(r => r.status === 'In Progress').map(s => (
                      <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '10px' }}>
                        <div><div style={{ fontWeight: 700, fontSize: '13px' }}>{s.patientId?.name}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.testName}</div></div>
                        <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => processSample(s)}>Enter</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-card desktop-only-flex" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <i data-lucide="flask-conical" style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.2 }}></i>
                    <p>Select a sample to process results</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'lab-inventory' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>Lab Inventory</h1>
              <button className="btn btn-primary" onClick={handleOpenAddLabItem}><i data-lucide="plus"></i> Add Item</button>
            </div>
            <div className="glass-card" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Stock Level</th>
                      <th>Alert Threshold</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labInventory.map(item => (
                      <tr key={item._id || item.id}>
                        <td><b>{item.name}</b></td>
                        <td>{item.category}</td>
                        <td style={{ fontWeight: 700 }}>{item.stock} {item.unit}</td>
                        <td>{item.threshold} {item.unit}</td>
                        <td>
                          <span className={`status-badge ${item.status === 'Healthy' ? 'available' : 'critical'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleOpenEditLabItem(item)}>Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleOpenRestockLabItem(item)}>Restock</button>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--danger)', borderColor: '#FECACA' }} onClick={() => handleDeleteLabItem(item._id || item.id)}>Delete</button>
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
      </div>

      <div className="mobile-bottom-nav">
        <div className={`mob-nav-item ${activeTab === 'lab-dash' ? 'active' : ''}`} onClick={() => setActiveTab('lab-dash')}><i data-lucide="layout-dashboard"></i><span>Home</span></div>
        <div className={`mob-nav-item ${activeTab === 'lab-requests' ? 'active' : ''}`} onClick={() => setActiveTab('lab-requests')}><i data-lucide="clipboard-list"></i><span>Reqs</span></div>
        <div className={`mob-nav-item ${activeTab === 'lab-samples' ? 'active' : ''}`} onClick={() => setActiveTab('lab-samples')}><i data-lucide="test-tube-2"></i><span>Samples</span></div>
        <div className={`mob-nav-item ${activeTab === 'lab-entry' ? 'active' : ''}`} onClick={() => setActiveTab('lab-entry')}><i data-lucide="edit-3"></i><span>Entry</span></div>
      </div>

      {showCollectModal && selectedReqForCollection && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1100, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-box" style={{ width: '95%', maxWidth: '500px', background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#1A1D23', margin: 0 }}>Collect Sample</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }} onClick={() => setShowCollectModal(false)}>
                <i data-lucide="x" style={{ width: '20px', height: '20px' }}></i>
              </button>
            </div>
            <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Patient</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B', marginBottom: '16px' }}>{selectedReqForCollection.patientId?.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Test Required</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>{selectedReqForCollection.testName}</div>
            </div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Sample Type</label>
              <select style={inputStyle} className="form-control">
                <option>Venous Blood</option>
                <option>Urine</option>
                <option>Swab</option>
              </select>
            </div>
            <button type="button" style={btnStyle} onClick={confirmCollection}>Confirm & Print Label</button>
          </div>
        </div>
      )}
      {/* Unified Manage Reagent/Supply Modal */}
      {showLabInventoryModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1300, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLabInventoryModal(false)}>
          <div className="modal-box glass-card" style={{ width: '90%', maxWidth: '500px', background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1D23', margin: 0 }}>
                {labModalMode === 'add' ? 'Add Reagent/Supply' : labModalMode === 'restock' ? 'Restock Lab Supply' : 'Edit Supply Details'}
              </h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }} onClick={() => setShowLabInventoryModal(false)}>
                <i data-lucide="x" style={{ width: '20px', height: '20px' }}></i>
              </button>
            </div>

            <form onSubmit={handleSaveLabItem}>
              {labModalMode !== 'restock' ? (
                <>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Supply Name</label>
                    <input type="text" style={inputStyle} value={labFormData.name} onChange={e => setLabFormData({...labFormData, name: e.target.value})} required placeholder="e.g. Hematology Reagent" />
                  </div>

                  <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={labelStyle}>Category</label>
                      <select style={inputStyle} value={labFormData.category} onChange={e => setLabFormData({...labFormData, category: e.target.value})} required>
                        <option value="Reagents">Reagents</option>
                        <option value="Consumables">Consumables</option>
                        <option value="Equipment">Equipment</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={labelStyle}>Unit Type</label>
                      <select style={inputStyle} value={labFormData.unit} onChange={e => setLabFormData({...labFormData, unit: e.target.value})} required>
                        <option value="L">L</option>
                        <option value="units">units</option>
                        <option value="boxes">boxes</option>
                        <option value="kits">kits</option>
                      </select>
                    </div>
                  </div>

                  <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={labelStyle}>Current Stock</label>
                      <input type="number" style={inputStyle} value={labFormData.stock} onChange={e => setLabFormData({...labFormData, stock: Number(e.target.value)})} required />
                    </div>

                    <div className="form-group">
                      <label style={labelStyle}>Low Threshold Alert</label>
                      <input type="number" style={inputStyle} value={labFormData.threshold} onChange={e => setLabFormData({...labFormData, threshold: Number(e.target.value)})} required />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Supply Item</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B' }}>{labFormData.name}</div>
                    <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Current Inventory</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)' }}>{labFormData.stock} {labFormData.unit} (Threshold: {labFormData.threshold})</div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={labelStyle}>Add Quantity</label>
                    <input type="number" style={inputStyle} value={labFormData.addQty} onChange={e => setLabFormData({...labFormData, addQty: Number(e.target.value)})} required min="1" />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', height: '48px', borderRadius: '12px' }} onClick={() => setShowLabInventoryModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} style={{ ...btnStyle, flex: 1 }}>
                  {loading ? 'Saving...' : labModalMode === 'add' ? 'Add Item' : labModalMode === 'restock' ? 'Restock Item' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LabDashboard;
