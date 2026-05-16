import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('10:30 AM');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const openDetailsModal = (app) => {
    setSelectedAppointment({ ...app });
    setDetailsModalOpen(true);
    setTimeout(() => window.lucide && window.lucide.createIcons(), 100);
  };

  const handleUpdateAppointment = async (app) => {
    try {
      await api.put(`/appointments/${app._id}`, { status: app.status, time: app.time, date: app.date });
      alert("Appointment updated successfully");
      setDetailsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to update appointment");
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    try {
      await api.delete(`/appointments/${id}`);
      alert("Appointment deleted");
      setDetailsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to delete appointment");
    }
  };
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [records, setRecords] = useState([
    { id: 'REC-1', name: 'Comprehensive Blood Count', date: '10 May 2025', type: 'Lab Report', size: '1.2MB' },
    { id: 'REC-2', name: 'Chest X-Ray', date: '05 May 2025', type: 'Radiology', size: '5.4MB' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const docsRes = await api.get('/auth/doctors');
      setDoctors(docsRes.data);

      const appsRes = await api.get(`/appointments?patientId=${user.id}`);
      setAppointments(appsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, showAppointmentModal, appointments, doctors]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const bookDoctor = (doc) => {
    setSelectedDoctor(doc);
    setShowAppointmentModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedDoctor) return;
    try {
      setLoading(true);
      const appRes = await api.post('/appointments', {
        patientId: user.id,
        doctorId: selectedDoctor._id,
        date: appointmentDate || new Date(),
        time: appointmentTime,
        reason: appointmentReason || 'General Consultation'
      });

      await api.post('/billing', {
        patientId: user.id,
        items: [
          { description: 'Consultation Fee', amount: 500 },
          { description: 'Registration Fee', amount: 50 }
        ],
        totalAmount: 550,
        paymentMethod: paymentMethod
      });

      setShowAppointmentModal(false);
      setSelectedDoctor(null);
      setAppointmentDate('');
      setAppointmentReason('');
      setPaymentMethod('UPI');
      fetchData();
      setActiveTab('history');
      alert("Appointment booked successfully!");
    } catch (err) {
      console.error(err);
      alert('Failed to book appointment');
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
          <a href="#" className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('summary'); }}><i data-lucide="layout-dashboard"></i> Health Summary</a>
          <a href="#" className={`nav-link ${activeTab === 'find' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('find'); }}><i data-lucide="search"></i> Find Doctor</a>
          <a href="#" className={`nav-link ${activeTab === 'history' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('history'); }}><i data-lucide="calendar"></i> Appointments</a>
          <a href="#" className={`nav-link ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('prescriptions'); }}><i data-lucide="pill"></i> My Prescriptions</a>
          <a href="#" className={`nav-link ${activeTab === 'records' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('records'); }}><i data-lucide="file-text"></i> Health Records</a>
          <a href="#" className="nav-link" style={{ marginTop: 'auto', color: 'var(--danger)' }} onClick={(e) => { e.preventDefault(); handleLogout(); }}><i data-lucide="log-out"></i> Logout</a>
        </nav>
      </div>

      <div className="top-nav">
        <div id="liveClock" className="desktop-only-flex" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 16px', borderRadius: '99px', fontWeight: 700, fontSize: '14px' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', cursor: 'pointer', position: 'relative' }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }} className="desktop-only-flex">
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D23' }}>{user.name || 'Johnathan Doe'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Patient ID: #MC-9921</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            {user.name ? user.name.substring(0, 2).toUpperCase() : 'JD'}
          </div>

          {showProfileMenu && (
            <div className="glass-card animate-in" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '220px', zIndex: 1200, padding: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '8px 12px', marginBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontWeight: 800, fontSize: '13px' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
              <div className="dropdown-item" onClick={() => { setActiveTab('summary'); setShowProfileMenu(false); }} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}><i data-lucide="user" style={{ width: '16px' }}></i> My Profile</div>
              <div className="dropdown-item" onClick={() => { setActiveTab('summary'); setShowProfileMenu(false); }} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}><i data-lucide="settings" style={{ width: '16px' }}></i> Settings</div>
              <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '8px', paddingTop: '8px' }}>
                <div className="dropdown-item" onClick={handleLogout} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--danger)', cursor: 'pointer' }}><i data-lucide="log-out" style={{ width: '16px' }}></i> Logout</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="main-content">
        {activeTab === 'summary' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Good morning, {user.name ? user.name.split(' ')[0] : 'Johnathan'}</h1>
            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
              <div>
                <div className="glass-card" style={{ marginBottom: '32px' }}>
                  <div className="flex-between" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><i data-lucide="trending-up" style={{ color: 'var(--primary)' }}></i> Vitals Trends</h3>
                    <select className="form-control" style={{ width: '140px', padding: '8px 12px', fontSize: '12px' }}><option>Last 6 Months</option></select>
                  </div>
                  <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px', borderBottom: '2px solid var(--border)' }}>
                    {[80, 95, 110, 85].map((h, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <div style={{ width: '40px', height: '120px', background: 'var(--primary-light)', borderRadius: '8px 8px 0 0', position: 'relative' }}>
                          <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${h}px`, background: 'var(--primary)', borderRadius: '4px 4px 0 0' }}></div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>{['JAN','FEB','MAR','APR'][i]}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', gap: '24px', fontSize: '12px', fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '3px' }}></span> Systolic BP</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '12px', height: '12px', background: 'var(--primary-light)', borderRadius: '3px' }}></span> Diastolic BP</div>
                  </div>
                </div>
                <div className="glass-card">
                  <h3 style={{ marginBottom: '24px' }}>Latest Lab Insights</h3>
                  <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--success-bg)', border: '1px solid #A7F3D0' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', marginBottom: '8px' }}>Hemoglobin</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>14.2 <span style={{ fontSize: '12px', opacity: 0.7 }}>g/dL</span></div>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--warning-bg)', border: '1px solid #FDE68A' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: '8px' }}>LDL Cholesterol</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--warning)' }}>162 <span style={{ fontSize: '12px', opacity: 0.7 }}>mg/dL</span></div>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--danger-bg)', border: '1px solid #FCA5A5' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '8px' }}>Vitamin D</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--danger)' }}>12 <span style={{ fontSize: '12px', opacity: 0.7 }}>ng/mL</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mobile-stack-container">
                <div className="glass-card" style={{ background: 'var(--primary-gradient)', color: 'white', border: 'none', marginBottom: '32px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, opacity: 0.8, letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase' }}>Next Appointment</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100&h=100" alt="Doctor" style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }} />
                    <div><div style={{ fontWeight: 800, fontSize: '18px' }}>Dr. William Harrison</div><div style={{ fontSize: '13px', opacity: 0.9 }}>Cardiology Follow-up</div></div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <i data-lucide="calendar" style={{ width: '18px' }}></i><div style={{ fontSize: '14px', fontWeight: 700 }}>Tomorrow, 10:30 AM</div>
                  </div>
                  <button className="btn" style={{ width: '100%', background: 'white', color: 'var(--primary)', justifyContent: 'center' }}>Add to Calendar</button>
                </div>
                <div className="glass-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px' }}>ACTIVE TOKEN</div>
                  <div style={{ fontSize: '48px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-2px' }}>A-42</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>Wait Time: <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>~14 mins</span></div>
                  <div style={{ marginTop: '20px', padding: '12px', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                    <i data-lucide="qr-code" style={{ width: '100px', height: '100px', color: 'var(--text-main)', opacity: 0.2 }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'find' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><h1 style={{ fontSize: '24px', fontWeight: 800 }}>Specialist Discovery</h1><p className="text-muted" style={{ fontWeight: 600 }}>Find and book leading medical experts</p></div>
              <div style={{ display: 'flex', gap: '12px' }}><button className="btn btn-secondary"><i data-lucide="filter"></i> Filter</button></div>
            </div>
            <div className="doctor-grid-pro" style={{ marginTop: '32px' }}>
              {doctors.map(doc => (
                <div key={doc._id} className="doctor-card-pro animate-in" onClick={() => bookDoctor(doc)}>
                  <div className="doc-avatar-wrapper">
                    <div style={{ width: '100%', height: '100%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 800 }}>{doc.name ? doc.name.substring(0,2).toUpperCase() : 'DR'}</div>
                    <div className="doc-rating-badge">★ 4.9</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '18px' }}>{doc.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 700, margin: '4px 0 12px' }}>{doc.specialty || 'General Physician'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>10+ Years Experience</span><div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="chevron-right" style={{ width: '16px' }}></i></div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}><h1 style={{ fontSize: '24px', fontWeight: 800 }}>Your Appointments</h1><button className="btn btn-primary" onClick={() => setActiveTab('find')}><i data-lucide="plus"></i> Book New</button></div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0 }}>
                  <thead style={{ background: '#F8FAFC' }}><tr><th>Date</th><th>Time</th><th>Specialist</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {appointments.map(app => (
                      <tr key={app._id}>
                        <td style={{ fontWeight: 700 }}>{new Date(app.date).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 600 }}>{app.time}</td>
                        <td><b>{app.doctorId?.name || 'Dr. Assigned'}</b></td>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{app.reason}</td>
                        <td><span className={`status-badge ${app.status === 'Completed' ? 'available' : 'pending'}`}>{app.status}</span></td>
                        <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => openDetailsModal(app)}>View Details</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Current Medications</h1>
            <div className="glass-card" style={{ padding: '12px' }}>
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0, border: 'none' }}>
                  <thead style={{ background: '#F8FAFC' }}><tr><th>Medicine</th><th>Instruction</th><th>Frequency</th><th>Doctor</th><th>Refill Status</th></tr></thead>
                  <tbody>
                    <tr>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="pill"></i></div><div><b>Amlodipine (5mg)</b><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hypertension</div></div></div></td>
                      <td>Take after breakfast</td><td><span className="status-badge available" style={{ fontSize: '11px' }}>1 - 0 - 1</span></td><td>Dr. William Harrison</td><td><span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '12px' }}>ACTIVE</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Secure Records Vault</h1>
            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {records.map(r => (
                <div key={r.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="file-text"></i></div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: '14px' }}>{r.name}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{r.date} • {r.size}</div></div>
                  <button className="btn btn-secondary" style={{ padding: '8px' }}><i data-lucide="download" style={{ width: '16px' }}></i></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAppointmentModal && selectedDoctor && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1100 }}>
          <div className="modal-box" style={{ width: '95%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900 }}>Secure Booking & Payment</h2>
              <button className="btn" style={{ padding: '8px' }} onClick={() => setShowAppointmentModal(false)}><i data-lucide="x"></i></button>
            </div>
            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', padding: '12px', background: '#F8FAFC', borderRadius: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800 }}>{selectedDoctor.name ? selectedDoctor.name.substring(0,2).toUpperCase() : 'DR'}</div>
                  <div><div style={{ fontWeight: 800, fontSize: '15px' }}>{selectedDoctor.name}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{selectedDoctor.specialty}</div></div>
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}><label style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px', display: 'block' }}>Select Date</label><input type="date" className="form-control" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} /></div>
                <div className="form-group" style={{ marginBottom: '16px' }}><label style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px', display: 'block' }}>Preferred Time Slot</label><div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>{['10:30 AM', '11:00 AM', '02:30 PM'].map(time => (<div key={time} style={{ padding: '8px', textAlign: 'center', background: appointmentTime === time ? 'var(--primary-light)' : '#F8FAFC', color: appointmentTime === time ? 'var(--primary)' : 'var(--text-muted)', borderRadius: '8px', fontWeight: 700, fontSize: '11px', cursor: 'pointer', border: appointmentTime === time ? '2px solid var(--primary)' : '2px solid transparent' }} onClick={() => setAppointmentTime(time)}>{time}</div>))}</div></div>
                <div className="form-group" style={{ marginBottom: '16px' }}><label style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px', display: 'block' }}>Reason for Visit</label><textarea className="form-control" style={{ minHeight: '60px', fontSize: '13px' }} placeholder="Briefly describe symptoms..." value={appointmentReason} onChange={e => setAppointmentReason(e.target.value)}></textarea></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', flex: 1 }}><h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Billing Summary</h3><div className="billing-summary" style={{ marginBottom: '0' }}><div className="billing-row"><span>Consultation Fee</span> <span>₹500.00</span></div><div className="billing-row"><span>Registration Fee</span> <span>₹50.00</span></div><div className="billing-total" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px dashed var(--border)' }}><span>Total Amount</span> <span>₹550.00</span></div></div></div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '12px', color: '#64748B' }}>Payment Method <span style={{ color: '#EF4444' }}>*</span></label><div className="payment-grid" style={{ marginBottom: '20px' }}>{['UPI', 'Card', 'Banking'].map(method => (<div key={method} className={`pay-btn ${paymentMethod === method ? 'active' : ''}`} onClick={() => setPaymentMethod(method)} style={{ fontSize: '12px', padding: '10px' }}>{paymentMethod === method && <i data-lucide="check-circle" style={{ width: '14px' }}></i>} {method}</div>))}</div></div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: '48px', fontSize: '15px', background: 'var(--primary-gradient)', boxShadow: '0 8px 16px rgba(59, 113, 254, 0.2)' }} onClick={confirmBooking} disabled={loading}><i data-lucide="lock" style={{ width: '16px' }}></i> {loading ? 'Processing...' : 'Pay ₹550 & Confirm'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailsModalOpen && selectedAppointment && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setDetailsModalOpen(false)}>
          <div className="modal-box" style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}><h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>Appointment Details</h2><i data-lucide="x" style={{ cursor: 'pointer', color: '#64748B' }} onClick={() => setDetailsModalOpen(false)}></i></div>
            <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #E2E8F0' }}>
              <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}><div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Doctor Name</div><div style={{ fontWeight: 800, fontSize: '15px' }}>{selectedAppointment.doctorId?.name || 'Assigned Doctor'}</div></div><div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Current Status</div><div style={{ fontWeight: 800, fontSize: '15px' }}>{selectedAppointment.status}</div></div></div>
              <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Reason</div><div style={{ fontWeight: 800, fontSize: '15px' }}>{selectedAppointment.reason}</div></div>
              <div style={{ borderTop: '1px solid #E2E8F0', margin: '20px 0' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '8px', color: '#1A1D23' }}>Reschedule Date</label><input type="date" className="form-control" style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '10px', height: '44px', width: '100%', padding: '0 12px', fontWeight: 600 }} value={selectedAppointment.date ? new Date(selectedAppointment.date).toISOString().split('T')[0] : ''} onChange={(e) => setSelectedAppointment({...selectedAppointment, date: e.target.value})} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '8px', color: '#1A1D23' }}>Reschedule Time</label><input type="time" className="form-control" style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '10px', height: '44px', width: '100%', padding: '0 12px', fontWeight: 600 }} value={selectedAppointment.time} onChange={(e) => setSelectedAppointment({...selectedAppointment, time: e.target.value})} /></div>
                </div>
                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '8px', color: '#1A1D23' }}>Update Status</label><select className="form-control" style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '10px', height: '44px', width: '100%', padding: '0 12px', fontWeight: 600 }} value={selectedAppointment.status} onChange={(e) => setSelectedAppointment({...selectedAppointment, status: e.target.value})}><option value="Pending">Keep as Pending</option><option value="Cancelled">Cancel Appointment</option></select></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}><button className="btn" style={{ background: '#FEE2E2', color: '#EF4444', fontWeight: 800, padding: '0 20px', borderRadius: '10px', height: '44px' }} onClick={() => handleDeleteAppointment(selectedAppointment._id)}>Delete Record</button><button className="btn btn-primary" style={{ fontWeight: 800, padding: '0 24px', borderRadius: '10px', height: '44px' }} onClick={() => handleUpdateAppointment(selectedAppointment)}>Save Changes</button></div>
          </div>
        </div>
      )}

      <div className="mobile-bottom-nav">
        <div className={`mob-nav-item ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}><i data-lucide="layout-dashboard"></i><span>Home</span></div>
        <div className={`mob-nav-item ${activeTab === 'find' ? 'active' : ''}`} onClick={() => setActiveTab('find')}><i data-lucide="search"></i><span>Find Dr</span></div>
        <div className={`mob-nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}><i data-lucide="calendar"></i><span>Apps</span></div>
        <div className={`mob-nav-item ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}><i data-lucide="file-text"></i><span>Vault</span></div>
      </div>
    </>
  );
};

export default PatientDashboard;
