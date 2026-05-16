import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ReceptionistDashboard = () => {
  const [activeTab, setActiveTab] = useState('dash');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [appointments, setAppointments] = useState([
      { id: "PT0025", name: "James Carter", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100", doctor: "Dr. Andrew Clark", docAvatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100", status: "Upcoming", time: "09:00 AM to 10:00 AM" },
      { id: "PT0024", name: "Emily Davis", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100", doctor: "Dr. Katherine Brooks", docAvatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=100", status: "Upcoming", time: "09:00 AM to 10:00 AM" }
  ]);

  const [mockQueue, setMockQueue] = useState([
      { id: 'A-42', name: 'Johnathan Doe', age: 42, gender: 'Male', wait: '12 min', status: 'Waiting', abha: '91-8821-2291-0112' },
      { id: 'A-43', name: 'Sarah Jenkins', age: 31, gender: 'Female', wait: '18 min', status: 'Waiting', abha: '91-1234-5678-9012' },
      { id: 'A-44', name: 'Robert Smith', age: 55, gender: 'Male', wait: '5 min', status: 'Waiting', abha: '91-9876-5432-1098' },
      { id: 'A-45', name: 'Emily Davis', age: 28, gender: 'Female', wait: '22 min', status: 'Waiting', abha: '91-5544-3322-1100' },
      { id: 'A-46', name: 'Michael Brown', age: 47, gender: 'Male', wait: '10 min', status: 'Waiting', abha: '91-1122-3344-5566' }
  ]);

  const [doctors, setDoctors] = useState([
      { id: 1, name: "Dr. William Harrison", specialty: "Cardiology", available: true, image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100", email: "william.h@medicore.com" },
      { id: 2, name: "Dr. Victoria Adams", specialty: "Urology", available: false, image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=100", email: "victoria.a@medicore.com" },
      { id: 3, name: "Dr. Jonathan Bennett", specialty: "Radiology", available: true, image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=100", email: "jonathan.b@medicore.com" }
  ]);

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomDropdownOpen, setSymptomDropdownOpen] = useState(false);
  const availableSymptoms = ['Fever', 'Headache', 'Body Pain', 'Fatigue', 'Weakness', 'Cough', 'Nausea'];
  
  const [selectedSlot, setSelectedSlot] = useState('10:30 AM');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, selectedSymptoms]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const switchTab = (tabId) => {
    setActiveTab(tabId);
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
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
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

      <div className="top-nav" style={{ padding: '0 40px', borderBottom: '1px solid #F1F5F9', background: 'white', display: 'flex', alignItems: 'center', height: '72px' }}>
        <div style={{ flex: 1, maxWidth: '600px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <i data-lucide="search" style={{ position: 'absolute', left: '16px', color: '#64748B', width: '18px' }}></i>
          <input type="text" className="search-input" placeholder="Search patient by mobile/ID" style={{ background: '#F8FAFC', border: 'none', paddingLeft: '48px', height: '44px', width: '100%', borderRadius: '12px', fontSize: '14px', fontWeight: 600 }} />
          <span style={{ position: 'absolute', right: '16px', fontSize: '11px', fontWeight: 700, color: '#94A3B8', background: 'white', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', pointerEvents: 'none' }}>Ctrl + K</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginLeft: 'auto' }}>
          <button className="btn" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', background: 'white', borderRadius: '12px', padding: '10px 20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', transition: '0.3s' }}>
            <i data-lucide="alert-circle" style={{ width: '20px' }}></i> Emergency
          </button>
          <div className="action-icon-btn" style={{ color: '#64748B', cursor: 'pointer' }}><i data-lucide="settings" style={{ width: '20px' }}></i></div>
          <div className="action-icon-btn" style={{ position: 'relative', color: '#64748B', cursor: 'pointer' }}>
            <i data-lucide="bell" style={{ width: '20px' }}></i>
            <div style={{ position: 'absolute', top: '12px', right: '14px', width: '18px', height: '18px', background: 'var(--danger)', color: 'white', borderRadius: '50%', border: '2px solid white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>5</div>
          </div>
        </div>
      </div>

      <div className="main-content">
        {activeTab === 'dash' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1A1D23', marginBottom: '8px' }}>Welcome, {user.name || 'Roshni'}</h1>
                <div style={{ fontSize: '15px', color: '#64748B', fontWeight: 700 }}>Today is {new Date().toLocaleDateString()}</div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', position: 'relative' }}>
                <button className="btn btn-primary" style={{ height: '52px', padding: '0 32px', fontWeight: 800, borderRadius: '14px', background: 'var(--primary-gradient)', boxShadow: '0 10px 20px rgba(59, 113, 254, 0.2)' }} onClick={() => switchTab('registration-form')}>
                  <i data-lucide="plus" style={{ width: '20px' }}></i> Create Appointment
                </button>
              </div>
            </div>

            <div className="ph-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '40px' }}>
              <div className="kpi-card" style={{ padding: '32px', cursor: 'pointer' }} onClick={() => switchTab('appointments')}>
                <div className="kpi-icon-box" style={{ background: '#FFF7ED', color: '#EA580C' }}><i data-lucide="calendar"></i></div>
                <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Total Appointments</div><div style={{ fontSize: '26px', fontWeight: 900 }}>218</div></div>
              </div>
              <div className="kpi-card" style={{ padding: '32px', cursor: 'pointer' }} onClick={() => switchTab('patients')}>
                <div className="kpi-icon-box" style={{ background: '#F0F9FF', color: '#0284C7' }}><i data-lucide="user"></i></div>
                <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Total Visits</div><div style={{ fontSize: '26px', fontWeight: 900 }}>500</div></div>
              </div>
              <div className="kpi-card" style={{ padding: '32px', cursor: 'pointer' }} onClick={() => switchTab('staff')}>
                <div className="kpi-icon-box" style={{ background: '#F5F3FF', color: '#7C3AED' }}><i data-lucide="stethoscope"></i></div>
                <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Total Doctors</div><div style={{ fontSize: '26px', fontWeight: 900 }}>54</div></div>
              </div>
              <div className="kpi-card" style={{ padding: '32px', cursor: 'pointer' }} onClick={() => switchTab('billing')}>
                <div className="kpi-icon-box" style={{ background: '#FDF2F8', color: '#DB2777' }}><i data-lucide="wallet"></i></div>
                <div><div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Total Revenue</div><div style={{ fontSize: '26px', fontWeight: 900 }}>₹2,18,500</div></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', marginBottom: '40px' }}>
              <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1D23' }}>Weekly Patient Trend</h3>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '11px', borderRadius: '10px', background: '#F1F5F9', fontWeight: 800 }}>View All</button>
                </div>
                
                <div style={{ height: '220px', position: 'relative', marginBottom: '24px' }}>
                  <div className="chart-glow-bg"></div>
                  <div className="bar-chart-container">
                    <div style={{display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%', width: '100%', paddingBottom: '20px', position: 'absolute', bottom: 0}}>
                       <div style={{width: '20px', height: '40%', background: 'var(--primary)', borderRadius: '4px'}}></div>
                       <div style={{width: '20px', height: '60%', background: 'var(--primary)', borderRadius: '4px'}}></div>
                       <div style={{width: '20px', height: '80%', background: 'var(--primary)', borderRadius: '4px'}}></div>
                       <div style={{width: '20px', height: '50%', background: 'var(--primary)', borderRadius: '4px'}}></div>
                       <div style={{width: '20px', height: '70%', background: 'var(--primary)', borderRadius: '4px'}}></div>
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
                  {doctors.map(doc => (
                    <div key={doc.id} className="avail-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div className="avail-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <img src={doc.image} style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover' }} alt="Doc" />
                        <div><div style={{ fontWeight: 900, fontSize: '14px', color: '#1A1D23' }}>{doc.name}</div><p style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>{doc.specialty}</p></div>
                      </div>
                      <span className={`status-badge ${doc.available ? 'available' : 'unavailable'}`} style={{ fontSize: '10px', borderRadius: '8px', padding: '6px 12px' }}>{doc.available ? 'Available' : 'On Break'}</span>
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
              <table className="elite-table" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
                <thead><tr><th>Patient ID</th><th>Patient Name</th><th>Doctor Name</th><th>Status</th><th>Date & Time</th></tr></thead>
                <tbody>
                  {appointments.map(app => (
                    <tr key={app.id}>
                      <td>{app.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={app.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="Patient" />
                          <span style={{ fontWeight: 700 }}>{app.name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={app.docAvatar} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} alt="Doc" />
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{app.doctor}</span>
                        </div>
                      </td>
                      <td><span className="status-badge upcoming" style={{ fontSize: '11px' }}>{app.status}</span></td>
                      <td style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>{app.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PATIENTS TAB */}
        {activeTab === 'patients' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23', marginBottom: '4px' }}>Patients</h2>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>Home <span style={{ margin: '0 8px' }}>»</span> <span style={{ color: '#1A1D23' }}>Patients</span></div>
              </div>
              <button className="btn btn-primary" style={{ height: '52px', padding: '0 32px', fontWeight: 800, borderRadius: '14px', background: 'var(--primary-gradient)', boxShadow: '0 10px 20px rgba(59, 113, 254, 0.2)' }} onClick={() => switchTab('registration-form')}>
                <i data-lucide="plus" style={{ width: '20px' }}></i> Create Appointment
              </button>
            </div>
            
            <div className="glass-card" style={{ padding: '24px' }}>
              <div className="flex-between" style={{ marginBottom: '24px' }}>
                <div className="search-wrapper" style={{ margin: 0, maxWidth: '400px' }}>
                    <i data-lucide="search"></i>
                    <input type="text" className="search-input" placeholder="Search Patients..." />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" style={{ padding: '0 16px', height: '44px' }}><i data-lucide="filter" style={{ width: '18px' }}></i> Filter</button>
                    <button className="btn btn-secondary" style={{ padding: '0 16px', height: '44px' }}><i data-lucide="download" style={{ width: '18px' }}></i> Export</button>
                </div>
              </div>
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
                    {mockQueue.map(p => (
                      <tr key={p.id} className="patients-table" style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td><input type="checkbox" style={{ width: '16px', height: '16px', borderRadius: '4px' }} /></td>
                          <td style={{ color: '#64748B', fontWeight: 600 }}>#{p.id}</td>
                          <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => switchTab('patient-details')}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                                    {getInitials(p.name)}
                                  </div>
                                  <span style={{ fontWeight: 700, color: '#1A1D23' }}>{p.name}</span>
                              </div>
                          </td>
                          <td style={{ color: '#64748B', fontWeight: 600 }}>{p.gender}</td>
                          <td style={{ color: '#64748B', fontWeight: 600 }}>+91 9876543210</td>
                          <td style={{ color: '#64748B', fontWeight: 600 }}>{p.name.split(' ')[0].toLowerCase()}@example.com</td>
                          <td><i data-lucide="more-vertical" style={{ width: '18px', color: '#64748B', cursor: 'pointer' }}></i></td>
                      </tr>
                    ))}
                  </tbody>
              </table>
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
                {/* Left Col: Profile & Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px', position: 'relative' }}>
                            <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200" style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover' }} alt="Avatar" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 800, background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '4px' }}>#PT001</div>
                                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D23', marginBottom: '4px' }}>Reyan Verol</h2>
                                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Last Visited : 24 Jan 2025</div>
                            </div>
                            <i data-lucide="edit-3" style={{ width: '18px', color: '#64748B', cursor: 'pointer' }}></i>
                        </div>

                        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D23', marginBottom: '20px' }}>Basic Information</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B', fontWeight: 600 }}>Added On</span><span style={{ fontWeight: 700, color: '#1A1D23' }}>24 May 2024</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B', fontWeight: 600 }}>DOB</span><span style={{ fontWeight: 700, color: '#1A1D23' }}>10 Jan 1991</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B', fontWeight: 600 }}>Gender</span><span style={{ fontWeight: 700, color: '#1A1D23' }}>Male</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B', fontWeight: 600 }}>Blood Group</span><span style={{ fontWeight: 700, color: '#1A1D23' }}>O+ve</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B', fontWeight: 600 }}>Phone Number</span><span style={{ fontWeight: 700, color: '#1A1D23' }}>+1 75964 25493</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748B', fontWeight: 600 }}>Total No of Bookings</span><span style={{ fontWeight: 700, color: '#1A1D23' }}>12</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Hubs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: 0 }}>
                        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D23' }}>Appointments</h3>
                            <button className="btn btn-secondary" style={{ height: '32px', fontSize: '11px', padding: '0 12px', fontWeight: 800 }}>View All</button>
                        </div>
                        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {/* Upcoming Card */}
                            <div style={{ padding: '24px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <span style={{ background: '#EFF6FF', color: '#3B82F6', fontSize: '11px', padding: '4px 12px', borderRadius: '6px', fontWeight: 800 }}>Upcoming</span>
                                    <div style={{ width: '32px', height: '32px', background: '#10B981', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="video" style={{ width: '16px' }}></i></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Department</div><div style={{ fontSize: '13px', fontWeight: 700 }}>Cardiology</div></div>
                                    <div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Doctor</div><div style={{ fontSize: '13px', fontWeight: 700 }}>Dr. Benjamin Harris</div></div>
                                </div>
                                <div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Date & Time</div><div style={{ fontSize: '13px', fontWeight: 700 }}>21 Dec 2024, 07:00 AM</div></div>
                            </div>
                             {/* Completed Card */}
                             <div style={{ padding: '24px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <span style={{ background: '#F0FDF4', color: '#10B981', fontSize: '11px', padding: '4px 12px', borderRadius: '6px', fontWeight: 800 }}>Completed</span>
                                    <div style={{ width: '32px', height: '32px', background: '#3B82F6', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="phone" style={{ width: '16px' }}></i></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Department</div><div style={{ fontSize: '13px', fontWeight: 700 }}>Radiology</div></div>
                                    <div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Doctor</div><div style={{ fontSize: '13px', fontWeight: 700 }}>Dr. Laura Mitchell</div></div>
                                </div>
                                <div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Date & Time</div><div style={{ fontSize: '13px', fontWeight: 700 }}>15 Jan 2025, 10:35 AM</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
           </div>
        )}

        {/* REGISTRATION FORM TAB */}
        {activeTab === 'registration-form' && (
           <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23', marginBottom: '32px' }}>Registration and appointment</h1>
              
              <div className="glass-card" style={{ padding: '40px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>1</div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D23' }}>Patient Information</h2>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
                    <div className="form-group">
                        <label>Full Name <span style={{ color: '#EF4444' }}>*</span></label>
                        <input type="text" className="form-control" placeholder="Enter full name" style={{ height: '48px', borderRadius: '8px' }} />
                    </div>
                    <div className="form-group">
                        <label>Gender <span style={{ color: '#EF4444' }}>*</span></label>
                        <select className="form-control" style={{ height: '48px', borderRadius: '8px' }}>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>DOB / Age <span style={{ color: '#EF4444' }}>*</span></label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="date" className="form-control" defaultValue="1990-06-24" style={{ height: '48px', borderRadius: '8px', flex: 1 }} />
                            <div style={{ width: '60px', height: '48px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#64748B' }}>33 Y</div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Mobile Number <span style={{ color: '#EF4444' }}>*</span></label>
                        <input type="text" className="form-control" placeholder="Enter Mobile Number" style={{ height: '48px', borderRadius: '8px' }} />
                    </div>
                    <div className="form-group">
                        <label>Email <span style={{ color: '#EF4444' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                            <i data-lucide="mail" style={{ position: 'absolute', left: '16px', top: '14px', color: '#CBD5E1', width: '18px' }}></i>
                            <input type="text" className="form-control" placeholder="Enter Email" style={{ height: '48px', borderRadius: '8px', paddingLeft: '48px' }} />
                        </div>
                    </div>
                </div>

                {/* Section 2 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>2</div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D23' }}>Visit & Appointment Details</h2>
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
                        <label>Department <span style={{ color: '#EF4444' }}>*</span></label>
                        <select className="form-control" style={{ height: '48px', borderRadius: '8px' }}>
                            <option>General Medicine</option>
                            <option>Cardiology</option>
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

                {/* Section 4 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>3</div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D23' }}>Billing & Payment</h2>
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
                    <button className="btn btn-primary" style={{ width: '400px', height: '54px', fontWeight: 800, fontSize: '16px', borderRadius: '10px', justifyContent: 'center', gap: '12px' }} onClick={() => {
                        alert("Appointment created successfully!");
                        switchTab('appointments');
                    }}>
                        <i data-lucide="qr-code"></i> Confirm & Generate Token
                    </button>
                </div>
              </div>
           </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
            <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>Appointments</h2>
                  <button className="btn btn-primary" onClick={() => switchTab('registration-form')}>Create Appointment</button>
              </div>
              <div className="glass-card" style={{ padding: '24px' }}>
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
                          {appointments.map(app => (
                              <tr key={app.id}>
                                  <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          <img src={app.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
                                          <span style={{ fontWeight: 700, color: '#1A1D23' }}>{app.name}</span>
                                      </div>
                                  </td>
                                  <td>{app.doctor}</td>
                                  <td style={{ fontWeight: 600 }}>{app.time}</td>
                                  <td><span className="status-badge upcoming">{app.status}</span></td>
                                  <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>View Details</button></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
            </div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
            <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D23' }}>Staff Management</h2>
                  <button className="btn btn-primary">Add Staff</button>
              </div>
              <div className="glass-card" style={{ padding: '24px' }}>
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
                              <tr key={doc.id}>
                                  <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          <img src={doc.image} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
                                          <span style={{ fontWeight: 700, color: '#1A1D23' }}>{doc.name}</span>
                                      </div>
                                  </td>
                                  <td>{doc.specialty}</td>
                                  <td>{doc.email}</td>
                                  <td><span className={`status-badge ${doc.available ? 'available' : 'unavailable'}`}>{doc.available ? 'Available' : 'On Break'}</span></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
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
        )}

      </div>
    </>
  );
};

export default ReceptionistDashboard;
