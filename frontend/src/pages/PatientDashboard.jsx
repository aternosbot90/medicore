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

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
  const [prescriptions, setPrescriptions] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);

  const [editProfileData, setEditProfileData] = useState({ name: '', age: '', gender: 'Male', contact: '', address: '', bloodGroup: 'O+', allergies: '', medicalHistory: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [records, setRecords] = useState([
    { id: 'REC-1', name: 'Comprehensive Blood Count', date: '10 May 2025', type: 'Lab Report', size: '1.2MB' },
    { id: 'REC-2', name: 'Chest X-Ray', date: '05 May 2025', type: 'Radiology', size: '5.4MB' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user.id) return;
    
    // Fetch Profile Independently
    try {
      const profileRes = await api.get(`/patients/${user.id}`);
      setPatientProfile(profileRes.data);
      setEditProfileData({
        name: profileRes.data.name || '',
        age: profileRes.data.age || '',
        gender: profileRes.data.gender || 'Male',
        contact: profileRes.data.contact || '',
        address: profileRes.data.address || '',
        bloodGroup: profileRes.data.bloodGroup || 'O+',
        allergies: profileRes.data.allergies || '',
        medicalHistory: Array.isArray(profileRes.data.medicalHistory) ? profileRes.data.medicalHistory.join(', ') : ''
      });
    } catch (profileErr) {
      console.warn("Failed to load full patient profile details", profileErr);
    }

    // Fetch Dashboard Data
    try {
      const docsRes = await api.get('/auth/doctors');
      setDoctors(docsRes.data);

      const appsRes = await api.get(`/appointments?patientId=${user.id}`);
      setAppointments(appsRes.data);

      const prescriptionsRes = await api.get('/prescriptions');
      const myPrescriptions = prescriptionsRes.data.filter(p => p.patientId?._id === user.id || p.patientId === user.id);
      setPrescriptions(myPrescriptions);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, showAppointmentModal, appointments, doctors, showProfileMenu, detailsModalOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const formattedHistory = editProfileData.medicalHistory.split(',').map(item => item.trim()).filter(Boolean);
      const res = await api.put(`/patients/${user.id}`, { ...editProfileData, medicalHistory: formattedHistory });
      setPatientProfile(res.data);
      const updatedUser = { ...user, name: res.data.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setProfileMsg({ type: 'error', text: 'New passwords do not match.' });
    }
    setIsUpdatingPassword(true);
    try {
      await api.put(`/patients/${user.id}/password`, { 
        currentPassword: passwordData.currentPassword, 
        newPassword: passwordData.newPassword 
      });
      setProfileMsg({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const bookDoctor = (doc) => {
    setSelectedDoctor(doc);
    setActiveTab('book-appointment');
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
          <a href="#" className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('summary'); setMobileSidebarOpen(false); }}><i data-lucide="layout-dashboard"></i> Health Summary</a>
          <a href="#" className={`nav-link ${activeTab === 'find' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('find'); setMobileSidebarOpen(false); }}><i data-lucide="search"></i> Find Doctor</a>
          <a href="#" className={`nav-link ${activeTab === 'history' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('history'); setMobileSidebarOpen(false); }}><i data-lucide="calendar"></i> Appointments</a>
          <a href="#" className={`nav-link ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('prescriptions'); setMobileSidebarOpen(false); }}><i data-lucide="pill"></i> My Prescriptions</a>
          <a href="#" className={`nav-link ${activeTab === 'records' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('records'); setMobileSidebarOpen(false); }}><i data-lucide="file-text"></i> Health Records</a>
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
              Patient Portal
            </span>
          </div>
          <div id="liveClock" className="desktop-only-flex" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 16px', borderRadius: '99px', fontWeight: 700, fontSize: '14px' }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
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
              <div className="dropdown-item" onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}><i data-lucide="user" style={{ width: '16px' }}></i> My Profile</div>
              <div className="dropdown-item" onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}><i data-lucide="settings" style={{ width: '16px' }}></i> Settings</div>
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
                  <thead style={{ background: '#F8FAFC' }}><tr><th>Medicine</th><th>Instruction</th><th>Frequency</th><th>Doctor</th><th>Dispense Status</th></tr></thead>
                  <tbody>
                    {prescriptions.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No active prescriptions found in your medical records.
                        </td>
                      </tr>
                    ) : (
                      prescriptions.flatMap(p => (p.medicines || []).map((m, idx) => (
                        <tr key={`${p._id}-${idx}`}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i data-lucide="pill"></i>
                              </div>
                              <div>
                                <b>{m.name} ({m.dose})</b>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.notes || 'General Treatment'}</div>
                              </div>
                            </div>
                          </td>
                          <td>{m.timing || 'As Directed'}</td>
                          <td><span className="status-badge available" style={{ fontSize: '11px' }}>{m.freq}</span></td>
                          <td>{p.doctorId?.name || 'Consulting Specialist'}</td>
                          <td><span style={{ color: p.status === 'Dispensed' ? 'var(--success)' : 'var(--warning)', fontWeight: 800, fontSize: '12px' }}>{p.status.toUpperCase()}</span></td>
                        </tr>
                      )))
                    )}
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

        {activeTab === 'profile' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>My Profile & Settings</h1>
            
            {profileMsg.text && (
              <div style={{ padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', 
                background: profileMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                color: profileMsg.type === 'success' ? '#16A34A' : '#DC2626',
                border: profileMsg.type === 'success' ? '1px solid #86EFAC' : '1px solid #FCA5A5'
              }}>
                <i data-lucide={profileMsg.type === 'success' ? 'check-circle' : 'alert-circle'} style={{ width: '16px', flexShrink: 0 }}></i>
                {profileMsg.text}
              </div>
            )}

            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Personal Information</h3>
                <form onSubmit={handleUpdateProfile}>
                  <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Full Name *</label>
                      <input type="text" className="form-control" style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600 }} value={editProfileData.name} onChange={e => setEditProfileData({...editProfileData, name: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Contact Number *</label>
                      <input type="text" className="form-control" style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600 }} value={editProfileData.contact} onChange={e => setEditProfileData({...editProfileData, contact: e.target.value})} required />
                    </div>
                  </div>
                  <div className="mobile-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Age *</label>
                      <input type="number" className="form-control" style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600 }} value={editProfileData.age} onChange={e => setEditProfileData({...editProfileData, age: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Gender *</label>
                      <select className="form-control" style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '10px', fontSize: '13px', fontWeight: 600, background: 'white' }} value={editProfileData.gender} onChange={e => setEditProfileData({...editProfileData, gender: e.target.value})} required>
                        <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Blood Group</label>
                      <select className="form-control" style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '10px', fontSize: '13px', fontWeight: 600, background: 'white' }} value={editProfileData.bloodGroup} onChange={e => setEditProfileData({...editProfileData, bloodGroup: e.target.value})}>
                        <option value="O+">O+</option><option value="O-">O-</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Address</label>
                    <textarea className="form-control" style={{ minHeight: '60px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '10px 12px', fontSize: '13px', fontWeight: 600 }} value={editProfileData.address} onChange={e => setEditProfileData({...editProfileData, address: e.target.value})} placeholder="Full address"></textarea>
                  </div>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Allergies</label>
                    <input type="text" className="form-control" placeholder="e.g. Peanuts, Penicillin (Leave empty if none)" style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600 }} value={editProfileData.allergies} onChange={e => setEditProfileData({...editProfileData, allergies: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Medical History (Comma separated)</label>
                    <input type="text" className="form-control" placeholder="e.g. Asthma, Diabetes" style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600 }} value={editProfileData.medicalHistory} onChange={e => setEditProfileData({...editProfileData, medicalHistory: e.target.value})} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px', justifyContent: 'center', fontWeight: 800, borderRadius: '8px', background: 'var(--primary-gradient)' }} disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>

              <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Change Password</h3>
                <form onSubmit={handleUpdatePassword}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Current Password *</label>
                    <input type="password" className="form-control" placeholder="Enter current password" style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600 }} value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>New Password *</label>
                    <input type="password" className="form-control" placeholder="Enter new password" style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600 }} value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Confirm New Password *</label>
                    <input type="password" className="form-control" placeholder="Re-type new password" style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600 }} value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} required />
                  </div>
                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', height: '46px', justifyContent: 'center', fontWeight: 800, borderRadius: '8px', background: 'white', border: '1px solid #CBD5E1' }} disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'book-appointment' && selectedDoctor && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <button className="btn btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setActiveTab('find')}>
                <i data-lucide="arrow-left" style={{ width: '16px' }}></i> Back to Specialists
              </button>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Schedule Appointment & Secure Checkout</h1>
            </div>

            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Pre-filled Patient Record */}
                <div className="glass-card" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>1</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D23', margin: 0 }}>Patient Information</h3>
                    <span className="status-badge available" style={{ marginLeft: 'auto', background: '#F0FDF4', color: '#10B981', fontSize: '11px', fontWeight: 800 }}>✓ Verified Profile</span>
                  </div>
                  
                  <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Full Name</label>
                      <input type="text" className="form-control" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'not-allowed', fontWeight: 700 }} value={patientProfile?.name || user.name || ''} readOnly />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Patient ID (UHID)</label>
                      <input type="text" className="form-control" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'not-allowed', fontWeight: 700 }} value={patientProfile ? `#MDC-${patientProfile._id.substring(18).toUpperCase()}` : '#MC-9921'} readOnly />
                    </div>
                  </div>

                  <div className="mobile-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Gender</label>
                      <input type="text" className="form-control" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'not-allowed', fontWeight: 700 }} value={patientProfile?.gender || 'Male'} readOnly />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Age</label>
                      <input type="text" className="form-control" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'not-allowed', fontWeight: 700 }} value={`${patientProfile?.age || '34'} Yrs`} readOnly />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Blood Group</label>
                      <input type="text" className="form-control" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'not-allowed', fontWeight: 700 }} value={patientProfile?.bloodGroup || 'O+'} readOnly />
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontWeight: 600 }}>
                    <i data-lucide="shield-check" style={{ width: '14px', color: '#10B981' }}></i> DPDP Act Compliant: Details pre-filled securely from registered healthcare records.
                  </div>
                </div>

                {/* Visit Details */}
                <div className="glass-card" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>2</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D23', margin: 0 }}>Consultation Details</h3>
                  </div>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D23', marginBottom: '8px', display: 'block' }}>Select Appointment Date <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="date" className="form-control" style={{ height: '48px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }} value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} required />
                  </div>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D23', marginBottom: '12px', display: 'block' }}>Preferred Time Slot <span style={{ color: '#EF4444' }}>*</span></label>
                    <div className="mobile-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      {['10:30 AM', '11:00 AM', '02:30 PM'].map(time => (
                        <div key={time} style={{ padding: '12px', textAlign: 'center', background: appointmentTime === time ? 'var(--primary-light)' : '#F8FAFC', color: appointmentTime === time ? 'var(--primary)' : 'var(--text-muted)', borderRadius: '10px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', border: appointmentTime === time ? '2px solid var(--primary)' : '2px solid transparent', transition: '0.2s' }} onClick={() => setAppointmentTime(time)}>{time}</div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D23', marginBottom: '8px', display: 'block' }}>Reason for Visit / Symptoms</label>
                    <textarea className="form-control" style={{ minHeight: '100px', fontSize: '13px', borderRadius: '10px', padding: '12px' }} placeholder="Briefly describe your symptoms or medical concern..." value={appointmentReason} onChange={e => setAppointmentReason(e.target.value)}></textarea>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Consulting Specialist Card */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 16px' }}>Consulting Doctor</h4>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900 }}>
                      {selectedDoctor.name ? selectedDoctor.name.substring(0,2).toUpperCase() : 'DR'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '16px', color: '#1A1D23' }}>{selectedDoctor.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>{selectedDoctor.specialty || 'General OPD'}</div>
                    </div>
                  </div>
                </div>

                {/* Billing Summary */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D23', marginBottom: '16px' }}>Billing Summary</h3>
                  <div className="billing-summary" style={{ marginBottom: 0 }}>
                    <div className="billing-row"><span>Consultation Fee</span> <span>₹500.00</span></div>
                    <div className="billing-row"><span>Registration Fee</span> <span>₹50.00</span></div>
                    <div className="billing-total" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px dashed var(--border)' }}>
                      <span>Total Amount</span> <span>₹550.00</span>
                    </div>
                  </div>
                </div>

                {/* Payment Gateway */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '12px', color: '#1A1D23' }}>Payment Method <span style={{ color: '#EF4444' }}>*</span></label>
                  <div className="payment-grid" style={{ marginBottom: '20px' }}>
                    {['UPI', 'Card', 'Banking'].map(method => (
                      <div key={method} className={`pay-btn ${paymentMethod === method ? 'active' : ''}`} onClick={() => setPaymentMethod(method)} style={{ fontSize: '12px', padding: '10px' }}>
                        {paymentMethod === method && (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="lucide lucide-check-circle"
                            style={{ flexShrink: 0 }}
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        )} {method}
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: '52px', fontSize: '15px', borderRadius: '12px', background: 'var(--primary-gradient)', boxShadow: '0 8px 16px rgba(59, 113, 254, 0.2)' }} onClick={confirmBooking} disabled={loading}>
                    <i data-lucide="lock" style={{ width: '16px' }}></i> {loading ? 'Processing...' : 'Pay ₹550 & Confirm'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

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
        <div className={`mob-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><i data-lucide="user"></i><span>Profile</span></div>
      </div>
    </>
  );
};

export default PatientDashboard;
