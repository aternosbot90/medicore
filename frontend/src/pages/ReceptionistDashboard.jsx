import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ReceptionistDashboard = () => {
  const [activeTab, setActiveTab] = useState('dash');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [appointments, setAppointments] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', contact: '', email: '', doctorId: '', bloodGroup: 'O+', address: '', medicalHistory: ''
  });

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomDropdownOpen, setSymptomDropdownOpen] = useState(false);
  const availableSymptoms = ['Fever', 'Headache', 'Body Pain', 'Fatigue', 'Weakness', 'Cough', 'Nausea'];
  
  const [selectedSlot, setSelectedSlot] = useState('10:30 AM');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [isExistingPatient, setIsExistingPatient] = useState(null); // null = choose mode, true = existing, false = new register
  const [searchPatientQuery, setSearchPatientQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Date range filter states
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Premium Custom Toast Notifications
  const [notification, setNotification] = useState(null); // { message: '', type: 'success' | 'error' }
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const openDetailsModal = (app) => {
    setSelectedAppointment({ ...app });
    setDetailsModalOpen(true);
    setShowDeleteConfirm(false);
    setTimeout(() => window.lucide && window.lucide.createIcons(), 100);
  };

  const handleUpdateAppointment = async (app) => {
    try {
      await api.put(`/appointments/${app._id}`, { status: app.status, time: app.time });
      showToast("Appointment updated successfully", "success");
      setDetailsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      showToast("Failed to update appointment", "error");
    }
  };

  const handleDeleteAppointment = async (id) => {
    try {
      await api.delete(`/appointments/${id}`);
      showToast("Appointment deleted successfully", "success");
      setDetailsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      showToast("Failed to delete appointment", "error");
    }
  };

  const fetchData = async () => {
    try {
      const pts = await api.get('/patients');
      setPatientsList(pts.data);

      const apps = await api.get('/appointments');
      setAppointments(apps.data);

      const docs = await api.get('/auth/doctors');
      setDoctors(docs.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const getFilteredAppointments = () => {
    return appointments.filter(app => {
      if (!app.date) return true;
      const appDate = new Date(app.date);
      const appDateOnly = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate());

      if (startDate) {
        const start = new Date(startDate);
        const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        if (appDateOnly < startOnly) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        if (appDateOnly > endOnly) return false;
      }
      return true;
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getWeeklyData = () => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString();
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      data.push({
        label: dayName,
        fullDate: dateStr,
        count: 0,
        walkin: 0,
        online: 0
      });
    }

    appointments.forEach(app => {
      const appDate = new Date(app.date);
      const appDateStr = appDate.toLocaleDateString();
      const dayData = data.find(d => d.fullDate === appDateStr);
      if (dayData) {
        dayData.count += 1;
      }
    });

    data.forEach(d => {
       if (d.count > 0) {
           d.walkin = Math.ceil(d.count * 0.6);
           d.online = d.count - d.walkin;
       }
    });

    return data;
  };

  const weeklyData = getWeeklyData();
  const maxCount = Math.max(...weeklyData.map(d => Math.max(d.walkin, d.online)), 5);


  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, selectedSymptoms, showProfileMenu, showDateFilter]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'registration-form') {
      setIsExistingPatient(null);
      setSelectedPatient(null);
      setSearchPatientQuery('');
      setFormData({ name: '', age: '', gender: 'Male', contact: '', email: '', doctorId: '', bloodGroup: 'O+', address: '', medicalHistory: '' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
    setSymptomDropdownOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleCreateAppointment = async () => {
    try {
      setLoading(true);
      
      let patientId = null;

      if (isExistingPatient && selectedPatient) {
        patientId = selectedPatient._id;
      } else {
        // Collect full details for new registration
        if (!formData.name || !formData.age || !formData.contact) {
          showToast("Please fill in Name, Age, and Contact Number for the new patient.", "error");
          setLoading(false);
          return;
        }

        const patientRes = await api.post('/patients', {
          name: formData.name,
          age: parseInt(formData.age) || 30,
          gender: formData.gender,
          contact: formData.contact,
          email: formData.email || '',
          bloodGroup: formData.bloodGroup || 'O+',
          address: formData.address || '',
          medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map(item => item.trim()) : []
        });
        patientId = patientRes.data._id;
      }

      if (!patientId) {
        showToast("Failed to resolve Patient ID. Please select or register a patient.", "error");
        setLoading(false);
        return;
      }

      await api.post('/appointments', {
        patientId,
        doctorId: formData.doctorId || doctors[0]?._id,
        date: new Date(),
        time: selectedSlot,
        reason: selectedSymptoms.join(', ') || 'General Checkup'
      });

      await api.post('/billing', {
        patientId,
        items: [
          { description: 'Consultation Fee', amount: 500 },
          { description: 'Registration Fee', amount: 50 }
        ],
        totalAmount: 550,
        paymentMethod: paymentMethod
      });

      showToast("Appointment booked successfully!", "success");
      setFormData({ name: '', age: '', gender: 'Male', contact: '', email: '', doctorId: '', bloodGroup: 'O+', address: '', medicalHistory: '' });
      setSelectedSymptoms([]);
      setIsExistingPatient(null);
      setSearchPatientQuery('');
      setSelectedPatient(null);
      fetchData();
      switchTab('appointments');
    } catch (err) {
      console.error(err);
      showToast('Failed to create appointment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {notification && (
        <div className="premium-toast" style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: notification.type === 'error' ? '1px solid #FEE2E2' : '1px solid #ECFDF5',
          borderRadius: '16px',
          padding: '12px 24px',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'toastSlideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: notification.type === 'error' ? '#FEE2E2' : '#ECFDF5',
            color: notification.type === 'error' ? '#EF4444' : '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 900
          }}>
            {notification.type === 'error' ? '✕' : '✓'}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D23' }}>{notification.message}</span>
        </div>
      )}

      <div className="sidebar">
        <div className="sidebar-logo">
          <i data-lucide="heart" style={{ color: 'var(--primary)', fill: 'var(--primary)' }}></i>
          <span>MediCore</span>
        </div>
        <nav>
          <a href="#" className={`nav-link ${activeTab === 'dash' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); switchTab('dash'); }}><i data-lucide="layout-grid"></i> Dashboard</a>
          <a href="#" className={`nav-link ${['patients', 'patient-details'].includes(activeTab) ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); switchTab('patients'); }}><i data-lucide="users"></i> Patient Management</a>
          <a href="#" className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); switchTab('appointments'); }}><i data-lucide="calendar"></i> Appointments</a>
          <a href="#" className={`nav-link ${activeTab === 'staff' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); switchTab('staff'); }}><i data-lucide="user-cog"></i> Staff Management</a>
          <a href="#" className={`nav-link ${activeTab === 'billing' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); switchTab('billing'); }}><i data-lucide="wallet"></i> Finance & Billing</a>
        </nav>

        <div className="sidebar-user" onClick={handleLogout} style={{cursor: 'pointer'}}>
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" className="user-avatar" alt="Avatar" />
          <div className="user-info">
            <div className="name">{user.name || 'Roshni'}</div>
            <div className="role">Receptionist</div>
          </div>
          <i data-lucide="log-out" style={{ marginLeft: 'auto', width: '16px', color: 'var(--danger)' }}></i>
        </div>
      </div>

      <div className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '560px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '17px', fontWeight: 950, color: 'var(--primary)', letterSpacing: '-0.5px' }}>MediCore</span>
            <span style={{ fontSize: '10px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: '99px', fontWeight: 700 }} className="desktop-only-inline">
              Front Desk
            </span>
          </div>
          <div className="desktop-only-flex" style={{ flex: 1, position: 'relative', alignItems: 'center' }}>
            <i data-lucide="search" style={{ position: 'absolute', left: '16px', color: '#64748B', width: '16px' }}></i>
            <input type="text" className="search-input" placeholder="Search..." style={{ background: '#F8FAFC', border: 'none', paddingLeft: '44px', height: '40px', width: '100%', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }} />
            <span className="desktop-only-flex" style={{ position: 'absolute', right: '12px', fontSize: '10px', fontWeight: 700, color: '#94A3B8', background: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0', pointerEvents: 'none' }}>Ctrl + K</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto', flexShrink: 0 }}>
          <button className="btn desktop-only-flex" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', background: 'white', borderRadius: '10px', padding: '8px 16px', fontWeight: 700, alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <i data-lucide="alert-circle" style={{ width: '18px' }}></i> Emergency
          </button>
          
          <div className="action-icon-btn desktop-only-flex" style={{ color: '#64748B' }} onClick={() => switchTab('settings')}>
            <i data-lucide="settings" style={{ width: '18px' }}></i>
          </div>

          <div style={{ position: 'relative', zIndex: 2000 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px' }} onClick={() => setShowProfileMenu(!showProfileMenu)} className="top-nav-user">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid var(--primary-light)' }} alt="Avatar" />
              <div style={{ display: 'none', flexDirection: 'column' }} className="desktop-only-flex">
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D23' }}>{user.name || 'Roshni'}</span>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>Receptionist</span>
              </div>
              <i data-lucide="chevron-down" style={{ width: '14px', color: '#64748B', transition: '0.3s', transform: showProfileMenu ? 'rotate(180deg)' : 'none' }}></i>
            </div>

            {showProfileMenu && (
              <div className="glass-card" style={{ position: 'absolute', top: '100%', right: 0, width: '200px', marginTop: '12px', zIndex: 3000, padding: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', background: 'white' }}>
                <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px' }}>{user.name || 'Receptionist'}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Front Desk Admin</div>
                </div>
                <div className="dropdown-item" onClick={() => { setShowProfileMenu(false); switchTab('profile'); }}><i data-lucide="user"></i> Profile</div>
                <div className="dropdown-item" onClick={() => { setShowProfileMenu(false); switchTab('settings'); }}><i data-lucide="settings"></i> Settings</div>
                <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }}></div>
                <div className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}><i data-lucide="log-out"></i> Logout</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="main-content">
        {activeTab === 'dash' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="dashboard-header mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: 'var(--f-h1)', fontWeight: 900, color: '#1A1D23', marginBottom: '4px' }}>Welcome, {user.name || 'Roshni'}</h1>
                <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <button className="btn btn-primary" style={{ height: '48px', padding: '0 24px', fontWeight: 800, borderRadius: '12px', background: 'var(--primary-gradient)', boxShadow: '0 10px 20px rgba(59, 113, 254, 0.1)' }} onClick={() => switchTab('registration-form')}>
                <i data-lucide="plus" style={{ width: '18px' }}></i> New Appointment
              </button>
            </div>

            <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
              <div className="kpi-card" onClick={() => switchTab('appointments')}>
                <div className="kpi-icon-box" style={{ background: '#FFF7ED', color: '#EA580C', width: '40px', height: '40px', flexShrink: 0 }}><i data-lucide="calendar" style={{ width: '18px' }}></i></div>
                <div><div style={{ fontSize: '10px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Apps</div><div style={{ fontSize: '20px', fontWeight: 900 }}>{appointments.length}</div></div>
              </div>
              <div className="kpi-card" onClick={() => switchTab('patients')}>
                <div className="kpi-icon-box" style={{ background: '#F0F9FF', color: '#0284C7', width: '40px', height: '40px', flexShrink: 0 }}><i data-lucide="user" style={{ width: '18px' }}></i></div>
                <div><div style={{ fontSize: '10px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Patients</div><div style={{ fontSize: '20px', fontWeight: 900 }}>{patientsList.length}</div></div>
              </div>
              <div className="kpi-card" onClick={() => switchTab('staff')}>
                <div className="kpi-icon-box" style={{ background: '#F5F3FF', color: '#7C3AED', width: '40px', height: '40px', flexShrink: 0 }}><i data-lucide="stethoscope" style={{ width: '18px' }}></i></div>
                <div><div style={{ fontSize: '10px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Doctors</div><div style={{ fontSize: '20px', fontWeight: 900 }}>{doctors.length}</div></div>
              </div>
              <div className="kpi-card" onClick={() => switchTab('billing')}>
                <div className="kpi-icon-box" style={{ background: '#FDF2F8', color: '#DB2777', width: '40px', height: '40px', flexShrink: 0 }}><i data-lucide="wallet" style={{ width: '18px' }}></i></div>
                <div><div style={{ fontSize: '10px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Revenue</div><div style={{ fontSize: '20px', fontWeight: 900 }}>₹5.5k</div></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', marginBottom: '40px' }} className="mobile-stack">
              <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1D23' }}>Weekly Patient Trend</h3>
                    <div className="chart-legend-inline">
                      <div className="legend-item-small">
                        <div className="legend-dot" style={{ background: '#7C3AED' }}></div>
                        Walk-ins
                      </div>
                      <div className="legend-item-small">
                        <div className="legend-dot" style={{ background: 'var(--primary)' }}></div>
                        Online
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '11px', borderRadius: '10px', background: '#F1F5F9', fontWeight: 800 }}>View All</button>
                </div>
                
                <div className="table-responsive" style={{ height: '220px', position: 'relative', marginBottom: '24px', overflowY: 'hidden', overflowX: 'auto' }}>
                  <div className="chart-glow-bg"></div>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '180px', pointerEvents: 'none' }}>
                    <div style={{ height: '33.3%', borderBottom: '1px solid #F1F5F9' }}></div>
                    <div style={{ height: '33.3%', borderBottom: '1px solid #F1F5F9' }}></div>
                    <div style={{ height: '33.3%', borderBottom: '1px solid #F1F5F9' }}></div>
                  </div>

                  <div className="bar-chart-container" style={{ minWidth: '500px' }}>
                    {weeklyData.map((day, idx) => {
                       const walkinPercent = Math.max((day.walkin / maxCount) * 100, 5);
                       const onlinePercent = Math.max((day.online / maxCount) * 100, 5);
                       
                       return (
                         <div key={idx} className="bar-group">
                           <div className="bar-pair">
                             <div className="chart-bar walkin" style={{ height: `${walkinPercent}%` }}>
                               <div className="bar-tooltip">{day.walkin} Walk-ins</div>
                             </div>
                             <div className="chart-bar online" style={{ height: `${onlinePercent}%` }}>
                               <div className="bar-tooltip">{day.online} Online</div>
                             </div>
                           </div>
                           <div className="bar-label" style={{ marginTop: '12px' }}>{day.label}</div>
                         </div>
                       )
                    })}
                  </div>
                </div>

                <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #F1F5F9', paddingTop: '24px', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0F4FF', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="user" style={{ width: '16px' }}></i></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 900, fontSize: '14px', color: '#1A1D23' }}>Walk-In</span>
                        <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--primary)' }}>60%</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#10B981', fontWeight: 800 }}>-15% Trend</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="globe" style={{ width: '16px' }}></i></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 900, fontSize: '14px', color: '#1A1D23' }}>Online</span>
                        <span style={{ fontWeight: 800, fontSize: '12px', color: '#7C3AED' }}>40%</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#10B981', fontWeight: 800 }}>+12% Trend</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '32px' }}>
                <div className="flex-between" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1D23' }}>Doctor's availability</h3>
                  <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '11px', borderRadius: '10px', background: '#F1F5F9', fontWeight: 800 }}>View All</button>
                </div>
                <div className="avail-list">
                  {doctors.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No doctors found.</div>
                  ) : doctors.map(doc => (
                    <div key={doc._id || doc.id} className="avail-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div className="avail-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800 }}>
                          {doc.name ? doc.name.substring(0,2).toUpperCase() : 'DR'}
                        </div>
                        <div><div style={{ fontWeight: 900, fontSize: '14px', color: '#1A1D23' }}>{doc.name || 'Unnamed Doctor'}</div><p style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>{doc.specialty || 'General Physician'}</p></div>
                      </div>
                      <span className="status-badge available" style={{ fontSize: '10px', borderRadius: '8px', padding: '6px 12px' }}>Available</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div className="flex-between" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Latest Appointments</h3>
                <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }}>View All</button>
              </div>
               <div className="table-responsive">
                 <table className="elite-table" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
                   <thead><tr><th>Patient ID</th><th>Patient Name</th><th>Doctor Name</th><th>Status</th><th>Date & Time</th><th>Action</th></tr></thead>
                   <tbody>
                     {appointments.length === 0 ? (
                       <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No recent appointments found.</td></tr>
                     ) : appointments.slice(0, 5).map(app => (
                       <tr key={app._id || app.id}>
                         <td>#{app.patientId?._id?.substring(18).toUpperCase() || 'ID'}</td>
                         <td>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                             <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                               {(app.patientId?.name || 'Unknown').substring(0, 1).toUpperCase()}
                             </div>
                             <span style={{ fontWeight: 700 }}>{app.patientId?.name || 'Unknown Patient'}</span>
                           </div>
                         </td>
                         <td>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                             <span style={{ fontWeight: 600, fontSize: '13px' }}>{app.doctorId?.name || app.doctor}</span>
                           </div>
                         </td>
                         <td><span className="status-badge upcoming" style={{ fontSize: '11px' }}>{app.status}</span></td>
                         <td style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>{app.time}</td>
                         <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px' }} onClick={() => openDetailsModal(app)}>View Details</button></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* PATIENTS TAB */}
        {activeTab === 'patients' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23', marginBottom: '4px' }}>Patients</h2>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>Home <span style={{ margin: '0 8px' }}>»</span> <span style={{ color: '#1A1D23' }}>Patients</span></div>
              </div>
              <button className="btn btn-primary" style={{ height: '52px', padding: '0 32px', fontWeight: 800, borderRadius: '14px', background: 'var(--primary-gradient)', boxShadow: '0 10px 20px rgba(59, 113, 254, 0.2)' }} onClick={() => switchTab('registration-form')}>
                <i data-lucide="plus" style={{ width: '20px' }}></i> Create Appointment
              </button>
            </div>
            
            <div className="glass-card" style={{ padding: '24px' }}>
              <div className="filter-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ flex: 1, maxWidth: '400px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i data-lucide="search" style={{ position: 'absolute', left: '16px', color: '#64748B', width: '18px' }}></i>
                    <input type="text" className="search-input" placeholder="Search Patients..." style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', paddingLeft: '44px', height: '44px', width: '100%', borderRadius: '12px', fontSize: '14px', fontWeight: 600 }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="btn btn-secondary" style={{ padding: '0 16px', height: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}><i data-lucide="filter" style={{ width: '18px' }}></i> Filter</button>
                    <button className="btn btn-secondary" style={{ padding: '0 16px', height: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}><i data-lucide="download" style={{ width: '18px' }}></i> Export</button>
                </div>
              </div>
               <div className="table-responsive">
                 <table className="elite-table" style={{ margin: 0, borderCollapse: 'collapse', borderSpacing: 0 }}>
                  <thead style={{ background: '#F8FAFC' }}>
                      <tr>
                          <th style={{ width: '40px' }}><input type="checkbox" style={{ width: '16px', height: '16px', borderRadius: '4px' }} /></th>
                          <th>Patient ID</th>
                          <th>Name</th>
                          <th>Gender</th>
                          <th>Mobile Number</th>
                          <th>Email</th>
                          <th style={{ width: '40px' }}></th>
                      </tr>
                  </thead>
                  <tbody>
                    {patientsList.map(p => (
                      <tr key={p._id} className="patients-table" style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td><input type="checkbox" style={{ width: '16px', height: '16px', borderRadius: '4px' }} /></td>
                          <td style={{ color: '#64748B', fontWeight: 600 }}>#{p._id.substring(18).toUpperCase()}</td>
                          <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => { setSelectedPatient(p); switchTab('patient-details'); }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                                    {getInitials(p.name)}
                                  </div>
                                  <span style={{ fontWeight: 700, color: '#1A1D23' }}>{p.name}</span>
                              </div>
                          </td>
                          <td style={{ color: '#64748B', fontWeight: 600 }}>{p.gender}</td>
                          <td style={{ color: '#64748B', fontWeight: 600 }}>{p.contact}</td>
                          <td style={{ color: '#64748B', fontWeight: 600 }}>{p.email || 'N/A'}</td>
                          <td><i data-lucide="more-vertical" style={{ width: '18px', color: '#64748B', cursor: 'pointer' }}></i></td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {/* PATIENT DETAILS TAB */}
        {activeTab === 'patient-details' && (
           <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23', marginBottom: '4px' }}>Patient Profile</h1>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>Patient Management <span style={{ margin: '0 8px' }}>»</span> <span style={{ color: '#1A1D23' }}>Profile</span></div>
                </div>
                <button className="btn btn-primary" style={{ height: '52px', padding: '0 32px', fontWeight: 800, borderRadius: '14px', background: 'var(--primary-gradient)', boxShadow: '0 10px 20px rgba(59, 113, 254, 0.2)' }} onClick={() => switchTab('registration-form')}>
                    <i data-lucide="plus" style={{ width: '20px' }}></i> Create Appointment
                </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px', position: 'relative' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900 }}>
                              {selectedPatient ? getInitials(selectedPatient.name) : 'PT'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 800, background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '4px' }}>
                                  #{selectedPatient?._id?.substring(18).toUpperCase() || 'PT001'}
                                </div>
                                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D23', marginBottom: '4px' }}>{selectedPatient?.name || 'No Patient Selected'}</h2>
                                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Registered : {selectedPatient?.createdAt ? new Date(selectedPatient.createdAt).toLocaleDateString() : 'N/A'}</div>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D23', marginBottom: '20px' }}>Basic Information</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B', fontWeight: 600 }}>Age</span><span style={{ fontWeight: 700, color: '#1A1D23' }}>{selectedPatient?.age || 'N/A'} Yrs</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B', fontWeight: 600 }}>Gender</span><span style={{ fontWeight: 700, color: '#1A1D23' }}>{selectedPatient?.gender || 'N/A'}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B', fontWeight: 600 }}>Blood Group</span><span style={{ fontWeight: 700, color: '#1A1D23' }}>{selectedPatient?.bloodGroup || 'N/A'}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B', fontWeight: 600 }}>Phone Number</span><span style={{ fontWeight: 700, color: '#1A1D23' }}>{selectedPatient?.contact || 'N/A'}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B', fontWeight: 600 }}>Email</span><span style={{ fontWeight: 700, color: '#1A1D23' }}>{selectedPatient?.email || 'N/A'}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B', fontWeight: 600 }}>Allergies</span><span style={{ fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '2px 8px', borderRadius: '4px' }}>{selectedPatient?.allergies || 'None'}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B', fontWeight: 600 }}>Medical History</span><span style={{ fontWeight: 700, color: '#1A1D23' }}>{selectedPatient?.medicalHistory && selectedPatient.medicalHistory.length > 0 ? selectedPatient.medicalHistory.join(', ') : 'None'}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: 0 }}>
                        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D23' }}>Appointments</h3>
                            <button className="btn btn-secondary" style={{ height: '32px', fontSize: '11px', padding: '0 12px', fontWeight: 800 }}>View All</button>
                        </div>
                        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {appointments.filter(app => app.patientId?._id === selectedPatient?._id || app.patientId === selectedPatient?._id).length === 0 ? (
                              <div style={{ colSpan: 2, color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0', gridColumn: 'span 2' }}>
                                No appointments found for this patient.
                              </div>
                            ) : appointments.filter(app => app.patientId?._id === selectedPatient?._id || app.patientId === selectedPatient?._id).map(app => (
                              <div key={app._id} style={{ padding: '24px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                      <span style={{ 
                                        background: app.status === 'upcoming' || app.status === 'Scheduled' ? '#EFF6FF' : '#F0FDF4', 
                                        color: app.status === 'upcoming' || app.status === 'Scheduled' ? '#3B82F6' : '#10B981', 
                                        fontSize: '11px', padding: '4px 12px', borderRadius: '6px', fontWeight: 800 
                                      }}>{app.status}</span>
                                      <div style={{ width: '32px', height: '32px', background: 'var(--primary)', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="calendar" style={{ width: '16px' }}></i></div>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                      <div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Symptom / Reason</div><div style={{ fontSize: '13px', fontWeight: 700 }}>{app.reason || 'General Checkup'}</div></div>
                                      <div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Doctor</div><div style={{ fontSize: '13px', fontWeight: 700 }}>{app.doctorId?.name || app.doctor || 'Unknown Doctor'}</div></div>
                                  </div>
                                  <div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Date & Time</div><div style={{ fontSize: '13px', fontWeight: 700 }}>{app.date ? new Date(app.date).toLocaleDateString() : 'N/A'} at {app.time}</div></div>
                              </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
           </div>
        )}

        {/* REGISTRATION FORM TAB */}
        {activeTab === 'registration-form' && (
           <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23', margin: 0 }}>Registration and appointment</h1>
                {isExistingPatient !== null && (
                  <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => {
                    setIsExistingPatient(null);
                    setSelectedPatient(null);
                    setFormData({ name: '', age: '', gender: 'Male', contact: '', email: '', doctorId: formData.doctorId, bloodGroup: 'O+', address: '', medicalHistory: '' });
                  }}>
                    ← Back to Selection
                  </button>
                )}
              </div>

              {isExistingPatient === null ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '380px', marginBottom: '40px' }}>
                  <div className="glass-card" style={{ width: '560px', padding: '40px', borderRadius: '16px', background: 'white', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)' }}>
                    
                    {/* Header: User Icon + Title + Subtitle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
                      <div style={{ 
                        width: '52px', 
                        height: '52px', 
                        borderRadius: '50%', 
                        background: '#EFF6FF', 
                        color: '#3B82F6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <i data-lucide="user" style={{ width: '26px', height: '26px' }}></i>
                      </div>
                      <div>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>Registered Patient</h2>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: 0, fontWeight: 500, lineHeight: '1.4' }}>
                          Search and select an existing patient to book an appointment.
                        </p>
                      </div>
                    </div>

                    {/* Search Field with magnifying glass on the right */}
                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search by Patient ID or Phone Number" 
                        style={{ 
                          height: '52px', 
                          paddingRight: '48px', 
                          paddingLeft: '16px',
                          borderRadius: '10px', 
                          fontSize: '14px', 
                          fontWeight: 600,
                          border: '1px solid #CBD5E1',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                        value={searchPatientQuery}
                        onChange={e => setSearchPatientQuery(e.target.value)}
                      />
                      <i data-lucide="search" style={{ position: 'absolute', right: '16px', top: '16px', color: '#94A3B8', width: '20px', height: '20px' }}></i>
                    </div>

                    {/* Search Autocomplete List */}
                    {searchPatientQuery.trim().length > 0 && (
                      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '10px', background: '#F8FAFC', marginBottom: '20px' }}>
                        {patientsList.filter(p => {
                          const q = searchPatientQuery.toLowerCase();
                          return p.name.toLowerCase().includes(q) || p.contact.toLowerCase().includes(q) || p._id.toLowerCase().includes(q);
                        }).length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '13px', fontWeight: 600 }}>
                            No matching patients found.
                          </div>
                        ) : (
                          patientsList.filter(p => {
                            const q = searchPatientQuery.toLowerCase();
                            return p.name.toLowerCase().includes(q) || p.contact.toLowerCase().includes(q) || p._id.toLowerCase().includes(q);
                          }).map(p => (
                            <div 
                              key={p._id} 
                              style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: '0.2s' }}
                              onClick={() => {
                                setSelectedPatient(p);
                                setFormData({
                                  name: p.name,
                                  age: p.age,
                                  gender: p.gender,
                                  contact: p.contact,
                                  email: p.email || '',
                                  bloodGroup: p.bloodGroup || 'O+',
                                  address: p.address || '',
                                  medicalHistory: p.medicalHistory ? p.medicalHistory.join(', ') : '',
                                  doctorId: formData.doctorId
                                });
                                setIsExistingPatient(true);
                              }}
                              className="patient-search-row"
                            >
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '13px', color: '#1A1D23' }}>{p.name}</div>
                                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                                  #{p._id.substring(18).toUpperCase()} • {p.gender} • {p.age} Yrs
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>{p.contact}</div>
                                <span style={{ fontSize: '10px', background: '#EFF6FF', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, display: 'inline-block', marginTop: '4px' }}>Select</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    <div style={{ width: '100%', height: '1px', background: '#F1F5F9', marginBottom: '20px' }}></div>

                    {/* Register New Patient green border button */}
                    <button 
                      className="btn" 
                      style={{ 
                        width: '100%', 
                        height: '52px', 
                        fontWeight: 800, 
                        borderRadius: '10px', 
                        border: '2px solid #10B981', 
                        background: 'transparent',
                        color: '#10B981',
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '0 20px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onClick={() => {
                        setSelectedPatient(null);
                        setFormData({ name: '', age: '', gender: 'Male', contact: '', email: '', doctorId: formData.doctorId, bloodGroup: 'O+', address: '', medicalHistory: '' });
                        setIsExistingPatient(false);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F0FDF4';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Register New Patient
                      <i data-lucide="chevron-right" style={{ width: '18px', height: '18px', marginLeft: 'auto', strokeWidth: 3 }}></i>
                    </button>

                  </div>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '40px', marginBottom: '40px' }}>
                  
                  {/* Status Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: isExistingPatient ? '#EFF6FF' : '#F0FDF4', border: isExistingPatient ? '1px solid #BFDBFE' : '1px solid #BBF7D0', borderRadius: '12px', marginBottom: '36px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isExistingPatient ? '#3B82F6' : '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i data-lucide={isExistingPatient ? "check" : "edit-3"} style={{ width: '16px' }}></i>
                      </div>
                      <div>
                        {isExistingPatient ? (
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#1E40AF' }}>
                            Booking Appointment for Registered Patient: <b style={{ textDecoration: 'underline' }}>{selectedPatient?.name}</b> (ID: #{selectedPatient?._id?.substring(18).toUpperCase()})
                          </span>
                        ) : (
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#166534' }}>
                            📝 Registering a New First-Time Patient Profile
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      className="btn" 
                      style={{ fontSize: '11px', fontWeight: 800, padding: '6px 12px', background: 'white', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer' }}
                      onClick={() => {
                        setIsExistingPatient(null);
                        setSelectedPatient(null);
                        setFormData({ name: '', age: '', gender: 'Male', contact: '', email: '', doctorId: formData.doctorId, bloodGroup: 'O+', address: '', medicalHistory: '' });
                      }}
                    >
                      Change Mode
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>1</div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D23', margin: 0 }}>Patient Information</h2>
                  </div>
                  
                  {/* Expanded Fields Form */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
                      <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Full Name <span style={{ color: '#EF4444' }}>*</span></label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Enter full name" 
                            style={{ height: '48px', borderRadius: '8px', background: isExistingPatient ? '#F1F5F9' : 'white', cursor: isExistingPatient ? 'not-allowed' : 'text', fontWeight: isExistingPatient ? 700 : 500 }} 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            readOnly={isExistingPatient} 
                          />
                      </div>
                      <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Gender <span style={{ color: '#EF4444' }}>*</span></label>
                          <select 
                            className="form-control" 
                            style={{ height: '48px', borderRadius: '8px', background: isExistingPatient ? '#F1F5F9' : 'white', cursor: isExistingPatient ? 'not-allowed' : 'pointer', fontWeight: isExistingPatient ? 700 : 500 }} 
                            value={formData.gender} 
                            onChange={e => setFormData({...formData, gender: e.target.value})} 
                            disabled={isExistingPatient}
                          >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                          </select>
                      </div>
                      <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Age <span style={{ color: '#EF4444' }}>*</span></label>
                          <input 
                            type="number" 
                            className="form-control" 
                            placeholder="Age" 
                            style={{ height: '48px', borderRadius: '8px', background: isExistingPatient ? '#F1F5F9' : 'white', cursor: isExistingPatient ? 'not-allowed' : 'text', fontWeight: isExistingPatient ? 700 : 500 }} 
                            value={formData.age} 
                            onChange={e => setFormData({...formData, age: e.target.value})} 
                            readOnly={isExistingPatient}
                          />
                      </div>
                      <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Mobile Number <span style={{ color: '#EF4444' }}>*</span></label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Enter Mobile Number" 
                            style={{ height: '48px', borderRadius: '8px', background: isExistingPatient ? '#F1F5F9' : 'white', cursor: isExistingPatient ? 'not-allowed' : 'text', fontWeight: isExistingPatient ? 700 : 500 }} 
                            value={formData.contact} 
                            onChange={e => setFormData({...formData, contact: e.target.value})} 
                            readOnly={isExistingPatient}
                          />
                      </div>
                      <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Email</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Enter Email" 
                            style={{ height: '48px', borderRadius: '8px', background: isExistingPatient ? '#F1F5F9' : 'white', cursor: isExistingPatient ? 'not-allowed' : 'text', fontWeight: isExistingPatient ? 700 : 500 }} 
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                            readOnly={isExistingPatient}
                          />
                      </div>
                      <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Blood Group</label>
                          <select 
                            className="form-control" 
                            style={{ height: '48px', borderRadius: '8px', background: isExistingPatient ? '#F1F5F9' : 'white', cursor: isExistingPatient ? 'not-allowed' : 'pointer', fontWeight: isExistingPatient ? 700 : 500 }} 
                            value={formData.bloodGroup} 
                            onChange={e => setFormData({...formData, bloodGroup: e.target.value})} 
                            disabled={isExistingPatient}
                          >
                              <option value="O+">O +ve</option>
                              <option value="O-">O -ve</option>
                              <option value="A+">A +ve</option>
                              <option value="A-">A -ve</option>
                              <option value="B+">B +ve</option>
                              <option value="B-">B -ve</option>
                              <option value="AB+">AB +ve</option>
                              <option value="AB-">AB -ve</option>
                          </select>
                      </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Residential Address</label>
                      <textarea 
                        className="form-control" 
                        placeholder="Enter full address details..." 
                        style={{ minHeight: '80px', borderRadius: '8px', background: isExistingPatient ? '#F1F5F9' : 'white', cursor: isExistingPatient ? 'not-allowed' : 'text', fontWeight: isExistingPatient ? 700 : 500, padding: '12px' }} 
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        readOnly={isExistingPatient}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Allergies & Medical History (Comma Separated)</label>
                      <textarea 
                        className="form-control" 
                        placeholder="Hypertension, Penicillin Allergy, etc..." 
                        style={{ minHeight: '80px', borderRadius: '8px', background: isExistingPatient ? '#F1F5F9' : 'white', cursor: isExistingPatient ? 'not-allowed' : 'text', fontWeight: isExistingPatient ? 700 : 500, padding: '12px' }} 
                        value={formData.medicalHistory}
                        onChange={e => setFormData({...formData, medicalHistory: e.target.value})}
                        readOnly={isExistingPatient}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>2</div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D23', margin: 0 }}>Visit & Appointment Details</h2>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                      <div className="form-group">
                          <label>Symptoms <span style={{ color: '#EF4444' }}>*</span></label>
                          <div className="custom-dropdown-container">
                              <div className="custom-dropdown-trigger" onClick={() => setSymptomDropdownOpen(!symptomDropdownOpen)}>
                                  <div className="selected-items">
                                      {selectedSymptoms.length > 0 ? (
                                          selectedSymptoms.map(s => (
                                            <div key={s} className="symptom-tag">
                                                {s}
                                                <i data-lucide="x" onClick={(e) => { e.stopPropagation(); toggleSymptom(s); }}></i>
                                            </div>
                                          ))
                                      ) : (
                                          <span style={{ color: '#94A3B8', fontWeight: 500 }}>Select symptoms</span>
                                      )}
                                  </div>
                                  <i data-lucide="chevron-down" style={{ width: '18px', color: '#94A3B8', transition: '0.3s', transform: symptomDropdownOpen ? 'rotate(180deg)' : 'none' }}></i>
                              </div>
                              {symptomDropdownOpen && (
                                  <div className="dropdown-options-box show">
                                      {availableSymptoms.map(s => (
                                          <div key={s} className="option-item" onClick={() => toggleSymptom(s)}>{s}</div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                      <div className="form-group">
                          <label>Select Doctor <span style={{ color: '#EF4444' }}>*</span></label>
                          <select className="form-control" style={{ height: '48px', borderRadius: '8px' }} value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>
                              <option value="">-- Choose Doctor --</option>
                              {doctors.map(doc => (
                                  <option key={doc._id} value={doc._id}>{doc.name}</option>
                              ))}
                          </select>
                      </div>
                  </div>

                  <div style={{ marginBottom: '48px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: '#64748B' }}>Select Slot / Queue</label>
                      <div className="time-grid">
                          {['10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM', '11:00 AM'].map(time => (
                              <div key={time} className={`time-chip ${selectedSlot === time ? 'selected' : 'available'}`} onClick={() => setSelectedSlot(time)}>
                                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{time}</div>
                                  <div style={{ fontSize: '10px', fontWeight: 600 }}>{selectedSlot === time ? 'Selected' : 'Available'}</div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>3</div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D23', margin: 0 }}>Billing & Payment</h2>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '40px', marginBottom: '48px' }}>
                      <div className="billing-summary">
                          <div className="billing-row"><span>Consultation Fee</span> <span>₹500.00</span></div>
                          <div className="billing-row"><span>Registration Fee</span> <span>₹50.00</span></div>
                          <div className="billing-total"><span>Total Amount</span> <span>₹550.00</span></div>
                      </div>
                      
                      <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: '#64748B' }}>Payment Method <span style={{ color: '#EF4444' }}>*</span></label>
                          <div className="payment-grid" style={{ marginBottom: '24px' }}>
                              {['Cash', 'UPI', 'Card', 'Insurance', 'Other'].map(method => (
                                  <div key={method} className={`pay-btn ${paymentMethod === method ? 'active' : ''}`} onClick={() => setPaymentMethod(method)}>
                                      {paymentMethod === method && <i data-lucide="check-circle"></i>} {method}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                      <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                          <button className="btn btn-secondary" style={{ height: '54px', flex: 1, justifyContent: 'center', fontWeight: 700, borderRadius: '10px' }}>Save as Draft</button>
                      </div>
                      <button className="btn btn-primary" style={{ width: '400px', height: '54px', fontWeight: 800, fontSize: '16px', borderRadius: '10px', justifyContent: 'center', gap: '12px' }} onClick={handleCreateAppointment} disabled={loading}>
                          <i data-lucide="qr-code"></i> {loading ? 'Processing...' : 'Confirm & Generate Token'}
                      </button>
                  </div>
                </div>
              )}
           </div>
        )}


        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            
            {/* Header: Title + Button Group */}
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>Appointments</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '48px', padding: '0 20px', borderRadius: '10px', fontWeight: 700 }} 
                  onClick={() => switchTab('registration-form')}
                >
                  <i data-lucide="plus" style={{ width: '18px', height: '18px' }}></i> Create Appointment
                </button>
                <button 
                  className="btn" 
                  style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '10px', 
                    background: showDateFilter ? 'rgba(59, 130, 246, 0.15)' : '#DDE3EA', 
                    color: '#2563EB', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}
                  onClick={() => {
                    setShowDateFilter(!showDateFilter);
                    setTimeout(() => window.lucide && window.lucide.createIcons(), 100);
                  }}
                  title="Filter appointments by date"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </button>
              </div>
            </div>

            {/* Sliding Date Range Filter Panel */}
            {showDateFilter && (
              <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', animation: 'slideDown 0.3s ease-out', border: '1px solid #BFDBFE', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i data-lucide="calendar-days" style={{ width: '18px', color: 'var(--primary)' }}></i> Select Appointment Date Range
                  </h4>
                  {(startDate || endDate) && (
                    <button 
                      className="btn" 
                      style={{ fontSize: '12px', padding: '4px 10px', background: 'transparent', color: '#EF4444', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                      onClick={() => { setStartDate(''); setEndDate(''); }}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '180px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>From Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      style={{ height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px' }} 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '180px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>To Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      style={{ height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px' }} 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)} 
                    />
                  </div>

                  {/* Preset Shortcuts */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ height: '40px', fontSize: '12px', fontWeight: 700, padding: '0 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white' }} 
                      onClick={() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        setStartDate(todayStr);
                        setEndDate(todayStr);
                      }}
                    >
                      Today
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ height: '40px', fontSize: '12px', fontWeight: 700, padding: '0 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white' }} 
                      onClick={() => {
                        const today = new Date();
                        const past7 = new Date();
                        past7.setDate(today.getDate() - 7);
                        setStartDate(past7.toISOString().split('T')[0]);
                        setEndDate(today.toISOString().split('T')[0]);
                      }}
                    >
                      Last 7 Days
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ height: '40px', fontSize: '12px', fontWeight: 700, padding: '0 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white' }} 
                      onClick={() => {
                        const today = new Date();
                        const past30 = new Date();
                        past30.setDate(today.getDate() - 30);
                        setStartDate(past30.toISOString().split('T')[0]);
                        setEndDate(today.toISOString().split('T')[0]);
                      }}
                    >
                      Last 30 Days
                    </button>
                  </div>
                </div>

                {/* Filter matches info */}
                <div style={{ marginTop: '14px', fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                  Found <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{getFilteredAppointments().length}</span> matching appointments.
                </div>
              </div>
            )}

            <div className="glass-card" style={{ padding: '24px' }}>
              <div className="table-responsive">
                <table className="elite-table" style={{ margin: 0 }}>
                  <thead style={{ background: '#F8FAFC' }}>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredAppointments().map(app => (
                      <tr key={app._id || app.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                              {getInitials(app.patientId?.name || 'Unknown')}
                            </div>
                            <span style={{ fontWeight: 700, color: '#1A1D23' }}>{app.patientId?.name || 'Unknown Patient'}</span>
                          </div>
                        </td>
                        <td>{app.doctorId?.name || app.doctor}</td>
                        <td style={{ fontWeight: 600 }}>{app.time}</td>
                        <td><span className="status-badge upcoming">{app.status}</span></td>
                        <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openDetailsModal(app)}>View Details</button></td>
                      </tr>
                    ))}
                    {getFilteredAppointments().length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontWeight: 600 }}>
                          No appointments found for the selected range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
            <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
              <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>Staff Management</h2>
                  <button className="btn btn-primary">Add Staff</button>
              </div>
              <div className="glass-card" style={{ padding: '24px' }}>
                  <div className="table-responsive">
                    <table className="elite-table" style={{ margin: 0 }}>
                        <thead style={{ background: '#F8FAFC' }}>
                            <tr>
                                <th>Staff Name</th>
                                <th>Role</th>
                                <th>Contact</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctors.map(doc => (
                                <tr key={doc._id || doc.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                                              {getInitials(doc.name || 'Staff')}
                                            </div>
                                            <span style={{ fontWeight: 700, color: '#1A1D23' }}>{doc.name || 'Unnamed Staff'}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{doc.specialty || 'General Physician'}</td>
                                    <td>
                                        <div style={{ fontSize: '13px', fontWeight: 700 }}>ID: {doc.staff_id || 'N/A'}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{doc.name ? `${doc.name.split(' ')[0].toLowerCase()}@medicore.com` : 'Contact Required'}</div>
                                    </td>
                                    <td><span className="status-badge available">Available</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>
            </div>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
            <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>Finance & Billing</h2>
                  <button className="btn btn-primary"><i data-lucide="download"></i> Export Report</button>
              </div>
              <div className="ph-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                  <div className="kpi-card" style={{ padding: '24px' }}>
                      <div className="kpi-icon-box" style={{ background: '#F0FDF4', color: '#10B981' }}><i data-lucide="trending-up"></i></div>
                      <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800 }}>TOTAL REVENUE</div><div style={{ fontSize: '24px', fontWeight: 900 }}>₹2,18,500</div></div>
                  </div>
                  <div className="kpi-card" style={{ padding: '24px' }}>
                      <div className="kpi-icon-box" style={{ background: '#FFFBEB', color: '#F59E0B' }}><i data-lucide="clock"></i></div>
                      <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800 }}>PENDING PAYMENTS</div><div style={{ fontSize: '24px', fontWeight: 900 }}>₹14,200</div></div>
                  </div>
                  <div className="kpi-card" style={{ padding: '24px' }}>
                      <div className="kpi-icon-box" style={{ background: '#EEF2FF', color: '#6366F1' }}><i data-lucide="credit-card"></i></div>
                      <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800 }}>TRANSACTIONS TODAY</div><div style={{ fontSize: '24px', fontWeight: 900 }}>142</div></div>
                  </div>
              </div>
              <div className="glass-card" style={{ padding: '24px' }}>
                  <div className="table-responsive">
                    <table className="elite-table" style={{ margin: 0 }}>
                        <thead style={{ background: '#F8FAFC' }}>
                            <tr>
                                <th>Invoice ID</th>
                                <th>Patient Name</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#INV-0992</td>
                                <td style={{ fontWeight: 600 }}>Reyan Verol</td>
                                <td>24 May 2024</td>
                                <td style={{ fontWeight: 800 }}>₹550.00</td>
                                <td><span className="status-badge available">Paid</span></td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#INV-0991</td>
                                <td style={{ fontWeight: 600 }}>Sarah Jenkins</td>
                                <td>24 May 2024</td>
                                <td style={{ fontWeight: 800 }}>₹1200.00</td>
                                <td><span className="status-badge pending">Pending</span></td>
                            </tr>
                        </tbody>
                    </table>
                  </div>
              </div>
            </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="dashboard-header" style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>My Profile</h2>
              <p style={{ color: '#64748B', fontWeight: 600 }}>Manage your personal information and security</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px' }} className="mobile-stack">
              <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 24px' }}>
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary-light)' }} alt="Profile" />
                  <div style={{ position: 'absolute', bottom: '0', right: '0', width: '36px', height: '36px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', cursor: 'pointer' }}>
                    <i data-lucide="camera" style={{ width: '16px' }}></i>
                  </div>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1D23', marginBottom: '4px' }}>{user.name || 'Roshni Singh'}</h3>
                <p style={{ fontSize: '14px', color: '#64748B', fontWeight: 700, marginBottom: '24px' }}>Senior Receptionist</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i data-lucide="mail" style={{ width: '18px', color: 'var(--primary)' }}></i>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{user.email || 'roshni@medicore.com'}</span>
                  </div>
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i data-lucide="phone" style={{ width: '18px', color: 'var(--primary)' }}></i>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>+91 98765 43210</span>
                  </div>
                </div>
                <button className="btn btn-secondary" style={{ width: '100%', marginTop: '32px', justifyContent: 'center', color: 'var(--danger)', border: '1px solid #FEE2E2' }} onClick={handleLogout}>
                  <i data-lucide="log-out"></i> Logout Account
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card" style={{ padding: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>Edit Profile</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" className="form-control" defaultValue={user.name || 'Roshni Singh'} style={{ height: '48px' }} />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" className="form-control" defaultValue={user.email || 'roshni@medicore.com'} style={{ height: '48px' }} />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number</label>
                      <input type="text" className="form-control" defaultValue="+91 98765 43210" style={{ height: '48px' }} />
                    </div>
                    <div className="form-group">
                      <label>Employee ID</label>
                      <input type="text" className="form-control" defaultValue="MED-RE-099" readOnly style={{ height: '48px', background: '#F8FAFC' }} />
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0 32px', height: '48px' }}>Save Changes</button>
                </div>

                <div className="glass-card" style={{ padding: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>Change Password</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input type="password" className="form-control" placeholder="********" style={{ height: '48px' }} />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input type="password" className="form-control" placeholder="New Password" style={{ height: '48px' }} />
                    </div>
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input type="password" className="form-control" placeholder="Confirm Password" style={{ height: '48px' }} />
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0 32px', height: '48px' }}>Update Password</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div className="dashboard-header" style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>System Settings</h2>
              <p style={{ color: '#64748B', fontWeight: 600 }}>Configure your workspace and preferences</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#EFF6FF', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="bell" style={{ width: '20px' }}></i></div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Notifications</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontSize: '14px', fontWeight: 700 }}>Email Alerts</div><div style={{ fontSize: '12px', color: '#64748B' }}>Receive daily summaries</div></div>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontSize: '14px', fontWeight: 700 }}>Push Notifications</div><div style={{ fontSize: '12px', color: '#64748B' }}>Instant app alerts</div></div>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontSize: '14px', fontWeight: 700 }}>SMS Updates</div><div style={{ fontSize: '12px', color: '#64748B' }}>Patient appointment reminders</div></div>
                    <input type="checkbox" />
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#F0FDF4', color: '#10B981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="shield" style={{ width: '20px' }}></i></div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Privacy & Security</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontSize: '14px', fontWeight: 700 }}>Two-Factor Auth</div><div style={{ fontSize: '12px', color: '#64748B' }}>Extra layer of security</div></div>
                    <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }}>Enable</button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontSize: '14px', fontWeight: 700 }}>Active Sessions</div><div style={{ fontSize: '12px', color: '#64748B' }}>Manage logged-in devices</div></div>
                    <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }}>View</button>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#FFFBEB', color: '#F59E0B', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="palette" style={{ width: '20px' }}></i></div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Appearance</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontSize: '14px', fontWeight: 700 }}>Dark Mode</div><div style={{ fontSize: '12px', color: '#64748B' }}>Toggle system theme</div></div>
                    <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }}>Enable</button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontSize: '14px', fontWeight: 700 }}>Compact View</div><div style={{ fontSize: '12px', color: '#64748B' }}>Higher density layout</div></div>
                    <input type="checkbox" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="mobile-bottom-nav">
        <div className={`mob-nav-item ${activeTab === 'dash' ? 'active' : ''}`} onClick={() => switchTab('dash')}>
          <i data-lucide="layout-grid"></i><span>Home</span>
        </div>
        <div className={`mob-nav-item ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => switchTab('appointments')}>
          <i data-lucide="calendar"></i><span>Apps</span>
        </div>
        <div className={`mob-nav-item ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => switchTab('patients')}>
          <i data-lucide="users"></i><span>Patients</span>
        </div>
        <div className={`mob-nav-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => switchTab('billing')}>
          <i data-lucide="wallet"></i><span>Bills</span>
        </div>
      </div>

      {/* APPOINTMENT DETAILS MODAL */}
      {detailsModalOpen && selectedAppointment && (
        <div className="details-modal-overlay" onClick={() => { setDetailsModalOpen(false); setShowDeleteConfirm(false); }}>
          <div className="details-modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1D23' }}>Appointment Details</h2>
              <button className="btn-close" onClick={() => { setDetailsModalOpen(false); setShowDeleteConfirm(false); }}><i data-lucide="x"></i></button>
            </div>
            
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800 }}>
                  {getInitials(selectedAppointment.patientId?.name)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: '#1A1D23' }}>{selectedAppointment.patientId?.name}</div>
                  <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>ID: #{selectedAppointment.patientId?._id?.substring(18).toUpperCase()}</div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '8px', color: '#1A1D23' }}>Status</label>
                  <select 
                    className="form-control" 
                    style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '10px', height: '44px', width: '100%', padding: '0 12px', fontWeight: 600 }}
                    value={selectedAppointment.status} 
                    onChange={(e) => setSelectedAppointment({...selectedAppointment, status: e.target.value})}
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '8px', color: '#1A1D23' }}>Reschedule Time</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '10px', height: '44px', width: '100%', padding: '0 12px', fontWeight: 600 }}
                    value={selectedAppointment.time} 
                    onChange={(e) => setSelectedAppointment({...selectedAppointment, time: e.target.value})} 
                  />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center', minHeight: '44px' }}>
              {!showDeleteConfirm ? (
                <>
                  <button className="btn" style={{ background: '#FEE2E2', color: '#EF4444', fontWeight: 800, padding: '0 20px', borderRadius: '10px', height: '44px' }} onClick={() => setShowDeleteConfirm(true)}>Delete</button>
                  <button className="btn btn-primary" style={{ fontWeight: 800, padding: '0 24px', borderRadius: '10px', height: '44px' }} onClick={() => handleUpdateAppointment(selectedAppointment)}>Save Changes</button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', animation: 'fadeIn 0.2s ease-out' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#EF4444' }}>Are you sure?</span>
                  <button className="btn" style={{ background: '#F1F5F9', color: '#64748B', fontWeight: 800, padding: '0 16px', borderRadius: '10px', height: '44px', fontSize: '13px' }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                  <button className="btn" style={{ background: '#EF4444', color: 'white', fontWeight: 800, padding: '0 20px', borderRadius: '10px', height: '44px', fontSize: '13px' }} onClick={() => { handleDeleteAppointment(selectedAppointment._id); setShowDeleteConfirm(false); }}>Confirm Delete</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="mobile-bottom-nav">
        <div className={`mob-nav-item ${activeTab === 'dash' ? 'active' : ''}`} onClick={() => switchTab('dash')}><i data-lucide="layout-grid"></i><span>Home</span></div>
        <div className={`mob-nav-item ${activeTab === 'registration-form' ? 'active' : ''}`} onClick={() => switchTab('registration-form')}><i data-lucide="calendar"></i><span>Apps</span></div>
        <div className={`mob-nav-item ${['patients', 'patient-details'].includes(activeTab) ? 'active' : ''}`} onClick={() => switchTab('patients')}><i data-lucide="users"></i><span>Patients</span></div>
        <div className={`mob-nav-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => switchTab('billing')}><i data-lucide="wallet"></i><span>Bills</span></div>
      </div>
    </>
  );
};

export default ReceptionistDashboard;
