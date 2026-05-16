import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LabDashboard = () => {
  const [activeTab, setActiveTab] = useState('lab-dash');
  const [activeSampleForEntry, setActiveSampleForEntry] = useState(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedReqForCollection, setSelectedReqForCollection] = useState(null);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [labRequests, setLabRequests] = useState([
    { id: 'LR-1001', patient: 'Johnathan Doe', test: 'Complete Blood Count', doctor: 'Dr. Harrison', time: '10:45 AM', priority: 'High', status: 'Pending' },
    { id: 'LR-1002', patient: 'Sarah Jenkins', test: 'Lipid Profile', doctor: 'Dr. Adams', time: '11:15 AM', priority: 'Normal', status: 'Pending' },
    { id: 'LR-1003', patient: 'Robert Smith', test: 'Liver Function Test', doctor: 'Dr. Bennett', time: '11:30 AM', priority: 'Normal', status: 'Pending' },
    { id: 'LR-1004', patient: 'Emily Davis', test: 'Thyroid Panel (T3, T4, TSH)', doctor: 'Dr. Brooks', time: '12:05 PM', priority: 'Urgent', status: 'Pending' }
  ]);

  const [labSamples, setLabSamples] = useState([
    { barcode: 'S-99210', patient: 'Michael Brown', type: 'Blood', collectedAt: '09:30 AM', collector: 'Technician A', status: 'Processing' },
    { barcode: 'S-99211', patient: 'Alice Wilson', type: 'Urine', collectedAt: '10:15 AM', collector: 'Technician B', status: 'Collected' }
  ]);

  const [labInventory, setLabInventory] = useState([
    { id: 1, name: 'Hematology Reagent', category: 'Reagents', stock: '12L', threshold: '20L', lastRestock: '12 May', status: 'Low' },
    { id: 2, name: 'Vacuum Tubes (Red)', category: 'Consumables', stock: '240 units', threshold: '1000 units', lastRestock: '05 May', status: 'Low' },
    { id: 3, name: 'Glucose Test Strips', category: 'Consumables', stock: '5000 units', threshold: '2000 units', lastRestock: '10 May', status: 'Healthy' }
  ]);

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, labRequests, labSamples, labInventory, showCollectModal, activeSampleForEntry]);

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

  const confirmCollection = () => {
    if (!selectedReqForCollection) return;
    
    const newSample = {
      barcode: 'S-' + Math.floor(Math.random() * 90000 + 10000),
      patient: selectedReqForCollection.patient,
      type: 'Blood',
      collectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      collector: user.name || 'Technician',
      status: 'Collected'
    };

    setLabSamples([...labSamples, newSample]);
    setLabRequests(labRequests.filter(r => r.id !== selectedReqForCollection.id));
    setShowCollectModal(false);
    setSelectedReqForCollection(null);
    alert("Sample collected and label printed!");
  };

  const processSample = (sample) => {
    setActiveSampleForEntry(sample);
    setActiveTab('lab-entry');
  };

  const finalizeResult = () => {
    if (!activeSampleForEntry) return;
    alert(`Lab results for ${activeSampleForEntry.barcode} verified and sent to consulting doctor!`);
    setLabSamples(labSamples.filter(s => s.barcode !== activeSampleForEntry.barcode));
    setActiveSampleForEntry(null);
    setActiveTab('lab-dash');
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo">
          <i data-lucide="heart-pulse"></i><span>MediCore</span>
        </div>
        <nav>
          <a href="#" className={`nav-link ${activeTab === 'lab-dash' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-dash'); }}>
            <i data-lucide="layout-dashboard"></i> Dashboard
          </a>
          <a href="#" className={`nav-link ${activeTab === 'lab-requests' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-requests'); }}>
            <i data-lucide="clipboard-list"></i> Test Requests
          </a>
          <a href="#" className={`nav-link ${activeTab === 'lab-samples' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-samples'); }}>
            <i data-lucide="test-tube-2"></i> Sample Tracking
          </a>
          <a href="#" className={`nav-link ${activeTab === 'lab-entry' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-entry'); }}>
            <i data-lucide="edit-3"></i> Result Entry
          </a>
          <a href="#" className={`nav-link ${activeTab === 'lab-inventory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-inventory'); }}>
            <i data-lucide="package"></i> Inventory
          </a>
          <a href="#" className={`nav-link ${activeTab === 'lab-archive' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-archive'); }}>
            <i data-lucide="archive"></i> Report Archive
          </a>
          
          <div style={{ marginTop: 'auto', padding: '20px 32px' }}>
            <a href="#" className="nav-link" style={{ color: '#FCA5A5', padding: 0 }} onClick={(e) => { e.preventDefault(); handleLogout(); }}>
              <i data-lucide="log-out"></i> Logout
            </a>
          </div>
        </nav>
      </div>

      <div className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 20px', borderRadius: '99px', fontWeight: 800, fontSize: '14px', letterSpacing: '1px' }}>
            {currentTime}
          </div>
          <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
            <i data-lucide="map-pin" style={{ width: '14px', verticalAlign: 'middle', marginRight: '4px' }}></i> Floor 2, Pathology Lab
          </div>
        </div>
        
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>{user.name || 'Dr. Sarah Chen'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Chief Lab Pathologist</div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)', color: '#9A3412', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <i data-lucide="flask-conical"></i>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* DASHBOARD TAB */}
        {activeTab === 'lab-dash' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', letterSpacing: '-1px' }}>Lab Overview</h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Real-time diagnostics and workflow monitor</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary"><i data-lucide="download"></i> Export Stats</button>
                <button className="btn btn-primary"><i data-lucide="plus"></i> Manual Entry</button>
              </div>
            </div>

            <div className="kpi-grid">
              <div className="lab-stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF2FF', color: '#4F46E5' }}><i data-lucide="inbox"></i></div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>New Requests</div>
                  <div style={{ fontSize: '28px', fontWeight: 900 }}>{labRequests.length}</div>
                </div>
              </div>
              <div className="lab-stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ECFDF5', color: '#059669' }}><i data-lucide="test-tubes"></i></div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>Samples Collected</div>
                  <div style={{ fontSize: '28px', fontWeight: 900 }}>{labSamples.length}</div>
                </div>
              </div>
              <div className="lab-stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFBEB', color: '#D97706' }}><i data-lucide="refresh-cw"></i></div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>In Processing</div>
                  <div style={{ fontSize: '28px', fontWeight: 900 }}>{labSamples.filter(s => s.status === 'Processing').length}</div>
                </div>
              </div>
              <div className="lab-stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEF2F2', color: '#DC2626' }}><i data-lucide="alert-octagon"></i></div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>Critical Alerts</div>
                  <div style={{ fontSize: '28px', fontWeight: 900 }}>02</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '18px' }}>Recent Test Requests</h3>
                  <a href="#" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); setActiveTab('lab-requests'); }}>View All</a>
                </div>
                <table className="elite-table">
                  <thead><tr><th>Patient</th><th>Test Name</th><th>Priority</th><th>Action</th></tr></thead>
                  <tbody>
                    {labRequests.slice(0,3).map(req => (
                      <tr key={req.id}>
                        <td><b>{req.patient}</b></td>
                        <td><span style={{fontWeight:600}}>{req.test}</span></td>
                        <td><span className={`status-badge ${req.priority === 'High' || req.priority === 'Urgent' ? 'critical' : 'pending'}`}>{req.priority}</span></td>
                        <td><button className="btn btn-primary" style={{padding:'6px 12px', fontSize:'11px'}} onClick={() => openCollectModal(req)}>Collect Sample</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="glass-card">
                <h3 style={{ fontWeight: 800, fontSize: '18px', marginBottom: '20px' }}>Inventory Alerts</h3>
                <div>
                  {labInventory.filter(item => item.status === 'Low').map(item => (
                    <div key={item.id} className="inventory-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#F8FAFC', borderRadius: '12px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 700 }}>Low Stock: {item.stock}</div>
                      </div>
                      <button className="btn" style={{ padding: '6px 12px', fontSize: '11px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>Order</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEST REQUESTS TAB */}
        {activeTab === 'lab-requests' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '24px' }}>Pending Test Requests</h1>
            <div className="table-wrapper">
              <table className="elite-table">
                <thead><tr><th>Req ID</th><th>Patient</th><th>Test Required</th><th>Ordered By</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {labRequests.map(req => (
                    <tr key={req.id}>
                      <td><b style={{ color: 'var(--primary)' }}>{req.id}</b></td>
                      <td><b>{req.patient}</b></td>
                      <td><span style={{ fontWeight: 600 }}>{req.test}</span></td>
                      <td>{req.doctor}</td>
                      <td>{req.time}</td>
                      <td><span className="status-badge pending">{req.status}</span></td>
                      <td><button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={() => openCollectModal(req)}>Collect</button></td>
                    </tr>
                  ))}
                  {labRequests.length === 0 && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No pending requests</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SAMPLE TRACKING TAB */}
        {activeTab === 'lab-samples' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '24px' }}>Sample Tracking</h1>
            <div className="table-wrapper">
              <table className="elite-table">
                <thead><tr><th>Barcode</th><th>Patient</th><th>Sample Type</th><th>Collected At</th><th>Collector</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {labSamples.map(s => (
                    <tr key={s.barcode}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)' }}>{s.barcode}</span></td>
                      <td><b>{s.patient}</b></td>
                      <td>{s.type}</td>
                      <td>{s.collectedAt}</td>
                      <td>{s.collector}</td>
                      <td><span className={`status-badge ${s.status === 'Processing' ? 'pending' : 'available'}`}>{s.status}</span></td>
                      <td><button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={() => processSample(s)}>Process</button></td>
                    </tr>
                  ))}
                  {labSamples.length === 0 && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No samples tracked</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RESULT ENTRY TAB */}
        {activeTab === 'lab-entry' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '24px' }}>Result Processing</h1>
            
            {activeSampleForEntry ? (
              <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900 }}>Result Entry: CBC / Standard Profile</h2>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Sample Barcode: {activeSampleForEntry.barcode} | Patient: {activeSampleForEntry.patient}</p>
                  </div>
                  <button className="btn btn-secondary"><i data-lucide="printer"></i> Print Worksheet</button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '20px', padding: '0 12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>PARAMETER</div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>RESULT</div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>REF. RANGE</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', background: 'white', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 2, fontWeight: 700 }}>Hemoglobin (Hb)</div>
                    <div style={{ flex: 1 }}><input type="text" className="form-control" style={{ width: '80px', textAlign: 'center' }} placeholder="14.2" /></div>
                    <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-muted)' }}>13.0 - 17.0 g/dL</div>
                  </div>
                  <div style={{ display: 'flex', background: 'white', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 2, fontWeight: 700 }}>Total WBC Count</div>
                    <div style={{ flex: 1 }}><input type="text" className="form-control" style={{ width: '80px', textAlign: 'center' }} placeholder="7500" /></div>
                    <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-muted)' }}>4000 - 11000 /cumm</div>
                  </div>
                  <div style={{ display: 'flex', background: 'white', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 2, fontWeight: 700 }}>Platelet Count</div>
                    <div style={{ flex: 1 }}><input type="text" className="form-control" style={{ width: '80px', textAlign: 'center' }} placeholder="2.5" /></div>
                    <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-muted)' }}>1.5 - 4.5 Lakhs</div>
                  </div>
                </div>
                
                <div className="form-group" style={{ marginTop: '24px' }}>
                  <label>Pathologist Remarks</label>
                  <textarea className="form-control" placeholder="Enter findings..."></textarea>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Save Draft</button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={finalizeResult}>Verify & Authorize</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                <div className="glass-card">
                  <h3 style={{ fontWeight: 800, marginBottom: '16px' }}>Active Processing</h3>
                  {labSamples.map(s => (
                    <div key={s.barcode} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{s.patient}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.barcode}</div>
                      </div>
                      <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '11px' }} onClick={() => processSample(s)}>Enter</button>
                    </div>
                  ))}
                  {labSamples.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No active processing tasks</div>}
                </div>
                <div className="glass-card">
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <i data-lucide="microscope" style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.3 }}></i>
                    <p style={{ fontWeight: 600 }}>Select a sample from the left to start result entry</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'lab-inventory' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '24px' }}>Lab Inventory Management</h1>
            <div className="table-wrapper">
              <table className="elite-table">
                <thead><tr><th>Item Name</th><th>Category</th><th>Current Stock</th><th>Threshold</th><th>Last Restock</th><th>Status</th></tr></thead>
                <tbody>
                  {labInventory.map(item => (
                    <tr key={item.id}>
                      <td><b>{item.name}</b></td>
                      <td>{item.category}</td>
                      <td style={{ fontWeight: 700 }}>{item.stock}</td>
                      <td>{item.threshold}</td>
                      <td>{item.lastRestock}</td>
                      <td><span className={`status-badge ${item.status === 'Low' ? 'critical' : 'available'}`}>{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ARCHIVE TAB */}
        {activeTab === 'lab-archive' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '24px' }}>Completed Reports Archive</h1>
            <div className="table-wrapper">
              <table className="elite-table">
                <thead><tr><th>Report ID</th><th>Patient</th><th>Test Name</th><th>Completed Date</th><th>Verified By</th><th>Outcome</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr>
                    <td><b style={{ color: 'var(--primary)' }}>RPT-2022</b></td>
                    <td><b>Reyan Verol</b></td>
                    <td>Complete Blood Count</td>
                    <td>14 May 2024</td>
                    <td>Dr. Sarah Chen</td>
                    <td><span className="status-badge available">Normal</span></td>
                    <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}><i data-lucide="download" style={{ width: '14px' }}></i></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SAMPLE COLLECTION MODAL */}
      {showCollectModal && selectedReqForCollection && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-box" style={{ width: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900 }}>Sample Collection</h2>
              <button className="btn" style={{ padding: '8px' }} onClick={() => setShowCollectModal(false)}><i data-lucide="x"></i></button>
            </div>
            <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>PATIENT</div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{selectedReqForCollection.patient}</div>
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>TEST ORDERED</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>{selectedReqForCollection.test}</div>
            </div>
            <div className="form-group">
              <label>Sample Type</label>
              <select className="form-control">
                <option>Venous Blood</option>
                <option>Capillary Blood</option>
                <option>Urine (Mid-stream)</option>
                <option>Swab</option>
              </select>
            </div>
            <div className="form-group">
              <label>Container Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="glass-card" style={{ padding: '12px', borderColor: 'var(--primary)', background: '#F0F4FF', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444', margin: '0 auto 8px' }}></div>
                  <span style={{ fontWeight: 700, fontSize: '12px' }}>EDTA (Purple)</span>
                </div>
                <div className="glass-card" style={{ padding: '12px', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FACC15', margin: '0 auto 8px' }}></div>
                  <span style={{ fontWeight: 700, fontSize: '12px' }}>Serum (Yellow)</span>
                </div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: '54px', fontSize: '16px' }} onClick={confirmCollection}>
              Confirm Collection & Print Label
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LabDashboard;
