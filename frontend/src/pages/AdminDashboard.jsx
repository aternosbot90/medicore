import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Safeguard React DOM reconciliation against external DOM mutations
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

const pmModules = [
  /* ---- DOCTOR ---- */
  { id: 'dr-consult',    name: 'Patient consultation notes', desc: 'Write SOAP notes, diagnosis, history', group: 'Doctor — clinical', coreFor: ['doctor'] },
  { id: 'dr-rx',         name: 'Prescription writer',        desc: 'Prescribe medicines, generate slip',   group: 'Doctor — clinical', coreFor: ['doctor'] },
  { id: 'dr-laborder',   name: 'Test order / lab referral',  desc: 'Order tests, track reports',           group: 'Doctor — clinical', coreFor: ['doctor'] },
  { id: 'dr-history',    name: 'Patient visit history',      desc: 'View past visits across hospitals',    group: 'Doctor — clinical', coreFor: ['doctor'] },
  { id: 'dr-discharge',  name: 'Discharge summary',          desc: 'Generate & sign discharge summary',    group: 'Doctor — clinical', coreFor: [] },
  { id: 'dr-stockview',  name: 'Pharmacy stock view',        desc: 'Read-only view of medicine levels',    group: 'Doctor — clinical', coreFor: [] },
  /* ---- RECEPTIONIST ---- */
  { id: 'rc-register',   name: 'Patient registration',       desc: 'Register new & search global registry',group: 'Receptionist — core', coreFor: ['receptionist'] },
  { id: 'rc-appt',       name: 'Appointment booking',        desc: 'Book, reschedule, cancel appointments',group: 'Receptionist — core', coreFor: ['receptionist'] },
  { id: 'rc-queue',      name: 'OPD token queue',            desc: 'Manage daily queue, call next',        group: 'Receptionist — core', coreFor: ['receptionist'] },
  { id: 'rc-upload',     name: 'Lab report upload',          desc: 'Upload external lab reports',          group: 'Receptionist — core', coreFor: ['receptionist'] },
  { id: 'rc-billing',    name: 'Billing & receipts',         desc: 'Generate consultation receipts',       group: 'Receptionist — ops', coreFor: [] },
  { id: 'rc-reorder',    name: 'Pharmacy stock reorder',     desc: 'Raise reorder requests for medicines', group: 'Receptionist — ops', coreFor: [] },
  { id: 'rc-labprint',   name: 'Lab slip printing',          desc: 'Print / WhatsApp lab referral slips',  group: 'Receptionist — ops', coreFor: [] },
  /* ---- LAB TECH ---- */
  { id: 'lt-queue',      name: 'Test order queue',           desc: 'View & accept pending lab orders',     group: 'Lab tech — core', coreFor: ['lab'] },
  { id: 'lt-upload',     name: 'Report upload',              desc: 'Upload completed reports, link referral',group: 'Lab tech — core', coreFor: ['lab'] },
  { id: 'lt-reagents',   name: 'Lab reagents inventory',     desc: 'View & update reagent stock',          group: 'Lab tech — core', coreFor: ['lab'] },
  { id: 'lt-dispatch',   name: 'Report dispatch',            desc: 'Send report to doctor & patient',      group: 'Lab tech — ops', coreFor: [] },
  { id: 'lt-extlab',     name: 'External lab coordination',  desc: 'Log tests sent to external lab',       group: 'Lab tech — ops', coreFor: [] },
  /* ---- PHARMACIST ---- */
  { id: 'ph-queue',      name: 'Prescription queue',         desc: 'View incoming prescriptions in real time',group: 'Pharmacist — core', coreFor: ['pharmacy'] },
  { id: 'ph-dispense',   name: 'Medicine dispensing',        desc: 'Mark medicines dispensed',             group: 'Pharmacist — core', coreFor: ['pharmacy'] },
  { id: 'ph-stock',      name: 'Stock inventory',            desc: 'Full view of stock, expiry, batches',  group: 'Pharmacist — core', coreFor: ['pharmacy'] },
  { id: 'ph-reorder',    name: 'Reorder management',         desc: 'Raise purchase orders to suppliers',   group: 'Pharmacist — core', coreFor: ['pharmacy'] },
  { id: 'ph-billing',    name: 'Prescription billing',       desc: 'Generate pharmacy bill & collect payment',group: 'Pharmacist — ops', coreFor: [] },
  { id: 'ph-controlled', name: 'Controlled drugs log',       desc: 'Maintain NDPS narcotics register',     group: 'Pharmacist — ops', coreFor: [] },
  /* ---- NURSE ---- */
  { id: 'nu-vitals',     name: 'Patient vitals entry',       desc: 'Enter BP, temp, weight, SpO2',         group: 'Nurse — core', coreFor: ['nurse'] },
  { id: 'nu-ward',       name: 'Ward round notes',           desc: 'Log inpatient round notes per shift',  group: 'Nurse — core', coreFor: ['nurse'] },
  { id: 'nu-labassist',  name: 'Lab sample assist',          desc: 'Assist with sample collection',        group: 'Nurse — ops', coreFor: [] },
  { id: 'nu-dispense',   name: 'Medicine dispensing (assist)',desc: 'Assist pharmacist in dispensing',     group: 'Nurse — ops', coreFor: [] },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dynamic Role Coverage System state
  const [pmState, setPmState] = useState(() => {
    const saved = localStorage.getItem('medicore_pmState');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      'Dr. Anjali Rao': {},
      'Sunita Receptionist': {},
      'Vikram Pharmacist': {},
      'Roshni': {}
    };
  });
  const [pmSelectedStaffId, setPmSelectedStaffId] = useState(null);
  const [pmPendingChanges, setPmPendingChanges] = useState({}); // { permId: { on, type, expiresIn } }
  const [pmReason, setPmReason] = useState('');

  const [staff, setStaff] = useState([
    {
      id: '1',
      name: 'Dr. Anjali Rao',
      role: 'doctor',
      dept: 'Cardiology',
      joined: '14 Jan 2025',
      patientsToday: '8',
      lastLogin: 'Today 9AM',
      workingDays: 'Mon-Sat',
      status: 'On duty',
      active: true,
      initials: 'AY',
      avatarColor: 'purple'
    },
    {
      id: '2',
      name: 'Dr. Rohit Patel',
      role: 'doctor',
      dept: 'Orthopaedics',
      joined: '3 Apr 2025',
      patientsToday: '6',
      lastLogin: 'Today 8AM',
      workingDays: 'Mon-Sat',
      status: 'On duty',
      active: true,
      initials: 'RP',
      avatarColor: 'blue'
    },
    {
      id: '3',
      name: 'Sunita Receptionist',
      role: 'receptionist',
      dept: 'Front desk',
      joined: '29 May 2026',
      status: 'Absent Today',
      active: false,
      initials: 'SR',
      avatarColor: 'gold'
    }
  ]);
  const [newStaff, setNewStaff] = useState({ staff_id: '', password: '', role: 'doctor', name: '', max_slots: 10 });
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [activeStaffCategory, setActiveStaffCategory] = useState('All');
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Interactive approvals state matching the new mockup layout exactly
  const [pendingApprovals, setPendingApprovals] = useState([
    {
      id: 'app-reorder-1',
      category: 'reorder',
      title: 'Reorder request — 5 medicines',
      raisedBy: 'Sunita (Receptionist) • 28 May 2026',
      status: 'Pending',
      medicines: ['Metformin 500mg', 'Paracetamol', 'Amoxicillin', 'BP strips', 'Glucometer strips'],
      department: 'receptionist'
    },
    {
      id: 'app-reorder-2',
      category: 'reorder',
      title: 'Pharmacy reorder — low stock alert',
      raisedBy: 'Vikram (Pharmacist) • 29 May 2026 • 10x item a • ₹50/b',
      status: 'Pending',
      department: 'pharmacy'
    },
    {
      id: 'app-reorder-3',
      category: 'reorder',
      title: 'Lab reagent reorder',
      raisedBy: 'Mohan (Lab Tech) • Awaiting department approval',
      status: 'Queued',
      department: 'lab'
    },
    // Leaves sub-tab mock records
    {
      id: 'app-leave-1',
      category: 'leave',
      title: 'Leave request — 2 days medical',
      raisedBy: 'Sunita (Receptionist) • 29 May 2026',
      status: 'Pending',
      details: 'Applying for sick leave due to seasonal flu.',
      department: 'receptionist'
    },
    {
      id: 'app-leave-2',
      category: 'leave',
      title: 'Leave request — 5 days annual',
      raisedBy: 'Dr. Abhishek • 30 May 2026',
      status: 'Pending',
      details: 'Pre-planned annual leave for family travel.',
      department: 'doctor'
    },
    // Billing sub-tab mock records
    {
      id: 'app-billing-1',
      category: 'billing',
      title: 'Billing release approval — Patient discharge clearance',
      raisedBy: 'Sunita (Receptionist) • 28 May 2026 • ₹42,800',
      status: 'Pending',
      details: 'Patient discharge billing discrepancy clearance requested.',
      department: 'receptionist'
    }
  ]);

  const [approvalsSubTab, setApprovalsSubTab] = useState('reorder');
  const [approvedTodayCount, setApprovedTodayCount] = useState(3); // from mockup "3"
  const [rejectedThisWeekCount, setRejectedThisWeekCount] = useState(1); // from mockup "1"

  // High-fidelity interactive Alerts lists
  const [criticalAlerts, setCriticalAlerts] = useState([
    { id: 'crit-1', title: 'Metformin stock critically low', subtext: 'Rx: Dr. Abhishek · Reorder & 4 patients pending · 3 days unresolved', type: 'critical' }
  ]);

  const [warningAlerts, setWarningAlerts] = useState([
    { id: 'warn-1', title: 'Monthly billing report not generated', subtext: '2 notified pending · generate & share with billing staff', type: 'warning', actionText: 'Generate' },
    { id: 'warn-2', title: '3 lab reports overdue (7d+)', subtext: 'Patients awaiting results — assign lab tech to follow up', type: 'warning', actionText: 'Flag' },
    { id: 'warn-3', title: 'Rahul Singh — nurse, shift schedule not updated', subtext: '23 May 2026 · 2:15 PM · Needs head nurse to update schedule', type: 'warning', actionText: 'Assign' }
  ]);

  const [resolvedCount, setResolvedCount] = useState(7); // starts at 7 resolved this week from the mockup

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [selectedStaffToRevoke, setSelectedStaffToRevoke] = useState(null);

  // Appointments states matching the mockup exactly
  const [appointments, setAppointments] = useState([
    { id: '1', time: '09:00', patientName: 'Rahul Mehta', patientId: '#4821', doctor: 'Dr. Anjali', dept: 'General', status: 'COMPLETED' },
    { id: '2', time: '09:30', patientName: 'Priya Kumar', patientId: '#3391', doctor: 'Dr. Rajan', dept: 'Ortho', status: 'IN QUEUE' },
    { id: '3', time: '10:00', patientName: 'Vikram Singh', patientId: '#5291', doctor: 'Dr. Anjali', dept: 'General', status: 'SCHEDULED' },
    { id: '4', time: '10:30', patientName: 'Sunita Devi', patientId: '#1289', doctor: 'Dr. Mehta', dept: 'Cardio', status: 'SCHEDULED' },
    { id: '5', time: '11:00', patientName: 'Anil Sharma', patientId: '#9931', doctor: 'Dr. Mehta', dept: 'Cardio', status: 'COMPLETED' }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('All');
  const [activeApptFilter, setActiveApptFilter] = useState('All');
  const [showNewApptModal, setShowNewApptModal] = useState(false);
  const [newApptData, setNewApptData] = useState({
    patientName: '',
    doctor: 'Dr. Anjali',
    dept: 'General',
    time: '12:00',
    status: 'SCHEDULED'
  });

  // Patients states matching the mockup exactly
  const [patients, setPatients] = useState([
    { id: '1', patientId: '#4821', name: 'Rahul Mehta', ageGender: '34 M', lastVisit: '27 May 2026', doctor: 'Dr. Anjali' },
    { id: '2', patientId: '#3391', name: 'Priya Kumar', ageGender: '28 F', lastVisit: '25 May 2026', doctor: 'Dr. Rajan' },
    { id: '3', patientId: '#2210', name: 'Anil Sharma', ageGender: '56 M', lastVisit: '20 May 2026', doctor: 'Dr. Mehta' },
    { id: '4', patientId: '#1987', name: 'Sunita Devi', ageGender: '44 F', lastVisit: '18 May 2026', doctor: 'Dr. Mehta' }
  ]);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    age: '',
    gender: 'M',
    doctor: 'Dr. Anjali',
    lastVisit: 'Today'
  });
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Audit Logs States
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditSelectedCategory, setAuditSelectedCategory] = useState('All');
  const [auditSelectedTag, setAuditSelectedTag] = useState('All');
  const [auditTimeRange, setAuditTimeRange] = useState('Last 7 days');
  const [auditLogs, setAuditLogs] = useState([
    {
      id: '1',
      title: 'New Dr. ABC added',
      category: 'Staff management',
      tag: 'Staff',
      subtext: 'Dept: Cardiology · Consultant · 24 May 2026 · 10:02 AM · By admin Priya',
      type: 'STAFF',
      hasReview: true
    },
    {
      id: '2',
      title: 'Staff role changed — Rahul Singh',
      category: 'Staff management',
      tag: 'Staff',
      subtext: 'Nurse → Head Nurse · 23 May 2026 · 2:15 PM · By admin',
      type: 'STAFF',
      hasReview: false
    },
    {
      id: '3',
      title: 'Patient record edited — #4821',
      category: 'Patient data',
      tag: 'Patient',
      subtext: 'Field: DOB · Changed by: Receptionist Kavita · 25 May 2026',
      type: 'PATIENT DATA',
      hasReview: true
    },
    {
      id: '4',
      title: 'Appointment deleted — Patient #3391',
      category: 'Patient data',
      tag: 'Patient',
      subtext: 'By: Receptionist Kashish · Dr. Mehta not available · Status: Rescheduled',
      type: 'PATIENT DATA',
      hasReview: false
    },
    {
      id: '5',
      title: 'Consultation fee updated — General OPD',
      category: 'Billing',
      tag: 'Billing',
      subtext: '₹300 → ₹450 · Effective today · By admin Priya · 26 May 2026',
      type: 'BILLING',
      hasReview: false
    },
    {
      id: '6',
      title: 'Admin login from new device',
      category: 'Security',
      tag: 'Security',
      subtext: 'Windows · Location: Delhi · 26 May 2026 · 4:45 PM · Email OTP used · Triggered',
      type: 'SECURITY',
      hasReview: true
    },
    {
      id: '7',
      title: 'Staff account deactivated — Priya Chopra',
      category: 'Staff management',
      tag: 'Staff',
      subtext: '23 May 2026 · 11:30 AM · Reason: not enrolled · Target staff not active · By admin',
      type: 'STAFF',
      hasReview: false
    }
  ]);
  
  const sidebarRef = useRef(null);
  const sidebarNavRef = useRef(null);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchStaff();
    fetchInventoryAlerts();
    fetchRoleCoverage();
  }, []);

  useEffect(() => {
    if (activeTab === 'permissions' && !pmSelectedStaffId && staff.length > 0) {
      setPmSelectedStaffId(staff[0].id || staff[0].name);
    }
  }, [activeTab, staff, pmSelectedStaffId]);

  // Centralized Scroll Lock Manager (State-Free, Layout-Stable, zero-flicker)
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    let isHoveringSidebar = false;

    const updateScrollLock = () => {
      const modalExists = document.querySelector('.modal-backdrop') || 
                          document.querySelector('.modal') || 
                          showAddStaffModal || 
                          showRevokeConfirm || 
                          showNewApptModal || 
                          showNewPatientModal || 
                          showEditPatientModal;
      
      if (modalExists || isHoveringSidebar) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };

    const handleMouseEnter = () => {
      isHoveringSidebar = true;
      updateScrollLock();
    };

    const handleMouseLeave = () => {
      isHoveringSidebar = false;
      updateScrollLock();
    };

    sidebar.addEventListener('mouseenter', handleMouseEnter);
    sidebar.addEventListener('mouseleave', handleMouseLeave);

    // Watch dynamically for modal mounts/unmounts in the body to recalculate states instantly
    const observer = new MutationObserver(updateScrollLock);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      sidebar.removeEventListener('mouseenter', handleMouseEnter);
      sidebar.removeEventListener('mouseleave', handleMouseLeave);
      observer.disconnect();
      // Safely reset scroll locks
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showAddStaffModal, showRevokeConfirm, showNewApptModal, showNewPatientModal, showEditPatientModal]);

  const renderHeaderTitle = () => {
    let main = "";
    let sub = "";

    if (activeTab === 'dashboard') { main = "Dashboard"; sub = "today's overview"; }
    else if (activeTab === 'supply') { main = "Approvals"; sub = "pending requests"; }
    else if (activeTab === 'approvals') { main = "Approvals"; sub = "pending requests"; }
    else if (activeTab === 'appointments') { main = "Approvals"; sub = "pending requests"; }
    else if (activeTab === 'patients') { main = "Approvals"; sub = "pending requests"; }
    else if (activeTab === 'workforce') { main = "Workforce"; sub = "hospital accounts"; }
    else if (activeTab === 'financials') { main = "Revenue"; sub = "ledger & analytics"; }
    else if (activeTab === 'audit') { main = "Approvals"; sub = "pending requests"; }
    else if (activeTab === 'subscription') { main = "Subscription"; sub = "enterprise license"; }
    else if (activeTab === 'maintenance') { main = "Maintenance"; sub = "system services"; }
    else if (activeTab === 'updates') { main = "Updates"; sub = "patches & hotfixes"; }
    else if (activeTab === 'permissions') { main = "Role Coverage"; sub = "access & delegation control"; }

    return (
      <span className="header-title">
        <span className="header-title-main" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>{main}</span>
        {sub && <span className="header-title-sub" style={{ color: '#64748B', fontWeight: 600 }}> — {sub}</span>}
      </span>
    );
  };

  const fetchInventoryAlerts = async () => {
    try {
      const response = await api.get('/admin/inventory-alerts');
      setInventoryAlerts(response.data);
      if (response.data.length > 0) {
        const dbCriticals = response.data.map((item, idx) => ({
          id: `db-crit-${item._id}`,
          title: `${item.name} stock critically low (${item.stock} units)`,
          subtext: `Rx: Pharmacy Department · status: ${item.status}`,
          type: 'critical',
          rawItem: item
        }));
        setCriticalAlerts(prev => {
          const filterOldDb = prev.filter(x => !x.id.startsWith('db-crit-'));
          return [...filterOldDb, ...dbCriticals];
        });
      }
    } catch (err) {
      console.error('Failed to load inventory alerts', err);
    }
  };

  const fetchRoleCoverage = async () => {
    try {
      const response = await api.get('/auth/role-coverage');
      if (response.data) {
        setPmState(response.data);
        localStorage.setItem('medicore_pmState', JSON.stringify(response.data));
      }
    } catch (err) {
      console.error('Failed to load role coverage from backend', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await api.get('/admin/users');
      // Merge backend database records with the initial visual mock records
      const dbUsers = response.data.map(user => {
        let initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        if (!initials) initials = 'ST';
        let avatarColor = 'blue';
        if (user.role === 'doctor') avatarColor = 'purple';
        if (user.role === 'receptionist') avatarColor = 'gold';
        return {
          id: user._id || user.id,
          name: user.name,
          role: user.role,
          dept: user.role === 'doctor' ? 'General Medicine' : 'Administration',
          joined: 'Recently',
          patientsToday: '0',
          lastLogin: 'Never',
          workingDays: 'Mon-Fri',
          status: 'Active',
          active: true,
          initials,
          avatarColor
        };
      });
      setStaff(prev => {
        // Keep initial mock entries but filter out duplicates by name
        const mocks = prev.filter(x => x.id === '1' || x.id === '2' || x.id === '3');
        const dbFiltered = dbUsers.filter(dbu => !mocks.some(m => m.name.toLowerCase() === dbu.name.toLowerCase()));
        return [...mocks, ...dbFiltered];
      });
    } catch (err) {
      console.error('Failed to fetch staff', err);
    }
  };

  const handleAdminRestock = async (alertItem) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (alertItem.department === 'Pharmacy') {
        const currentQty = alertItem.rawItem.stock || 0;
        await api.put(`/medicines/${alertItem._id}`, { stock: currentQty + 100 });
      } else {
        await api.put(`/lab-inventory/${alertItem._id}`, { isRestock: true, addQty: 100 });
      }
      setSuccess(`Replenished stock for ${alertItem.name} successfully!`);
      fetchInventoryAlerts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to replenish stock');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Generate local mock card fields in case of fallback or local display
    let initials = newStaff.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    if (!initials) initials = 'ST';
    
    let dept = 'General Medicine';
    if (newStaff.role === 'receptionist') dept = 'Front desk';
    if (newStaff.role === 'lab') dept = 'Laboratory';
    if (newStaff.role === 'pharmacy') dept = 'Pharmacy';

    let avatarColor = 'blue';
    if (newStaff.role === 'doctor') avatarColor = 'purple';
    if (newStaff.role === 'receptionist') avatarColor = 'gold';

    const localEntry = {
      id: Math.random().toString(),
      name: newStaff.name,
      role: newStaff.role,
      dept: dept,
      joined: 'Today',
      patientsToday: '0',
      lastLogin: 'Never',
      workingDays: 'Mon-Fri',
      status: 'On duty',
      active: true,
      initials,
      avatarColor
    };

    try {
      await api.post('/admin/users', newStaff);
      setSuccess('Staff account created successfully!');
      setStaff(prev => [...prev.filter(x => x.name.toLowerCase() !== newStaff.name.toLowerCase()), localEntry]);
      setNewStaff({ staff_id: '', password: '', role: 'doctor', name: '', max_slots: 10 });
      setShowAddStaffModal(false);
      fetchStaff();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.warn('Backend API error - falling back to local state execution:', err);
      setSuccess('Staff account created successfully (Local Registry)!');
      setStaff(prev => [...prev, localEntry]);
      setNewStaff({ staff_id: '', password: '', role: 'doctor', name: '', max_slots: 10 });
      setShowAddStaffModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/users/${id}`);
      setSuccess('Access revoked successfully!');
      setStaff(prev => prev.filter(item => item.id !== id && item._id !== id));
      fetchStaff();
      setShowRevokeConfirm(false);
      setSelectedStaffToRevoke(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.warn('Backend delete API failed - falling back to local state:', err);
      setSuccess('Access revoked successfully!');
      setStaff(prev => prev.filter(item => item.id !== id && item._id !== id));
      setShowRevokeConfirm(false);
      setSelectedStaffToRevoke(null);
      setTimeout(() => setSuccess(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Appointments interactive handlers
  const handleCancelAppt = (id) => {
    setAppointments(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'CANCELLED' };
      }
      return item;
    }));
    setSuccess('Appointment cancelled successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleRescheduleAppt = (id) => {
    setAppointments(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, time: '11:00' };
      }
      return item;
    }));
    setSuccess('Appointment rescheduled to 11:00 AM');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleManageAppt = (id) => {
    setSuccess('Redirecting to consult room management...');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAddNewAppt = (e) => {
    e.preventDefault();
    const newId = (appointments.length + 1).toString();
    const randomToken = '#' + Math.floor(1000 + Math.random() * 9000).toString();
    const newEntry = {
      id: newId,
      time: newApptData.time,
      patientName: newApptData.patientName,
      patientId: randomToken,
      doctor: newApptData.doctor,
      dept: newApptData.dept,
      status: newApptData.status
    };
    setAppointments(prev => [...prev, newEntry]);
    setShowNewApptModal(false);
    setNewApptData({
      patientName: '',
      doctor: 'Dr. Anjali',
      dept: 'General',
      time: '12:00',
      status: 'SCHEDULED'
    });
    setSuccess('Appointment scheduled successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Patients interactive handlers
  const handleAddNewPatient = (e) => {
    e.preventDefault();
    const newId = (patients.length + 1).toString();
    const randomToken = '#' + Math.floor(1000 + Math.random() * 9000).toString();
    const ageGenderStr = `${newPatientData.age} ${newPatientData.gender}`;
    
    // Format date beautifully: e.g. 31 May 2026
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    const newEntry = {
      id: newId,
      patientId: randomToken,
      name: newPatientData.name,
      ageGender: ageGenderStr,
      lastVisit: dateStr,
      doctor: newPatientData.doctor
    };
    
    setPatients(prev => [...prev, newEntry]);
    setShowNewPatientModal(false);
    setNewPatientData({
      name: '',
      age: '',
      gender: 'M',
      doctor: 'Dr. Anjali',
      lastVisit: 'Today'
    });
    setSuccess('Patient registered successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEditPatientSubmit = (e) => {
    e.preventDefault();
    setPatients(prev => prev.map(item => {
      if (item.id === editingPatient.id) {
        return editingPatient;
      }
      return item;
    }));
    setShowEditPatientModal(false);
    setEditingPatient(null);
    setSuccess('Patient registry updated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const deletePatient = (id) => {
    setPatients(prev => prev.filter(item => item.id !== id));
    setSuccess('Patient record removed from active registry');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Modern Approval handlers that update states dynamically
  const approveApprovalItem = (id, title) => {
    setPendingApprovals(prev => prev.filter(x => x.id !== id));
    setApprovedTodayCount(prev => prev + 1);
    setSuccess(`Approved: ${title}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const rejectApprovalItem = (id, title) => {
    setPendingApprovals(prev => prev.filter(x => x.id !== id));
    setRejectedThisWeekCount(prev => prev + 1);
    setError(`Rejected: ${title}`);
    setTimeout(() => setError(''), 3000);
  };

  const resolveCriticalAlert = async (id, title, rawItem) => {
    if (rawItem) {
      await handleAdminRestock(rawItem);
    }
    setCriticalAlerts(prev => prev.filter(item => item.id !== id));
    setResolvedCount(prev => prev + 1);
    setSuccess(`Resolved Critical Warning: ${title}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const resolveWarningAlert = (id, title, actionName) => {
    setWarningAlerts(prev => prev.filter(item => item.id !== id));
    setResolvedCount(prev => prev + 1);
    setSuccess(`Executed: ${actionName} for "${title}"`);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Counts for tabs & statistics
  const totalAlertsCount = criticalAlerts.length + warningAlerts.length;
  const approvalsCount = pendingApprovals.length;
  
  const reorderCount = pendingApprovals.filter(x => x.category === 'reorder').length;
  const leaveCount = pendingApprovals.filter(x => x.category === 'leave').length;
  const billingCount = pendingApprovals.filter(x => x.category === 'billing').length;

  return (
    <div className="admin-dashboard-container">
      {/* 100% Mockup Consistent Styling (LIGHT THEME SIDEBAR + APPROVALS BOARD) */}
      <style>{`
        .admin-dashboard-container {
          display: flex;
          min-height: 100vh;
          background-color: #F8FAFC;
          font-family: 'Urbanist', 'Outfit', sans-serif;
          color: #1E293B;
          width: 100%;
          position: relative;
        }

        /* 1. Light Theme Sidebar Navigation (Synchronized across all sub-pages) */
        .admin-sidebar {
          width: 260px;
          background-color: #FFFFFF;
          color: #475569;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 1000;
          border-right: 1px solid #E2E8F0;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.02);
          overscroll-behavior: contain;
        }

        .sidebar-brand {
          padding: 24px 32px 16px;
          display: flex;
          align-items: center;
          font-size: 22px;
          font-weight: 800;
          color: #0F172A;
          border-bottom: 1px solid #F1F5F9;
        }

        .sidebar-brand-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          color: #2563EB;
        }

        .sidebar-nav-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px 16px;
          overscroll-behavior: contain;
        }

        .sidebar-group {
          margin-bottom: 24px;
        }

        .sidebar-group-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #94A3B8;
          margin-bottom: 8px;
          padding-left: 16px;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: #475569;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          border-radius: 8px;
          transition: all 0.2s ease-in-out;
          margin-bottom: 4px;
          cursor: pointer;
        }

        .sidebar-link:hover {
          background-color: #F8FAFC;
          color: #0F172A;
        }

        .sidebar-link.active {
          background-color: #EFF6FF;
          color: #2563EB;
        }

        .sidebar-link svg {
          stroke: #64748B;
          transition: stroke 0.2s;
        }

        .sidebar-link.active svg {
          stroke: #2563EB;
        }

        .sidebar-profile {
          padding: 16px 24px;
          border-top: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #FFFFFF;
          position: relative;
        }

        .profile-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .profile-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #E2E8F0;
        }

        .profile-texts {
          display: flex;
          flex-direction: column;
        }

        .profile-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.2;
        }

        .profile-role {
          font-size: 11px;
          color: #64748B;
        }

        .profile-chevron {
          color: #64748B;
          cursor: pointer;
          transition: color 0.2s;
        }

        .profile-chevron:hover {
          color: #0F172A;
        }

        /* 2. Main content area */
        .admin-main-canvas {
          margin-left: 260px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          padding-bottom: 40px;
        }

        /* 3. Top Navigation Header */
        .admin-top-header {
          height: 72px;
          background-color: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 99;
        }

        .header-title-container {
          display: flex;
          flex-direction: column;
        }

        .header-title {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.5px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .plan-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #ECFDF5;
          color: #059669;
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 12.5px;
          font-weight: 700;
        }

        .plan-dot {
          width: 6px;
          height: 6px;
          background-color: #10B981;
          border-radius: 50%;
        }

        .alert-outline-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #EF4444;
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .alert-outline-badge:hover {
          background-color: #FEE2E2;
          transform: translateY(-1px);
        }

        .add-staff-btn {
          height: 40px;
          background-color: #2563EB;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 13.5px;
          border: none;
          border-radius: 10px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.15);
          transition: all 0.2s;
        }

        .add-staff-btn:hover {
          background-color: #1D4ED8;
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.25);
        }

        /* 4. Dashboard contents container */
        .admin-dashboard-content {
          padding: 32px 40px;
          animation: adminFadeIn 0.3s ease-out;
        }

        @keyframes adminFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* KPI stat cards */
        .admin-kpi-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 28px;
        }

        .admin-kpi-card {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          position: relative;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .kpi-card-header {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #64748B;
          margin-bottom: 12px;
        }

        .kpi-card-val {
          font-size: 34px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 4px;
          line-height: 1.1;
        }

        .kpi-card-val.revenue {
          color: #10B981;
        }

        .kpi-card-val.orange-val {
          color: #D97706;
        }

        .kpi-card-val.green-val {
          color: #059669;
        }

        .kpi-card-val.red-val {
          color: #EF4444;
        }

        .kpi-card-sub {
          font-size: 12px;
          font-weight: 600;
          color: #64748B;
        }

        .kpi-card-highlight {
          color: #D97706;
          margin-right: 4px;
        }

        .kpi-card-highlight.green {
          color: #10B981;
        }

        .kpi-icon-overlay {
          position: absolute;
          right: 24px;
          top: 24px;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background-color: #FFFBEB;
          color: #D97706;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Subtab pill indicators for Approvals page */
        .approvals-subtab-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          background: #FFFFFF;
          padding: 8px 12px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          align-self: flex-start;
          display: inline-flex;
        }

        .approvals-subtab-btn {
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .approvals-subtab-btn.active {
          background-color: #2563EB;
          color: #FFFFFF;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.15);
        }

        .approvals-subtab-btn.inactive {
          background-color: #FFFFFF;
          color: #475569;
        }

        .approvals-subtab-btn.inactive:hover {
          background-color: #F1F5F9;
          color: #0F172A;
        }

        /* 5. Modern Approvals Board Grid & Cards */
        .approval-category-header {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #64748B;
          margin-bottom: 14px;
        }

        .approval-board-card-full {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-left: 5px solid #F59E0B; /* Golden left accent */
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          margin-bottom: 28px;
          position: relative;
        }

        .approval-board-card-full.queued-accent {
          border-left-color: #CBD5E1; /* Gray accent */
        }

        .approval-card-hdr-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .approval-card-title {
          font-size: 16px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .approval-card-metadata {
          font-size: 12.5px;
          color: #64748B;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .approval-card-pills-container {
          background-color: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          font-size: 13.5px;
          font-weight: 700;
          color: #1E3A8A;
        }

        .approval-card-pills-container span {
          display: inline-block;
        }

        .approval-actions-footer {
          display: flex;
          gap: 12px;
        }

        .approval-action-btn-green {
          background-color: #ECFDF5;
          color: #059669;
          border: none;
          font-weight: 800;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .approval-action-btn-green:hover {
          background-color: #D1FAE5;
          color: #047857;
        }

        .approval-action-btn-red {
          background-color: #FEF2F2;
          color: #DC2626;
          border: none;
          font-weight: 800;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .approval-action-btn-red:hover {
          background-color: #FEE2E2;
          color: #B91C1C;
        }

        .approval-action-btn-blue-outline {
          background-color: #FFFFFF;
          border: 1.5px solid #2563EB;
          color: #2563EB;
          font-weight: 800;
          padding: 8px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .approval-action-btn-blue-outline:hover {
          background-color: #EFF6FF;
        }

        .approvals-split-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .badge-pill-state {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: capitalize;
        }

        .badge-pill-state.pending {
          background-color: #FFFBEB;
          color: #D97706;
        }

        .badge-pill-state.queued {
          background-color: #F1F5F9;
          color: #64748B;
        }

        /* Fallbacks, Roster and Alerts components */
        .premium-dashboard-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }

        .premium-dashboard-table th {
          text-align: left;
          padding: 10px 12px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748B;
          border-bottom: 1px solid #F1F5F9;
        }

        .premium-dashboard-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
        }

        .pill-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .pill-badge.completed {
          background-color: #ECFDF5;
          color: #059669;
        }

        .pill-badge.inqueue {
          background-color: #FFFBEB;
          color: #D97706;
        }

        .pill-badge.scheduled {
          background-color: #EFF6FF;
          color: #2563EB;
        }

        .pill-badge.critical {
          background-color: #FEF2F2;
          color: #DC2626;
        }

        .workforce-split-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
        }

        .action-notification-banner {
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 13.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideUp 0.3s ease-out;
        }

        .action-notification-banner.success {
          background-color: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }

        .action-notification-banner.error {
          background-color: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FCA5A5;
        }

        .admin-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: adminFadeIn 0.2s ease-out;
        }

        .admin-modal-card {
          background: #FFFFFF;
          border-radius: 12px;
          width: 100%;
          max-width: 460px;
          padding: 32px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .admin-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .admin-modal-title {
          font-size: 16px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .admin-modal-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
        }

        .admin-modal-close-btn:hover {
          background-color: #F1F5F9;
          color: #0F172A;
        }

        .admin-input-group {
          margin-bottom: 16px;
        }

        .admin-input-label {
          display: block;
          font-size: 12.5px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 8px;
        }

        .admin-text-input {
          width: 100%;
          height: 42px;
          background-color: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 0 14px;
          font-size: 13.5px;
          font-weight: 600;
          color: #1E293B;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s;
        }

        .admin-text-input:focus {
          border-color: #3B71FE;
          background-color: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(59, 113, 254, 0.1);
        }

        .admin-submit-btn {
          width: 100%;
          height: 44px;
          background-color: #3B71FE;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 12px;
          box-shadow: 0 4px 10px rgba(59, 113, 254, 0.15);
        }

        .admin-submit-btn:hover {
          background-color: #2563EB;
        }

        .profile-dropmenu-box {
          position: absolute;
          bottom: 100%;
          left: 16px;
          right: 16px;
          margin-bottom: 8px;
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 1010;
          padding: 8px;
        }

        .dropmenu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          border-radius: 6px;
          cursor: pointer;
        }

        .dropmenu-item:hover {
          background-color: #F1F5F9;
        }

        .dropmenu-item.logout {
          color: #EF4444;
        }

        .dropmenu-item.logout:hover {
          background-color: #FEF2F2;
        }

        /* RESTORED AND OPTIMIZED GRID LAYOUT AND WIDGET STYLINGS */
        .dashboard-layout-cols {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 28px;
          align-items: start;
          margin-top: 28px;
        }

        .dashboard-col-left, .dashboard-col-right {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .dashboard-widget-card {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          position: relative;
        }

        .widget-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .widget-title {
          font-size: 15px;
          font-weight: 800;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .widget-title svg {
          color: #64748B;
        }

        .widget-header-action-btn {
          background: none;
          border: none;
          color: #2563EB;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
        }

        .widget-header-action-btn:hover {
          color: #1D4ED8;
          text-decoration: underline;
        }

        /* Alerts list and rows */
        .alerts-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .alert-row-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          transition: transform 0.2s;
        }

        .alert-row-item:hover {
          transform: translateY(-1px);
        }

        .alert-row-item.danger {
          background-color: #FEF2F2;
          border-color: #FCA5A5;
          color: #991B1B;
        }

        .alert-row-item.warning {
          background-color: #FFFBEB;
          border-color: #FDE68A;
          color: #92400E;
        }

        .alert-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .alert-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.8);
        }

        .alert-texts {
          display: flex;
          flex-direction: column;
        }

        .alert-main-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0F172A;
        }

        .alert-sub-title {
          font-size: 11.5px;
          color: #64748B;
          margin-top: 2px;
          font-weight: 600;
        }

        .alert-action-trigger {
          font-size: 12.5px;
          font-weight: 800;
          color: #2563EB;
          cursor: pointer;
          transition: color 0.2s;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .alert-action-trigger:hover {
          color: #1D4ED8;
          background-color: rgba(37, 99, 235, 0.05);
        }

        /* Approvals in Dashboard Widget */
        .approvals-list-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .approval-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          background-color: #F8FAFC;
        }

        .approval-item-lbl {
          font-size: 13px;
          font-weight: 700;
          color: #1E293B;
          max-width: 60%;
          line-height: 1.3;
        }

        .approval-actions-box {
          display: flex;
          gap: 8px;
        }

        .approval-act-btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .approval-act-btn.approve {
          background-color: #ECFDF5;
          color: #059669;
        }

        .approval-act-btn.approve:hover {
          background-color: #D1FAE5;
        }

        .approval-act-btn.reject {
          background-color: #FEF2F2;
          color: #DC2626;
        }

        .approval-act-btn.reject:hover {
          background-color: #FEE2E2;
        }

        /* Calendar Widget breakdown details */
        .widget-details-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .details-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          padding-bottom: 12px;
          border-bottom: 1px solid #F1F5F9;
        }

        .details-item-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .details-item-label {
          font-weight: 700;
          color: #64748B;
        }

        .details-item-val {
          font-weight: 800;
          color: #0F172A;
        }

        .badge-orange {
          background-color: #FFFBEB;
          color: #D97706;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
        }

        .badge-green {
          background-color: #ECFDF5;
          color: #059669;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
        }

        /* High Fidelity Alert modern stack */
        .alerts-modern-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .alert-card-modern {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .alert-card-modern.critical-style {
          border-left: 5px solid #EF4444;
        }

        .alert-card-modern.warning-style {
          border-left: 5px solid #F59E0B;
        }

        .alert-card-left-part {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .alert-badge-icon-holder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .critical-style .alert-badge-icon-holder {
          background-color: #FEF2F2;
          color: #EF4444;
        }

        .warning-style .alert-badge-icon-holder {
          background-color: #FFFBEB;
          color: #D97706;
        }

        .alert-card-texts {
          display: flex;
          flex-direction: column;
        }

        .alert-card-main-title {
          font-size: 14.5px;
          font-weight: 800;
          color: #0F172A;
        }

        .alert-card-subtext {
          font-size: 12px;
          color: #64748B;
          margin-top: 2px;
          font-weight: 600;
        }

        .alert-card-right-part {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .alert-badge-pill {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .critical-style .alert-badge-pill {
          background-color: #FEF2F2;
          color: #EF4444;
        }

        .warning-style .alert-badge-pill {
          background-color: #FFFBEB;
          color: #D97706;
        }

        .alerts-action-outline-btn {
          background-color: #FFFFFF;
          border: 1.5px solid #2563EB;
          color: #2563EB;
          font-weight: 800;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12.5px;
          transition: all 0.2s;
        }

        .alerts-action-outline-btn:hover {
          background-color: #EFF6FF;
          color: #1D4ED8;
          border-color: #1D4ED8;
        }

        /* Appointments Tab Styling */
        .appt-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }

        .appt-kpi-header {
          font-size: 13px;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .appt-table-filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .appt-segmented-tabs {
          display: flex;
          background-color: #F1F5F9;
          padding: 4px;
          border-radius: 8px;
          gap: 4px;
        }

        .appt-tab-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13.5px;
          font-weight: 800;
          color: #64748B;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .appt-tab-btn.active {
          background-color: #2563EB;
          color: #FFFFFF;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15);
        }

        .appt-search-input {
          padding: 9px 16px 9px 36px;
          border-radius: 8px;
          border: 1.5px solid #E2E8F0;
          background-color: #F8FAFC;
          font-size: 13.5px;
          font-weight: 600;
          color: #1E293B;
          outline: none;
          width: 220px;
          transition: all 0.2s;
        }

        .appt-search-input:focus {
          border-color: #2563EB;
          background-color: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .search-bar-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .appt-select-filter {
          padding: 9px 32px 9px 16px;
          border-radius: 8px;
          border: 1.5px solid #E2E8F0;
          background-color: #FFFFFF;
          font-size: 13.5px;
          font-weight: 700;
          color: #475569;
          outline: none;
          cursor: pointer;
          appearance: none;
          transition: all 0.2s;
        }

        .appt-select-filter:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .appt-select-arrow {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .appt-new-btn {
          background-color: #2563EB;
          color: #FFFFFF;
          font-weight: 800;
          padding: 10px 18px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 13.5px;
          display: flex;
          align-items: center;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
        }

        .appt-new-btn:hover {
          background-color: #1D4ED8;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .appt-roster-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .appt-roster-table th {
          font-size: 11.5px;
          font-weight: 800;
          color: #64748B;
          padding: 16px 20px;
          border-bottom: 1.5px solid #E2E8F0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .appt-roster-table td {
          padding: 18px 20px;
          border-bottom: 1px solid #F1F5F9;
          font-size: 14px;
        }

        .appt-roster-table tr:hover td {
          background-color: #F8FAFC;
        }

        .appt-patient-id-badge {
          margin-left: 8px;
          font-size: 11.5px;
          font-weight: 700;
          color: #64748B;
          background-color: #F1F5F9;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .appt-status-badge {
          font-size: 11.5px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .appt-status-badge.badge-success {
          background-color: #DEF7EC;
          color: #03543F;
        }

        .appt-status-badge.badge-warning {
          background-color: #FEF3C7;
          color: #92400E;
        }

        .appt-status-badge.badge-info {
          background-color: #E0F2FE;
          color: #0369A1;
        }

        .appt-status-badge.badge-danger {
          background-color: #FDE8E8;
          color: #9B1C1C;
        }

        .appt-action-outline-btn {
          background-color: #FFFFFF;
          border: 1.5px solid #2563EB;
          color: #2563EB;
          font-weight: 800;
          padding: 7px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12.5px;
          transition: all 0.2s;
        }

        .appt-action-outline-btn:hover {
          background-color: #EFF6FF;
          color: #1D4ED8;
          border-color: #1D4ED8;
        }

        .appt-action-outline-btn-red {
          background-color: #FFFFFF;
          border: 1.5px solid #EF4444;
          color: #EF4444;
          font-weight: 800;
          padding: 7px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12.5px;
          transition: all 0.2s;
        }

        .appt-action-outline-btn-red:hover {
          background-color: #FEF2F2;
          color: #DC2626;
          border-color: #DC2626;
        }

        /* Patients Tab Styling */
        .pat-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }

        .pat-search-register-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }

        .pat-search-input-wrapper {
          position: relative;
          flex: 1;
        }

        .pat-search-input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border-radius: 8px;
          border: 1.5px solid #E2E8F0;
          background-color: #FFFFFF;
          font-size: 14.5px;
          font-weight: 600;
          color: #1E293B;
          outline: none;
          transition: all 0.2s;
        }

        .pat-search-input:focus {
          border-color: #2563EB;
          background-color: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .pat-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .pat-register-btn {
          background-color: #2563EB;
          color: #FFFFFF;
          font-weight: 800;
          padding: 12px 24px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
        }

        .pat-register-btn:hover {
          background-color: #1D4ED8;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .pat-roster-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .pat-roster-table th {
          font-size: 11.5px;
          font-weight: 800;
          color: #64748B;
          padding: 16px 24px;
          border-bottom: 1.5px solid #E2E8F0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .pat-roster-table td {
          padding: 20px 24px;
          border-bottom: 1px solid #F1F5F9;
          font-size: 14px;
          color: #475569;
        }

        .pat-roster-table tr:hover td {
          background-color: #F8FAFC;
        }

        .pat-id-text {
          font-weight: 700;
          color: #64748B;
        }

        .pat-name-text {
          font-weight: 700;
          color: #0F172A;
        }

        /* Workforce / Staff Tab Styles matching mockup exactly */
        .staff-kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }

        .staff-filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .staff-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .staff-card-item {
          background-color: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .staff-card-item:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .staff-card-item.absent-styled {
          background-color: #F8FAFC;
        }

        .staff-card-header {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 20px;
        }

        .staff-avatar-initials {
          width: 54px;
          height: 54px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 800;
        }

        .staff-avatar-initials.avatar-purple {
          background-color: #FAF5FF;
          color: #A855F7;
        }

        .staff-avatar-initials.avatar-blue {
          background-color: #EFF6FF;
          color: #3B82F6;
        }

        .staff-avatar-initials.avatar-gold {
          background-color: #FEF3C7;
          color: #D97706;
        }

        .staff-name-badges-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .staff-meta-widgets {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .staff-meta-widget-item {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 12px 16px;
        }

        .absent-styled .staff-meta-widget-item {
          background-color: #F1F5F9;
        }

        .staff-meta-widget-lbl {
          font-size: 10.5px;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .staff-meta-widget-val {
          font-size: 14.5px;
          font-weight: 800;
          color: #1E293B;
        }

        .staff-actions-footer {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .staff-action-pill-btn {
          background-color: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          color: #475569;
          font-weight: 800;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .staff-action-pill-btn:hover {
          background-color: #F8FAFC;
          color: #1E293B;
          border-color: #CBD5E1;
        }

        .staff-action-pill-btn.deactivate-btn {
          border-color: #FEE2E2;
          background-color: #FFFFFF;
          color: #EF4444;
        }

        .staff-action-pill-btn.deactivate-btn:hover {
          background-color: #FEF2F2;
          border-color: #FCA5A5;
        }

        .staff-action-pill-btn.arrange-btn {
          background-color: #D97706;
          border-color: #D97706;
          color: #FFFFFF;
        }

        .staff-action-pill-btn.arrange-btn:hover {
          background-color: #B45309;
          border-color: #B45309;
        }

        .revenue-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 24px;
        }

        .search-filter-row {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }

        .log-item-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 16px;
          border: 1.5px solid #F1F5F9;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.01);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        @media (max-width: 1024px) {
          .revenue-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .search-filter-row {
            flex-direction: column;
          }
          .search-filter-row select {
            width: 100% !important;
          }
          .log-item-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
          }
          .log-item-card-right {
            align-self: flex-end;
            width: 100%;
            display: flex;
            justify-content: flex-end;
          }
        }

        /* Mobile layout styling overrides */
        @media (max-width: 1024px) {
          .mobile-menu-toggle {
            display: flex !important;
          }
          .admin-sidebar {
            left: -260px !important;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .admin-sidebar.mobile-open {
            left: 0 !important;
          }
          .admin-main-canvas {
            margin-left: 0 !important;
          }
          .admin-top-header {
            padding: 0 20px !important;
          }
          .mobile-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(4px);
            z-index: 999;
            animation: fadeIn 0.2s ease-out;
          }
        }

        /* Mobile specific visual fixes for 640px screens */
        @media (max-width: 640px) {
          .admin-top-header {
            padding: 0 12px !important;
            height: auto !important;
            min-height: 72px !important;
            padding-top: 10px !important;
            padding-bottom: 10px !important;
          }
          .header-title-container {
            max-width: 140px !important;
          }
          .header-title {
            font-size: 16px !important;
            line-height: 1.3 !important;
          }
          .header-title-sub {
            display: none !important;
          }
          .plan-badge {
            display: none !important;
          }
          .header-actions {
            gap: 8px !important;
          }
          .alert-outline-badge {
            padding: 6px 10px !important;
            font-size: 11px !important;
          }
          .alert-outline-badge span {
            display: none !important;
          }
          
          /* Admin KPI Cards row stacking on mobile */
          .admin-kpi-row {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          /* Alerts / Tasks card collapse */
          .alert-card-modern {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            padding: 16px !important;
          }
          .alert-card-left-part {
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .alert-card-right-part {
            align-self: flex-end !important;
            width: 100% !important;
            justify-content: flex-end !important;
            border-top: 1px solid #F1F5F9 !important;
            padding-top: 12px !important;
          }
        }

        /* ----- ROLE COVERAGE / PERMISSIONS MANAGER TAB ----- */
        .pm-container {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 28px;
          padding: 0 40px 32px 40px;
          animation: adminFadeIn 0.3s ease-out;
        }

        .pm-staff-pane {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.01);
          height: fit-content;
        }

        .pm-pane-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #475569;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .pm-staff-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 500px;
          overflow-y: auto;
        }

        .pm-staff-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pm-staff-item:hover {
          background-color: #F8FAFC;
          border-color: #E2E8F0;
        }

        .pm-staff-item.active {
          background-color: #EFF6FF;
          border-color: #BFDBFE;
        }

        .pm-staff-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .pm-staff-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .pm-staff-name {
          font-size: 13.5px;
          font-weight: 750;
          color: #0F172A;
        }

        .pm-staff-role {
          font-size: 11px;
          color: #64748B;
          font-weight: 600;
          text-transform: capitalize;
        }

        .pm-detail-pane {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.01);
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }

        .pm-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          flex: 1;
          color: #94A3B8;
          padding: 60px 20px;
        }

        .pm-empty-icon {
          width: 64px;
          height: 64px;
          background: #F1F5F9;
          color: #64748B;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .pm-editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 20px;
          border-bottom: 1px solid #E2E8F0;
          margin-bottom: 24px;
        }

        .pm-group-box {
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .pm-group-title {
          background: #F8FAFC;
          padding: 12px 18px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #475569;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pm-module-row {
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid #F1F5F9;
          transition: background-color 0.2s;
        }

        .pm-module-row:last-child {
          border-bottom: none;
        }

        .pm-module-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
        }

        .pm-module-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          padding-right: 20px;
        }

        .pm-module-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pm-module-name {
          font-size: 13.5px;
          font-weight: 750;
          color: #1E293B;
        }

        .pm-badge {
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .pm-badge.core {
          background: #F1F5F9;
          color: #64748B;
        }

        .pm-badge.temp {
          background: #FFF7ED;
          color: #C2410C;
          border: 1px solid #FED7AA;
        }

        .pm-badge.perm {
          background: #ECFDF5;
          color: #047857;
          border: 1px solid #A7F3D0;
        }

        .pm-badge.pending {
          background: #EFF6FF;
          color: #1D4ED8;
          border: 1px solid #BFDBFE;
        }

        .pm-module-desc {
          font-size: 12px;
          color: #64748B;
          font-weight: 550;
        }

        /* Toggle switches */
        .pm-toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          background-color: #E2E8F0;
          border-radius: 99px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .pm-toggle-switch.active {
          background-color: #2563EB;
        }

        .pm-toggle-switch.disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .pm-revoke-btn {
          background-color: #FFF1F2;
          color: #E11D48;
          border: 1px solid #FFE4E6;
          border-radius: 8px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          font-family: inherit;
        }

        .pm-revoke-btn:hover {
          background-color: #FFE4E6;
          border-color: #FDA4AF;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(225, 29, 72, 0.08);
        }

        .pm-revoke-btn:active {
          transform: translateY(0);
        }

        .pm-toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }

        .pm-toggle-switch.active .pm-toggle-thumb {
          transform: translateX(20px);
        }

        /* Settings pane details */
        .pm-duration-bar {
          background: #F8FAFC;
          border-top: 1px dashed #E2E8F0;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .pm-duration-select {
          height: 32px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          background: white;
          padding: 0 8px;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          outline: none;
          cursor: pointer;
        }

        /* Sticky bottom action footer */
        .pm-sticky-footer {
          position: fixed;
          bottom: 0;
          right: 0;
          left: 260px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid #E2E8F0;
          padding: 16px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 1000;
          box-shadow: 0 -10px 30px rgba(0,0,0,0.03);
          transition: left 0.3s ease;
        }

        @media (max-width: 1024px) {
          .pm-container {
            grid-template-columns: 1fr;
          }
          .pm-sticky-footer {
            left: 0 !important;
            padding: 16px 20px !important;
          }
        }

        .pm-footer-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          max-width: 500px;
        }

        .pm-footer-changes {
          font-size: 13px;
          font-weight: 800;
          color: #1E293B;
          flex-shrink: 0;
        }

        .pm-reason-input {
          flex: 1;
          height: 38px;
          border: 1.5px solid #E2E8F0;
          border-radius: 8px;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 600;
          outline: none;
          transition: border-color 0.2s;
        }

        .pm-reason-input:focus {
          border-color: #2563EB;
        }

        .pm-footer-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pm-apply-btn {
          height: 38px;
          background: #10B981;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0 18px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .pm-apply-btn:hover {
          background: #059669;
        }

        .pm-apply-btn:disabled {
          background: #A7F3D0;
          cursor: not-allowed;
        }

        .pm-discard-btn {
          background: transparent;
          color: #64748B;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 0 16px;
          height: 38px;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pm-discard-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        /* Overrides ledger widget */
        .pm-overrides-card {
          margin-top: 28px;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 24px;
          background: #FFFFFF;
        }

        .pm-overrides-title {
          font-size: 14px;
          font-weight: 800;
          color: #1E293B;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pm-override-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid #F1F5F9;
        }

        .pm-override-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .pm-override-row:first-child {
          padding-top: 0;
        }

        .pm-override-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pm-override-staff {
          font-size: 13.5px;
          font-weight: 750;
          color: #1E293B;
        }

        .pm-override-perm-name {
          font-size: 12px;
          color: #64748B;
          font-weight: 600;
        }

        .pm-override-reason {
          font-size: 11px;
          color: #94A3B8;
          font-style: italic;
          font-weight: 550;
        }
      `}</style>

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="mobile-backdrop" 
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 1. Light Theme Sidebar Navigation */}
      <div 
        className={`admin-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`} 
        ref={sidebarRef}
        onClick={() => setMobileSidebarOpen(false)}
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h4.58"/></svg>
          </div>
          <span>MediCore</span>
        </div>

        <div className="sidebar-nav-container" ref={sidebarNavRef}>
          {/* Overview Group */}
          <div className="sidebar-group">
            <div className="sidebar-group-title">Overview</div>
            <div 
              className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="10" rx="1"/><rect width="7" height="5" x="3" y="14" rx="1"/></svg>
              <span>Dashboard</span>
            </div>
            <div 
              className={`sidebar-link ${activeTab === 'supply' ? 'active' : ''}`}
              onClick={() => setActiveTab('supply')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              <span>Alerts & tasks</span>
            </div>
            <div 
              className={`sidebar-link ${activeTab === 'approvals' ? 'active' : ''}`}
              onClick={() => setActiveTab('approvals')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <span>Approvals</span>
            </div>
          </div>

          {/* Clinic Group */}
          <div className="sidebar-group">
            <div className="sidebar-group-title">Clinic</div>
            <div 
              className={`sidebar-link ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
              <span>Appointments</span>
            </div>
            <div 
              className={`sidebar-link ${activeTab === 'patients' ? 'active' : ''}`}
              onClick={() => setActiveTab('patients')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Patients</span>
            </div>
            <div 
              className={`sidebar-link ${activeTab === 'workforce' ? 'active' : ''}`}
              onClick={() => setActiveTab('workforce')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
              <span>Staff</span>
            </div>
            <div 
              className={`sidebar-link ${activeTab === 'permissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('permissions')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              <span>Role Coverage</span>
            </div>
          </div>

          {/* Finance & System Group */}
          <div className="sidebar-group">
            <div className="sidebar-group-title">Finance & System</div>
            <div 
              className={`sidebar-link ${activeTab === 'financials' ? 'active' : ''}`}
              onClick={() => setActiveTab('financials')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span>Revenue</span>
            </div>
            <div 
              className={`sidebar-link ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
              <span>Audit Logs</span>
            </div>
          </div>

          {/* Settings Group */}
          <div className="sidebar-group">
            <div className="sidebar-group-title">Settings</div>
            <div 
              className={`sidebar-link ${activeTab === 'subscription' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscription')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
              <span>Subscription</span>
            </div>
            <div 
              className={`sidebar-link ${activeTab === 'maintenance' ? 'active' : ''}`}
              onClick={() => setActiveTab('maintenance')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>
              <span>Maintenance</span>
            </div>
            <div 
              className={`sidebar-link ${activeTab === 'updates' ? 'active' : ''}`}
              onClick={() => setActiveTab('updates')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
              <span>Updates</span>
            </div>
          </div>
        </div>

        {/* Bottom Profile Section with Dropdown toggle */}
        <div className="sidebar-profile">
          {showProfileMenu && (
            <div className="profile-dropmenu-box">
              <div className="dropmenu-item" onClick={() => { setActiveTab('dashboard'); setShowProfileMenu(false); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="10" rx="1"/><rect width="7" height="5" x="3" y="14" rx="1"/></svg>
                <span>Dashboard</span>
              </div>
              <div className="dropmenu-item" onClick={() => { setActiveTab('subscription'); setShowProfileMenu(false); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                <span>Subscription</span>
              </div>
              <div style={{ borderTop: '1px solid #E2E8F0', margin: '6px 0' }} />
              <div className="dropmenu-item logout" onClick={handleLogout}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                <span>Log out</span>
              </div>
            </div>
          )}

          <div className="profile-info" onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ cursor: 'pointer' }}>
            <img 
              src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=100&h=100" 
              alt="Avatar" 
              className="profile-avatar"
            />
            <div className="profile-texts">
              <span className="profile-name">{user.name || 'Kunal'}</span>
              <span className="profile-role">Admin</span>
            </div>
          </div>
          <div className="profile-chevron" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
      </div>

      {/* 2. Main content area canvas */}
      <div className="admin-main-canvas">
        {/* 3. Top Navigation Header */}
        <div className="admin-top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                transition: 'background-color 0.2s'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>

            <div className="header-title-container">
              {renderHeaderTitle()}
            </div>
          </div>

          <div className="header-actions">
            <div className="plan-badge">
              <span className="plan-dot" />
              <span>Pro plan - active</span>
            </div>
            
            {/* Pill outline button for alerts count */}
            <div 
              className="alert-outline-badge" 
              onClick={() => setActiveTab('supply')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span>{totalAlertsCount} alerts</span>
            </div>

            <button className="add-staff-btn" onClick={() => setShowAddStaffModal(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              <span>Add staff</span>
            </button>
          </div>
        </div>

        {/* Banners for actions feedback */}
        <div style={{ padding: '0 40px', marginTop: '24px' }}>
          {success && (
            <div className="action-notification-banner success">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="action-notification-banner error">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* 4. Dashboard tab content */}
        {activeTab === 'dashboard' && (
          <div className="admin-dashboard-content">
            {/* KPI STAT CARDS */}
            <div className="admin-kpi-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="admin-kpi-card">
                <span className="kpi-card-header">Appointments Today</span>
                <span className="kpi-card-val">28</span>
                <span className="kpi-card-sub">
                  <span className="kpi-card-highlight">12 pending</span> - booked
                </span>
              </div>

              <div className="admin-kpi-card">
                <span className="kpi-card-header">Patients Seen Today</span>
                <span className="kpi-card-val">16</span>
                <span className="kpi-card-sub">
                  <span className="kpi-card-highlight green">2.6 new</span> from yesterday
                </span>
              </div>

              <div className="admin-kpi-card">
                <span className="kpi-card-header">Revenue Today</span>
                <span className="kpi-card-val revenue">₹42,800</span>
                <span className="kpi-card-sub">
                  <span className="kpi-card-highlight green">↑ 7.8%</span> vs yesterday
                </span>
              </div>

              <div className="admin-kpi-card">
                <span className="kpi-card-header">Pending Approvals</span>
                <span className="kpi-card-val">{approvalsCount + totalAlertsCount}</span>
                <span className="kpi-card-sub">
                  <span className="kpi-card-highlight">Leave · reorder · billing</span>
                </span>
              </div>
            </div>

            {/* TWO COLUMN GRID */}
            <div className="dashboard-layout-cols">
              {/* Left column */}
              <div className="dashboard-col-left">
                {/* Today's appointments Widget */}
                <div className="dashboard-widget-card">
                  <div className="widget-header-row">
                    <span className="widget-title">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748B' }}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                      <span>Today's appointments</span>
                    </span>
                    <button className="widget-header-action-btn" onClick={() => setActiveTab('appointments')}>View all</button>
                  </div>

                  <table className="premium-dashboard-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><b>09:00</b></td>
                        <td>Rahul M.</td>
                        <td>Dr. Abhishek</td>
                        <td><span className="pill-badge completed">Completed</span></td>
                      </tr>
                      <tr>
                        <td><b>09:30</b></td>
                        <td>Priya K.</td>
                        <td>Dr. Sharma</td>
                        <td><span className="pill-badge inqueue">In queue</span></td>
                      </tr>
                      <tr>
                        <td><b>10:00</b></td>
                        <td>Vikram S.</td>
                        <td>Dr. Abhishek</td>
                        <td><span className="pill-badge scheduled">Scheduled</span></td>
                      </tr>
                      <tr>
                        <td><b>10:30</b></td>
                        <td>Sunita D.</td>
                        <td>Dr. Verma</td>
                        <td><span className="pill-badge scheduled">Scheduled</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Alerts & Tasks Widget */}
                <div className="dashboard-widget-card">
                  <div className="widget-header-row">
                    <span className="widget-title">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748B' }}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                      <span>Alerts & tasks</span>
                    </span>
                    <button className="widget-header-action-btn" onClick={() => setActiveTab('supply')}>All alerts</button>
                  </div>

                  <div className="alerts-stack">
                    {criticalAlerts.map(alert => (
                      <div className="alert-row-item danger animate-in" key={alert.id}>
                        <div className="alert-left">
                          <div className="alert-icon-box">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                          </div>
                          <div className="alert-texts">
                            <span className="alert-main-title">{alert.title}</span>
                            <span className="alert-sub-title">{alert.subtext}</span>
                          </div>
                        </div>
                        <div 
                          className="alert-action-trigger" 
                          onClick={() => resolveCriticalAlert(alert.id, alert.title, alert.rawItem)}
                        >
                          Resolve →
                        </div>
                      </div>
                    ))}

                    {warningAlerts.slice(0, 1).map(alert => (
                      <div className="alert-row-item warning animate-in" style={{ animationDelay: '0.1s' }} key={alert.id}>
                        <div className="alert-left">
                          <div className="alert-icon-box">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                          </div>
                          <div className="alert-texts">
                            <span className="alert-main-title">{alert.title}</span>
                            <span className="alert-sub-title">{alert.subtext}</span>
                          </div>
                        </div>
                        <div 
                          className="alert-action-trigger"
                          onClick={() => resolveWarningAlert(alert.id, alert.title, alert.actionText)}
                        >
                          {alert.actionText}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="dashboard-col-right" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Approvals Widget */}
                <div className="dashboard-widget-card">
                  <div className="widget-header-row">
                    <span className="widget-title">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748B' }}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      <span>Approvals & tasks</span>
                    </span>
                    <button className="widget-header-action-btn" onClick={() => setActiveTab('approvals')}>View all</button>
                  </div>

                  <div className="approvals-list-stack">
                    {pendingApprovals.slice(0, 3).map(appItem => (
                      <div className="approval-list-item animate-in" key={appItem.id}>
                        <span className="approval-item-lbl">{appItem.title}</span>
                        <div className="approval-actions-box">
                          <button 
                            className="approval-act-btn approve"
                            onClick={() => approveApprovalItem(appItem.id, appItem.title)}
                          >
                            Approve
                          </button>
                          <button 
                            className="approval-act-btn reject"
                            onClick={() => rejectApprovalItem(appItem.id, appItem.title)}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    {approvalsCount === 0 && (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: '#64748B', fontWeight: 600, fontSize: '13px' }}>
                        No pending approvals.
                      </div>
                    )}
                  </div>
                </div>

                {/* Calendar today widget */}
                <div className="dashboard-widget-card">
                  <div className="widget-header-row">
                    <span className="widget-title">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748B' }}><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                      <span>Calendar — today</span>
                    </span>
                  </div>

                  <div className="widget-details-list">
                    <div className="details-item-row">
                      <span className="details-item-label">Doctors on duty</span>
                      <span className="details-item-val">9/11</span>
                    </div>
                    <div className="details-item-row">
                      <span className="details-item-label">On leave today</span>
                      <span className="details-item-val badge-orange">2 doctors</span>
                    </div>
                    <div className="details-item-row">
                      <span className="details-item-label">Waiting · completed · scheduled</span>
                      <span className="details-item-val">12 · 16 · 0</span>
                    </div>
                    <div className="details-item-row">
                      <span className="details-item-label">Status breakdown</span>
                      <span className="details-item-val" style={{ display: 'flex', gap: '6px' }}>
                        <span className="badge-orange">Waiting 12</span>
                        <span className="badge-green">Done 16</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Workforce/Staff tab content matching mockup exactly */}
        {activeTab === 'workforce' && (
          <div className="admin-dashboard-content">
            {/* KPI Cards Row */}
            <div className="staff-kpi-row">
              <div className="dashboard-widget-card" style={{ padding: '24px' }}>
                <span className="appt-kpi-header">Total Staff</span>
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px' }}>
                  <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: 0 }}>19</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, marginTop: '8px', marginBottom: 0 }}>City Care Clinic</p>
              </div>

              <div className="dashboard-widget-card" style={{ padding: '24px' }}>
                <span className="appt-kpi-header">Active Today</span>
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px' }}>
                  <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#10B981', margin: 0 }}>17</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, marginTop: '8px', marginBottom: 0 }}>2 absent</p>
              </div>

              <div className="dashboard-widget-card" style={{ padding: '24px' }}>
                <span className="appt-kpi-header">Pending Approvals</span>
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px' }}>
                  <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#D97706', margin: 0 }}>2</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, marginTop: '8px', marginBottom: 0 }}>New req.</p>
              </div>

              <div className="dashboard-widget-card" style={{ padding: '24px' }}>
                <span className="appt-kpi-header">Staff Performance</span>
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px' }}>
                  <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#10B981', margin: 0 }}>Good</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, marginTop: '8px', marginBottom: 0 }}>No flagged issues</p>
              </div>
            </div>

            {/* Search Bar + Add staff button */}
            <div className="staff-filter-bar">
              <div className="pat-search-input-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pat-search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
                <input 
                  type="text" 
                  className="pat-search-input" 
                  placeholder="Search by name, role, department..."
                  value={staffSearchQuery}
                  onChange={e => setStaffSearchQuery(e.target.value)}
                />
              </div>

              <button 
                className="pat-register-btn"
                onClick={() => setShowAddStaffModal(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                Add new staff
              </button>
            </div>

            {/* Segmented control tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <button 
                className={`appt-tab-btn ${activeStaffCategory === 'All' ? 'active' : ''}`}
                onClick={() => setActiveStaffCategory('All')}
                style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '13.5px' }}
              >
                All staff (19)
              </button>
              <button 
                className={`appt-tab-btn ${activeStaffCategory === 'Doctors' ? 'active' : ''}`}
                onClick={() => setActiveStaffCategory('Doctors')}
                style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '13.5px', border: '1px solid #E2E8F0', backgroundColor: activeStaffCategory === 'Doctors' ? '#2563EB' : '#FFFFFF', color: activeStaffCategory === 'Doctors' ? '#FFFFFF' : '#64748B' }}
              >
                Doctors (4)
              </button>
              <button 
                className={`appt-tab-btn ${activeStaffCategory === 'Receptionist' ? 'active' : ''}`}
                onClick={() => setActiveStaffCategory('Receptionist')}
                style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '13.5px', border: '1px solid #E2E8F0', backgroundColor: activeStaffCategory === 'Receptionist' ? '#2563EB' : '#FFFFFF', color: activeStaffCategory === 'Receptionist' ? '#FFFFFF' : '#64748B' }}
              >
                Receptionist (2)
              </button>
              <button 
                className={`appt-tab-btn ${activeStaffCategory === 'Others' ? 'active' : ''}`}
                onClick={() => setActiveStaffCategory('Others')}
                style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '13.5px', border: '1px solid #E2E8F0', backgroundColor: activeStaffCategory === 'Others' ? '#2563EB' : '#FFFFFF', color: activeStaffCategory === 'Others' ? '#FFFFFF' : '#64748B' }}
              >
                Others (13)
              </button>
            </div>

            {/* Roster list stack */}
            <div className="staff-cards-stack">
              {staff
                .filter(item => {
                  if (staffSearchQuery) {
                    const query = staffSearchQuery.toLowerCase();
                    return (
                      item.name.toLowerCase().includes(query) ||
                      item.role.toLowerCase().includes(query) ||
                      (item.dept && item.dept.toLowerCase().includes(query))
                    );
                  }
                  return true;
                })
                .filter(item => {
                  if (activeStaffCategory === 'Doctors') return item.role === 'doctor';
                  if (activeStaffCategory === 'Receptionist') return item.role === 'receptionist';
                  if (activeStaffCategory === 'Others') return item.role !== 'doctor' && item.role !== 'receptionist';
                  return true;
                })
                .map(item => {
                  const isAbsent = item.status === 'Absent Today';
                  return (
                    <div key={item.id || item._id} className={`staff-card-item ${isAbsent ? 'absent-styled' : ''}`}>
                      {/* Top header profile area */}
                      <div className="staff-card-header">
                        <div className={`staff-avatar-initials avatar-${item.avatarColor || 'blue'}`}>
                          {item.initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="staff-name-badges-row">
                            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: '0 8px 0 0' }}>{item.name}</h3>
                            {isAbsent ? (
                              <>
                                <span className="appt-status-badge" style={{ backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '11px', fontWeight: 800, borderRadius: '6px', padding: '3px 8px' }}>Absent Today</span>
                                <span className="appt-status-badge" style={{ backgroundColor: '#E6FFFA', color: '#047481', fontSize: '11px', fontWeight: 800, borderRadius: '6px', padding: '3px 8px' }}>RECEPTIONIST</span>
                              </>
                            ) : (
                              <>
                                <span className="appt-status-badge badge-success" style={{ fontSize: '11px', fontWeight: 800, borderRadius: '6px', padding: '3px 8px' }}>Active</span>
                                <span className="appt-status-badge" style={{ backgroundColor: '#F3E8FF', color: '#6B21A8', fontSize: '11px', fontWeight: 800, borderRadius: '6px', padding: '3px 8px' }}>{item.role.toUpperCase()}</span>
                                {item.dept && (
                                  <span className="appt-status-badge" style={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontSize: '11px', fontWeight: 800, borderRadius: '6px', padding: '3px 8px' }}>{item.dept.toUpperCase()}</span>
                                )}
                              </>
                            )}
                          </div>
                          <p style={{ color: '#64748B', fontSize: '13.5px', fontWeight: 600, margin: '6px 0 0 0' }}>
                            {item.role === 'doctor' ? 'Doctor' : 'Staff'} • {item.dept || 'Administration'} • Joined {item.joined || 'Recently'}
                          </p>
                        </div>
                      </div>

                      {/* Detail Widgets (Only for non-absent active staff) */}
                      {!isAbsent && (
                        <div className="staff-meta-widgets">
                          <div className="staff-meta-widget-item">
                            <div className="staff-meta-widget-lbl">Patients Today</div>
                            <div className="staff-meta-widget-val">{item.patientsToday || '0'}</div>
                          </div>
                          <div className="staff-meta-widget-item">
                            <div className="staff-meta-widget-lbl">Last Login</div>
                            <div className="staff-meta-widget-val" style={{ color: '#10B981' }}>{item.lastLogin || 'Today 9AM'}</div>
                          </div>
                          <div className="staff-meta-widget-item">
                            <div className="staff-meta-widget-lbl">Working Days</div>
                            <div className="staff-meta-widget-val">{item.workingDays || 'Mon-Sat'}</div>
                          </div>
                          <div className="staff-meta-widget-item">
                            <div className="staff-meta-widget-lbl">Status</div>
                            <div className="staff-meta-widget-val" style={{ color: '#10B981' }}>{item.status || 'On duty'}</div>
                          </div>
                        </div>
                      )}

                      {/* Actions Footer */}
                      <div className="staff-actions-footer">
                        {isAbsent ? (
                          <>
                            <button 
                              className="staff-action-pill-btn arrange-btn"
                              onClick={() => {
                                alert(`Requesting scheduling cover for ${item.name}...`);
                                setSuccess(`Cover coverage scheduled for ${item.name}!`);
                                setTimeout(() => setSuccess(''), 3000);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><polyline points="20 6 9 17 4 12"/></svg>
                              Arrange cover
                            </button>
                            <button 
                              className="staff-action-pill-btn"
                              onClick={() => alert(`Staff Profile View:\nName: ${item.name}\nRole: ${item.role}\nDepartment: ${item.dept}`)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12.01" y1="16" y2="16"/><path d="M12 8a2 2 0 0 1 2 2c0 .991-.807 1.312-1.32 1.637C12.16 12.014 12 12.518 12 13"/></svg>
                              View
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="staff-action-pill-btn" onClick={() => alert(`Sending notification ping to ${item.name}...`)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                              Notify
                            </button>
                            <button className="staff-action-pill-btn" onClick={() => alert(`Staff Profile View:\nName: ${item.name}\nRole: ${item.role}\nDepartment: ${item.dept}`)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                              View profile
                            </button>
                            <button className="staff-action-pill-btn" onClick={() => alert(`Editing profile options for ${item.name}...`)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                              Edit
                            </button>
                            <button className="staff-action-pill-btn" onClick={() => alert(`Configuring custom EMR access tokens & credentials for ${item.name}...`)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                              Permissions
                            </button>
                            {item.role !== 'admin' && (
                              <button 
                                className="staff-action-pill-btn deactivate-btn"
                                onClick={() => {
                                  setSelectedStaffToRevoke({ id: item.id || item._id, name: item.name });
                                  setShowRevokeConfirm(true);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/></svg>
                                Deactivate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Load Remaining Staff button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', marginBottom: '16px' }}>
              <button 
                className="appt-tab-btn" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1.5px solid #E2E8F0', padding: '10px 24px', borderRadius: '100px', fontSize: '13.5px', fontWeight: 800, color: '#475569', backgroundColor: '#FFFFFF' }}
                onClick={() => alert('Loading 16 remaining staff accounts...')}
              >
                ••• Load all 16 remaining staff
              </button>
            </div>
          </div>
        )}

        {/* 6. Alerts & tasks Tab Content */}
        {activeTab === 'supply' && (
          <div className="admin-dashboard-content">
            {/* KPI STAT CARDS ROW */}
            <div className="admin-kpi-row">
              <div className="admin-kpi-card">
                <span className="kpi-card-header">Total Alerts</span>
                <span className="kpi-card-val red-val">{totalAlertsCount}</span>
                <span className="kpi-card-sub">
                  <span className="kpi-card-highlight">{criticalAlerts.length} critical</span> - {warningAlerts.length} warnings
                </span>
                <div className="kpi-icon-overlay">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                </div>
              </div>

              <div className="admin-kpi-card">
                <span className="kpi-card-header">Oldest Unresolved</span>
                <span className="kpi-card-val orange-val">
                  {criticalAlerts.length > 0 ? "3d" : "0d"}
                </span>
                <span className="kpi-card-sub">Medicine reorder</span>
              </div>

              <div className="admin-kpi-card">
                <span className="kpi-card-header">Resolved This Week</span>
                <span className="kpi-card-val green-val">{resolvedCount}</span>
                <span className="kpi-card-sub">By admin</span>
              </div>
            </div>

            {/* CRITICAL ALERTS SECTION */}
            <div className="approval-category-header">Critical</div>
            <div className="alerts-modern-stack" style={{ marginBottom: '32px' }}>
              {criticalAlerts.map(alert => (
                <div className="alert-card-modern critical-style animate-in" key={alert.id}>
                  <div className="alert-card-left-part">
                    <div className="alert-badge-icon-holder">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v8L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45L14 10V2z"/><path d="M6 2h12"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>
                    </div>
                    <div className="alert-card-texts">
                      <span className="alert-card-main-title">{alert.title}</span>
                      <span className="alert-card-subtext">{alert.subtext}</span>
                    </div>
                  </div>
                  <div className="alert-card-right-part">
                    <span className="alert-badge-pill">Critical</span>
                    <button 
                      className="alerts-action-outline-btn"
                      onClick={() => resolveCriticalAlert(alert.id, alert.title, alert.rawItem)}
                    >
                      Resolve →
                    </button>
                  </div>
                </div>
              ))}
              {criticalAlerts.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontWeight: 600, background: '#FFFFFF', borderRadius: '12px', border: '1px dashed #E2E8F0' }}>
                  No active critical warnings!
                </div>
              )}
            </div>

            {/* WARNINGS ALERTS SECTION */}
            <div className="approval-category-header">Warnings</div>
            <div className="alerts-modern-stack">
              {warningAlerts.map((alert, index) => (
                <div 
                  className="alert-card-modern warning-style animate-in" 
                  key={alert.id}
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  <div className="alert-card-left-part">
                    <div className="alert-badge-icon-holder">
                      {alert.actionText === 'Generate' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                      )}
                      {alert.actionText === 'Flag' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v8L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45L14 10V2z"/><path d="M6 2h12"/><path d="M8.5 2h7"/></svg>
                      )}
                      {alert.actionText === 'Assign' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg>
                      )}
                    </div>
                    <div className="alert-card-texts">
                      <span className="alert-card-main-title">{alert.title}</span>
                      <span className="alert-card-subtext">{alert.subtext}</span>
                    </div>
                  </div>
                  <div className="alert-card-right-part">
                    <span className="alert-badge-pill">Warning</span>
                    <button 
                      className="alerts-action-outline-btn"
                      onClick={() => resolveWarningAlert(alert.id, alert.title, alert.actionText)}
                    >
                      {alert.actionText}
                    </button>
                  </div>
                </div>
              ))}
              {warningAlerts.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontWeight: 600, background: '#FFFFFF', borderRadius: '12px', border: '1px dashed #E2E8F0' }}>
                  No warnings active!
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Approvals Tab Content (Identical to latest mockup) */}
        {activeTab === 'approvals' && (
          <div className="admin-dashboard-content">
            {/* KPI STAT CARDS */}
            <div className="admin-kpi-row">
              <div className="admin-kpi-card">
                <span className="kpi-card-header">Pending Approvals</span>
                <span className="kpi-card-val">{approvalsCount}</span>
                <span className="kpi-card-sub">Across all categories</span>
              </div>

              <div className="admin-kpi-card">
                <span className="kpi-card-header">Approved Today</span>
                <span className="kpi-card-val green-val">{approvedTodayCount}</span>
                <span className="kpi-card-sub">By admin</span>
              </div>

              <div className="admin-kpi-card">
                <span className="kpi-card-header">Rejected</span>
                <span className="kpi-card-val red-val">{rejectedThisWeekCount}</span>
                <span className="kpi-card-sub">This week</span>
              </div>
            </div>

            {/* Inner Subtabs selector */}
            <div className="approvals-subtab-bar">
              <button 
                className={`approvals-subtab-btn ${approvalsSubTab === 'reorder' ? 'active' : 'inactive'}`}
                onClick={() => setApprovalsSubTab('reorder')}
              >
                Reorder requests ({reorderCount})
              </button>
              <button 
                className={`approvals-subtab-btn ${approvalsSubTab === 'leave' ? 'active' : 'inactive'}`}
                onClick={() => setApprovalsSubTab('leave')}
              >
                Leave approvals ({leaveCount})
              </button>
              <button 
                className={`approvals-subtab-btn ${approvalsSubTab === 'billing' ? 'active' : 'inactive'}`}
                onClick={() => setApprovalsSubTab('billing')}
              >
                Billing ({billingCount})
              </button>
            </div>

            {/* Reorder subtab list matching screenshot exactly */}
            {approvalsSubTab === 'reorder' && (
              <div>
                {/* 1. APPROVAL REQUEST BY RECEPTIONIST */}
                <div className="approval-category-header">Approval Request by Receptionist</div>
                {pendingApprovals.filter(x => x.id === 'app-reorder-1').map(item => (
                  <div className="approval-board-card-full animate-in" key={item.id}>
                    <div className="approval-card-hdr-row">
                      <h3 className="approval-card-title">{item.title}</h3>
                      <span className="badge-pill-state pending">{item.status}</span>
                    </div>
                    <div className="approval-card-metadata">{item.raisedBy}</div>
                    
                    {/* Nested medicines block */}
                    <div className="approval-card-pills-container">
                      <span>{item.medicines.join(' • ')}</span>
                    </div>

                    <div className="approval-actions-footer">
                      <button 
                        className="approval-action-btn-green"
                        onClick={() => approveApprovalItem(item.id, item.title)}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        className="approval-action-btn-red"
                        onClick={() => rejectApprovalItem(item.id, item.title)}
                      >
                        ✕ Reject
                      </button>
                      <button 
                        className="approval-action-btn-blue-outline"
                        onClick={() => setSuccess(`Viewing full details for ${item.title}`)}
                      >
                        👁 View details
                      </button>
                    </div>
                  </div>
                ))}

                {/* 2 & 3. Split row cards: Pharmacy Reorder & Lab Reagent */}
                <div className="approvals-split-row">
                  <div>
                    <div className="approval-category-header">Approval Request by Pharmacy</div>
                    {pendingApprovals.filter(x => x.id === 'app-reorder-2').map(item => (
                      <div className="approval-board-card-full animate-in" key={item.id} style={{ margin: 0 }}>
                        <div className="approval-card-hdr-row">
                          <h3 className="approval-card-title">{item.title}</h3>
                          <span className="badge-pill-state pending">{item.status}</span>
                        </div>
                        <div className="approval-card-metadata" style={{ minHeight: '38px' }}>{item.raisedBy}</div>
                        
                        <div className="approval-actions-footer" style={{ marginTop: '24px' }}>
                          <button 
                            className="approval-action-btn-green"
                            onClick={() => approveApprovalItem(item.id, item.title)}
                          >
                            ✓ Approve
                          </button>
                          <button 
                            className="approval-action-btn-red"
                            onClick={() => rejectApprovalItem(item.id, item.title)}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingApprovals.filter(x => x.id === 'app-reorder-2').length === 0 && (
                      <div style={{ padding: '24px', textAlign: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', color: '#64748B', fontWeight: 600 }}>
                        No pending pharmacy reorder.
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="approval-category-header">Lab Technician Requests</div>
                    {pendingApprovals.filter(x => x.id === 'app-reorder-3').map(item => (
                      <div className="approval-board-card-full queued-accent animate-in" key={item.id} style={{ margin: 0 }}>
                        <div className="approval-card-hdr-row">
                          <h3 className="approval-card-title">{item.title}</h3>
                          <span className="badge-pill-state queued">{item.status}</span>
                        </div>
                        <div className="approval-card-metadata" style={{ minHeight: '38px' }}>{item.raisedBy}</div>
                        
                        <div className="approval-actions-footer" style={{ marginTop: '24px' }}>
                          <button 
                            className="approval-action-btn-green"
                            onClick={() => approveApprovalItem(item.id, item.title)}
                          >
                            ✓ Approve
                          </button>
                          <button 
                            className="approval-action-btn-red"
                            onClick={() => rejectApprovalItem(item.id, item.title)}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingApprovals.filter(x => x.id === 'app-reorder-3').length === 0 && (
                      <div style={{ padding: '24px', textAlign: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', color: '#64748B', fontWeight: 600 }}>
                        No queued lab reagent requests.
                      </div>
                    )}
                  </div>
                </div>

                {reorderCount === 0 && (
                  <div style={{ padding: '48px 0', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
                    All reorder requests have been successfully approved or resolved!
                  </div>
                )}
              </div>
            )}

            {/* Leave subtab list */}
            {approvalsSubTab === 'leave' && (
              <div>
                <div className="approval-category-header">Leave Approvals Ledger</div>
                {pendingApprovals.filter(x => x.category === 'leave').map(item => (
                  <div className="approval-board-card-full animate-in" key={item.id}>
                    <div className="approval-card-hdr-row">
                      <h3 className="approval-card-title">{item.title}</h3>
                      <span className="badge-pill-state pending">{item.status}</span>
                    </div>
                    <div className="approval-card-metadata">{item.raisedBy}</div>
                    
                    <div style={{ color: '#475569', fontSize: '13.5px', fontWeight: 600, marginBottom: '20px' }}>
                      {item.details}
                    </div>

                    <div className="approval-actions-footer">
                      <button 
                        className="approval-action-btn-green"
                        onClick={() => approveApprovalItem(item.id, item.title)}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        className="approval-action-btn-red"
                        onClick={() => rejectApprovalItem(item.id, item.title)}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
                {leaveCount === 0 && (
                  <div style={{ padding: '48px 0', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
                    No pending leave requests.
                  </div>
                )}
              </div>
            )}

            {/* Billing subtab list */}
            {approvalsSubTab === 'billing' && (
              <div>
                <div className="approval-category-header">Billing Clearance requests</div>
                {pendingApprovals.filter(x => x.category === 'billing').map(item => (
                  <div className="approval-board-card-full animate-in" key={item.id}>
                    <div className="approval-card-hdr-row">
                      <h3 className="approval-card-title">{item.title}</h3>
                      <span className="badge-pill-state pending">{item.status}</span>
                    </div>
                    <div className="approval-card-metadata">{item.raisedBy}</div>
                    
                    <div style={{ color: '#475569', fontSize: '13.5px', fontWeight: 600, marginBottom: '20px' }}>
                      {item.details}
                    </div>

                    <div className="approval-actions-footer">
                      <button 
                        className="approval-action-btn-green"
                        onClick={() => approveApprovalItem(item.id, item.title)}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        className="approval-action-btn-red"
                        onClick={() => rejectApprovalItem(item.id, item.title)}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
                {billingCount === 0 && (
                  <div style={{ padding: '48px 0', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
                    No pending billing clearances.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 8. Financials Content */}
        {activeTab === 'financials' && (
          <div className="admin-dashboard-content" style={{ animation: 'slideUp 0.4s ease-out' }}>
            
            {/* KPI Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {/* Card 1: Revenue Today */}
              <div className="dashboard-widget-card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue Today</span>
                <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', margin: '8px 0', fontFamily: "'Outfit', sans-serif" }}>₹42,800</h2>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ↑ <span style={{ color: '#64748B', fontWeight: 600 }}>7.8% vs yesterday</span>
                </span>
              </div>

              {/* Card 2: This Month */}
              <div className="dashboard-widget-card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>This Month</span>
                <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', margin: '8px 0', fontFamily: "'Outfit', sans-serif" }}>₹8,34,000</h2>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>May 2026</span>
              </div>

              {/* Card 3: From Consultations */}
              <div className="dashboard-widget-card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>From Consultations</span>
                <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', margin: '8px 0', fontFamily: "'Outfit', sans-serif" }}>2.6%</h2>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Share from OPD</span>
              </div>

              {/* Card 4: Pending Collections */}
              <div className="dashboard-widget-card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Collections</span>
                <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#D97706', margin: '8px 0', fontFamily: "'Outfit', sans-serif" }}>₹12,400</h2>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>7 patients</span>
              </div>
            </div>

            {/* Main Graphs & Breakdown Grid */}
            <div className="revenue-grid">
              {/* Left Widget: Monthly Revenue Chart */}
              <div className="dashboard-widget-card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Monthly revenue — last 6 months</h3>
                </div>

                {/* Vertical Bar Chart Canvas */}
                <div style={{ 
                  height: '240px', 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  justifyContent: 'space-between', 
                  padding: '0 24px',
                  marginBottom: '24px',
                  borderBottom: '1.5px solid #F1F5F9',
                  paddingBottom: '12px'
                }}>
                  {/* Dec Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%' }}>
                    <div style={{ 
                      height: '110px', 
                      width: '100%', 
                      background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.03) 100%)', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'flex-end', 
                      overflow: 'hidden',
                      border: '1.5px solid rgba(37, 99, 235, 0.1)',
                      borderBottom: 'none'
                    }}>
                      <div style={{ height: '8px', width: '100%', background: '#2563EB', borderRadius: '0 0 6px 6px' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginTop: '12px' }}>Dec</span>
                  </div>

                  {/* Jan Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%' }}>
                    <div style={{ 
                      height: '160px', 
                      width: '100%', 
                      background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.03) 100%)', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'flex-end', 
                      overflow: 'hidden',
                      border: '1.5px solid rgba(37, 99, 235, 0.1)',
                      borderBottom: 'none'
                    }}>
                      <div style={{ height: '8px', width: '100%', background: '#2563EB', borderRadius: '0 0 6px 6px' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginTop: '12px' }}>Jan</span>
                  </div>

                  {/* Feb Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%' }}>
                    <div style={{ 
                      height: '80px', 
                      width: '100%', 
                      background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.03) 100%)', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'flex-end', 
                      overflow: 'hidden',
                      border: '1.5px solid rgba(37, 99, 235, 0.1)',
                      borderBottom: 'none'
                    }}>
                      <div style={{ height: '8px', width: '100%', background: '#2563EB', borderRadius: '0 0 6px 6px' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginTop: '12px' }}>Feb</span>
                  </div>

                  {/* Mar Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%' }}>
                    <div style={{ 
                      height: '190px', 
                      width: '100%', 
                      background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.03) 100%)', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'flex-end', 
                      overflow: 'hidden',
                      border: '1.5px solid rgba(37, 99, 235, 0.1)',
                      borderBottom: 'none'
                    }}>
                      <div style={{ height: '8px', width: '100%', background: '#2563EB', borderRadius: '0 0 6px 6px' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginTop: '12px' }}>Mar</span>
                  </div>

                  {/* Apr Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%' }}>
                    <div style={{ 
                      height: '115px', 
                      width: '100%', 
                      background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.03) 100%)', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'flex-end', 
                      overflow: 'hidden',
                      border: '1.5px solid rgba(37, 99, 235, 0.1)',
                      borderBottom: 'none'
                    }}>
                      <div style={{ height: '8px', width: '100%', background: '#2563EB', borderRadius: '0 0 6px 6px' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginTop: '12px' }}>Apr</span>
                  </div>

                  {/* May Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%' }}>
                    <div style={{ 
                      height: '190px', 
                      width: '100%', 
                      background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.03) 100%)', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'flex-end', 
                      overflow: 'hidden',
                      border: '1.5px solid rgba(37, 99, 235, 0.1)',
                      borderBottom: 'none'
                    }}>
                      <div style={{ height: '8px', width: '100%', background: '#2563EB', borderRadius: '0 0 6px 6px' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginTop: '12px' }}>May</span>
                  </div>
                </div>

                {/* Avg & Best stats block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>Avg monthly revenue</span>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>₹7,80,000</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>Best month (Mar)</span>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#10B981', fontFamily: "'Outfit', sans-serif" }}>₹9,12,000</span>
                  </div>
                </div>
              </div>

              {/* Right Widget: Revenue Breakdown List */}
              <div className="dashboard-widget-card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Revenue breakdown</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Row 1 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1.5px solid #F1F5F9' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>OPD consultations</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>₹24,000</span>
                    </div>
                    {/* Row 2 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1.5px solid #F1F5F9' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Lab tests</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>₹11,200</span>
                    </div>
                    {/* Row 3 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1.5px solid #F1F5F9' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Pharmacy</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>₹6,800</span>
                    </div>
                    {/* Row 4 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1.5px solid #F1F5F9' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Procedures</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>₹800</span>
                    </div>
                    {/* Row 5 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0 8px 0' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Pending collections</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#F59E0B', fontFamily: "'Outfit', sans-serif" }}>₹12,400</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
        {/* 7. Appointments Content Tab matching mockup exactly */}
        {activeTab === 'appointments' && (
          <div className="admin-dashboard-content">
            {/* KPI Cards Row */}
            <div className="appt-stats-row">
              <div className="dashboard-widget-card" style={{ padding: '24px' }}>
                <span className="appt-kpi-header">Booked Today</span>
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px' }}>
                  <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: 0 }}>28</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, marginTop: '8px', marginBottom: 0 }}>12 pending</p>
              </div>

              <div className="dashboard-widget-card" style={{ padding: '24px' }}>
                <span className="appt-kpi-header">Completed</span>
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px' }}>
                  <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: 0 }}>16</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, marginTop: '8px', marginBottom: 0 }}>As of now</p>
              </div>

              <div className="dashboard-widget-card" style={{ padding: '24px' }}>
                <span className="appt-kpi-header">Walk-Ins</span>
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px' }}>
                  <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: 0 }}>4</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, marginTop: '8px', marginBottom: 0 }}>Today</p>
              </div>

              <div className="dashboard-widget-card" style={{ padding: '24px' }}>
                <span className="appt-kpi-header">Cancelled</span>
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px' }}>
                  <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#EF4444', margin: 0 }}>1</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, marginTop: '8px', marginBottom: 0 }}>Rescheduled</p>
              </div>
            </div>

            {/* Appointment Overview Container */}
            <div className="dashboard-widget-card" style={{ padding: '28px', borderRadius: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '24px' }}>Appointment Overview</h2>

              {/* Table Filter Actions Row */}
              <div className="appt-table-filter-bar">
                {/* Left Tabs */}
                <div className="appt-segmented-tabs">
                  <button 
                    className={`appt-tab-btn ${activeApptFilter === 'All' ? 'active' : ''}`}
                    onClick={() => setActiveApptFilter('All')}
                  >
                    All (28)
                  </button>
                  <button 
                    className={`appt-tab-btn ${activeApptFilter === 'Waiting' ? 'active' : ''}`}
                    onClick={() => setActiveApptFilter('Waiting')}
                  >
                    Waiting (12)
                  </button>
                  <button 
                    className={`appt-tab-btn ${activeApptFilter === 'Completed' ? 'active' : ''}`}
                    onClick={() => setActiveApptFilter('Completed')}
                  >
                    Completed (16)
                  </button>
                  <button 
                    className={`appt-tab-btn ${activeApptFilter === 'Cancelled' ? 'active' : ''}`}
                    onClick={() => setActiveApptFilter('Cancelled')}
                  >
                    Cancelled (1)
                  </button>
                </div>

                {/* Right Side Controls */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* Search box */}
                  <div style={{ position: 'relative' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
                    <input 
                      type="text" 
                      className="appt-search-input" 
                      placeholder="Search patient, doctor, token..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Dropdown Select */}
                  <div style={{ position: 'relative' }}>
                    <select 
                      className="appt-select-filter"
                      value={selectedDoctorFilter}
                      onChange={e => setSelectedDoctorFilter(e.target.value)}
                    >
                      <option value="All">All doctors</option>
                      <option value="Dr. Anjali">Dr. Anjali</option>
                      <option value="Dr. Rajan">Dr. Rajan</option>
                      <option value="Dr. Mehta">Dr. Mehta</option>
                    </select>
                    <div className="appt-select-arrow">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>

                  {/* + New appointment button */}
                  <button 
                    className="appt-new-btn"
                    onClick={() => setShowNewApptModal(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                    New appointment
                  </button>
                </div>
              </div>

              {/* Roster Table */}
              <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table className="appt-roster-table">
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>TIME</th>
                      <th>PATIENT</th>
                      <th>DOCTOR</th>
                      <th>DEPT</th>
                      <th style={{ width: '160px' }}>STATUS</th>
                      <th style={{ width: '220px', textAlign: 'right' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments
                      .filter(item => {
                        // Apply tab selection filters
                        if (activeApptFilter === 'Waiting' && item.status !== 'IN QUEUE') return false;
                        if (activeApptFilter === 'Completed' && item.status !== 'COMPLETED') return false;
                        if (activeApptFilter === 'Cancelled' && item.status !== 'CANCELLED') return false;
                        
                        // Apply doctor filter
                        if (selectedDoctorFilter !== 'All' && item.doctor !== selectedDoctorFilter) return false;

                        // Apply search filter
                        if (searchQuery) {
                          const query = searchQuery.toLowerCase();
                          return (
                            item.patientName.toLowerCase().includes(query) ||
                            item.patientId.toLowerCase().includes(query) ||
                            item.doctor.toLowerCase().includes(query) ||
                            item.dept.toLowerCase().includes(query)
                          );
                        }
                        return true;
                      })
                      .map(item => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700, color: '#1E293B' }}>{item.time}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, color: '#0F172A' }}>{item.patientName}</span>
                              <span className="appt-patient-id-badge">{item.patientId}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: '#475569' }}>{item.doctor}</td>
                          <td style={{ fontWeight: 600, color: '#475569' }}>{item.dept}</td>
                          <td>
                            {item.status === 'COMPLETED' && (
                              <span className="appt-status-badge badge-success">Completed</span>
                            )}
                            {item.status === 'IN QUEUE' && (
                              <span className="appt-status-badge badge-warning">In Queue</span>
                            )}
                            {item.status === 'SCHEDULED' && (
                              <span className="appt-status-badge badge-info">Scheduled</span>
                            )}
                            {item.status === 'CANCELLED' && (
                              <span className="appt-status-badge badge-danger">Cancelled</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              {item.status === 'COMPLETED' && (
                                <button className="appt-action-outline-btn" onClick={() => alert(`Viewing details for ${item.patientName}`)}>View</button>
                              )}
                              {item.status === 'IN QUEUE' && (
                                <button className="appt-action-outline-btn" onClick={() => handleManageAppt(item.id)}>Manage</button>
                              )}
                              {item.status === 'SCHEDULED' && item.patientName === 'Sunita Devi' && (
                                <>
                                  <button className="appt-action-outline-btn" onClick={() => handleRescheduleAppt(item.id)}>Reschedule</button>
                                  <button className="appt-action-outline-btn-red" onClick={() => handleCancelAppt(item.id)}>Cancel</button>
                                </>
                              )}
                              {item.status === 'SCHEDULED' && item.patientName !== 'Sunita Devi' && (
                                <button className="appt-action-outline-btn" onClick={() => alert(`Viewing scheduled details for ${item.patientName}`)}>View</button>
                              )}
                              {item.status === 'CANCELLED' && (
                                <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 600, paddingRight: '12px' }}>Cancelled</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 8. Patients Content Tab matching mockup exactly */}
        {activeTab === 'patients' && (
          <div className="admin-dashboard-content">
            {/* KPI Cards Row */}
            <div className="pat-stats-row">
              <div className="dashboard-widget-card" style={{ padding: '24px' }}>
                <span className="appt-kpi-header">Total Patients</span>
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px' }}>
                  <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: 0 }}>2,340</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, marginTop: '8px', marginBottom: 0 }}>Registered in system</p>
              </div>

              <div className="dashboard-widget-card" style={{ padding: '24px' }}>
                <span className="appt-kpi-header">New This Month</span>
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px' }}>
                  <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: 0 }}>87</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, marginTop: '8px', marginBottom: 0 }}>Registered May 2026</p>
              </div>

              <div className="dashboard-widget-card" style={{ padding: '24px' }}>
                <span className="appt-kpi-header">Follow-Up Due</span>
                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px' }}>
                  <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#D97706', margin: 0 }}>14</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, marginTop: '8px', marginBottom: 0 }}>This week</p>
              </div>
            </div>

            {/* Roster & Search Bar */}
            <div className="pat-search-register-bar">
              {/* Search Field */}
              <div className="pat-search-input-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pat-search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
                <input 
                  type="text" 
                  className="pat-search-input" 
                  placeholder="Search by name, phone, patient ID..."
                  value={patientSearchQuery}
                  onChange={e => setPatientSearchQuery(e.target.value)}
                />
              </div>

              {/* + Register patient Button */}
              <button 
                className="pat-register-btn"
                onClick={() => setShowNewPatientModal(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                Register patient
              </button>
            </div>

            {/* Registry Card */}
            <div className="dashboard-widget-card" style={{ padding: '0px', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="pat-roster-table">
                  <thead>
                    <tr>
                      <th style={{ width: '150px' }}>PATIENT ID</th>
                      <th>NAME</th>
                      <th>AGE / GENDER</th>
                      <th>LAST VISIT</th>
                      <th>DOCTOR</th>
                      <th style={{ width: '180px', textAlign: 'right', paddingRight: '32px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients
                      .filter(item => {
                        if (patientSearchQuery) {
                          const query = patientSearchQuery.toLowerCase();
                          return (
                            item.name.toLowerCase().includes(query) ||
                            item.patientId.toLowerCase().includes(query) ||
                            item.ageGender.toLowerCase().includes(query) ||
                            item.doctor.toLowerCase().includes(query)
                          );
                        }
                        return true;
                      })
                      .map(item => (
                        <tr key={item.id}>
                          <td className="pat-id-text">{item.patientId}</td>
                          <td className="pat-name-text">{item.name}</td>
                          <td style={{ fontWeight: 600 }}>{item.ageGender}</td>
                          <td style={{ fontWeight: 600 }}>{item.lastVisit}</td>
                          <td style={{ fontWeight: 600 }}>{item.doctor}</td>
                          <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                className="appt-action-outline-btn"
                                onClick={() => alert(`Patient Roster File:\nName: ${item.name}\nID: ${item.patientId}\nAge/Gender: ${item.ageGender}\nAssigned: ${item.doctor}`)}
                              >
                                View
                              </button>
                              <button 
                                className="appt-action-outline-btn"
                                onClick={() => {
                                  setEditingPatient({ ...item });
                                  setShowEditPatientModal(true);
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 9. Fallback for placeholder clicks to keep UI functional */}
        {['subscription', 'maintenance', 'updates'].includes(activeTab) && (
          <div className="admin-dashboard-content">
            <div className="dashboard-widget-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.8 }}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Security Scoped Module</h2>
              <p style={{ color: '#64748B', fontWeight: 600, fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px' }}>
                The <span style={{ textTransform: 'capitalize', color: '#2563EB' }}>{activeTab}</span> dashboard operates under advanced regulatory compliance. Fully operational.
              </p>
              <button className="widget-header-action-btn" onClick={() => setActiveTab('dashboard')}>Back to main overview</button>
            </div>
          </div>
        )}

        {/* 11. Role Coverage / Permissions Management */}
        {activeTab === 'permissions' && (() => {
          const selectedStaff = staff.find(s => s.id === pmSelectedStaffId || s.name === pmSelectedStaffId);
          
          // Compute system active overrides list
          const activeOverridesList = [];
          Object.keys(pmState || {}).forEach(staffName => {
            Object.keys(pmState[staffName] || {}).forEach(permId => {
              const over = pmState[staffName][permId];
              if (over?.on) {
                const matchingPerm = pmModules.find(m => m.id === permId);
                activeOverridesList.push({
                  staffName,
                  permId,
                  permName: matchingPerm?.name || permId,
                  type: over.type,
                  expiresIn: over.expiresIn,
                  note: over.note
                });
              }
            });
          });

          // Direct revoke function
          const handleDirectRevoke = (staffName, permId) => {
            const nextState = { ...pmState };
            if (nextState[staffName]) {
              nextState[staffName] = { ...nextState[staffName] };
              delete nextState[staffName][permId];
            }
            localStorage.setItem('medicore_pmState', JSON.stringify(nextState));
            setPmState(nextState);

            api.post('/auth/role-coverage', { state: nextState })
              .catch(err => console.error('Failed to sync direct revoke to backend', err));

            // Audit log
            const newAuditLog = {
              id: `pm-audit-${Date.now()}`,
              title: `Role coverage revoked for ${staffName}`,
              category: 'Staff management',
              tag: 'Staff',
              subtext: `Permission [${permId}] revoked immediately by admin. · Just now`,
              type: 'STAFF',
              hasReview: false
            };
            setAuditLogs(prev => [newAuditLog, ...prev]);
            setSuccess(`Revoked permission [${permId}] for ${staffName} successfully!`);
            setTimeout(() => setSuccess(''), 3000);
          };

          const pendingCount = Object.keys(pmPendingChanges).length;

          const handleApplyPendingChanges = () => {
            if (!pmReason) return;
            const nextState = { ...pmState };
            
            Object.keys(pmPendingChanges).forEach(permId => {
              const change = pmPendingChanges[permId];
              if (!nextState[selectedStaff.name]) {
                nextState[selectedStaff.name] = {};
              } else {
                nextState[selectedStaff.name] = { ...nextState[selectedStaff.name] };
              }

              if (change.on) {
                nextState[selectedStaff.name][permId] = {
                  on: true,
                  type: change.type,
                  expiresIn: change.type === 'temp' ? change.expiresIn : null,
                  note: pmReason
                };
              } else {
                delete nextState[selectedStaff.name][permId];
              }
            });

            localStorage.setItem('medicore_pmState', JSON.stringify(nextState));
            setPmState(nextState);

            api.post('/auth/role-coverage', { state: nextState })
              .catch(err => console.error('Failed to sync permission updates to backend', err));

            // Audit trail entry
            const newAuditLog = {
              id: `pm-audit-${Date.now()}`,
              title: `Role coverage updated — ${selectedStaff.name}`,
              category: 'Staff management',
              tag: 'Staff',
              subtext: `${pendingCount} permissions modified. Reason: ${pmReason} · By admin Kunal · Just now`,
              type: 'STAFF',
              hasReview: false
            };
            setAuditLogs(prev => [newAuditLog, ...prev]);

            setSuccess(`Permissions updated successfully for ${selectedStaff.name}!`);
            setTimeout(() => setSuccess(''), 3000);

            // Clear state
            setPmPendingChanges({});
            setPmReason('');
          };

          return (
            <div className="pm-container">
              {/* Left pane - Staff List Selector */}
              <div className="pm-staff-pane">
                <span className="pm-pane-title">Hospital Roster</span>
                <div className="pm-staff-list">
                  {staff.map(s => {
                    const isActive = pmSelectedStaffId === s.id || pmSelectedStaffId === s.name;
                    // Count active overrides for this staff
                    const overrideCount = Object.keys(pmState[s.name] || {}).filter(k => pmState[s.name][k]?.on).length;
                    
                    return (
                      <div 
                        key={s.id || s.name} 
                        className={`pm-staff-item ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          setPmSelectedStaffId(s.id || s.name);
                          setPmPendingChanges({});
                          setPmReason('');
                        }}
                      >
                        <div 
                          className="pm-staff-avatar"
                          style={{
                            backgroundColor: s.avatarColor === 'purple' ? '#FAF5FF' : s.avatarColor === 'gold' ? '#FFFBEB' : '#EFF6FF',
                            color: s.avatarColor === 'purple' ? '#7C3AED' : s.avatarColor === 'gold' ? '#D97706' : '#2563EB',
                            border: `1px solid ${s.avatarColor === 'purple' ? '#E9D5FF' : s.avatarColor === 'gold' ? '#FEF3C7' : '#BFDBFE'}`
                          }}
                        >
                          {s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="pm-staff-info">
                          <span className="pm-staff-name">{s.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="pm-staff-role">{s.role}</span>
                            {overrideCount > 0 && (
                              <span style={{ fontSize: '9px', background: '#FEF3C7', color: '#B45309', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                                {overrideCount} Overrides
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right pane - Permissions Grid Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="pm-detail-pane">
                  {selectedStaff ? (
                    <>
                      <div className="pm-editor-header">
                        <div>
                          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
                            Coverage Delegation Grid
                          </h2>
                          <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0, fontWeight: 600 }}>
                            Configure modules for <span style={{ color: '#2563EB', fontWeight: 750 }}>{selectedStaff.name}</span> ({selectedStaff.role} · {selectedStaff.dept})
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={{ fontSize: '11px', background: '#F1F5F9', padding: '6px 12px', borderRadius: '8px', color: '#475569', fontWeight: 700 }}>
                            Staff ID: #{selectedStaff.id}
                          </span>
                        </div>
                      </div>

                      {/* Render permission groupings */}
                      {Array.from(new Set(pmModules.map(m => m.group))).map(groupName => {
                        const groupPerms = pmModules.filter(m => m.group === groupName);
                        
                        return (
                          <div key={groupName} className="pm-group-box">
                            <div className="pm-group-title">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                              {groupName}
                            </div>
                            
                            {groupPerms.map(perm => {
                              const isCore = perm.coreFor.includes(selectedStaff.role);
                              const activeOverride = pmState[selectedStaff.name]?.[perm.id];
                              const pendingChange = pmPendingChanges[perm.id];
                              
                              // Compute active state
                              let activeState = false;
                              if (isCore) {
                                activeState = true;
                              } else if (pendingChange !== undefined) {
                                activeState = pendingChange.on;
                              } else {
                                activeState = activeOverride?.on === true;
                              }

                              return (
                                <div key={perm.id} className="pm-module-row animate-in">
                                  <div className="pm-module-main">
                                    <div className="pm-module-info">
                                      <div className="pm-module-name-row">
                                        <span className="pm-module-name">{perm.name}</span>
                                        {isCore && <span className="pm-badge core">Core</span>}
                                        {pendingChange !== undefined && (
                                          <span className="pm-badge pending">
                                            Pending {pendingChange.on ? 'Grant' : 'Revoke'}
                                          </span>
                                        )}
                                        {(!isCore && pendingChange === undefined && activeOverride?.on) && (
                                          <span className={`pm-badge ${activeOverride.type}`}>
                                            {activeOverride.type === 'temp' ? `Temp cover (${activeOverride.expiresIn})` : 'Perm supervisor'}
                                          </span>
                                        )}
                                      </div>
                                      <span className="pm-module-desc">{perm.desc}</span>
                                    </div>

                                    {/* Action Toggle Switch */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                      {(!isCore && pendingChange === undefined && activeOverride?.on) && (
                                        <button 
                                          className="pm-revoke-btn"
                                          onClick={() => handleDirectRevoke(selectedStaff.name, perm.id)}
                                        >
                                          Revoke Cover
                                        </button>
                                      )}
                                      
                                      <div 
                                        className={`pm-toggle-switch ${activeState ? 'active' : ''} ${isCore ? 'disabled' : ''}`}
                                        onClick={() => {
                                          if (isCore) return;
                                          const wasOn = activeOverride?.on || false;
                                          const currentOn = pendingChange !== undefined ? pendingChange.on : wasOn;
                                          const nextOn = !currentOn;
                                          
                                          setPmPendingChanges(prev => {
                                            const copy = { ...prev };
                                            if (nextOn === wasOn) {
                                              delete copy[perm.id];
                                            } else {
                                              copy[perm.id] = {
                                                on: nextOn,
                                                type: activeOverride?.type || 'temp',
                                                expiresIn: activeOverride?.expiresIn || 'Today midnight'
                                              };
                                            }
                                            return copy;
                                          });
                                        }}
                                      >
                                        <div className="pm-toggle-thumb" />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Render Duration / Interval Settings */}
                                  {(activeState && !isCore) && (
                                    <div className="pm-duration-bar">
                                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                                        Coverage Interval
                                      </span>
                                      
                                      <select
                                        className="pm-duration-select"
                                        value={pendingChange !== undefined ? pendingChange.type : (activeOverride?.type || 'temp')}
                                        onChange={(e) => {
                                          const nextType = e.target.value;
                                          const wasOn = activeOverride?.on || false;
                                          const currentOn = pendingChange !== undefined ? pendingChange.on : wasOn;
                                          
                                          setPmPendingChanges(prev => ({
                                            ...prev,
                                            [perm.id]: {
                                              on: currentOn,
                                              type: nextType,
                                              expiresIn: nextType === 'temp' ? 'Today midnight' : null
                                            }
                                          }));
                                        }}
                                      >
                                        <option value="temp">Temporary Override</option>
                                        <option value="perm">Permanent Supervisor</option>
                                      </select>

                                      {(pendingChange !== undefined ? pendingChange.type : (activeOverride?.type || 'temp')) === 'temp' && (
                                        <select
                                          className="pm-duration-select"
                                          value={pendingChange !== undefined ? pendingChange.expiresIn : (activeOverride?.expiresIn || 'Today midnight')}
                                          onChange={(e) => {
                                            const nextExpires = e.target.value;
                                            const wasOn = activeOverride?.on || false;
                                            const currentOn = pendingChange !== undefined ? pendingChange.on : wasOn;
                                            const currentType = pendingChange !== undefined ? pendingChange.type : (activeOverride?.type || 'temp');
                                            
                                            setPmPendingChanges(prev => ({
                                              ...prev,
                                              [perm.id]: {
                                                on: currentOn,
                                                type: currentType,
                                                expiresIn: nextExpires
                                              }
                                            }));
                                          }}
                                        >
                                          <option value="Today midnight">1 Day (Expires Today midnight)</option>
                                          <option value="3 days">3 Days (72 Hours)</option>
                                          <option value="7 days">7 Days (1 Week)</option>
                                          <option value="14 days">14 Days (2 Weeks)</option>
                                          <option value="30 days">30 Days (1 Month)</option>
                                        </select>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="pm-empty-state">
                      <div className="pm-empty-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', margin: '0 0 4px 0' }}>No Staff Selected</h3>
                      <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, fontWeight: 600 }}>Please choose a staff member from the roster to delegate roles.</p>
                    </div>
                  )}
                </div>

                {/* Active Overrides Ledger Widget */}
                <div className="pm-overrides-card animate-in">
                  <h3 className="pm-overrides-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    Hospital Active Coverage Overrides Ledger ({activeOverridesList.length})
                  </h3>
                  
                  {activeOverridesList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {activeOverridesList.map(item => (
                        <div key={`${item.staffName}-${item.permId}`} className="pm-override-row animate-in">
                          <div className="pm-override-info">
                            <span className="pm-override-staff">{item.staffName}</span>
                            <span className="pm-override-perm-name">
                              Delegated: <b>{item.permName}</b> (Code: {item.permId})
                            </span>
                            {item.note && (
                              <span className="pm-override-reason">Reason: "{item.note}"</span>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className={`pm-badge ${item.type}`}>
                              {item.type === 'temp' ? `Temp override (${item.expiresIn})` : 'Perm supervisor'}
                            </span>
                            <button 
                              className="pm-revoke-btn"
                              onClick={() => handleDirectRevoke(item.staffName, item.permId)}
                            >
                              Revoke Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B', fontWeight: 600, textAlign: 'center', padding: '20px 0' }}>
                      No active delegations in the system currently. All staff are operating under default role boundaries.
                    </p>
                  )}
                </div>
              </div>

              {/* Sticky bottom changes validation bar */}
              {pendingCount > 0 && (
                <div className="pm-sticky-footer">
                  <div className="pm-footer-left animate-in">
                    <span className="pm-footer-changes">
                      Pending Changes: {pendingCount} module{pendingCount > 1 ? 's' : ''} modified
                    </span>
                    <input 
                      type="text"
                      className="pm-reason-input"
                      placeholder="Mandatory reason for delegation (e.g. receptionist Sunita absent today)..."
                      value={pmReason}
                      onChange={e => setPmReason(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="pm-footer-actions">
                    <button 
                      className="pm-discard-btn"
                      onClick={() => {
                        setPmPendingChanges({});
                        setPmReason('');
                      }}
                    >
                      Discard
                    </button>
                    <button 
                      className="pm-apply-btn"
                      onClick={handleApplyPendingChanges}
                      disabled={!pmReason}
                    >
                      Apply & Log Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* 10. Audit Logs Content matching mockup exactly */}
        {activeTab === 'audit' && (() => {
          // Dynamic filtering logic based on user input and filter tabs
          const filteredLogs = auditLogs.filter(log => {
            const matchesSearch = 
              log.title.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
              log.subtext.toLowerCase().includes(auditSearchQuery.toLowerCase());
              
            const matchesCategory = 
              auditSelectedCategory === 'All' || 
              log.category === auditSelectedCategory;
              
            let matchesTag = true;
            if (auditSelectedTag !== 'All') {
              if (auditSelectedTag === 'High priority') {
                matchesTag = log.hasReview === true;
              } else {
                matchesTag = log.tag === auditSelectedTag;
              }
            }
            
            return matchesSearch && matchesCategory && matchesTag;
          });

          return (
            <div className="admin-dashboard-content" style={{ animation: 'slideUp 0.4s ease-out' }}>
              
              {/* KPI Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {/* Events Card */}
                <div className="dashboard-widget-card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Events Last 7 Days</span>
                  <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', margin: '8px 0', fontFamily: "'Outfit', sans-serif" }}>48</h2>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>System wide</span>
                </div>

                {/* Priority Flags Card */}
                <div className="dashboard-widget-card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>High-Priority Flags</span>
                  <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#D97706', margin: '8px 0', fontFamily: "'Outfit', sans-serif" }}>2</h2>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Needs review</span>
                </div>

                {/* Security Card */}
                <div className="dashboard-widget-card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Security Events</span>
                  <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#EF4444', margin: '8px 0', fontFamily: "'Outfit', sans-serif" }}>4</h2>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Login, device changes</span>
                </div>
              </div>

              {/* Search & Select Period Container */}
              <div className="search-filter-row">
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search logs — action, patient, staff, date..." 
                    style={{ width: '100%', height: '46px', paddingLeft: '44px', paddingRight: '16px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', fontWeight: 600, outline: 'none', background: 'white', transition: 'border-color 0.2s' }}
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  value={auditTimeRange} 
                  onChange={(e) => setAuditTimeRange(e.target.value)}
                  style={{ height: '46px', width: '180px', borderRadius: '10px', border: '1.5px solid #E2E8F0', padding: '0 12px', fontSize: '13px', fontWeight: 700, outline: 'none', background: 'white', color: '#475569', cursor: 'pointer' }}
                >
                  <option value="Last 7 days">Last 7 days</option>
                  <option value="Last 30 days">Last 30 days</option>
                  <option value="Today">Today</option>
                </select>
              </div>

              {/* Two Tier Category Buttons Filter */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[
                  { key: 'All', label: 'All (48)' },
                  { key: 'Staff management', label: 'Staff management (12)' },
                  { key: 'Patient data', label: 'Patient data (18)' },
                  { key: 'Billing', label: 'Billing (10)' },
                  { key: 'Security', label: 'Security (8)' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setAuditSelectedCategory(tab.key);
                      setAuditSelectedTag('All');
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: auditSelectedCategory === tab.key ? '#2563EB' : '#F1F5F9',
                      color: auditSelectedCategory === tab.key ? 'white' : '#475569'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Row 2 Tags Filter */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {[
                  { key: 'All', label: 'All' },
                  { key: 'Staff', label: 'Staff' },
                  { key: 'Patient', label: 'Patient' },
                  { key: 'Billing', label: 'Billing' },
                  { key: 'High priority', label: 'High priority' }
                ].map((subtab) => (
                  <button
                    key={subtab.key}
                    onClick={() => setAuditSelectedTag(subtab.key)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1.5px solid',
                      borderColor: auditSelectedTag === subtab.key ? '#2563EB' : '#E2E8F0',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: auditSelectedTag === subtab.key ? '#EFF6FF' : 'white',
                      color: auditSelectedTag === subtab.key ? '#2563EB' : '#64748B'
                    }}
                  >
                    {subtab.label}
                  </button>
                ))}
              </div>

              {/* Logs Roster List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    // Category Icon Styles
                    let iconBg = '#EFF6FF';
                    let iconColor = '#2563EB';
                    let iconSvg = null;

                    if (log.category === 'Staff management') {
                      iconBg = log.title.includes('deactivated') ? '#FFFBEB' : '#EFF6FF';
                      iconColor = log.title.includes('deactivated') ? '#D97706' : '#2563EB';
                      iconSvg = log.title.includes('deactivated') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      );
                    } else if (log.category === 'Patient data') {
                      iconBg = log.title.includes('deleted') ? '#FEF2F2' : '#FDF2F8';
                      iconColor = log.title.includes('deleted') ? '#EF4444' : '#DB2777';
                      iconSvg = log.title.includes('deleted') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      );
                    } else if (log.category === 'Billing') {
                      iconBg = '#ECFDF5';
                      iconColor = '#10B981';
                      iconSvg = (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/></svg>
                      );
                    } else if (log.category === 'Security') {
                      iconBg = '#FFF7ED';
                      iconColor = '#EA580C';
                      iconSvg = (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                      );
                    }

                    // Badge Styles
                    let badgeBg = '#EFF6FF';
                    let badgeColor = '#2563EB';
                    if (log.type === 'PATIENT DATA') {
                      badgeBg = '#FEF2F2';
                      badgeColor = '#EF4444';
                    } else if (log.type === 'BILLING') {
                      badgeBg = '#ECFDF5';
                      badgeColor = '#10B981';
                    } else if (log.type === 'SECURITY') {
                      badgeBg = '#FFF7ED';
                      badgeColor = '#EA580C';
                    }

                    return (
                      <div 
                        key={log.id} 
                        className="dashboard-widget-card log-item-card"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                          {/* Round Icon */}
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {iconSvg}
                          </div>
                          
                          {/* Log details */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{log.title}</span>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', display: 'block' }}>{log.subtext}</span>
                          </div>
                        </div>

                        {/* Badges & Actions */}
                        <div className="log-item-card-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '10px', 
                            fontWeight: 800, 
                            backgroundColor: badgeBg, 
                            color: badgeColor,
                            letterSpacing: '0.3px'
                          }}>
                            {log.type}
                          </span>
                          
                          {log.hasReview && (
                            <button 
                              style={{ 
                                padding: '6px 12px', 
                                border: '1.5px solid #E2E8F0', 
                                borderRadius: '8px', 
                                background: 'white', 
                                color: '#475569', 
                                fontSize: '11px', 
                                fontWeight: 700, 
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.background = '#F8FAFC'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = 'white'; }}
                              onClick={() => alert(`Reviewing action: "${log.title}"`)}
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="dashboard-widget-card" style={{ padding: '40px', textAlign: 'center', color: '#64748B', borderRadius: '16px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.5 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>No audit trails matches this filter criteria.</p>
                  </div>
                )}
              </div>

            </div>
          );
        })()}
      </div>

      {/* Pop-up Add Staff Modal Overlay */}
      {showAddStaffModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddStaffModal(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <span className="admin-modal-title">Add New Staff Account</span>
              <button className="admin-modal-close-btn" onClick={() => setShowAddStaffModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddStaff}>
              <div className="admin-input-group">
                <label className="admin-input-label">Full Name</label>
                <input 
                  type="text" 
                  className="admin-text-input" 
                  value={newStaff.name} 
                  onChange={e => setNewStaff({...newStaff, name: e.target.value})} 
                  placeholder="e.g. Dr. Jane Smith" 
                  required 
                />
              </div>
              <div className="admin-input-group">
                <label className="admin-input-label">Username (Staff ID)</label>
                <input 
                  type="text" 
                  className="admin-text-input" 
                  value={newStaff.staff_id} 
                  onChange={e => setNewStaff({...newStaff, staff_id: e.target.value})} 
                  placeholder="e.g. janesmith" 
                  required 
                />
              </div>
              <div className="admin-input-group">
                <label className="admin-input-label">Login Password</label>
                <input 
                  type="password" 
                  className="admin-text-input" 
                  value={newStaff.password} 
                  onChange={e => setNewStaff({...newStaff, password: e.target.value})} 
                  placeholder="••••••••" 
                  required 
                />
              </div>
              <div className="admin-input-group">
                <label className="admin-input-label">Access Role</label>
                <select 
                  className="admin-text-input" 
                  style={{ padding: '0 8px' }}
                  value={newStaff.role} 
                  onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                >
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="lab">Laboratory</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>
              
              {newStaff.role === 'doctor' && (
                <div className="admin-input-group animate-in">
                  <label className="admin-input-label">Daily Max Appointment Slots</label>
                  <input 
                    type="number" 
                    className="admin-text-input" 
                    min="1" 
                    max="100" 
                    value={newStaff.max_slots} 
                    onChange={e => setNewStaff({...newStaff, max_slots: Number(e.target.value)})} 
                    required 
                  />
                </div>
              )}

              <button type="submit" disabled={loading} className="admin-submit-btn">
                {loading ? 'Processing...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete/Revoke Confirmation Modal Overlay */}
      {showRevokeConfirm && (
        <div className="admin-modal-overlay" onClick={() => { setShowRevokeConfirm(false); setSelectedStaffToRevoke(null); }}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ border: '1px solid #FCA5A5' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              </div>
            </div>

            <h3 style={{ textAlign: 'center', margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Revoke Staff Access</h3>
            <p style={{ textAlign: 'center', margin: '0 0 24px 0', fontSize: '14px', color: '#64748B', lineHeight: '20px', fontWeight: 600 }}>
              Are you sure you want to permanently revoke access for <b style={{ color: '#0F172A' }}>{selectedStaffToRevoke?.name}</b>?<br />
              This account will be immediately deleted and lose all access.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="approval-act-btn" 
                style={{ flex: 1, height: '44px', border: '1px solid #CBD5E1', fontSize: '14px', borderRadius: '8px' }}
                onClick={() => {
                  setShowRevokeConfirm(false);
                  setSelectedStaffToRevoke(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="admin-submit-btn" 
                style={{ flex: 1, height: '44px', margin: 0, backgroundColor: '#EF4444', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                onClick={() => handleDeleteStaff(selectedStaffToRevoke?.id)}
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up New Appointment Modal Overlay */}
      {showNewApptModal && (
        <div className="admin-modal-overlay" onClick={() => setShowNewApptModal(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <span className="admin-modal-title">Schedule New Appointment</span>
              <button className="admin-modal-close-btn" onClick={() => setShowNewApptModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddNewAppt}>
              <div className="admin-input-group">
                <label className="admin-input-label">Patient Name</label>
                <input 
                  type="text" 
                  className="admin-text-input" 
                  value={newApptData.patientName} 
                  onChange={e => setNewApptData({...newApptData, patientName: e.target.value})} 
                  placeholder="e.g. Ramesh Kumar" 
                  required 
                />
              </div>
              <div className="admin-input-group">
                <label className="admin-input-label">Select Doctor</label>
                <select 
                  className="admin-text-input" 
                  value={newApptData.doctor}
                  onChange={e => {
                    const doc = e.target.value;
                    let dept = 'General';
                    if (doc === 'Dr. Rajan') dept = 'Ortho';
                    if (doc === 'Dr. Mehta') dept = 'Cardio';
                    setNewApptData({...newApptData, doctor: doc, dept: dept});
                  }}
                  required
                >
                  <option value="Dr. Anjali">Dr. Anjali (General)</option>
                  <option value="Dr. Rajan">Dr. Rajan (Ortho)</option>
                  <option value="Dr. Mehta">Dr. Mehta (Cardio)</option>
                </select>
              </div>
              <div className="admin-input-group">
                <label className="admin-input-label">Preferred Time slot</label>
                <input 
                  type="text" 
                  className="admin-text-input" 
                  value={newApptData.time} 
                  onChange={e => setNewApptData({...newApptData, time: e.target.value})} 
                  placeholder="e.g. 11:30" 
                  required 
                />
              </div>
              <button type="submit" className="admin-submit-btn" style={{ marginTop: '16px' }}>
                Schedule Appointment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pop-up Register New Patient Modal Overlay */}
      {showNewPatientModal && (
        <div className="admin-modal-overlay" onClick={() => setShowNewPatientModal(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <span className="admin-modal-title">Register New Patient Record</span>
              <button className="admin-modal-close-btn" onClick={() => setShowNewPatientModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddNewPatient}>
              <div className="admin-input-group">
                <label className="admin-input-label">Patient Name</label>
                <input 
                  type="text" 
                  className="admin-text-input" 
                  value={newPatientData.name} 
                  onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} 
                  placeholder="e.g. Ramesh Mehta" 
                  required 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="admin-input-group">
                  <label className="admin-input-label">Age</label>
                  <input 
                    type="number" 
                    className="admin-text-input" 
                    value={newPatientData.age} 
                    onChange={e => setNewPatientData({...newPatientData, age: e.target.value})} 
                    placeholder="e.g. 45" 
                    required 
                  />
                </div>
                <div className="admin-input-group">
                  <label className="admin-input-label">Gender</label>
                  <select 
                    className="admin-text-input" 
                    value={newPatientData.gender} 
                    onChange={e => setNewPatientData({...newPatientData, gender: e.target.value})} 
                    required
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="admin-input-group">
                <label className="admin-input-label">Assigned Consultant</label>
                <select 
                  className="admin-text-input" 
                  value={newPatientData.doctor}
                  onChange={e => setNewPatientData({...newPatientData, doctor: e.target.value})}
                  required
                >
                  <option value="Dr. Anjali">Dr. Anjali (General)</option>
                  <option value="Dr. Rajan">Dr. Rajan (Ortho)</option>
                  <option value="Dr. Mehta">Dr. Mehta (Cardio)</option>
                </select>
              </div>
              <button type="submit" className="admin-submit-btn" style={{ marginTop: '16px' }}>
                Register Patient Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pop-up Edit Patient Modal Overlay */}
      {showEditPatientModal && editingPatient && (
        <div className="admin-modal-overlay" onClick={() => { setShowEditPatientModal(false); setEditingPatient(null); }}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <span className="admin-modal-title">Edit Patient Record ({editingPatient.patientId})</span>
              <button className="admin-modal-close-btn" onClick={() => { setShowEditPatientModal(false); setEditingPatient(null); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleEditPatientSubmit}>
              <div className="admin-input-group">
                <label className="admin-input-label">Patient Name</label>
                <input 
                  type="text" 
                  className="admin-text-input" 
                  value={editingPatient.name} 
                  onChange={e => setEditingPatient({...editingPatient, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="admin-input-group">
                <label className="admin-input-label">Age & Gender (e.g. "34 M")</label>
                <input 
                  type="text" 
                  className="admin-text-input" 
                  value={editingPatient.ageGender} 
                  onChange={e => setEditingPatient({...editingPatient, ageGender: e.target.value})} 
                  required 
                />
              </div>
              <div className="admin-input-group">
                <label className="admin-input-label">Assigned Consultant</label>
                <select 
                  className="admin-text-input" 
                  value={editingPatient.doctor}
                  onChange={e => setEditingPatient({...editingPatient, doctor: e.target.value})}
                  required
                >
                  <option value="Dr. Anjali">Dr. Anjali (General)</option>
                  <option value="Dr. Rajan">Dr. Rajan (Ortho)</option>
                  <option value="Dr. Mehta">Dr. Mehta (Cardio)</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="approval-act-btn"
                  style={{ flex: 1, border: '1.5px solid #EF4444', color: '#EF4444' }}
                  onClick={() => {
                    deletePatient(editingPatient.id);
                    setShowEditPatientModal(false);
                    setEditingPatient(null);
                  }}
                >
                  Delete Record
                </button>
                <button 
                  type="submit" 
                  className="admin-submit-btn" 
                  style={{ flex: 2, margin: 0 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
