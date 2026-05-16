import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [doctors] = useState([
    { id: 1, name: "Dr. William Harrison", specialty: "Cardiology Specialist", exp: "15 Years", rating: "4.9", image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300", available: true },
    { id: 2, name: "Dr. Sarah Chen", specialty: "Neurology", exp: "12 Years", rating: "4.8", image: "https://images.unsplash.com/photo-1594824432258-2e061801c876?auto=format&fit=crop&q=80&w=300&h=300", available: true },
    { id: 3, name: "Dr. Marcus Johnson", specialty: "Orthopedics", exp: "20 Years", rating: "4.7", image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300", available: false },
    { id: 4, name: "Dr. Emily Davis", specialty: "Pediatrics", exp: "10 Years", rating: "4.9", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300", available: true }
  ]);

  const [appointments, setAppointments] = useState([
    { id: 'APT-1001', date: 'May 09, 2025', time: '10:30 AM', doctor: 'Dr. William Harrison', reason: 'Chest Pain Consult', status: 'Confirmed' },
    { id: 'APT-1002', date: 'April 15, 2025', time: '02:00 PM', doctor: 'Dr. Sarah Chen', reason: 'Routine Checkup', status: 'Completed' }
  ]);

  const [records, setRecords] = useState([
    { id: 'REC-1', name: 'Comprehensive Blood Count', date: '10 May 2025', type: 'Lab Report', size: '1.2MB' },
    { id: 'REC-2', name: 'Chest X-Ray', date: '05 May 2025', type: 'Radiology', size: '5.4MB' },
    { id: 'REC-3', name: 'Discharge Summary', date: '12 Jan 2024', type: 'Clinical', size: '800KB' }
  ]);

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, showAppointmentModal]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const bookDoctor = (doc) => {
    setSelectedDoctor(doc);
    setShowAppointmentModal(true);
  };

  const confirmBooking = () => {
    if (!selectedDoctor) return;
    setAppointments([
      { id: 'APT-' + Math.floor(Math.random() * 9000 + 1000), date: 'Tomorrow', time: '11:00 AM', doctor: selectedDoctor.name, reason: 'General Consultation', status: 'Confirmed' },
      ...appointments
    ]);
    setShowAppointmentModal(false);
    setSelectedDoctor(null);
    setActiveTab('history');
    alert("Appointment booked successfully!");
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo">
          <i data-lucide="heart-pulse"></i><span>MediCore</span>
        </div>
        <nav>
          <a href="#" className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('summary'); }}>
            <i data-lucide="layout-dashboard"></i> Health Summary
          </a>
          <a href="#" className={`nav-link ${activeTab === 'find' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('find'); }}>
            <i data-lucide="search"></i> Find Doctor
          </a>
          <a href="#" className={`nav-link ${activeTab === 'history' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('history'); }}>
            <i data-lucide="calendar"></i> Appointments
          </a>
          <a href="#" className={`nav-link ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('prescriptions'); }}>
            <i data-lucide="pill"></i> My Prescriptions
          </a>
          <a href="#" className={`nav-link ${activeTab === 'records' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('records'); }}>
            <i data-lucide="file-text"></i> Health Records
          </a>
          <a href="#" className="nav-link" style={{ marginTop: 'auto', color: 'var(--danger)' }} onClick={(e) => { e.preventDefault(); handleLogout(); }}>
            <i data-lucide="log-out"></i> Logout
          </a>
        </nav>
      </div>

      <div className="top-nav">
        <div id="liveClock" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 16px', borderRadius: '99px', fontWeight: 700, fontSize: '14px' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            {user.name ? user.name.substring(0, 2).toUpperCase() : 'JD'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>{user.name || 'Johnathan Doe'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Patient ID: #MC-9921</div>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* Health Summary Tab */}
        {activeTab === 'summary' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}>Good morning, {user.name ? user.name.split(' ')[0] : 'Johnathan'}</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
              <div>
                {/* Vitals Trend */}
                <div className="glass-card" style={{ marginBottom: '32px' }}>
                  <div className="flex-between" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><i data-lucide="trending-up" style={{ color: 'var(--primary)' }}></i> Vitals Trends</h3>
                    <select className="form-control" style={{ width: '140px', padding: '8px 12px', fontSize: '12px' }}>
                      <option>Last 6 Months</option>
                    </select>
                  </div>
                  <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px', borderBottom: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <div style={{ width: '40px', height: '120px', background: 'var(--primary-light)', borderRadius: '8px 8px 0 0', position: 'relative' }}>
                        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '80px', background: 'var(--primary)', borderRadius: '4px 4px 0 0' }}></div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>JAN</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <div style={{ width: '40px', height: '120px', background: 'var(--primary-light)', borderRadius: '8px 8px 0 0', position: 'relative' }}>
                        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '95px', background: 'var(--primary)', borderRadius: '4px 4px 0 0' }}></div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>FEB</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <div style={{ width: '40px', height: '120px', background: 'var(--primary-light)', borderRadius: '8px 8px 0 0', position: 'relative' }}>
                        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '110px', background: 'var(--primary)', borderRadius: '4px 4px 0 0' }}></div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>MAR</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <div style={{ width: '40px', height: '120px', background: 'var(--primary-light)', borderRadius: '8px 8px 0 0', position: 'relative' }}>
                        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '85px', background: 'var(--primary)', borderRadius: '4px 4px 0 0' }}></div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>APR</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', gap: '24px', fontSize: '12px', fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '3px' }}></span> Systolic BP</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '12px', height: '12px', background: 'var(--primary-light)', borderRadius: '3px' }}></span> Diastolic BP</div>
                  </div>
                </div>
                
                {/* Lab Summary */}
                <div className="glass-card">
                  <h3 style={{ marginBottom: '24px' }}>Latest Lab Insights</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--success-bg)', border: '1px solid #A7F3D0' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', marginBottom: '8px' }}>Hemoglobin</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>14.2 <span style={{ fontSize: '12px', opacity: 0.7 }}>g/dL</span></div>
                      <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: 700, color: 'var(--success)' }}>NORMAL</div>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--warning-bg)', border: '1px solid #FDE68A' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: '8px' }}>LDL Cholesterol</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--warning)' }}>162 <span style={{ fontSize: '12px', opacity: 0.7 }}>mg/dL</span></div>
                      <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: 700, color: 'var(--warning)' }}>BORDERLINE</div>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--danger-bg)', border: '1px solid #FCA5A5' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '8px' }}>Vitamin D</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--danger)' }}>12 <span style={{ fontSize: '12px', opacity: 0.7 }}>ng/mL</span></div>
                      <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: 700, color: 'var(--danger)' }}>LOW ACTION REQ.</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                {/* Next Appointment */}
                <div className="glass-card" style={{ background: 'var(--primary-gradient)', color: 'white', border: 'none', marginBottom: '32px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, opacity: 0.8, letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase' }}>Next Appointment</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100&h=100" alt="Doctor" style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '18px' }}>Dr. William Harrison</div>
                      <div style={{ fontSize: '13px', opacity: 0.9 }}>Cardiology Follow-up</div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <i data-lucide="calendar" style={{ width: '18px' }}></i>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Tomorrow, 10:30 AM</div>
                  </div>
                  <button className="btn" style={{ width: '100%', background: 'white', color: 'var(--primary)', justifyContent: 'center' }}>Add to Calendar</button>
                </div>

                {/* Digital Token */}
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

        {/* Find Doctor Tab */}
        {activeTab === 'find' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><h1 style={{ fontSize: '28px', fontWeight: 800 }}>Specialist Discovery</h1><p className="text-muted" style={{ fontWeight: 600 }}>Find and book leading medical experts</p></div>
              <div style={{ display: 'flex', gap: '12px' }}><button className="btn btn-secondary"><i data-lucide="filter"></i> Filter</button></div>
            </div>
            
            <div className="doctor-grid-pro" style={{ marginTop: '32px' }}>
              {doctors.map(doc => (
                <div key={doc.id} className="doctor-card-pro animate-in" onClick={() => bookDoctor(doc)}>
                  <div className="doc-avatar-wrapper">
                    <img src={doc.image} className="doc-avatar-img" alt={doc.name} />
                    <div className="doc-rating-badge">★ {doc.rating}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '18px' }}>{doc.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 700, margin: '4px 0 12px' }}>{doc.specialty}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{doc.exp} Experience</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i data-lucide="chevron-right" style={{ width: '16px' }}></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'history' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Your Appointments</h1>
              <button className="btn btn-primary" onClick={() => setActiveTab('find')}><i data-lucide="plus"></i> Book New</button>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <table className="elite-table" style={{ margin: 0 }}>
                <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Specialist</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(app => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 700 }}>{app.date}</td>
                      <td style={{ fontWeight: 600 }}>{app.time}</td>
                      <td><b>{app.doctor}</b></td>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{app.reason}</td>
                      <td><span className={`status-badge ${app.status === 'Confirmed' ? 'available' : 'pending'}`}>{app.status}</span></td>
                      <td><button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>View Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}>Current Medications</h1>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="elite-table" style={{ margin: 0, border: 'none' }}>
                <thead style={{ background: '#F8FAFC' }}>
                  <tr><th>Medicine</th><th>Instruction</th><th>Frequency</th><th>Doctor</th><th>Refill Status</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="pill"></i></div>
                        <div><b>Amlodipine (5mg)</b><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hypertension</div></div>
                      </div>
                    </td>
                    <td>Take after breakfast</td>
                    <td><span className="status-badge available" style={{ fontSize: '11px' }}>1 - 0 - 1</span></td>
                    <td>Dr. William Harrison</td>
                    <td><span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '12px' }}>ACTIVE</span></td>
                  </tr>
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="pill"></i></div>
                        <div><b>Atorvastatin (20mg)</b><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cholesterol</div></div>
                      </div>
                    </td>
                    <td>Take before sleep</td>
                    <td><span className="status-badge available" style={{ fontSize: '11px' }}>0 - 0 - 1</span></td>
                    <td>Dr. William Harrison</td>
                    <td><span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '12px' }}>ACTIVE</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: '32px', padding: '24px', background: 'var(--warning-bg)', borderRadius: '20px', border: '1.5px dashed var(--warning)', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--warning)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="bell"></i></div>
              <div>
                <h4 style={{ color: '#92400E', fontWeight: 800 }}>Adherence Tip</h4>
                <p style={{ color: '#92400E', fontSize: '14px', opacity: 0.9 }}>Setting an alarm for 09:00 AM can help you remember your morning dose of Amlodipine.</p>
              </div>
            </div>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}>Secure Records Vault</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {records.map(r => (
                <div key={r.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="file-text"></i></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '14px' }}>{r.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{r.date} • {r.size}</div>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '8px' }}><i data-lucide="download" style={{ width: '16px' }}></i></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* APPOINTMENT MODAL */}
      {showAppointmentModal && selectedDoctor && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-box" style={{ width: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900 }}>Book Appointment</h2>
              <button className="btn" style={{ padding: '8px' }} onClick={() => setShowAppointmentModal(false)}><i data-lucide="x"></i></button>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', padding: '16px', background: '#F8FAFC', borderRadius: '16px' }}>
              <img src={selectedDoctor.image} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} alt="Doctor" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '16px' }}>{selectedDoctor.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{selectedDoctor.specialty}</div>
              </div>
            </div>

            <div className="form-group">
              <label>Select Date</label>
              <input type="date" className="form-control" />
            </div>

            <div className="form-group">
              <label>Preferred Time Slot</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ padding: '10px', textAlign: 'center', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', border: '2px solid var(--primary)' }}>10:30 AM</div>
                <div style={{ padding: '10px', textAlign: 'center', background: '#F8FAFC', color: 'var(--text-muted)', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>11:00 AM</div>
                <div style={{ padding: '10px', textAlign: 'center', background: '#F8FAFC', color: 'var(--text-muted)', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>02:30 PM</div>
              </div>
            </div>

            <div className="form-group">
              <label>Reason for Visit</label>
              <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Briefly describe your symptoms..."></textarea>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: '54px', fontSize: '16px' }} onClick={confirmBooking}>
              Confirm Booking
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PatientDashboard;
