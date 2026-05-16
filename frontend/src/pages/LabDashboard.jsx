import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const LabDashboard = () => {
  const [activeTab, setActiveTab] = useState('lab-dash');
  const [activeSampleForEntry, setActiveSampleForEntry] = useState(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedReqForCollection, setSelectedReqForCollection] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [labRequests, setLabRequests] = useState([]);
  const [labInventory, setLabInventory] = useState([
    { id: 1, name: 'Hematology Reagent', category: 'Reagents', stock: '12L', threshold: '20L', lastRestock: '12 May', status: 'Low' },
    { id: 2, name: 'Vacuum Tubes (Red)', category: 'Consumables', stock: '240 units', threshold: '1000 units', lastRestock: '05 May', status: 'Low' },
    { id: 3, name: 'Glucose Test Strips', category: 'Consumables', stock: '5000 units', threshold: '2000 units', lastRestock: '10 May', status: 'Healthy' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/labs');
      setLabRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, labRequests, labInventory, showCollectModal, activeSampleForEntry, showProfileMenu]);

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
      alert("Sample collected and sent to processing!");
    } catch (err) {
      console.error(err);
      alert('Failed to collect sample');
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
      alert(`Lab results for ${activeSampleForEntry.patientId?.name} verified and sent to consulting doctor!`);
      setActiveSampleForEntry(null);
      fetchData();
      setActiveTab('lab-dash');
    } catch (err) {
      console.error(err);
      alert('Failed to finalize result');
    }
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo">
          <i data-lucide="heart-pulse"></i><span>MediCore</span>
        </div>
        <nav>
          <a href="#" className={`nav-link ${activeTab === 'lab-dash' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-dash'); }}><i data-lucide="layout-dashboard"></i> Dashboard</a>
          <a href="#" className={`nav-link ${activeTab === 'lab-requests' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-requests'); }}><i data-lucide="clipboard-list"></i> Test Requests</a>
          <a href="#" className={`nav-link ${activeTab === 'lab-samples' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-samples'); }}><i data-lucide="test-tube-2"></i> Sample Tracking</a>
          <a href="#" className={`nav-link ${activeTab === 'lab-entry' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-entry'); }}><i data-lucide="edit-3"></i> Result Entry</a>
          <a href="#" className={`nav-link ${activeTab === 'lab-inventory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-inventory'); }}><i data-lucide="package"></i> Inventory</a>
          <a href="#" className="nav-link" style={{ marginTop: 'auto', color: 'var(--danger)' }} onClick={(e) => { e.preventDefault(); handleLogout(); }}><i data-lucide="log-out"></i> Logout</a>
        </nav>
      </div>

      <div className="top-nav">
        <div id="liveClock" className="desktop-only-flex" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 16px', borderRadius: '99px', fontWeight: 700, fontSize: '14px' }}>
          {currentTime}
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
                  {labInventory.filter(item => item.status === 'Low').map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#F8FAFC', borderRadius: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 700 }}>Low: {item.stock}</div>
                      </div>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '10px' }}>Order</button>
                    </div>
                  ))}
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
            <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '24px' }}>Lab Inventory</h1>
            <div className="glass-card" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0 }}>
                  <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Status</th></tr></thead>
                  <tbody>
                    {labInventory.map(item => (
                      <tr key={item.id}>
                        <td><b>{item.name}</b></td>
                        <td>{item.category}</td>
                        <td style={{ fontWeight: 700 }}>{item.stock}</td>
                        <td><span className={`status-badge ${item.status === 'Low' ? 'critical' : 'available'}`}>{item.status}</span></td>
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
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1100 }}>
          <div className="modal-box" style={{ width: '95%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900 }}>Collect Sample</h2>
              <button className="btn" onClick={() => setShowCollectModal(false)}><i data-lucide="x"></i></button>
            </div>
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Patient</div>
              <div style={{ fontSize: '18px', fontWeight: 900 }}>{selectedReqForCollection.patientId?.name}</div>
              <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Test Required</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)' }}>{selectedReqForCollection.testName}</div>
            </div>
            <div className="form-group"><label>Sample Type</label><select className="form-control"><option>Venous Blood</option><option>Urine</option><option>Swab</option></select></div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: '54px', fontSize: '16px', marginTop: '20px' }} onClick={confirmCollection}>Confirm & Print Label</button>
          </div>
        </div>
      )}
    </>
  );
};

export default LabDashboard;
