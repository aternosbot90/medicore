import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('dash');
  const [consultTab, setConsultTab] = useState('c-history');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [appointments, setAppointments] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  const [prescriptionItems, setPrescriptionItems] = useState([
    { id: 1, name: "", dosage: "", freq: "" }
  ]);
  const [labTests, setLabTests] = useState({
    'CBC with ESR': false,
    'Fasting Blood Sugar': false,
    'Lipid Profile': false
  });

  const [loading, setLoading] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(user.isSetupComplete === true);
  const [setupData, setSetupData] = useState({
    name: user.name || '',
    specialty: user.specialty || 'General Physician'
  });

  const handleCompleteSetup = async () => {
    if (!setupData.name || !setupData.specialty) {
      alert("Please fill all details.");
      return;
    }
    try {
      setLoading(true);
      const res = await api.put(`/auth/profile/${user.id || user._id}`, {
        name: setupData.name,
        specialty: setupData.specialty,
        isSetupComplete: true
      });
      const updatedUser = { ...user, name: res.data.name, specialty: res.data.specialty, isSetupComplete: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsSetupComplete(true);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const apps = await api.get(`/appointments?doctorId=${user.id}`);
      setAppointments(apps.data);
      const pts = await api.get('/patients');
      setPatientsList(pts.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addMedicineRow = () => {
    setPrescriptionItems([...prescriptionItems, { id: Date.now(), name: "", dosage: "", freq: "" }]);
  };

  const removeMedicineRow = (id) => {
    setPrescriptionItems(prescriptionItems.filter(item => item.id !== id));
  };

  const startConsultation = (app) => {
    if (app) setActiveAppointment(app);
    setActiveTab('consultations');
  };

  const handleFinalizeConsultation = async () => {
    if (!activeAppointment) return;
    try {
      setLoading(true);
      await api.put(`/appointments/${activeAppointment._id}`, { status: 'Completed', notes: clinicalNotes, diagnosis: diagnosis });
      const validItems = prescriptionItems.filter(i => i.name && i.dosage && i.freq);
      if (validItems.length > 0) {
        await api.post('/prescriptions', { appointmentId: activeAppointment._id, patientId: activeAppointment.patientId._id, doctorId: user.id, items: validItems.map(i => ({ medicine: i.name, dosage: i.dosage, duration: "7 days", instructions: i.freq })) });
      }
      const selectedTests = Object.keys(labTests).filter(test => labTests[test]);
      for (const testName of selectedTests) {
        await api.post('/labs', { appointmentId: activeAppointment._id, patientId: activeAppointment.patientId._id, doctorId: user.id, testName: testName });
      }
      alert('Consultation finalized successfully!');
      fetchData();
      setActiveTab('dash');
      setActiveAppointment(null);
      setClinicalNotes('');
      setDiagnosis('');
      setPrescriptionItems([{ id: 1, name: "", dosage: "", freq: "" }]);
      setLabTests({ 'CBC with ESR': false, 'Fasting Blood Sugar': false, 'Lipid Profile': false });
    } catch (err) {
      console.error(err);
      alert('Failed to finalize consultation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, consultTab, isSetupComplete, showProfileMenu]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!isSetupComplete) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 20px' }}><i data-lucide="stethoscope"></i></div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1A1D23' }}>Welcome, Doctor!</h1>
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Please complete your profile.</p>
          </div>
          <div className="form-group"><label>Full Name</label><input type="text" className="form-control" value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} placeholder="Dr. Sarah Jenkins" /></div>
          <div className="form-group"><label>Specialty</label><input type="text" className="form-control" value={setupData.specialty} onChange={e => setSetupData({...setupData, specialty: e.target.value})} placeholder="Cardiology Specialist" /></div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: '52px' }} onClick={handleCompleteSetup} disabled={loading}>{loading ? 'Saving...' : 'Complete Setup'}</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo"><i data-lucide="heart-pulse"></i><span>MediCore</span></div>
        <nav>
          <a href="#" className={`nav-link ${activeTab === 'dash' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dash'); }}><i data-lucide="layout-grid"></i> Dashboard</a>
          <a href="#" className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('appointments'); }}><i data-lucide="calendar"></i> Appointments</a>
          <a href="#" className={`nav-link ${activeTab === 'patients' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('patients'); }}><i data-lucide="users"></i> Patients</a>
          <a href="#" className={`nav-link ${activeTab === 'lab-reports' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-reports'); }}><i data-lucide="flask-conical"></i> Lab Reports</a>
          <a href="#" className={`nav-link ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('prescriptions'); }}><i data-lucide="pill"></i> Prescriptions</a>
          <a href="#" className="nav-link" style={{ marginTop: 'auto', color: 'var(--danger)' }} onClick={(e) => { e.preventDefault(); handleLogout(); }}><i data-lucide="log-out"></i> Logout</a>
        </nav>
      </div>

      <div className="top-nav">
        <div id="liveClock" className="desktop-only-flex" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 16px', borderRadius: '99px', fontWeight: 700, fontSize: '14px' }}>
          {new Date().toLocaleTimeString()}
        </div>
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', cursor: 'pointer', position: 'relative' }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }} className="desktop-only-flex">
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D23' }}>{user.name || 'Doctor'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.specialty}</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            {user.name ? user.name.substring(0, 2).toUpperCase() : 'DR'}
          </div>

          {showProfileMenu && (
            <div className="glass-card animate-in" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '220px', zIndex: 1200, padding: '12px' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '8px 12px', marginBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontWeight: 800, fontSize: '13px' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.specialty}</div>
              </div>
              <div className="dropdown-item" onClick={() => { setActiveTab('dash'); setShowProfileMenu(false); }}><i data-lucide="user"></i> My Profile</div>
              <div className="dropdown-item" onClick={() => { setActiveTab('dash'); setShowProfileMenu(false); }}><i data-lucide="settings"></i> Settings</div>
              <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '8px', paddingTop: '8px' }}>
                <div className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}><i data-lucide="log-out"></i> Logout</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="main-content">
        {activeTab === 'dash' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="dashboard-header" style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1A1D23' }}>Good Morning, {user.name}</h1>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>You have {appointments.length} patients scheduled today.</p>
            </div>

            <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="kpi-card" style={{ padding: '16px' }}>
                <div className="kpi-icon-box" style={{ background: '#F0F4FF', color: 'var(--primary)', width: '40px', height: '40px', marginBottom: '12px' }}><i data-lucide="calendar" style={{ width: '18px' }}></i></div>
                <div><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>APPOINTMENTS</div><div style={{ fontSize: '18px', fontWeight: 800 }}>{appointments.length}</div></div>
              </div>
              <div className="kpi-card" style={{ padding: '16px' }}>
                <div className="kpi-icon-box" style={{ background: '#F0FFF4', color: 'var(--success)', width: '40px', height: '40px', marginBottom: '12px' }}><i data-lucide="users" style={{ width: '18px' }}></i></div>
                <div><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>PATIENTS</div><div style={{ fontSize: '18px', fontWeight: 800 }}>{patientsList.length}</div></div>
              </div>
              <div className="kpi-card" style={{ padding: '16px' }}>
                <div className="kpi-icon-box" style={{ background: '#FFFBEB', color: 'var(--warning)', width: '40px', height: '40px', marginBottom: '12px' }}><i data-lucide="clock" style={{ width: '18px' }}></i></div>
                <div><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>WAITING</div><div style={{ fontSize: '18px', fontWeight: 800 }}>06</div></div>
              </div>
            </div>

            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
              <div>
                <div className="glass-card">
                  <div className="flex-between" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Upcoming Patients</h3>
                    <div style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} onClick={() => setActiveTab('appointments')}>View All →</div>
                  </div>
                  <div className="table-responsive">
                    <table className="elite-table" style={{ margin: 0 }}>
                      <thead><tr><th>Time</th><th>Patient</th><th>Type</th><th>Action</th></tr></thead>
                      <tbody>
                        {appointments.slice(0,3).map(app => (
                          <tr key={app._id}>
                            <td><b style={{ color: 'var(--primary)' }}>{app.time}</b></td>
                            <td><div style={{ fontWeight: 700 }}>{app.patientId?.name}</div></td>
                            <td><span style={{ fontSize: '12px', fontWeight: 600 }}>{app.reason}</span></td>
                            <td><button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => startConsultation(app)}>Consult</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div>
                <div className="glass-card">
                  <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>Quick Actions</h3>
                  <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', background: '#F0F4FF', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}><i data-lucide="plus-circle" style={{ color: 'var(--primary)', marginBottom: '6px', width: '18px' }}></i><div style={{ fontSize: '11px', fontWeight: 800 }}>Schedule</div></div>
                    <div style={{ padding: '12px', background: '#F0FFF4', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}><i data-lucide="file-text" style={{ color: 'var(--success)', marginBottom: '6px', width: '18px' }}></i><div style={{ fontSize: '11px', fontWeight: 800 }}>Certificate</div></div>
                    <div style={{ padding: '12px', background: '#FFFBEB', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}><i data-lucide="clipboard-list" style={{ color: 'var(--warning)', marginBottom: '6px', width: '18px' }}></i><div style={{ fontSize: '11px', fontWeight: 800 }}>Lab Order</div></div>
                    <div style={{ padding: '12px', background: '#FFF5F5', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}><i data-lucide="alert-triangle" style={{ color: 'var(--danger)', marginBottom: '6px', width: '18px' }}></i><div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--danger)' }}>Emergency</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'consultations' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }} className="mobile-stack">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>{activeAppointment ? activeAppointment.patientId?.name?.substring(0,2).toUpperCase() : 'PT'}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#1A1D23' }}>{activeAppointment ? activeAppointment.patientId?.name : 'Patient Name'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>In Consultation</div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleFinalizeConsultation} disabled={loading} style={{ background: 'var(--primary-gradient)', height: '44px', padding: '0 16px', fontSize: '13px', fontWeight: 800, width: '100%' }}>
                  {loading ? 'Finalizing...' : 'Finalize Consult'}
                </button>
              </div>

              <div className="table-responsive" style={{ borderBottom: '1px solid var(--border)', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', padding: '0 20px' }}>
                  {['c-history', 'c-vitals', 'c-notes', 'c-prescription'].map(t => (
                    <div key={t} onClick={() => setConsultTab(t)} style={{ padding: '16px', cursor: 'pointer', borderBottom: consultTab === t ? '3px solid var(--primary)' : '3px solid transparent', color: consultTab === t ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 800, fontSize: '13px', whiteSpace: 'nowrap' }}>{t === 'c-history' ? 'History' : t === 'c-vitals' ? 'Vitals' : t === 'c-notes' ? 'Notes' : 'Prescription'}</div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '24px', minHeight: '400px' }}>
                {consultTab === 'c-history' && (
                  <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group"><label>Chief Complaint</label><textarea className="form-control" style={{ minHeight: '120px' }} placeholder="Primary symptoms..."></textarea></div>
                    <div className="form-group"><label>Past History</label><textarea className="form-control" style={{ minHeight: '120px' }} placeholder="Existing conditions..."></textarea></div>
                  </div>
                )}
                {consultTab === 'c-vitals' && (
                  <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="form-group"><label>BP</label><input type="text" className="form-control" defaultValue="120/80" /></div>
                    <div className="form-group"><label>Pulse</label><input type="text" className="form-control" defaultValue="72" /></div>
                    <div className="form-group"><label>Temp</label><input type="text" className="form-control" defaultValue="98.6" /></div>
                  </div>
                )}
                {consultTab === 'c-notes' && (
                  <div className="form-group"><label>Clinical Observations</label><textarea className="form-control" value={clinicalNotes} onChange={e => setClinicalNotes(e.target.value)} style={{ minHeight: '200px' }} placeholder="Detailed assessment..."></textarea></div>
                )}
                {consultTab === 'c-prescription' && (
                  <div>
                    <div className="flex-between" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}><h4>Medicines</h4><button className="btn btn-secondary" onClick={addMedicineRow}>+ Add</button></div>
                    <div className="table-responsive">
                      <table className="elite-table">
                        <thead><tr><th>Drug</th><th>Dose</th><th>Freq</th><th>Action</th></tr></thead>
                        <tbody>
                          {prescriptionItems.map((item, index) => (
                            <tr key={item.id}>
                              <td><input type="text" className="form-control" value={item.name} onChange={e => { const n = [...prescriptionItems]; n[index].name = e.target.value; setPrescriptionItems(n); }} placeholder="Med name" /></td>
                              <td><input type="text" className="form-control" value={item.dosage} onChange={e => { const n = [...prescriptionItems]; n[index].dosage = e.target.value; setPrescriptionItems(n); }} placeholder="500mg" /></td>
                              <td><input type="text" className="form-control" value={item.freq} onChange={e => { const n = [...prescriptionItems]; n[index].freq = e.target.value; setPrescriptionItems(n); }} placeholder="1-0-1" /></td>
                              <td><button onClick={() => removeMedicineRow(item.id)} style={{ color: 'var(--danger)', border: 'none', background: 'none' }}><i data-lucide="trash-2" style={{ width: '16px' }}></i></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Appointments Schedule</h1>
            <div className="glass-card" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0 }}>
                  <thead><tr><th>ID</th><th>Patient</th><th>Time</th><th>Reason</th><th>Action</th></tr></thead>
                  <tbody>
                    {appointments.map(app => (
                      <tr key={app._id}>
                        <td>#{app._id.substring(18).toUpperCase()}</td>
                        <td><b>{app.patientId?.name}</b></td>
                        <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{app.time}</td>
                        <td>{app.reason}</td>
                        <td><button className="btn btn-secondary" onClick={() => startConsultation(app)}>Open Case</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Patient Management</h1>
            <div className="glass-card" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0 }}>
                  <thead><tr><th>Patient ID</th><th>Name</th><th>Gender</th><th>Contact</th><th>Action</th></tr></thead>
                  <tbody>
                    {patientsList.map(pt => (
                      <tr key={pt._id}>
                        <td>#{pt._id.substring(18).toUpperCase()}</td>
                        <td><b>{pt.name}</b></td>
                        <td>{pt.gender}</td>
                        <td>{pt.contact}</td>
                        <td><button className="btn btn-secondary">History</button></td>
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
        <div className={`mob-nav-item ${activeTab === 'dash' ? 'active' : ''}`} onClick={() => setActiveTab('dash')}><i data-lucide="layout-grid"></i><span>Home</span></div>
        <div className={`mob-nav-item ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}><i data-lucide="calendar"></i><span>Apps</span></div>
        <div className={`mob-nav-item ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}><i data-lucide="users"></i><span>Patients</span></div>
        <div className={`mob-nav-item ${activeTab === 'consultations' ? 'active' : ''}`} onClick={() => setActiveTab('consultations')}><i data-lucide="stethoscope"></i><span>Consult</span></div>
      </div>
    </>
  );
};

export default DoctorDashboard;
