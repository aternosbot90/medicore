import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('dash');
  const [consultTab, setConsultTab] = useState('c-history');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [appointments, setAppointments] = useState([
      { id: "APT-1001", patient: "Johnathan Doe", age: 42, time: "10:30 AM", type: "Follow-up", status: "Waiting" },
      { id: "APT-1002", patient: "Sarah Jenkins", age: 31, time: "11:00 AM", type: "Routine Checkup", status: "Confirmed" },
      { id: "APT-1003", patient: "Michael Brown", age: 47, time: "11:30 AM", type: "Consultation", status: "Confirmed" },
      { id: "APT-1004", patient: "Emily Davis", age: 28, time: "12:00 PM", type: "Follow-up", status: "Confirmed" }
  ]);

  const [patientsList, setPatientsList] = useState([
      { id: "PT-001", name: "Reyan Verol", gender: "Male", phone: "+1 75964 25493", email: "reyan@example.com", lastVisit: "24 Jan 2025" },
      { id: "PT-002", name: "Johnathan Doe", gender: "Male", phone: "+1 98765 43210", email: "john@example.com", lastVisit: "12 Feb 2025" },
      { id: "PT-003", name: "Sarah Jenkins", gender: "Female", phone: "+1 55512 34567", email: "sarah@example.com", lastVisit: "05 Mar 2025" }
  ]);

  const [prescriptionItems, setPrescriptionItems] = useState([
    { id: 1, name: "Paracetamol 650mg", dosage: "1 Tablet", freq: "1-0-1" },
    { id: 2, name: "Amoxicillin 500mg", dosage: "1 Capsule", freq: "1-1-1" }
  ]);
  
  const addMedicineRow = () => {
    setPrescriptionItems([...prescriptionItems, { id: Date.now(), name: "", dosage: "", freq: "" }]);
  };

  const removeMedicineRow = (id) => {
    setPrescriptionItems(prescriptionItems.filter(item => item.id !== id));
  };

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, consultTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const startConsultation = () => {
    setActiveTab('consultations');
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo"><i data-lucide="heart-pulse" style={{ color: 'var(--primary)' }}></i><span>MediCore</span></div>
        <nav>
          <a href="#" className={`nav-link ${activeTab === 'dash' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dash'); }}><i data-lucide="layout-grid"></i> Dashboard</a>
          <a href="#" className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('appointments'); }}><i data-lucide="calendar"></i> Appointments</a>
          <a href="#" className={`nav-link ${activeTab === 'patients' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('patients'); }}><i data-lucide="users"></i> Patient Management</a>
          <a href="#" className={`nav-link ${activeTab === 'lab-reports' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-reports'); }}><i data-lucide="flask-conical"></i> Lab reports</a>
          <a href="#" className={`nav-link ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('prescriptions'); }}><i data-lucide="pill"></i> Prescriptions</a>
          <a href="#" className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }}><i data-lucide="settings"></i> Settings</a>
          
          {activeTab === 'consultations' && (
            <a href="#" className="nav-link active" onClick={(e) => { e.preventDefault(); setActiveTab('consultations'); }}><i data-lucide="stethoscope"></i> Consultation</a>
          )}

          <div className="sidebar-user" onClick={handleLogout} style={{cursor: 'pointer'}}>
            <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100&h=100" className="user-avatar" alt="Profile" />
            <div className="user-info">
              <div className="name">{user.name || 'Dr. Andrew Clark'}</div>
              <div className="role">Cardiology Specialist</div>
            </div>
            <i data-lucide="log-out" style={{ marginLeft: 'auto', width: '16px', color: 'var(--danger)' }}></i>
          </div>
        </nav>
      </div>

      <div className="top-nav">
        <div className="search-wrapper">
          <i data-lucide="search"></i>
          <input type="text" className="search-input" placeholder="Search patient by mobile/ID..." />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginLeft: 'auto' }}>
          <button className="btn" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', background: 'white', borderRadius: '12px', padding: '10px 20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
            <i data-lucide="alert-circle" style={{ width: '20px' }}></i> Emergency
          </button>
          <div className="action-icon-btn" style={{ position: 'relative', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <i data-lucide="bell" style={{ width: '20px' }}></i>
            <div style={{ position: 'absolute', top: '12px', right: '14px', width: '18px', height: '18px', background: 'var(--danger)', color: 'white', borderRadius: '50%', border: '2px solid white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>3</div>
          </div>
        </div>
      </div>

      <div className="main-content">
        {activeTab === 'dash' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1A1D23' }}>Good Morning, {user.name || 'Dr. Andrew Clark'}</h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '14px' }}>Today, {new Date().toLocaleDateString()} | You have 6 patients in the waiting queue</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" style={{ background: 'white' }}><i data-lucide="calendar"></i> View Schedule</button>
                <button className="btn btn-primary" onClick={startConsultation} style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 12px rgba(59, 113, 254, 0.3)' }}><i data-lucide="play-circle"></i> Start Next Patient</button>
              </div>
            </div>

            <div className="ph-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '32px' }}>
              <div className="kpi-card">
                <div className="kpi-icon-box" style={{ background: '#F0F4FF', color: 'var(--primary)' }}><i data-lucide="users"></i></div>
                <div><div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL APPOINTMENTS</div><div style={{ fontSize: '22px', fontWeight: 800 }}>24</div></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-box" style={{ background: '#F0FFF4', color: 'var(--success)' }}><i data-lucide="user-check"></i></div>
                <div><div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>PATIENTS SEEN</div><div style={{ fontSize: '22px', fontWeight: 800 }}>18</div></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-box" style={{ background: '#FFFBEB', color: 'var(--warning)' }}><i data-lucide="clock-3"></i></div>
                <div><div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>LIVE QUEUE</div><div style={{ fontSize: '22px', fontWeight: 800 }}>06</div></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon-box" style={{ background: '#FFF5F5', color: 'var(--danger)' }}><i data-lucide="flame"></i></div>
                <div><div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>URGENT CASES</div><div style={{ fontSize: '22px', fontWeight: 800 }}>02</div></div>
              </div>
            </div>

            <div className="ph-grid" style={{ gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
              <div>
                <div className="glass-card" style={{ marginBottom: '32px' }}>
                  <div className="flex-between" style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Upcoming Appointments</h3>
                    <div style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} onClick={() => setActiveTab('appointments')}>View Full List →</div>
                  </div>
                  <table className="elite-table" style={{ boxShadow: 'none', border: 'none', margin: 0 }}>
                    <thead style={{ background: '#F8FAFC' }}>
                      <tr><th>Time</th><th>Patient Details</th><th>Type</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {appointments.slice(0,3).map(app => (
                        <tr key={app.id}>
                          <td><b style={{ color: 'var(--primary)' }}>{app.time}</b></td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{app.patient}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.age} Yrs | ID: {app.id}</div>
                          </td>
                          <td><span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>{app.type}</span></td>
                          <td><span className={`status-badge ${app.status === 'Waiting' ? 'pending' : 'available'}`} style={{ fontSize: '10px' }}>{app.status}</span></td>
                          <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={startConsultation}>View Case</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="glass-card">
                    <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '20px' }}>Quick Actions</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ padding: '16px', background: '#F0F4FF', borderRadius: '16px', textAlign: 'center', cursor: 'pointer' }}>
                        <i data-lucide="plus-circle" style={{ color: 'var(--primary)', marginBottom: '8px' }}></i>
                        <div style={{ fontSize: '11px', fontWeight: 800 }}>Add Appointment</div>
                      </div>
                      <div style={{ padding: '16px', background: '#F0FFF4', borderRadius: '16px', textAlign: 'center', cursor: 'pointer' }}>
                        <i data-lucide="file-text" style={{ color: 'var(--success)', marginBottom: '8px' }}></i>
                        <div style={{ fontSize: '11px', fontWeight: 800 }}>Issue Certificate</div>
                      </div>
                      <div style={{ padding: '16px', background: '#FFFBEB', borderRadius: '16px', textAlign: 'center', cursor: 'pointer' }}>
                        <i data-lucide="clipboard-list" style={{ color: 'var(--warning)', marginBottom: '8px' }}></i>
                        <div style={{ fontSize: '11px', fontWeight: 800 }}>Lab Reports</div>
                      </div>
                      <div style={{ padding: '16px', background: '#FFF5F5', borderRadius: '16px', textAlign: 'center', cursor: 'pointer' }} onClick={() => alert('Emergency Alert Triggered!')}>
                        <i data-lucide="alert-triangle" style={{ color: 'var(--danger)', marginBottom: '8px' }}></i>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--danger)' }}>Emergency</div>
                      </div>
                    </div>
                  </div>
                  <div className="glass-card">
                    <div className="flex-between" style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 800 }}>Recent Vitals Record</h3>
                      <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>All Data →</span>
                    </div>
                    <div className="widget-list">
                      <div className="widget-item"><span>BP (Avg)</span> <b style={{ color: 'var(--danger)' }}>142/90</b></div>
                      <div className="widget-item"><span>SpO2</span> <b style={{ color: 'var(--success)' }}>98%</b></div>
                      <div className="widget-item"><span>Heart Rate</span> <b style={{ color: 'var(--primary)' }}>72 bpm</b></div>
                      <div className="widget-item"><span>Temperature</span> <b>98.4 F</b></div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="cal-widget" style={{ marginBottom: '32px' }}>
                  <div className="cal-header">
                    <span style={{ fontSize: '14px', fontWeight: 800 }}>Availability Status</span>
                    <span className="status-badge available" style={{ fontSize: '10px' }}>ONLINE</span>
                  </div>
                  <div style={{ paddingTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                      <div className="donut-container" style={{ position: 'relative', width: '64px', height: '64px' }}>
                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                          <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#F1F5F9" strokeWidth="4.5"></circle>
                          <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="var(--primary)" strokeWidth="4.5" strokeDasharray="75 25" strokeLinecap="round"></circle>
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900, color: '#1A1D23' }}>75%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800 }}>Daily Quota</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>18 of 24 Patients Seen</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card">
                  <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '20px' }}>Clinical Messenger</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px', borderLeft: '3px solid var(--primary)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 800, marginBottom: '4px' }}>RECEPTIONIST</div>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>Dr. Clark, Patient Johnathan is waiting at the desk.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Consultations Tab */}
        {activeTab === 'consultations' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ background: 'white', borderRadius: '28px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '85vh', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '28px 40px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, boxShadow: '0 8px 16px rgba(59, 113, 254, 0.2)' }}>JD</div>
                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '18px', height: '18px', background: 'var(--success)', border: '3px solid white', borderRadius: '50%' }}></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#1A1D23' }}>Johnathan Doe</h2>
                      <span className="status-badge available" style={{ fontSize: '10px', background: '#F0FFF4' }}>IN CONSULTATION</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>42Y • Male • #A-42 • ABHA: 91-8821-2291-0112</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" style={{ background: 'white', borderColor: 'var(--border)' }}><i data-lucide="save"></i> Save Draft</button>
                  <button className="btn btn-primary" onClick={() => setActiveTab('dash')} style={{ background: 'var(--primary-gradient)', height: '52px', padding: '0 32px', boxShadow: '0 10px 20px rgba(59, 113, 254, 0.2)' }}><i data-lucide="send"></i> Finalize & Dispatch</button>
                </div>
              </div>

              <div style={{ padding: '0 40px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '32px', background: 'white' }}>
                <div className={`consult-tab ${consultTab === 'c-history' ? 'active' : ''}`} onClick={() => setConsultTab('c-history')} style={{ cursor: 'pointer', padding: '16px 0', borderBottom: consultTab === 'c-history' ? '2px solid var(--primary)' : '2px solid transparent', fontWeight: consultTab === 'c-history' ? 800 : 600, color: consultTab === 'c-history' ? 'var(--primary)' : 'var(--text-muted)' }}>Medical History</div>
                <div className={`consult-tab ${consultTab === 'c-vitals' ? 'active' : ''}`} onClick={() => setConsultTab('c-vitals')} style={{ cursor: 'pointer', padding: '16px 0', borderBottom: consultTab === 'c-vitals' ? '2px solid var(--primary)' : '2px solid transparent', fontWeight: consultTab === 'c-vitals' ? 800 : 600, color: consultTab === 'c-vitals' ? 'var(--primary)' : 'var(--text-muted)' }}>Vitals & Assessment</div>
                <div className={`consult-tab ${consultTab === 'c-notes' ? 'active' : ''}`} onClick={() => setConsultTab('c-notes')} style={{ cursor: 'pointer', padding: '16px 0', borderBottom: consultTab === 'c-notes' ? '2px solid var(--primary)' : '2px solid transparent', fontWeight: consultTab === 'c-notes' ? 800 : 600, color: consultTab === 'c-notes' ? 'var(--primary)' : 'var(--text-muted)' }}>Clinical Notes</div>
                <div className={`consult-tab ${consultTab === 'c-diagnosis' ? 'active' : ''}`} onClick={() => setConsultTab('c-diagnosis')} style={{ cursor: 'pointer', padding: '16px 0', borderBottom: consultTab === 'c-diagnosis' ? '2px solid var(--primary)' : '2px solid transparent', fontWeight: consultTab === 'c-diagnosis' ? 800 : 600, color: consultTab === 'c-diagnosis' ? 'var(--primary)' : 'var(--text-muted)' }}>Diagnosis</div>
                <div className={`consult-tab ${consultTab === 'c-prescription' ? 'active' : ''}`} onClick={() => setConsultTab('c-prescription')} style={{ cursor: 'pointer', padding: '16px 0', borderBottom: consultTab === 'c-prescription' ? '2px solid var(--primary)' : '2px solid transparent', fontWeight: consultTab === 'c-prescription' ? 800 : 600, color: consultTab === 'c-prescription' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Digital Prescription <span style={{ marginLeft: '8px', fontSize: '10px', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '6px' }}>NEW</span></div>
              </div>

              <div className="consult-body" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 0, padding: 0, background: 'white', flex: 1 }}>
                <div style={{ padding: '40px', height: 'calc(85vh - 200px)', overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
                  
                  {consultTab === 'c-history' && (
                    <div className="consult-content active" style={{ animation: 'slideUp 0.3s ease-out' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px', color: '#1A1D23' }}>Comprehensive History</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                        <div className="glass-card">
                          <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Chief Complaint</div>
                          <textarea className="form-control" style={{ minHeight: '100px', borderColor: 'transparent', background: '#F8FAFC' }} placeholder="Describe primary symptoms..."></textarea>
                        </div>
                        <div className="glass-card">
                          <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Past Medical History</div>
                          <textarea className="form-control" style={{ minHeight: '100px', borderColor: 'transparent', background: '#F8FAFC' }} placeholder="Known conditions, surgeries..."></textarea>
                        </div>
                      </div>
                    </div>
                  )}

                  {consultTab === 'c-vitals' && (
                    <div className="consult-content active" style={{ animation: 'slideUp 0.3s ease-out' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px', color: '#1A1D23' }}>Vital Signs Monitor</h3>
                      <div className="vitals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                        <div className="vital-input" style={{ padding: '16px', borderRadius: '12px', background: '#F0F4FF', borderLeft: '4px solid var(--primary)' }}><label style={{fontSize:'12px', fontWeight:700, color:'var(--text-muted)', marginBottom:'8px', display:'block'}}>Blood Pressure</label><input type="text" className="form-control" defaultValue="142/90" /></div>
                        <div className="vital-input" style={{ padding: '16px', borderRadius: '12px', background: '#FFF5F5', borderLeft: '4px solid var(--danger)' }}><label style={{fontSize:'12px', fontWeight:700, color:'var(--text-muted)', marginBottom:'8px', display:'block'}}>Pulse Rate</label><input type="text" className="form-control" defaultValue="88" /></div>
                        <div className="vital-input" style={{ padding: '16px', borderRadius: '12px', background: '#F0FFF4', borderLeft: '4px solid var(--success)' }}><label style={{fontSize:'12px', fontWeight:700, color:'var(--text-muted)', marginBottom:'8px', display:'block'}}>Temperature</label><input type="text" className="form-control" defaultValue="98.4" /></div>
                      </div>
                    </div>
                  )}

                  {consultTab === 'c-notes' && (
                    <div className="consult-content active" style={{ animation: 'slideUp 0.3s ease-out' }}>
                      <div className="flex-between" style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D23' }}>Clinical Notes</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }}>Templates</button>
                          <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }}><i data-lucide="mic" style={{ width: '14px' }}></i> Voice Note</button>
                        </div>
                      </div>
                      <textarea className="form-control" style={{ minHeight: '350px', padding: '24px', lineHeight: 1.6, border: '1px solid #E2E8F0', borderRadius: '20px', background: '#FBFDFF' }} placeholder="Enter clinical observations, physical exam findings, and assessment..."></textarea>
                    </div>
                  )}

                  {consultTab === 'c-diagnosis' && (
                    <div className="consult-content active" style={{ animation: 'slideUp 0.3s ease-out' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px', color: '#1A1D23' }}>Diagnosis & Assessment</h3>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <span className="status-badge" style={{ background: 'white', color: 'var(--primary)', border: '2px solid var(--primary)', padding: '8px 16px', borderRadius: '12px' }}><b>I10</b> Essential Hypertension <i data-lucide="x" style={{ width: '14px', marginLeft: '8px', cursor: 'pointer' }}></i></span>
                        <span className="status-badge" style={{ background: 'white', color: 'var(--primary)', border: '2px solid var(--primary)', padding: '8px 16px', borderRadius: '12px' }}><b>E11.9</b> Type 2 Diabetes <i data-lucide="x" style={{ width: '14px', marginLeft: '8px', cursor: 'pointer' }}></i></span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <i data-lucide="search" style={{ position: 'absolute', left: '16px', top: '18px', color: 'var(--text-muted)', width: '18px' }}></i>
                        <input type="text" className="form-control" placeholder="Search ICD-10 codes or common names..." style={{ padding: '16px 48px', borderRadius: '16px', background: '#F8FAFC', border: 'none' }} />
                      </div>
                    </div>
                  )}

                  {consultTab === 'c-prescription' && (
                    <div className="consult-content active" style={{ animation: 'slideUp 0.3s ease-out' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D23' }}>Digital Prescription</h3>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={addMedicineRow}><i data-lucide="plus"></i> Add Medicine</button>
                      </div>
                      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="elite-table" style={{ margin: 0, border: 'none' }}>
                          <thead style={{ background: '#F8FAFC' }}>
                            <tr><th>Medicine Name</th><th>Dosage</th><th>Frequency</th><th>Action</th></tr>
                          </thead>
                          <tbody>
                            {prescriptionItems.map(item => (
                              <tr key={item.id}>
                                <td><input type="text" className="form-control" defaultValue={item.name} /></td>
                                <td><input type="text" className="form-control" defaultValue={item.dosage} /></td>
                                <td><input type="text" className="form-control" defaultValue={item.freq} /></td>
                                <td><button className="btn btn-secondary" style={{ padding: '6px', color: 'var(--danger)' }} onClick={() => removeMedicineRow(item.id)}><i data-lucide="trash-2" style={{width: '16px'}}></i></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
                <div style={{ padding: '40px', background: '#F8FAFC', height: 'calc(85vh - 200px)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '24px', color: '#1A1D23' }}>Investigation Orders</h3>
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Laboratory Tests</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}><input type="checkbox" style={{ width: '16px', height: '16px' }} /> CBC with ESR</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}><input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} /> Fasting Blood Sugar</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}><input type="checkbox" style={{ width: '16px', height: '16px' }} /> Lipid Profile</label>
                    </div>
                  </div>
                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ padding: '28px', background: 'white', borderRadius: '24px', border: '2px dashed #E2E8F0', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Doctor's Digital Seal</div>
                      <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: '32px', color: 'var(--primary)', marginBottom: '6px' }}>{user.name || 'Dr. Andrew Clark'}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Cardiology Specialist</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>Appointments Schedule</h2>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <table className="elite-table" style={{ margin: 0 }}>
                <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                    <th>Appointment ID</th>
                    <th>Patient Name</th>
                    <th>Time Slot</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(app => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{app.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                            {app.patient.substring(0,2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 700, color: '#1A1D23' }}>{app.patient}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{app.time}</td>
                      <td style={{ fontWeight: 600 }}>{app.type}</td>
                      <td><span className={`status-badge ${app.status === 'Waiting' ? 'pending' : 'available'}`}>{app.status}</span></td>
                      <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={startConsultation}>Start Consult</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Patient Management Tab */}
        {activeTab === 'patients' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>Patient Management</h2>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <table className="elite-table" style={{ margin: 0 }}>
                <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Phone</th>
                    <th>Last Visit</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsList.map(pt => (
                    <tr key={pt.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{pt.id}</td>
                      <td><span style={{ fontWeight: 700, color: '#1A1D23' }}>{pt.name}</span></td>
                      <td>{pt.gender}</td>
                      <td>{pt.phone}</td>
                      <td style={{ fontWeight: 600 }}>{pt.lastVisit}</td>
                      <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>View History</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lab Reports Tab */}
        {activeTab === 'lab-reports' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>Lab Reports</h2>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <table className="elite-table" style={{ margin: 0 }}>
                <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                    <th>Report ID</th>
                    <th>Patient Name</th>
                    <th>Test Name</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>RPT-2011</td>
                    <td><span style={{ fontWeight: 700, color: '#1A1D23' }}>Johnathan Doe</span></td>
                    <td style={{ fontWeight: 600 }}>Complete Blood Count</td>
                    <td>24 May 2024</td>
                    <td><span className="status-badge available">Completed</span></td>
                    <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}><i data-lucide="eye" style={{width:'14px'}}></i> View</button></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>RPT-2012</td>
                    <td><span style={{ fontWeight: 700, color: '#1A1D23' }}>Sarah Jenkins</span></td>
                    <td style={{ fontWeight: 600 }}>Lipid Profile</td>
                    <td>24 May 2024</td>
                    <td><span className="status-badge pending">Pending</span></td>
                    <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', opacity: 0.5 }} disabled><i data-lucide="eye" style={{width:'14px'}}></i> View</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>Prescription History</h2>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <table className="elite-table" style={{ margin: 0 }}>
                <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                    <th>Prescription ID</th>
                    <th>Patient Name</th>
                    <th>Date Issued</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>PRX-9982</td>
                    <td><span style={{ fontWeight: 700, color: '#1A1D23' }}>Michael Brown</span></td>
                    <td>10 May 2024</td>
                    <td><span className="status-badge available">Dispensed</span></td>
                    <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}><i data-lucide="printer" style={{width:'14px'}}></i> Print</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '32px' }}>Settings</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              <div className="glass-card">
                <h3 style={{ marginBottom: '24px' }}>Profile & Availability</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>DOCTOR NAME</label><input type="text" defaultValue="Dr. Andrew Clark" className="form-control" /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>SPECIALTY</label><input type="text" defaultValue="Cardiology Specialist" className="form-control" /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>AVAILABILITY</label><select className="form-control"><option>Available</option><option>On Break</option><option>Offline</option></select></div>
                  <button className="btn btn-primary" style={{ marginTop: '12px', justifyContent: 'center' }}>Update Profile</button>
                </div>
              </div>
              <div className="glass-card">
                <h3 style={{ marginBottom: '24px' }}>Digital Assets</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>DIGITAL SIGNATURE</label>
                    <div style={{ border: '2px dashed var(--border)', padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
                      <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: '32px', color: 'var(--primary)', marginBottom: '12px' }}>Dr. Andrew Clark</div>
                      <button className="btn btn-secondary" style={{ fontSize: '12px', margin: '0 auto' }}>Change Signature</button>
                    </div>
                  </div>
                  <div className="flex-between">
                    <span>Enable Real-time Pharmacy Flow</span>
                    <input type="checkbox" defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default DoctorDashboard;
