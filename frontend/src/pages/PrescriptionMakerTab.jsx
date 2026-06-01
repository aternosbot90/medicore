import React, { useState } from 'react';

export default function PrescriptionMakerTab({
  selectedPatient,
  vitals,
  soap,
  setSoap,
  medicines,
  setMedicines,
  addMedicineRow,
  removeMedicineRow,
  updateMedicineRow,
  diagnosisText,
  setDiagnosisText,
  sendToPharmacy,
  setSendToPharmacy,
  handleLockPrescription,
  setShowTimelineModal,
  setLabs,
  addLog
}) {
  // Sidebar drawer visibility state
  const [showAssignLabDrawer, setShowAssignLabDrawer] = useState(false);

  // Body scroll lock effect
  React.useEffect(() => {
    if (showAssignLabDrawer) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showAssignLabDrawer]);

  // Dynamic Lucide Icons re-renderer inside Prescription Maker
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 50);
    return () => clearTimeout(timer);
  });
  
  // Drawer clinical state fields
  const [selectedLabsList, setSelectedLabsList] = useState(['CBC', 'Vitamin D', 'HbA1c']);
  const [searchQuery, setSearchQuery] = useState('');
  const [labPriority, setLabPriority] = useState('Routine');
  const [labInstructions, setLabInstructions] = useState('Patient fasting required');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Available EMR diagnostic lab tests
  const availableTests = [
    'CBC', 'Vitamin D', 'HbA1c', 'LFT', 'KFT', 'Lipid Profile', 'TSH', 
    'Thyroid Panel', 'Urine Routine', 'Vitamin B12', 'Fasting Blood Sugar',
    'Post Prandial Blood Sugar', 'Serum Calcium', 'Iron Studies', 'X-Ray Chest'
  ];

  const handleAddLab = (testName) => {
    if (testName && !selectedLabsList.includes(testName)) {
      setSelectedLabsList([...selectedLabsList, testName]);
      addLog(`Added Lab test tag: ${testName}`);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleRemoveLab = (testName) => {
    setSelectedLabsList(selectedLabsList.filter(item => item !== testName));
    addLog(`Removed Lab test tag: ${testName}`);
  };

  const handleAssignAndSend = () => {
    if (selectedLabsList.length === 0) {
      alert("Please select at least one laboratory test.");
      return;
    }
    // Update parent EMR dashboard labs state
    setLabs(selectedLabsList);
    addLog(`Dispatched Laboratory Order: ${selectedLabsList.join(', ')} | Priority: ${labPriority}`);
    
    // Close Drawer and show a premium notification
    setShowAssignLabDrawer(false);
    alert(`Successfully assigned and dispatched ${selectedLabsList.length} test(s) to the Laboratory!`);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', padding: '24px', background: '#F8FAFC', minHeight: 'calc(100vh - 100px)' }} className="mobile-stack">
      
      {/* Left Column (Patient Context) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Patient Profile Card */}
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', background: '#ffffff', boxShadow: '0 1.5px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F1F5F9' }}>
              <img 
                src={selectedPatient?.name?.toLowerCase().includes('ravi') 
                  ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
                  : "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80"
                } 
                alt="Patient Avatar" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>{selectedPatient?.name || 'Ravi Kumar'}</h3>
                <span style={{ color: selectedPatient?.gender === 'Female' ? '#EC4899' : '#2563EB', fontSize: '16px', fontWeight: 'bold' }}>
                  {selectedPatient?.gender === 'Female' ? '♀' : '♂'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                {selectedPatient?.age || 32} Y, {selectedPatient?.gender || 'Male'} | {selectedPatient?.contact || '9876543210'}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                PATIENT ID: {selectedPatient?.uhid || 'PT000123'}
              </p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '20px 0' }} />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em' }}>CONSULTATION DETAILS</span>
              <button 
                onClick={() => setShowTimelineModal(true)}
                style={{ border: 'none', background: 'none', color: '#2563EB', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0 }}
              >
                <i data-lucide="edit-3" style={{ width: '13px', height: '13px', color: '#2563EB', marginRight: '4px' }}></i> Edit
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Date & Time</span>
                <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 750 }}>
                  {selectedPatient?.name?.toLowerCase().includes('ravi') ? '24 May 2024, 09:00 AM' : '28 May 2026, 10:15 AM'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Visit Type</span>
                <span style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: '11px', fontWeight: 900, padding: '4px 8px', borderRadius: '6px' }}>
                  NEW VISIT
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Consultation ID</span>
                <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 750 }}>{selectedPatient?.visitId || 'CONS-000245'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Symptoms Card */}
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', background: '#ffffff', boxShadow: '0 1.5px 4px rgba(0,0,0,0.03)' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 800, color: '#C2410C', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i data-lucide="thermometer" style={{ width: '16px', height: '16px', color: '#C2410C' }}></i> Symptoms
          </h4>
          <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0', color: '#334155', fontSize: '14px', lineHeight: 1.6, fontWeight: 600 }}>
            <li style={{ marginBottom: '4px' }}>Fever since 2 days</li>
            <li style={{ marginBottom: '4px' }}>Headache</li>
            <li style={{ marginBottom: '4px' }}>Body Pain</li>
            <li style={{ marginBottom: '4px' }}>Sore Throat</li>
          </ul>
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>NOTES:</span>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontStyle: 'italic', fontWeight: 600, lineHeight: 1.4 }}>
              "Patient reports mild body ache and throat irritation."
            </p>
          </div>
        </div>

        {/* Vitals Card */}
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', background: '#ffffff', boxShadow: '0 1.5px 4px rgba(0,0,0,0.03)' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i data-lucide="activity" style={{ width: '16px', height: '16px', color: '#059669' }}></i> Vitals
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>BP</span>
              <div style={{ fontSize: '15px', color: '#1E293B', fontWeight: 800, marginTop: '2px' }}>
                {vitals.bpSys}/{vitals.bpDia} <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>mmHg</span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Pulse</span>
              <div style={{ fontSize: '15px', color: '#1E293B', fontWeight: 800, marginTop: '2px' }}>
                {vitals.pulse} <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>bpm</span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Temperature</span>
              <div style={{ fontSize: '15px', color: '#1E293B', fontWeight: 800, marginTop: '2px' }}>
                {vitals.temp} <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>°F</span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Weight</span>
              <div style={{ fontSize: '15px', color: '#1E293B', fontWeight: 800, marginTop: '2px' }}>
                {vitals.weight} <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>kg</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
            <button 
              onClick={() => setShowTimelineModal(true)}
              style={{ border: 'none', background: 'none', color: '#2563EB', fontSize: '13.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0 }}
            >
              View All Vitals <span style={{ fontSize: '14px' }}>→</span>
            </button>
          </div>
        </div>

      </div>

      {/* Right Column (Prescription Sheet) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Main Prescription Card */}
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', background: '#ffffff', boxShadow: '0 1.5px 4px rgba(0,0,0,0.03)' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i data-lucide="file-text" style={{ width: '20px', height: '20px', color: '#1E293B' }}></i> Prescription
            </h2>
            <button 
              onClick={() => setShowAssignLabDrawer(true)}
              style={{ border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#2563EB', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: '0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
              onMouseLeave={e => e.currentTarget.style.background = '#EFF6FF'}
            >
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>+</span> Assign Lab test
            </button>
          </div>

          {/* Diagnosis Section */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', marginBottom: '8px' }}>DIAGNOSIS (OPTIONAL)</label>
            <input 
              type="text" 
              value={diagnosisText} 
              onChange={e => {
                setDiagnosisText(e.target.value);
                setSoap(prev => ({ ...prev, assessment: e.target.value }));
              }} 
              placeholder="Enter Patient Diagnosis..." 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, color: '#1E293B', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }} 
            />
          </div>

          {/* Medications Section */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', marginBottom: '12px' }}>MEDICATIONS</label>
            
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', width: '40px' }}>#</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B' }}>MEDICINE</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', width: '110px' }}>DOSAGE</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', width: '140px' }}>FREQUENCY</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', width: '100px' }}>DURATION</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', width: '130px' }}>INSTRUCTIONS</th>
                    <th style={{ padding: '12px 16px', width: '40px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med, idx) => (
                    <tr key={med.id || idx} style={{ borderBottom: idx === medicines.length - 1 ? 'none' : '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13.5px', fontWeight: 700, color: '#64748B' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <input 
                          type="text" 
                          value={med.name} 
                          onChange={e => updateMedicineRow(med.id, 'name', e.target.value)} 
                          placeholder="Medicine name..." 
                          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13.5px', fontWeight: 700, color: '#1E293B', width: '100%' }} 
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input 
                          type="text" 
                          value={med.dose} 
                          onChange={e => updateMedicineRow(med.id, 'dose', e.target.value)} 
                          placeholder="e.g. 500 mg" 
                          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13.5px', fontWeight: 600, color: '#1E293B', width: '100%' }} 
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select 
                          value={med.freq} 
                          onChange={e => updateMedicineRow(med.id, 'freq', e.target.value)} 
                          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13.5px', fontWeight: 600, color: '#1E293B', width: '100%', cursor: 'pointer' }}
                        >
                          <option value="Twice a Day">Twice a Day</option>
                          <option value="Once a Day">Once a Day</option>
                          <option value="Thrice a Day">Thrice a Day</option>
                          <option value="Four Times a Day">Four Times a Day</option>
                          <option value="1 Tab TDS">1 Tab TDS</option>
                          <option value="1 Tab BD">1 Tab BD</option>
                          <option value="1 Tab OD">1 Tab OD</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input 
                          type="text" 
                          value={med.duration} 
                          onChange={e => updateMedicineRow(med.id, 'duration', e.target.value)} 
                          placeholder="e.g. 5 Days" 
                          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13.5px', fontWeight: 600, color: '#1E293B', width: '100%' }} 
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select 
                          value={med.timing} 
                          onChange={e => updateMedicineRow(med.id, 'timing', e.target.value)} 
                          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13.5px', fontWeight: 600, color: '#1E293B', width: '100%', cursor: 'pointer' }}
                        >
                          <option value="After Food">After Food</option>
                          <option value="Before Food">Before Food</option>
                          <option value="With Food">With Food</option>
                          <option value="Empty Stomach">Empty Stomach</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button 
                          onClick={() => removeMedicineRow(med.id)} 
                          style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <i data-lucide="trash-2" style={{ width: '15px', height: '15px', color: '#EF4444' }}></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  <tr>
                    <td colSpan="7" style={{ padding: '16px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                      <button 
                        onClick={() => addMedicineRow({ name: '', dose: '', freq: 'Once a Day', duration: '5 Days', timing: 'After Food' })} 
                        style={{ border: 'none', background: 'none', color: '#2563EB', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: 0 }}
                      >
                        <span style={{ fontSize: '16px', color: '#2563EB', fontWeight: 'bold', marginRight: '4px' }}>+</span> Add Medicine
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes for Patient */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', marginBottom: '8px' }}>NOTES FOR PATIENT</label>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', background: '#F8FAFC' }}>
              <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0', fontSize: '14px', color: '#1E293B', fontWeight: 600, lineHeight: 1.8 }}>
                <li style={{ marginBottom: '8px' }}><span style={{ color: '#2563EB', marginRight: '6px' }}>•</span> Take plenty of rest and fluids.</li>
                <li style={{ marginBottom: '8px' }}><span style={{ color: '#2563EB', marginRight: '6px' }}>•</span> Avoid oily and spicy food.</li>
                <li style={{ marginBottom: '8px' }}><span style={{ color: '#2563EB', marginRight: '6px' }}>•</span> Contact clinic if symptoms persist or worsen.</li>
              </ul>
              <textarea 
                data-lenis-prevent
                value={soap.plan}
                onChange={e => setSoap(prev => ({ ...prev, plan: e.target.value }))}
                placeholder="Add additional patient instructions here..." 
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '13.5px', color: '#64748B', resize: 'none', minHeight: '60px', fontWeight: 500, boxSizing: 'border-box' }}
              />
            </div>
          </div>

        </div>

        {/* Bottom Action Footer */}
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', background: '#ffffff', boxShadow: '0 1.5px 4px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="checkbox" 
              id="sendPharmacyCheck" 
              checked={sendToPharmacy} 
              onChange={e => setSendToPharmacy(e.target.checked)} 
              style={{ width: '18px', height: '18px', accentColor: '#2563EB', cursor: 'pointer' }} 
            />
            <div>
              <label htmlFor="sendPharmacyCheck" style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', cursor: 'pointer' }}>Send prescription to pharmacy</label>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>MediCore Pharmacy, Main Branch</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => {
                if (selectedPatient) {
                  // reload patient data
                  setDiagnosisText('Viral Fever with Upper Respiratory Tract Infection');
                  setMedicines([
                    { id: 1, name: 'Paracetamol', dose: '500 mg', freq: 'Twice a Day', duration: '5 Days', timing: 'After Food' },
                    { id: 2, name: 'Azithromycin', dose: '250 mg', freq: 'Once a Day', duration: '3 Days', timing: 'Before Food' }
                  ]);
                }
              }}
              style={{ border: 'none', background: 'none', color: '#64748B', fontSize: '14px', fontWeight: 700, cursor: 'pointer', padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleLockPrescription}
              style={{ background: '#2563EB', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)', transition: '0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Send Prescription
            </button>
          </div>
        </div>

      </div>

      {/* Modern High-Fidelity Sliding Lab Drawer (Matches user specification image 100%) */}
      {showAssignLabDrawer && (
        <>
          {/* Blur Backdrop */}
          <div 
            onClick={() => setShowAssignLabDrawer(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.3)',
              backdropFilter: 'blur(6px)',
              zIndex: 99999,
              transition: 'opacity 0.2s ease-out'
            }}
          />

          {/* Drawer Container */}
          <div 
            data-lenis-prevent
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '460px',
              maxWidth: '90vw',
              background: '#ffffff',
              boxShadow: '-10px 0 40px rgba(15, 23, 42, 0.08)',
              zIndex: 100000,
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              fontFamily: "'Urbanist', sans-serif"
            }}
          >
            {/* Header */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1E3A8A' }}>Assign Laboratory Test</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                  {selectedPatient?.name || 'Ravi Kumar'} | {selectedPatient?.uhid || 'PT000123'}
                </p>
              </div>
              <button 
                onClick={() => setShowAssignLabDrawer(false)}
                style={{ border: 'none', background: 'none', fontSize: '22px', color: '#94A3B8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                ×
              </button>
            </div>

            {/* Content Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Test Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', letterSpacing: '0.05em', marginBottom: '10px' }}>LABORATORY TEST SELECTION</label>
                
                <div style={{ position: 'relative' }}>
                  <i data-lucide="search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748B' }}></i>
                  <input 
                    type="text" 
                    placeholder="Search tests (e.g. Blood, Urine...)" 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 44px',
                      borderRadius: '12px',
                      border: '1.5px solid #E2E8F0',
                      fontSize: '14px',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#1E293B',
                      background: '#ffffff',
                      transition: 'border-color 0.2s'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        handleAddLab(searchQuery.trim());
                      }
                    }}
                  />

                  {/* Test Suggestions Overlay */}
                  {showSuggestions && searchQuery.trim() && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      zIndex: 10,
                      marginTop: '6px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      padding: '6px'
                    }}>
                      {availableTests
                        .filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(t => (
                          <div 
                            key={t}
                            onClick={() => handleAddLab(t)}
                            style={{ padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 650, color: '#334155', transition: '0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            {t}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Selected Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
                  {selectedLabsList.map(lab => (
                    <span 
                      key={lab} 
                      style={{ 
                        background: '#EEF2FF', 
                        color: '#4F46E5', 
                        border: '1.5px solid #DBEAFE', 
                        fontSize: '12px', 
                        fontWeight: 750, 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px' 
                      }}
                    >
                      {lab}
                      <span 
                        onClick={() => handleRemoveLab(lab)}
                        style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#4F46E5', display: 'inline-flex', alignItems: 'center' }}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', letterSpacing: '0.05em', marginBottom: '12px' }}>PRIORITY</label>
                <div style={{ display: 'flex', gap: '24px' }}>
                  {['Routine', 'Urgent', 'Emergency'].map(option => (
                    <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                      <input 
                        type="radio" 
                        name="labPriority" 
                        value={option}
                        checked={labPriority === option}
                        onChange={() => setLabPriority(option)}
                        style={{ width: '18px', height: '18px', accentColor: '#2563EB', cursor: 'pointer' }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', letterSpacing: '0.05em', marginBottom: '10px' }}>INSTRUCTIONS</label>
                <textarea 
                  data-lenis-prevent
                  value={labInstructions}
                  onChange={e => setLabInstructions(e.target.value)}
                  placeholder="Patient instructions (e.g. Fasting required)"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#1E293B',
                    minHeight: '90px',
                    resize: 'none'
                  }}
                />
              </div>

              {/* TAT Info Card (Purple Glassmorphic Layout Matching Mockup) */}
              <div 
                style={{
                  background: '#F5F3FF',
                  border: '1px solid #DDD6FE',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <i data-lucide="info" style={{ width: '16px', height: '16px', color: '#7C3AED', marginTop: '3px' }}></i>
                  <p style={{ margin: 0, fontSize: '13px', color: '#5B21B6', fontWeight: 700, lineHeight: 1.4 }}>
                    Average TAT for these tests is 24 hours.
                  </p>
                </div>

                {/* Corridor Clinical Image */}
                <div 
                  style={{
                    position: 'relative',
                    height: '110px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid rgba(124, 58, 237, 0.15)'
                  }}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&auto=format&fit=crop&q=80" 
                    alt="Clinical Laboratory" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  {/* Overlay Badge */}
                  <div 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(15, 23, 42, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span 
                      style={{
                        background: '#ffffff',
                        color: '#1E293B',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 800,
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i data-lucide="map-pin" style={{ width: '13px', height: '13px', color: '#4F46E5' }}></i> Main Lab (Floor 2)
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '24px 32px', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <button 
                onClick={handleAssignAndSend}
                style={{
                  width: '100%',
                  background: '#2563EB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
                onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
              >
                <i data-lucide="send" style={{ width: '16px', height: '16px' }}></i> Assign & Send to Laboratory
              </button>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                Digital order will be sent instantly to the laboratory system.
              </p>
            </div>

          </div>

          {/* CSS Animation injection inline */}
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}

    </div>
  );
}
