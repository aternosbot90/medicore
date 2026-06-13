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

const CoverageTimerBanner = ({ coverageState, setCoverageState }) => {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calculateTimeLeft = () => {
      const newTimeLeft = {};
      const now = new Date();
      let expiredAny = false;

      Object.keys(coverageState || {}).forEach(k => {
        const perm = coverageState[k];
        if (perm && perm.on && perm.type === 'temp' && perm.expiresAt) {
          const expires = new Date(perm.expiresAt);
          const diff = expires - now;
          if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            newTimeLeft[k] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          } else {
            expiredAny = true;
          }
        }
      });

      setTimeLeft(newTimeLeft);

      if (expiredAny && setCoverageState) {
        const updated = {};
        Object.keys(coverageState).forEach(k => {
          const perm = coverageState[k];
          if (perm && perm.on && perm.type === 'temp' && perm.expiresAt) {
            if (new Date(perm.expiresAt) > now) {
              updated[k] = perm;
            }
          } else {
            updated[k] = perm;
          }
        });
        setCoverageState(updated);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [coverageState, setCoverageState]);

  const activeTempPerms = Object.keys(coverageState || {}).filter(k => {
    const perm = coverageState[k];
    return perm && perm.on && perm.type === 'temp' && perm.expiresAt && new Date(perm.expiresAt) > new Date();
  });

  if (activeTempPerms.length === 0) return null;

  const getModuleName = (id) => {
    const names = {
      'doc-consult': 'Doctor Consultation',
      'doc-history': 'Patient Medical History',
      'dr-stockview': 'Pharmacy Stock View',
      'rc-register': 'Patient Registration',
      'rc-appt': 'Appointment Booking',
      'rc-queue': 'OPD Token Queue',
      'rc-upload': 'Lab Report Upload',
      'rc-billing': 'Billing & Receipts',
      'rc-reorder': 'Pharmacy Stock Reorder',
      'rc-labprint': 'Lab Slip Printing',
      'lt-queue': 'Test Order Queue',
      'lt-upload': 'Report Upload',
      'lt-reagents': 'Lab Reagents Inventory',
      'lt-dispatch': 'Report Dispatch',
      'lt-extlab': 'External Lab Coordination',
      'ph-queue': 'Prescription Queue',
      'ph-dispense': 'Medicine Dispensing',
      'ph-stock': 'Stock Inventory',
      'ph-reorder': 'Reorder Management',
      'ph-billing': 'Prescription Billing',
      'ph-controlled': 'Controlled Drugs Log',
      'nu-vitals': 'Patient Vitals Entry',
      'nu-ward': 'Ward Round Notes',
      'nu-labassist': 'Lab Sample Assist',
      'nu-dispense': 'Medicine Dispensing Assist'
    };
    return names[id] || id;
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
      border: '1px solid #FCD34D',
      borderRadius: '12px',
      padding: '14px 20px',
      marginBottom: '24px',
      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#92400E' }}>
          Temporary Assigned Role Coverage Active
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {activeTempPerms.map(k => (
          <div key={k} style={{
            background: '#FFFFFF',
            border: '1px solid #FDE68A',
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12.5px',
            fontWeight: 700,
            color: '#78350F'
          }}>
            <span>{getModuleName(k)}</span>
            <span style={{
              background: '#FEF3C7',
              color: '#B45309',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontWeight: 800,
              fontSize: '12px',
              border: '1px solid #FCD34D'
            }}>
              {timeLeft[k] || '00:00:00'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MOCK_COMPLETED_REPORTS = [
  {
    _id: "mock1",
    customId: "LAB-29402",
    patientId: { name: "Eleanor Shellstrop", gender: "Female", age: 36, contact: "+91 98765 43210" },
    testName: "Complete Blood Count (CBC)",
    status: "Completed",
    doctorId: { name: "Dr. James Wilson" },
    createdAt: "2023-10-24T09:15:00.000Z",
    updatedAt: "2023-10-24T09:15:00.000Z",
    results: JSON.stringify({ remarks: "Normal blood count.", isDraft: false }),
    uploadedBy: "Dr. James Wilson"
  },
  {
    _id: "mock2",
    customId: "LAB-11839",
    patientId: { name: "Chidi Anagonye", gender: "Male", age: 38, contact: "+91 98765 43211" },
    testName: "Lipid Profile",
    status: "Completed",
    doctorId: { name: "Sarah Jenkins (Tech)" },
    createdAt: "2023-10-24T10:42:00.000Z",
    updatedAt: "2023-10-24T10:42:00.000Z",
    results: JSON.stringify({ remarks: "Cholesterol slightly elevated.", isDraft: false }),
    uploadedBy: "Sarah Jenkins (Tech)"
  },
  {
    _id: "mock3",
    customId: "LAB-38491",
    patientId: { name: "Jason Mendoza", gender: "Male", age: 32, contact: "+91 98765 43212" },
    testName: "Liver Function Test",
    status: "Completed",
    doctorId: { name: "Dr. James Wilson" },
    createdAt: "2023-10-24T11:20:00.000Z",
    updatedAt: "2023-10-24T11:20:00.000Z",
    results: JSON.stringify({ remarks: "Elevated ALT/AST levels.", isDraft: false }),
    uploadedBy: "Dr. James Wilson",
    isUrgent: true
  },
  {
    _id: "mock4",
    customId: "LAB-88203",
    patientId: { name: "Tahani Al-Jamil", gender: "Female", age: 34, contact: "+91 98765 43213" },
    testName: "Thyroid Profile",
    status: "Completed",
    doctorId: { name: "Mark Robertson" },
    createdAt: "2023-10-23T16:50:00.000Z",
    updatedAt: "2023-10-23T16:50:00.000Z",
    results: JSON.stringify({ remarks: "TSH within normal limits.", isDraft: false }),
    uploadedBy: "Mark Robertson"
  },
  {
    _id: "mock5",
    customId: "LAB-00421",
    patientId: { name: "Michael G. Realman", gender: "Male", age: 45, contact: "+91 98765 43214" },
    testName: "Blood Culture",
    status: "Completed",
    doctorId: { name: "Dr. Sarah L." },
    createdAt: "2023-10-23T14:15:00.000Z",
    updatedAt: "2023-10-23T14:15:00.000Z",
    results: JSON.stringify({ remarks: "No bacterial growth detected.", isDraft: false }),
    uploadedBy: "Dr. Sarah L."
  },
  {
    _id: "mock6",
    customId: "LAB-28491",
    patientId: { name: "Janet Dell", gender: "Female", age: 29, contact: "+91 98765 43215" },
    testName: "Urine Routine",
    status: "Completed",
    doctorId: { name: "Sarah Jenkins (Tech)" },
    createdAt: "2023-10-22T11:30:00.000Z",
    updatedAt: "2023-10-22T11:30:00.000Z",
    results: JSON.stringify({ remarks: "Normal.", isDraft: false }),
    uploadedBy: "Sarah Jenkins (Tech)"
  },
  {
    _id: "mock7",
    customId: "LAB-19382",
    patientId: { name: "Simone Garnet", gender: "Female", age: 31, contact: "+91 98765 43216" },
    testName: "HbA1c Profile",
    status: "Completed",
    doctorId: { name: "Dr. James Wilson" },
    createdAt: "2023-10-22T09:10:00.000Z",
    updatedAt: "2023-10-22T09:10:00.000Z",
    results: JSON.stringify({ remarks: "HbA1c: 5.6% - Normal.", isDraft: false }),
    uploadedBy: "Dr. James Wilson"
  },
  {
    _id: "mock8",
    customId: "LAB-84729",
    patientId: { name: "Larry Vance", gender: "Male", age: 52, contact: "+91 98765 43217" },
    testName: "Kidney Function Test",
    status: "Completed",
    doctorId: { name: "Dr. Sarah L." },
    createdAt: "2023-10-21T15:25:00.000Z",
    updatedAt: "2023-10-21T15:25:00.000Z",
    results: JSON.stringify({ remarks: "BUN slightly elevated.", isDraft: false }),
    uploadedBy: "Dr. Sarah L."
  },
  {
    _id: "mock9",
    customId: "LAB-47291",
    patientId: { name: "John Locke", gender: "Male", age: 48, contact: "+91 98765 43218" },
    testName: "Thyroid Profile",
    status: "Completed",
    doctorId: { name: "Mark Robertson" },
    createdAt: "2023-10-21T10:05:00.000Z",
    updatedAt: "2023-10-21T10:05:00.000Z",
    results: JSON.stringify({ remarks: "TSH normal.", isDraft: false }),
    uploadedBy: "Mark Robertson"
  },
  {
    _id: "mock10",
    customId: "LAB-98213",
    patientId: { name: "Jack Shephard", gender: "Male", age: 40, contact: "+91 98765 43219" },
    testName: "Complete Blood Count (CBC)",
    status: "Completed",
    doctorId: { name: "Dr. James Wilson" },
    createdAt: "2023-10-20T08:30:00.000Z",
    updatedAt: "2023-10-20T08:30:00.000Z",
    results: JSON.stringify({ remarks: "All values normal.", isDraft: false }),
    uploadedBy: "Dr. James Wilson"
  },
  {
    _id: "mock11",
    customId: "LAB-12948",
    patientId: { name: "Kate Austen", gender: "Female", age: 35, contact: "+91 98765 43220" },
    testName: "Lipid Profile",
    status: "Completed",
    doctorId: { name: "Sarah Jenkins (Tech)" },
    createdAt: "2023-10-20T14:40:00.000Z",
    updatedAt: "2023-10-20T14:40:00.000Z",
    results: JSON.stringify({ remarks: "Borderline high cholesterol.", isDraft: false }),
    uploadedBy: "Sarah Jenkins (Tech)"
  },
  {
    _id: "mock12",
    customId: "LAB-78392",
    patientId: { name: "Hugo Reyes", gender: "Male", age: 33, contact: "+91 98765 43221" },
    testName: "Glucose Fasting",
    status: "Completed",
    doctorId: { name: "Dr. James Wilson" },
    createdAt: "2023-10-19T09:50:00.000Z",
    updatedAt: "2023-10-19T09:50:00.000Z",
    results: JSON.stringify({ remarks: "Glucose: 95 mg/dL - Normal.", isDraft: false }),
    uploadedBy: "Dr. James Wilson"
  },
  {
    _id: "mock13",
    customId: "LAB-39482",
    patientId: { name: "James Sawyer", gender: "Male", age: 37, contact: "+91 98765 43222" },
    testName: "Liver Function Test",
    status: "Completed",
    doctorId: { name: "Dr. Sarah L." },
    createdAt: "2023-10-19T11:15:00.000Z",
    updatedAt: "2023-10-19T11:15:00.000Z",
    results: JSON.stringify({ remarks: "Mild liver enzyme elevation.", isDraft: false }),
    uploadedBy: "Dr. Sarah L."
  },
  {
    _id: "mock14",
    customId: "LAB-92841",
    patientId: { name: "Sayid Jarrah", gender: "Male", age: 42, contact: "+91 98765 43223" },
    testName: "Blood Culture",
    status: "Completed",
    doctorId: { name: "Dr. James Wilson" },
    createdAt: "2023-10-18T16:20:00.000Z",
    updatedAt: "2023-10-18T16:20:00.000Z",
    results: JSON.stringify({ remarks: "Negative for growth.", isDraft: false }),
    uploadedBy: "Dr. James Wilson"
  },
  {
    _id: "mock15",
    customId: "LAB-48291",
    patientId: { name: "Sun Kwon", gender: "Female", age: 33, contact: "+91 98765 43224" },
    testName: "Urine Routine",
    status: "Completed",
    doctorId: { name: "Mark Robertson" },
    createdAt: "2023-10-18T10:10:00.000Z",
    updatedAt: "2023-10-18T10:10:00.000Z",
    results: JSON.stringify({ remarks: "Normal findings.", isDraft: false }),
    uploadedBy: "Mark Robertson"
  }
];

const LabDashboard = () => {
  const [activeTab, setActiveTab] = useState('lab-dash'); // 'lab-dash', 'lab-requests', 'lab-reports', 'lab-inventory'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Real Database Lab Inventory States
  const [labInventory, setLabInventory] = useState([]);
  const [showLabInventoryModal, setShowLabInventoryModal] = useState(false);
  const [labModalMode, setLabModalMode] = useState('add'); // 'add', 'edit', 'restock'
  const [labFormData, setLabFormData] = useState({
    name: '',
    category: 'Reagents',
    stock: 50,
    unit: 'L',
    threshold: 20,
    addQty: 10
  });
  const [currentLabItemId, setCurrentLabItemId] = useState(null);

  // Success / Error messages to replace native alert boxes
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic filter & pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('Today'); // Default filter matches screenshot
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Reports Repository Specific Filter States (Screenshot 4)
  const [repPatientSearch, setRepPatientSearch] = useState('');
  const [repTestTypeFilter, setRepTestTypeFilter] = useState('All');
  const [repDateRangeFilter, setRepDateRangeFilter] = useState('Last 30 Days');
  const [appliedRepFilters, setAppliedRepFilters] = useState({
    patient: '',
    testType: 'All',
    dateRange: 'Last 30 Days'
  });
  const [repCurrentPage, setRepCurrentPage] = useState(1);

  const [selectedDate, setSelectedDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Unified Interaction Details Modal States
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [paramVals, setParamVals] = useState({
    hemoglobin: '',
    wbc: '',
    platelets: ''
  });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Dynamic role coverage state & listener
  const [coverageState, setCoverageState] = useState(() => {
    const saved = localStorage.getItem('medicore_pmState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed[user.name] || {};
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  useEffect(() => {
    const syncCoverage = () => {
      const saved = localStorage.getItem('medicore_pmState');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCoverageState(parsed[user.name] || {});
        } catch (e) {
          console.error(e);
        }
      }
    };
    syncCoverage();
    window.addEventListener('storage', syncCoverage);

    const fetchBackendCoverage = async () => {
      try {
        const response = await api.get('/auth/role-coverage');
        if (response.data) {
          localStorage.setItem('medicore_pmState', JSON.stringify(response.data));
          setCoverageState(response.data[user.name] || {});
        }
      } catch (err) {
        console.error('Failed to sync coverage from backend', err);
      }
    };
    fetchBackendCoverage();

    return () => window.removeEventListener('storage', syncCoverage);
  }, [user.name]);

  const [labRequests, setLabRequests] = useState([]);

  const inputStyle = {
    width: '100%',
    height: '44px',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '0 12px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1E293B',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const btnStyle = {
    width: '100%',
    height: '44px',
    background: '#2563EB',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/labs');
      setLabRequests(res.data);
      
      const invRes = await api.get('/lab-inventory');
      setLabInventory(invRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, labRequests, labInventory, selectedRequestDetails, showProfileMenu, showLabInventoryModal, showDatePicker, currentPage, statusFilter, dateFilter, appliedRepFilters, repCurrentPage]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Dynamic Avatar Initials and Palette Generator
  const getAvatarStyle = (name) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PT';
    const charCode = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
    const colorSchemes = [
      { bg: '#EFF6FF', text: '#2563EB' }, // Blue
      { bg: '#FFFBEB', text: '#D97706' }, // Orange/Yellow
      { bg: '#ECFDF5', text: '#059669' }, // Green
      { bg: '#FEF2F2', text: '#DC2626' }, // Red
      { bg: '#F5F3FF', text: '#7C3AED' }  // Purple
    ];
    const scheme = colorSchemes[charCode % colorSchemes.length];
    return { initials, ...scheme };
  };

  // Generate dynamic specimen metadata matching the layout screenshot
  const getTestSpecimenInfo = (testName) => {
    const test = (testName || '').toLowerCase();
    if (test.includes('blood') || test.includes('cbc') || test.includes('hemoglobin') || test.includes('platelet') || test.includes('wbc')) {
      return { code: 'CBC', desc: 'Whole Blood - EDTA' };
    }
    if (test.includes('lipid') || test.includes('sugar') || test.includes('hba1c') || test.includes('cholesterol') || test.includes('liver') || test.includes('lft') || test.includes('kft') || test.includes('urea') || test.includes('glucose')) {
      return { code: 'FBS', desc: 'Plasma - Fluoride' };
    }
    if (test.includes('thyroid') || test.includes('tsh') || test.includes('hormone') || test.includes('t3') || test.includes('t4') || test.includes('panel')) {
      return { code: 'THY', desc: 'Serum - Plain' };
    }
    if (test.includes('covid') || test.includes('pcr') || test.includes('rt-pcr') || test.includes('molecular') || test.includes('dna')) {
      return { code: 'PCR', desc: 'Nasopharyngeal Swab' };
    }
    if (test.includes('x-ray') || test.includes('xr') || test.includes('chest') || test.includes('scan') || test.includes('mri')) {
      return { code: 'XR', desc: 'Radiology Department' };
    }
    return { code: 'LAB', desc: 'Specimen Swab/Serum/Urine' };
  };

  // Dynamic Assigned Lab Department Generator
  const getAssignedLab = (testName) => {
    const test = (testName || '').toLowerCase();
    if (test.includes('blood') || test.includes('cbc') || test.includes('hemoglobin') || test.includes('platelet') || test.includes('wbc')) {
      return 'Hematology A';
    }
    if (test.includes('lipid') || test.includes('sugar') || test.includes('hba1c') || test.includes('cholesterol') || test.includes('liver') || test.includes('lft') || test.includes('kft') || test.includes('urea') || test.includes('glucose')) {
      return 'Biochemistry Main';
    }
    if (test.includes('thyroid') || test.includes('tsh') || test.includes('hormone') || test.includes('t3') || test.includes('t4') || test.includes('panel')) {
      return 'Hormone Lab';
    }
    if (test.includes('covid') || test.includes('pcr') || test.includes('rt-pcr') || test.includes('molecular') || test.includes('dna')) {
      return 'Molecular Lab';
    }
    return 'Biochemistry Main';
  };

  // Dynamic ABHA ID Generator based on patient email or name
  const getAbhaId = (name, email) => {
    if (email && email.includes('@')) {
      return email.split('@')[0].toUpperCase() + '@ABDM';
    }
    const cleanName = (name || 'patient').toLowerCase().replace(/\s+/g, '.');
    return cleanName + '@ABDM';
  };

  // Dynamic Status Badge formatting
  const renderStatusBadge = (status, results) => {
    if (status === 'Completed') {
      return (
        <span className="status-badge" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
          Completed
        </span>
      );
    }
    if (status === 'In Progress') {
      return results ? (
        <span className="status-badge" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
          Report Pending
        </span>
      ) : (
        <span className="status-badge" style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
          Sample Collected
        </span>
      );
    }
    return (
      <span className="status-badge" style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}>
        Pending Sample
      </span>
    );
  };

  // Perform sample collection (Pending -> In Progress)
  const handleCollectSample = async (reqId) => {
    try {
      setLoading(true);
      const specimenInfo = getTestSpecimenInfo(selectedRequestDetails.testName);
      await api.put(`/labs/${reqId}`, { 
        status: 'In Progress',
        notes: `Sample Type: ${specimenInfo.desc}`
      });
      fetchData();
      setSuccessMessage("Sample collected successfully and sent to analysis!");
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Update local detailed request state
      const updatedReq = { ...selectedRequestDetails, status: 'In Progress', notes: `Sample Type: ${specimenInfo.desc}` };
      setSelectedRequestDetails(updatedReq);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to collect sample');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Save partial results as Draft (keeps In Progress, but marks as Report Pending)
  const handleSaveDraft = async (reqId) => {
    try {
      setLoading(true);
      const draftData = JSON.stringify({
        parameters: paramVals,
        remarks: remarks,
        isDraft: true
      });
      await api.put(`/labs/${reqId}`, { 
        results: draftData 
      });
      fetchData();
      setSuccessMessage("Draft results saved successfully!");
      setTimeout(() => setSuccessMessage(''), 3000);
      setSelectedRequestDetails(null);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to save draft results');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Finalize lab report (In Progress -> Completed)
  const handleFinalizeReport = async (reqId) => {
    try {
      setLoading(true);
      const finalData = JSON.stringify({
        parameters: paramVals,
        remarks: remarks,
        isDraft: false,
        finalizedAt: new Date().toISOString()
      });
      await api.put(`/labs/${reqId}`, { 
        status: 'Completed',
        results: finalData 
      });
      fetchData();
      setSuccessMessage("Lab report finalized and dispatched to EMR vault!");
      setTimeout(() => setSuccessMessage(''), 3000);
      setSelectedRequestDetails(null);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to finalize lab report');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Helper to safely parse JSON results from DB
  const parseResults = (resultsStr) => {
    if (!resultsStr) return { parameters: {}, remarks: '', isDraft: false };
    try {
      return JSON.parse(resultsStr);
    } catch (e) {
      return { parameters: {}, remarks: resultsStr || '', isDraft: false };
    }
  };

  // Open details modal and prefill inputs
  const handleOpenDetails = (req) => {
    setSelectedRequestDetails(req);
    const parsed = parseResults(req.results);
    setRemarks(parsed.remarks || '');
    setParamVals({
      hemoglobin: parsed.parameters?.hemoglobin || '',
      wbc: parsed.parameters?.wbc || '',
      platelets: parsed.parameters?.platelets || ''
    });
  };

  // Lab Inventory operations
  const handleOpenAddLabItem = () => {
    setLabModalMode('add');
    setLabFormData({
      name: '',
      category: 'Reagents',
      stock: 50,
      unit: 'L',
      threshold: 20,
      addQty: 10
    });
    setShowLabInventoryModal(true);
  };

  const handleOpenEditLabItem = (item) => {
    setLabModalMode('edit');
    setCurrentLabItemId(item._id);
    setLabFormData({
      name: item.name,
      category: item.category,
      stock: item.stock,
      unit: item.unit,
      threshold: item.threshold,
      addQty: 10
    });
    setShowLabInventoryModal(true);
  };

  const handleOpenRestockLabItem = (item) => {
    setLabModalMode('restock');
    setCurrentLabItemId(item._id);
    setLabFormData({
      name: item.name,
      category: item.category,
      stock: item.stock,
      unit: item.unit,
      threshold: item.threshold,
      addQty: 10
    });
    setShowLabInventoryModal(true);
  };

  const handleSaveLabItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (labModalMode === 'add') {
        await api.post('/lab-inventory', labFormData);
        setSuccessMessage('Lab item added successfully');
      } else if (labModalMode === 'restock') {
        await api.put(`/lab-inventory/${currentLabItemId}`, { 
          isRestock: true, 
          addQty: labFormData.addQty 
        });
        setSuccessMessage('Inventory restocked successfully');
      } else {
        await api.put(`/lab-inventory/${currentLabItemId}`, labFormData);
        setSuccessMessage('Lab item updated successfully');
      }
      setShowLabInventoryModal(false);
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Failed to save item');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLabItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this lab item?')) {
      try {
        await api.delete(`/lab-inventory/${id}`);
        setSuccessMessage('Lab item deleted successfully');
        fetchData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error(err);
        setErrorMessage('Failed to delete item');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  // Filter requests based on search query, status, and date selectors
  const filteredRequests = labRequests.filter(req => {
    // Search query match
    const nameMatch = (req.patientId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (req.patientId?._id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (req.patientId?.contact || '').includes(searchQuery);
    
    if (!nameMatch) return false;

    // Status filter match
    if (statusFilter !== 'All') {
      if (statusFilter === 'Pending') {
        if (req.status !== 'Pending') return false;
      } else if (statusFilter === 'Completed') {
        if (req.status !== 'Completed') return false;
      } else if (statusFilter === 'Sample Collected') {
        if (req.status !== 'In Progress' || parseResults(req.results).isDraft) return false;
      } else if (statusFilter === 'Report Pending') {
        if (req.status !== 'In Progress' || !parseResults(req.results).isDraft) return false;
      }
    }

    // Date filter match
    if (dateFilter !== 'All') {
      const matchDate = new Date();
      const reqDate = new Date(req.createdAt).toDateString();
      if (dateFilter === 'Today') {
        if (reqDate !== matchDate.toDateString()) return false;
      } else if (dateFilter === 'Yesterday') {
        matchDate.setDate(matchDate.getDate() - 1);
        if (reqDate !== matchDate.toDateString()) return false;
      } else if (dateFilter === 'Week') {
        const diffTime = Math.abs(new Date() - new Date(req.createdAt));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return false;
      }
    }

    return true;
  });

  // Filter Reports Repository List (Screenshot 4)
  const allCompletedReports = [
    ...labRequests.filter(req => req.status === 'Completed'),
    ...MOCK_COMPLETED_REPORTS
  ];

  // Sort reports by completed date descending
  allCompletedReports.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  const repFilteredRequests = allCompletedReports.filter(req => {
    // Search filter
    const patientName = req.patientId?.name || '';
    const patientUHID = req.customId || `LAB-${req._id.substring(18).toUpperCase()}`;
    const nameMatch = patientName.toLowerCase().includes(appliedRepFilters.patient.toLowerCase()) ||
                      patientUHID.toLowerCase().includes(appliedRepFilters.patient.toLowerCase());
    
    if (!nameMatch) return false;

    // Test Type filter
    if (appliedRepFilters.testType !== 'All') {
      if (req.testName !== appliedRepFilters.testType) return false;
    }

    // Date Range filter
    if (appliedRepFilters.dateRange !== 'All Time') {
      const diffTime = Math.abs(new Date() - new Date(req.updatedAt || req.createdAt));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (appliedRepFilters.dateRange === 'Last 30 Days' && diffDays > 30) return false;
      if (appliedRepFilters.dateRange === 'Last 7 Days' && diffDays > 7) return false;
      if (appliedRepFilters.dateRange === 'Today' && new Date(req.updatedAt || req.createdAt).toDateString() !== new Date().toDateString()) return false;
    }

    return true;
  });

  // Calculate Reports page pagination slice
  const repTotalPages = Math.ceil(repFilteredRequests.length / rowsPerPage) || 1;
  const repPaginatedRequests = repFilteredRequests.slice((repCurrentPage - 1) * rowsPerPage, repCurrentPage * rowsPerPage);

  // Calculate pagination slice for requests list
  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage) || 1;
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Extract unique test names from database and mock reports for dropdown options
  const uniqueTestTypes = Array.from(new Set([
    ...labRequests.map(r => r.testName),
    ...MOCK_COMPLETED_REPORTS.map(r => r.testName)
  ]));

  return (
    <>
      <style>{`
        /* Scoped Premium styles to override the index.css dark sidebar for the Lab Portal */
        .sidebar {
          background: #FFFFFF !important;
          border-right: 1px solid #E2E8F0 !important;
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.02) !important;
          display: flex !important;
          flex-direction: column !important;
          width: 240px !important;
        }
        .sidebar-logo {
          color: #0F172A !important;
          padding: 24px 24px 28px !important;
          border-bottom: 1px solid #F1F5F9 !important;
          font-weight: 800 !important;
        }
        .sidebar-logo i {
          color: #2563EB !important;
        }
        nav {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          padding: 16px 0 !important;
        }
        .nav-link {
          color: #475569 !important;
          padding: 12px 20px !important;
          margin: 2px 16px !important;
          border-radius: 8px !important;
          border-left: none !important;
          font-size: 13.5px !important;
          font-weight: 700 !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          transition: all 0.2s ease !important;
        }
        .nav-link:hover {
          background: #F8FAFC !important;
          color: #0F172A !important;
        }
        .nav-link.active {
          background: #EFF6FF !important;
          color: #2563EB !important;
          font-weight: 800 !important;
        }
        .sidebar-user {
          border-top: 1px solid #E2E8F0 !important;
          padding: 16px 20px !important;
          background: #FFFFFF !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          margin-top: auto !important;
          cursor: pointer !important;
          position: relative !important;
        }
        .sidebar-user:hover {
          background: #F8FAFC !important;
        }
        .sidebar-user .name {
          color: #0F172A !important;
          font-weight: 700 !important;
          font-size: 13.5px !important;
        }
        .sidebar-user .role {
          color: #64748B !important;
          font-weight: 600 !important;
          font-size: 11px !important;
        }
        .top-nav {
          background: #FFFFFF !important;
          border-bottom: 1px solid #E2E8F0 !important;
          margin-left: 240px !important;
          height: 64px !important;
          padding: 0 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 20px !important;
        }
        .search-wrapper {
          position: relative !important;
          flex: 1 !important;
          max-width: 380px !important;
          margin: 0 !important;
        }
        .search-wrapper i, .search-wrapper svg {
          position: absolute !important;
          left: 14px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          color: #94A3B8 !important;
          pointer-events: none !important;
          width: 16px !important;
          height: 16px !important;
        }
        .search-wrapper .search-input {
          background: #F8FAFC !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important;
          padding-left: 40px !important;
          font-size: 13.5px !important;
          font-weight: 600 !important;
          height: 40px !important;
        }
        .search-wrapper .search-input:focus {
          border-color: #2563EB !important;
          background: #FFFFFF !important;
        }
        .bell-icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748B;
          position: relative;
          transition: all 0.2s;
        }
        .bell-icon-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }
        .bell-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #EF4444;
          position: absolute;
          top: 8px;
          right: 8px;
          border: 2px solid #FFFFFF;
        }
        .main-content {
          margin-left: 240px !important;
          background: #F8FAFC !important;
          padding: 32px !important;
          min-height: calc(100vh - 64px) !important;
        }
        .calendar-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #EFF6FF;
          border: none;
          color: #2563EB;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .calendar-btn:hover {
          background: #DBEAFE;
        }
        .kpi-container-custom {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }
        .kpi-card-custom {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 18px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01);
        }
        .kpi-icon-box-custom {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .kpi-inner-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .kpi-title-custom {
          font-size: 11px;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .kpi-value-custom {
          font-size: 26px;
          font-weight: 800;
          color: #0F172A;
          line-height: 1;
        }
        .avatar-circle-initials {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 12.5px;
          font-family: inherit;
        }
        .elite-table-custom {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 0;
        }
        .elite-table-custom th {
          padding: 16px 24px;
          font-size: 11px;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #E2E8F0;
          text-align: left;
        }
        .elite-table-custom td {
          padding: 16px 24px;
          border-bottom: 1px solid #F1F5F9;
          font-size: 13.5px;
          color: #0F172A;
          vertical-align: middle;
        }
        .elite-table-custom tr:hover td {
          background: #F8FAFC;
        }
        .details-link-btn {
          color: #2563EB;
          font-weight: 700;
          cursor: pointer;
          font-size: 13px;
          background: none;
          border: none;
          padding: 0;
          transition: color 0.15s ease;
        }
        .details-link-btn:hover {
          color: #1D4ED8;
          text-decoration: underline;
        }
        .open-btn-custom {
          background: #FFFFFF !important;
          border: 1.5px solid #2563EB !important;
          color: #2563EB !important;
          padding: 6px 18px !important;
          border-radius: 6px !important;
          font-weight: 700 !important;
          font-size: 12.5px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .open-btn-custom:hover {
          background: #2563EB !important;
          color: #FFFFFF !important;
        }
        .filter-select-custom {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          outline: none;
          cursor: pointer;
          height: 36px;
          transition: border-color 0.15s ease;
        }
        .filter-select-custom:focus {
          border-color: #2563EB;
        }
        .page-btn {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .page-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }
        .page-btn.active {
          background: #2563EB;
          color: #FFFFFF;
          border-color: #2563EB;
        }

        /* Detail View Card styles (to match the third screenshot) */
        .detail-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01);
        }
        .detail-card-title {
          font-size: 14px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .detail-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .detail-meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .detail-meta-label {
          font-size: 11px;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .detail-meta-val {
          font-size: 14px;
          font-weight: 700;
          color: #1E293B;
        }
        .specimen-badge-box {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 14px 20px;
          position: relative;
          min-width: 280px;
          flex: 1;
        }
        .specimen-code-icon {
          width: 38px;
          height: 38px;
          border-radius: 6px;
          background: #EFF6FF;
          color: #2563EB;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 11px;
        }
        .upload-dashed-box {
          border: 2px dashed #CBD5E1;
          background: #F8FAFC;
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .upload-dashed-box:hover {
          border-color: #2563EB;
          background: #EFF6FF;
        }

        /* Reports Repository Filters Container */
        .reports-filters-container-custom {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 16px;
          align-items: flex-end;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01);
        }
        .reports-filter-input-wrapper {
          position: relative;
          width: 100%;
        }
        .reports-filter-input-wrapper i {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
        }
        .reports-filter-input {
          padding-left: 36px !important;
        }
        .table-responsive {
          width: 100% !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        
        .mobile-backdrop {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(15, 23, 42, 0.4) !important;
          backdrop-filter: blur(2px) !important;
          z-index: 1999 !important;
          animation: fadeIn 0.2s ease-out !important;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 1024px) {
          .sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 240px !important;
            transform: translateX(-100%) !important;
            transition: transform 0.3s ease !important;
            z-index: 2000 !important;
            height: 100% !important;
            height: 100dvh !important;
            padding-bottom: calc(32px + env(safe-area-inset-bottom, 32px)) !important;
          }
          .sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .mobile-menu-toggle {
            display: flex !important;
          }
          .top-nav {
            margin-left: 0 !important;
            padding: 0 16px !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 16px !important;
          }
          .kpi-container-custom {
            grid-template-columns: 1fr 1fr;
          }
          .detail-meta-grid {
            grid-template-columns: 1fr 1fr;
          }
          .reports-filters-container-custom {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          div.mobile-stack {
            grid-template-columns: 1fr !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 20px !important;
          }
          .lab-requests-filters-bar-custom {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
            padding: 16px !important;
          }
          .lab-requests-filters-inner-custom {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
            gap: 10px !important;
          }
          .lab-requests-filters-inner-custom span {
            margin-bottom: 4px !important;
          }
          .lab-requests-filters-bar-custom select {
            width: 100% !important;
            height: 40px !important;
          }
          .lab-requests-filters-bar-custom button {
            align-self: flex-end !important;
            width: 40px !important;
            height: 40px !important;
          }
        }

        @media (max-width: 640px) {
          .kpi-container-custom {
            grid-template-columns: 1fr !important;
          }
          .search-wrapper {
            max-width: 180px !important;
          }
          .top-nav {
            padding: 0 12px !important;
            gap: 8px !important;
          }
        }

        @media (max-width: 480px) {
          .detail-meta-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }

        /* Additional Visual Enhancements for Reports Repository */
        .nav-link.active {
          background: #EFF6FF !important;
          color: #2563EB !important;
          font-weight: 800 !important;
          position: relative !important;
        }
        .nav-link.active::before {
          content: '' !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          bottom: 0 !important;
          width: 4px !important;
          background: #2563EB !important;
          border-top-left-radius: 8px !important;
          border-bottom-left-radius: 8px !important;
        }
        .reports-filters-container-custom label {
          display: block !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          color: #475569 !important;
          margin-bottom: 8px !important;
          text-transform: none !important;
          letter-spacing: normal !important;
        }
        .reports-filter-input-wrapper i, .reports-filter-input-wrapper svg {
          position: absolute !important;
          left: 12px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          color: #94A3B8 !important;
          width: 16px !important;
          height: 16px !important;
        }
        .date-select-wrapper i, .date-select-wrapper svg {
          position: absolute !important;
          left: 12px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          color: #94A3B8 !important;
          width: 16px !important;
          height: 16px !important;
          pointer-events: none !important;
        }
        .status-badge-completed-custom {
          display: inline-flex !important;
          align-items: center !important;
          border-left: 3px solid #2563EB !important;
          background: #EFF6FF !important;
          color: #1E40AF !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          letter-spacing: 0.5px !important;
        }
        .status-badge-urgent-custom {
          display: inline-flex !important;
          align-items: center !important;
          border-left: 3px solid #EA580C !important;
          background: #FFF7ED !important;
          color: #C2410C !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          letter-spacing: 0.5px !important;
        }

        /* Dynamic Responsive Typography Overrides */
        @media (max-width: 1024px) {
          h1, [style*="fontSize: '28px'"], [style*="fontSize: '24px'"], [style*="fontSize:28px"], [style*="fontSize:24px"] {
            font-size: 20px !important;
          }
          h2 {
            font-size: 17px !important;
          }
          h3, [style*="fontSize: '18px'"], [style*="fontSize: '17px'"], [style*="fontSize:18px"], [style*="fontSize:17px"] {
            font-size: 15px !important;
          }
          .modern-kpi-val, .kpi-value-custom {
            font-size: 18px !important;
          }
          .modern-kpi-lbl, .kpi-title-custom {
            font-size: 10.5px !important;
          }
          .premium-table th, .elite-table th, .elite-table-custom th {
            font-size: 10px !important;
            padding: 10px 12px !important;
          }
          .premium-table td, .elite-table td, .elite-table-custom td {
            font-size: 12px !important;
            padding: 10px 12px !important;
          }
          .nav-link {
            font-size: 12.5px !important;
            padding: 10px 16px !important;
          }
          .search-input, .form-control {
            font-size: 12px !important;
            padding: 8px 12px !important;
          }
          .btn {
            font-size: 12px !important;
            padding: 8px 16px !important;
          }
          body, p, span, div, label {
            font-size: 12.5px !important;
          }
          .avail-info b {
            font-size: 12px !important;
          }
          .avail-info p {
            font-size: 10.5px !important;
          }
        }

        @media (max-width: 640px) {
          h1, [style*="fontSize: '28px'"], [style*="fontSize: '24px'"], [style*="fontSize:28px"], [style*="fontSize:24px"] {
            font-size: 17px !important;
          }
          h3, [style*="fontSize: '18px'"], [style*="fontSize: '17px'"], [style*="fontSize:18px"], [style*="fontSize:17px"] {
            font-size: 13.5px !important;
          }
          .modern-kpi-val, .kpi-value-custom {
            font-size: 16px !important;
          }
          .modern-kpi-lbl, .kpi-title-custom {
            font-size: 9.5px !important;
          }
          .premium-table th, .elite-table th, .elite-table-custom th {
            font-size: 9px !important;
            padding: 8px 10px !important;
          }
          .premium-table td, .elite-table td, .elite-table-custom td {
            font-size: 11px !important;
            padding: 8px 10px !important;
          }
          .nav-link {
            font-size: 12px !important;
            padding: 8px 12px !important;
          }
          .search-input, .form-control {
            font-size: 11.5px !important;
            padding: 6px 10px !important;
          }
          .btn {
            font-size: 11px !important;
            padding: 6px 12px !important;
          }
          body, p, span, div, label {
            font-size: 11.5px !important;
          }
        }
      `}</style>

      {/* Sidebar Navigation */}
      <div className={"sidebar " + (mobileSidebarOpen ? "mobile-open" : "")} data-lenis-prevent>
        <div className="sidebar-logo">
          <i data-lucide="heart-pulse"></i><span>MediCore</span>
        </div>
        <nav style={{ flex: 1 }}>
          <a href="#" className={`nav-link ${activeTab === 'lab-dash' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-dash'); setSelectedRequestDetails(null); setMobileSidebarOpen(false); }}>
            <i data-lucide="layout-dashboard"></i> Overview
          </a>
          <a href="#" className={`nav-link ${activeTab === 'lab-requests' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-requests'); setSelectedRequestDetails(null); setMobileSidebarOpen(false); }}>
            <i data-lucide="clipboard-list"></i> Lab requests
          </a>
          <a href="#" className={`nav-link ${activeTab === 'lab-reports' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab-reports'); setSelectedRequestDetails(null); setMobileSidebarOpen(false); }}>
            <i data-lucide="file-text"></i> Reports
          </a>
          <a href="#" className={`nav-link ${activeTab === 'lab-inventory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSelectedRequestDetails(null); setActiveTab('lab-inventory'); setMobileSidebarOpen(false); }}>
            <i data-lucide="package"></i> Inventory
          </a>

          {/* DYNAMIC COVERAGE INTEGRATION LINKS */}
          {(Object.keys(coverageState || {}).some(k => k.startsWith('rc-') && coverageState[k]?.on)) && (
            <a href="#" className={`nav-link ${activeTab === 'receptionist_cover' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('receptionist_cover'); setMobileSidebarOpen(false); }} style={{ color: '#E11D48', fontWeight: 800 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', flexShrink: 0 }}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              Receptionist Cover
            </a>
          )}
          {(Object.keys(coverageState || {}).some(k => k.startsWith('ph-') && coverageState[k]?.on)) && (
            <a href="#" className={`nav-link ${activeTab === 'pharmacy_cover' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('pharmacy_cover'); setMobileSidebarOpen(false); }} style={{ color: '#2563EB', fontWeight: 800 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', flexShrink: 0 }}><path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Pharmacy Cover
            </a>
          )}
        </nav>

        {/* User Profile at bottom of Sidebar */}
        <div className="sidebar-user" onClick={() => setShowProfileMenu(!showProfileMenu)}>
          <img 
            src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150&h=150" 
            alt="Sunny avatar" 
            className="user-avatar" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div className="user-info" style={{ flex: 1 }}>
            <div className="name" style={{ color: '#0F172A', fontWeight: 700, fontSize: '13.5px' }}>Sunny</div>
            <div className="role" style={{ color: '#64748B', fontWeight: 500, fontSize: '11px' }}>Lab Technician</div>
          </div>
          <i data-lucide="chevron-down" style={{ width: '16px', color: '#64748B' }}></i>

          {showProfileMenu && (
            <div className="glass-card animate-in" style={{ position: 'absolute', bottom: '100%', left: '16px', width: '208px', marginBottom: '8px', zIndex: 1200, padding: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0', background: 'white', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '8px 12px', marginBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A' }}>{user.name || 'Sunny'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email || 'sunny@medicore.com'}</div>
              </div>
              <div className="dropdown-item" onClick={() => { setActiveTab('lab-dash'); setShowProfileMenu(false); }} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#334155' }}><i data-lucide="user" style={{ width: '16px' }}></i> My Profile</div>
              <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '8px', paddingTop: '8px' }}>
                <div className="dropdown-item" onClick={handleLogout} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--danger)', cursor: 'pointer' }}><i data-lucide="log-out" style={{ width: '16px' }}></i> Logout</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div className="mobile-backdrop" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Header / Top Navigation */}
      <div className="top-nav">
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
            marginRight: 'auto'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>

        <div className="search-wrapper">
          <i data-lucide="search"></i>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search patient by mobile/ID"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <button className="bell-icon-btn">
          <i data-lucide="bell" style={{ width: '20px', height: '20px' }}></i>
          <span className="bell-dot"></span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <CoverageTimerBanner coverageState={coverageState} setCoverageState={setCoverageState} />
        {successMessage && <div style={{ color: 'green', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><i data-lucide="check-circle"></i>{successMessage}</div>}
        {errorMessage && <div style={{ color: 'red', background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '12px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><i data-lucide="alert-triangle"></i>{errorMessage}</div>}

        {/* PAGE-LEVEL DETAIL VIEW (Unlocked by clicking 'OPEN') */}
        {selectedRequestDetails ? (
          <div className="tab-content active" style={{ animation: 'slideUp 0.3s ease-out' }}>
            
            {/* Back Navigation Breadcrumb */}
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', cursor: 'pointer', color: '#64748B', fontSize: '13px', fontWeight: 700 }}
              onClick={() => setSelectedRequestDetails(null)}
            >
              <i data-lucide="arrow-left" style={{ width: '16px', height: '16px' }}></i>
              <span>Today's Tests</span>
              <span style={{ color: '#CBD5E1', fontSize: '12px' }}>&gt;</span>
              <span style={{ color: '#0F172A', fontWeight: 800 }}>Test Request #LR-{selectedRequestDetails._id.substring(18).toUpperCase()}</span>
            </div>

            {/* 1. Patient Info Card */}
            <div className="detail-card" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i data-lucide="user" style={{ width: '26px', height: '26px' }}></i>
              </div>
              <div className="detail-meta-grid" style={{ flex: 1 }}>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Patient Name</span>
                  <span className="detail-meta-val" style={{ fontSize: '17px', fontWeight: 800 }}>{selectedRequestDetails.patientId?.name || 'N/A'}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Age / Gender</span>
                  <span className="detail-meta-val">{selectedRequestDetails.patientId?.age || '28'} Years / {selectedRequestDetails.patientId?.gender || 'Female'}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Mobile</span>
                  <span className="detail-meta-val">{selectedRequestDetails.patientId?.contact || '+91 98765 43210'}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">ABHA ID</span>
                  <span className="detail-meta-val">{getAbhaId(selectedRequestDetails.patientId?.name, selectedRequestDetails.patientId?.email)}</span>
                </div>
              </div>
            </div>

            {/* 2. Doctor Recommendation Card */}
            <div className="recommendation-card-custom detail-card" style={{ padding: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#0F172A', fontSize: '14.5px' }}>
                  <i data-lucide="activity" style={{ color: '#2563EB', width: '18px', height: '18px' }}></i>
                  <span>Doctor Recommendation</span>
                </div>
                <span style={{ color: '#64748B', fontSize: '12.5px', fontWeight: 700 }}>
                  Ordered: {new Date(selectedRequestDetails.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(selectedRequestDetails.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <span className="detail-meta-label">Recommended By</span>
                  <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px', marginTop: '4px' }}>
                    {selectedRequestDetails.doctorId?.name || 'Dr. Arvind Mukherjee'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Senior Cardiologist, Apollo Clinic</div>
                </div>

                <div>
                  <span className="detail-meta-label">Requested Tests</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '10px' }}>
                    {(() => {
                      const spec = getTestSpecimenInfo(selectedRequestDetails.testName);
                      return (
                        <div className="specimen-badge-box">
                          <div className="specimen-code-icon">{spec.code}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '13.5px' }}>{selectedRequestDetails.testName}</div>
                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>{spec.desc}</div>
                          </div>
                          <i data-lucide="info" style={{ width: '16px', color: '#94A3B8' }}></i>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Sample Collection Pending / Collected block */}
            <div className="detail-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '8px', 
                  background: selectedRequestDetails.status === 'Pending' ? '#EFF6FF' : '#ECFDF5', 
                  color: selectedRequestDetails.status === 'Pending' ? '#2563EB' : '#059669', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <i data-lucide={selectedRequestDetails.status === 'Pending' ? 'hourglass' : 'check'} style={{ width: '20px', height: '20px' }}></i>
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '14.5px' }}>
                    {selectedRequestDetails.status === 'Pending' ? 'Sample Collection Pending' : 'Sample Collected & Received'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                    {selectedRequestDetails.status === 'Pending' ? 'Waiting for phlebotomist to confirm collection.' : 'Sample received in laboratory. Standard specimen validation successfully completed.'}
                  </div>
                </div>
              </div>

              {selectedRequestDetails.status === 'Pending' && (
                <button 
                  className="btn btn-primary" 
                  style={{ height: '40px', padding: '0 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => handleCollectSample(selectedRequestDetails._id)}
                  disabled={loading}
                >
                  <i data-lucide="syringe"></i> Mark Sample Collected
                </button>
              )}
            </div>

            {/* 4. Upload Reports & Media (Disabled until sample is collected!) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Upload Reports & Media</h3>
                {selectedRequestDetails.status === 'Pending' && (
                  <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, fontStyle: 'italic' }}>
                    Unlock this section by collecting samples
                  </span>
                )}
              </div>

              <div 
                style={{ 
                  opacity: selectedRequestDetails.status === 'Pending' ? 0.5 : 1, 
                  pointerEvents: selectedRequestDetails.status === 'Pending' ? 'none' : 'auto',
                  transition: 'opacity 0.2s ease',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.8fr',
                  gap: '24px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px'
                }}
                className="mobile-stack"
              >
                {/* Left Column: Drag & Drop upload + Result Entries if In Progress */}
                <div>
                  <div className="upload-dashed-box" style={{ marginBottom: '24px' }}>
                    <i data-lucide="cloud" style={{ width: '40px', height: '40px', color: '#94A3B8' }}></i>
                    <div style={{ fontWeight: 800, color: '#334155', fontSize: '13.5px' }}>Click to upload or drag and drop</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>PDF, JPEG, PNG or DICOM (Max 50MB)</div>
                  </div>

                  {selectedRequestDetails.status === 'In Progress' && (
                    <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #EFF6FF' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Test Parameters</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ flex: 1, fontWeight: 700, fontSize: '13px', color: '#475569' }}>Hemoglobin</span>
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ width: '120px', height: '36px', background: 'white' }} 
                            placeholder="e.g. 14.2" 
                            value={paramVals.hemoglobin}
                            onChange={(e) => setParamVals({ ...paramVals, hemoglobin: e.target.value })}
                          />
                          <span style={{ fontSize: '11px', color: '#94A3B8', width: '90px', textAlign: 'right', fontWeight: 600 }}>12.0 - 16.0 g/dL</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ flex: 1, fontWeight: 700, fontSize: '13px', color: '#475569' }}>WBC Count</span>
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ width: '120px', height: '36px', background: 'white' }} 
                            placeholder="e.g. 7.2" 
                            value={paramVals.wbc}
                            onChange={(e) => setParamVals({ ...paramVals, wbc: e.target.value })}
                          />
                          <span style={{ fontSize: '11px', color: '#94A3B8', width: '90px', textAlign: 'right', fontWeight: 600 }}>4.0 - 11.0 k/µL</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ flex: 1, fontWeight: 700, fontSize: '13px', color: '#475569' }}>Platelet Count</span>
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ width: '120px', height: '36px', background: 'white' }} 
                            placeholder="e.g. 250" 
                            value={paramVals.platelets}
                            onChange={(e) => setParamVals({ ...paramVals, platelets: e.target.value })}
                          />
                          <span style={{ fontSize: '11px', color: '#94A3B8', width: '90px', textAlign: 'right', fontWeight: 600 }}>150 - 450 k/µL</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRequestDetails.status === 'Completed' && (
                    <div style={{ background: '#F0FDF4', padding: '20px', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Finalized Parameters</h4>
                      {(() => {
                        const parsed = parseResults(selectedRequestDetails.results);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600 }}>Hemoglobin</span><b style={{ color: '#0F172A' }}>{parsed.parameters?.hemoglobin ? `${parsed.parameters.hemoglobin} g/dL` : 'N/A'}</b></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600 }}>WBC Count</span><b style={{ color: '#0F172A' }}>{parsed.parameters?.wbc ? `${parsed.parameters.wbc} k/µL` : 'N/A'}</b></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600 }}>Platelet Count</span><b style={{ color: '#0F172A' }}>{parsed.parameters?.platelets ? `${parsed.parameters.platelets} k/µL` : 'N/A'}</b></div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Right Column: Remarks + Controls */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="detail-meta-label" style={{ marginBottom: '8px' }}>Technician Notes</span>
                  <textarea 
                    className="form-control" 
                    style={{ flex: 1, minHeight: '120px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px', fontSize: '13px', outline: 'none', resize: 'none' }}
                    placeholder="Add observations or special remarks here..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    disabled={selectedRequestDetails.status === 'Completed'}
                  ></textarea>

                  {selectedRequestDetails.status === 'In Progress' && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ flex: 1, height: '40px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, justifyContent: 'center' }}
                        onClick={() => handleSaveDraft(selectedRequestDetails._id)}
                      >
                        Save Draft
                      </button>
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1, height: '40px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, justifyContent: 'center' }}
                        onClick={() => handleFinalizeReport(selectedRequestDetails._id)}
                      >
                        Finalize & Dispatch
                      </button>
                    </div>
                  )}

                  {selectedRequestDetails.status === 'Completed' && (
                    <div style={{ marginTop: '16px' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', height: '40px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, justifyContent: 'center' }}
                        onClick={() => window.print()}
                      >
                        Print Report PDF
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        ) : (
          /* REGULAR TABS LIST VIEWS */
          <>
            {/* Tab 1: Laboratory Overview */}
            {activeTab === 'lab-dash' && (
              <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: '0 0 4px 0' }}>Laboratory Overview</h1>
                    <p style={{ color: '#64748B', fontWeight: 600, fontSize: '13.5px', margin: 0 }}>
                      Live operational metrics for Today, {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : todayStr}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                    {selectedDate && (
                      <button 
                        onClick={() => setSelectedDate('')} 
                        style={{ fontSize: '12px', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, color: '#64748B' }}
                      >
                        Clear Date Filter ×
                      </button>
                    )}
                    <button className="calendar-btn" onClick={() => setShowDatePicker(!showDatePicker)}>
                      <i data-lucide="calendar"></i>
                    </button>
                    {showDatePicker && (
                      <div className="glass-card animate-in" style={{ position: 'absolute', top: '48px', right: 0, zIndex: 1200, padding: '16px', width: '220px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
                        <label style={labelStyle}>Select Date</label>
                        <input 
                          type="date" 
                          style={inputStyle} 
                          value={selectedDate} 
                          onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setShowDatePicker(false);
                          }} 
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* KPI Metrics Dashboard Grid */}
                <div className="kpi-container-custom">
                  <div className="kpi-card-custom">
                    <div className="kpi-icon-box-custom" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                      <i data-lucide="plus-circle" style={{ width: '22px', height: '22px' }}></i>
                    </div>
                    <div className="kpi-inner-content">
                      <div className="kpi-title-custom">New Requests</div>
                      <div className="kpi-value-custom">{labRequests.filter(r => r.status === 'Pending').length}</div>
                    </div>
                  </div>

                  <div className="kpi-card-custom">
                    <div className="kpi-icon-box-custom" style={{ background: '#FFFBEB', color: '#D97706' }}>
                      <i data-lucide="refresh-cw" style={{ width: '20px', height: '20px' }}></i>
                    </div>
                    <div className="kpi-inner-content">
                      <div className="kpi-title-custom">In Progress</div>
                      <div className="kpi-value-custom">
                        {labRequests.filter(r => r.status === 'In Progress' && !parseResults(r.results).isDraft).length}
                      </div>
                    </div>
                  </div>

                  <div className="kpi-card-custom">
                    <div className="kpi-icon-box-custom" style={{ background: '#ECFDF5', color: '#059669' }}>
                      <i data-lucide="check-circle" style={{ width: '22px', height: '22px' }}></i>
                    </div>
                    <div className="kpi-inner-content">
                      <div className="kpi-title-custom">Completed Today</div>
                      <div className="kpi-value-custom">{labRequests.filter(r => r.status === 'Completed').length}</div>
                    </div>
                  </div>

                  <div className="kpi-card-custom">
                    <div className="kpi-icon-box-custom" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                      <i data-lucide="alert-circle" style={{ width: '22px', height: '22px' }}></i>
                    </div>
                    <div className="kpi-inner-content">
                      <div className="kpi-title-custom">Pending Reports</div>
                      <div className="kpi-value-custom">
                        {labRequests.filter(r => r.status === 'In Progress' && parseResults(r.results).isDraft).length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Lab Tests Table Card */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 8px' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '17px', color: '#0F172A', margin: 0 }}>Recent Lab Tests</h3>
                    <button 
                      style={{ color: '#2563EB', fontWeight: 700, fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => {
                        setActiveTab('lab-requests');
                        setDateFilter('All');
                      }}
                    >
                      View All Records
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table className="elite-table-custom">
                      <thead>
                        <tr>
                          <th>Patient Name</th>
                          <th>Test Type</th>
                          <th>Assigned Lab</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.slice(0, 8).map(req => {
                          const avatar = getAvatarStyle(req.patientId?.name);
                          return (
                            <tr key={req._id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div className="avatar-circle-initials" style={{ background: avatar.bg, color: avatar.text }}>
                                    {avatar.initials}
                                  </div>
                                  <span style={{ fontWeight: 750, color: '#0F172A' }}>{req.patientId?.name || 'N/A'}</span>
                                </div>
                              </td>
                              <td>
                                <span style={{ fontWeight: 600, color: '#334155' }}>{req.testName}</span>
                              </td>
                              <td>
                                <span style={{ fontWeight: 600, color: '#64748B' }}>{getAssignedLab(req.testName)}</span>
                              </td>
                              <td>
                                {renderStatusBadge(req.status, req.results)}
                              </td>
                              <td>
                                <button className="details-link-btn" onClick={() => handleOpenDetails(req)}>
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredRequests.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontWeight: 600 }}>
                              No lab test requests matching the criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Lab Requests List (With Filters and Pagination) */}
            {activeTab === 'lab-requests' && (
              <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
                {/* Filters Bar */}
                <div className="lab-requests-filters-bar-custom" style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)'
                }}>
                  <div className="lab-requests-filters-inner-custom" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>FILTERS:</span>
                    
                    <select 
                      className="filter-select-custom"
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="All">Status: All</option>
                      <option value="Pending">Status: Pending Sample</option>
                      <option value="Sample Collected">Status: Sample Collected</option>
                      <option value="Report Pending">Status: Report Pending</option>
                      <option value="Completed">Status: Completed</option>
                    </select>

                    <select 
                      className="filter-select-custom"
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="All">Date: All</option>
                      <option value="Today">Date: Today</option>
                      <option value="Yesterday">Date: Yesterday</option>
                      <option value="Week">Date: Last 7 Days</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => {
                      fetchData();
                      setSuccessMessage("Database records updated successfully!");
                      setTimeout(() => setSuccessMessage(''), 2000);
                    }}
                    style={{
                      width: '36px',
                      height: '36px',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#475569',
                      transition: 'all 0.2s'
                    }}
                    title="Refresh Requests"
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                  >
                    <i data-lucide="refresh-cw" style={{ width: '16px', height: '16px' }}></i>
                  </button>
                </div>

                {/* Requests Table Box */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="table-responsive">
                    <table className="elite-table-custom">
                      <thead>
                        <tr>
                          <th>Patient Name</th>
                          <th>Doctor Name</th>
                          <th>Test Type</th>
                          <th>Requested</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRequests.map(req => {
                          const reqTime = new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          return (
                            <tr key={req._id}>
                              <td>
                                <div>
                                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px' }}>{req.patientId?.name || 'N/A'}</div>
                                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', fontWeight: 600 }}>
                                    ID: #LAB-{req._id.substring(18).toUpperCase()} • {req.patientId?.gender || 'N/A'}, {req.patientId?.age || 'N/A'}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span style={{ fontWeight: 700, color: '#334155' }}>{req.doctorId?.name || 'N/A'}</span>
                              </td>
                              <td>
                                <span style={{ 
                                  background: '#F1F5F9', 
                                  color: '#475569', 
                                  borderRadius: '4px', 
                                  padding: '4px 8px', 
                                  fontSize: '12px', 
                                  fontWeight: 700 
                                }}>
                                  {req.testName}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontWeight: 600, color: '#475569' }}>{reqTime}</span>
                              </td>
                              <td>
                                {renderStatusBadge(req.status, req.results)}
                              </td>
                              <td>
                                <button className="open-btn-custom" onClick={() => handleOpenDetails(req)}>
                                  OPEN
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {paginatedRequests.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontWeight: 600 }}>
                              No requests match the selected filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer with Pagination matching the second screenshot */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                      Showing {paginatedRequests.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} - {Math.min(currentPage * rowsPerPage, filteredRequests.length)} of {filteredRequests.length} tests
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="page-btn"
                        style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                      >
                        <i data-lucide="chevron-left" style={{ width: '14px', height: '14px' }}></i>
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <button 
                          key={pageNum}
                          className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      ))}
                      <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="page-btn"
                        style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                      >
                        <i data-lucide="chevron-right" style={{ width: '14px', height: '14px' }}></i>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Tab 3: Reports Vault / Repository (Screenshot 4) */}
            {activeTab === 'lab-reports' && (
              <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
                
                {/* Title and stats layout */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }} className="mobile-stack">
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 950, color: '#0F172A', fontFamily: "'Outfit', sans-serif", margin: '0 0 4px 0' }}>Reports Repository</h1>
                    <p style={{ color: '#64748B', fontWeight: 600, fontSize: '13.5px', margin: 0 }}>
                      Access all completed clinical diagnostics and uploaded PDF reports.
                    </p>
                  </div>
                  
                  {/* KPI stats blocks */}
                  {(() => {
                    const baseTotalReports = 1269; // 1269 base + 15 mock reports = 1284. Plus any database completed tests.
                    const completedDbCount = labRequests.filter(r => r.status === 'Completed').length;
                    const displayTotalReports = baseTotalReports + 15 + completedDbCount;

                    const baseUploadedToday = 42;
                    const completedTodayDbCount = labRequests.filter(r => r.status === 'Completed' && new Date(r.updatedAt).toDateString() === new Date().toDateString()).length;
                    const displayUploadedToday = baseUploadedToday + completedTodayDbCount;

                    return (
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 24px', minWidth: '160px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)' }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Total Reports</div>
                          <div style={{ fontSize: '28px', fontWeight: 900, color: '#2563EB', lineHeight: 1 }}>
                            {displayTotalReports.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 24px', minWidth: '160px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)' }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Uploaded Today</div>
                          <div style={{ fontSize: '28px', fontWeight: 900, color: '#2563EB', lineHeight: 1 }}>
                            {displayUploadedToday}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Filters Row */}
                <div className="reports-filters-container-custom">
                  <div style={{ width: '100%' }}>
                    <label>Patient Search</label>
                    <div className="reports-filter-input-wrapper">
                      <i data-lucide="user"></i>
                      <input 
                        type="text" 
                        style={inputStyle} 
                        className="reports-filter-input"
                        placeholder="Search by name or ID..."
                        value={repPatientSearch}
                        onChange={e => setRepPatientSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ width: '100%' }}>
                    <label>Test Type</label>
                    <select 
                      style={inputStyle}
                      value={repTestTypeFilter}
                      onChange={e => setRepTestTypeFilter(e.target.value)}
                    >
                      <option value="All">All Test Types</option>
                      {uniqueTestTypes.map(tName => (
                        <option key={tName} value={tName}>{tName}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ width: '100%' }}>
                    <label>Date Range</label>
                    <div className="date-select-wrapper" style={{ position: 'relative' }}>
                      <select 
                        style={{ ...inputStyle, paddingLeft: '36px' }}
                        value={repDateRangeFilter}
                        onChange={e => setRepDateRangeFilter(e.target.value)}
                      >
                        <option value="Last 30 Days">Last 30 Days</option>
                        <option value="Last 7 Days">Last 7 Days</option>
                        <option value="Today">Today</option>
                        <option value="All Time">All Time</option>
                      </select>
                      <i data-lucide="calendar"></i>
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary"
                    style={{ height: '44px', padding: '0 24px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 800, background: '#2563EB', color: 'white', border: 'none', cursor: 'pointer' }}
                    onClick={() => {
                      setAppliedRepFilters({
                        patient: repPatientSearch,
                        testType: repTestTypeFilter,
                        dateRange: repDateRangeFilter
                      });
                      setRepCurrentPage(1);
                    }}
                  >
                    Apply Filters
                  </button>
                </div>

                {/* Completed Reports Table Card */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #E2E8F0', background: 'white', borderRadius: '12px' }}>
                  <div className="table-responsive">
                    <table className="elite-table-custom">
                      <thead>
                        <tr>
                          <th>Patient Name</th>
                          <th>Test Type</th>
                          <th>Status</th>
                          <th>Uploaded By</th>
                          <th>Upload Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repPaginatedRequests.map(req => {
                          const testCode = getTestSpecimenInfo(req.testName).code;
                          
                          // Formatting date as "Oct 24, 2023 • 09:15 AM"
                          const formatReportDate = (dateStr) => {
                            const date = new Date(dateStr);
                            const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            let hours = date.getHours();
                            const minutes = date.getMinutes().toString().padStart(2, '0');
                            const ampm = hours >= 12 ? 'AM' : 'PM';
                            hours = hours % 12;
                            hours = hours ? hours : 12;
                            const hourStr = hours.toString().padStart(2, '0');
                            return `${datePart} • ${hourStr}:${minutes} ${ampm}`;
                          };

                          const isUrgent = req.isUrgent || (req.isMock && req._id === 'mock3');
                          const uploadedBy = req.uploadedBy || req.doctorId?.name || 'Dr. James Wilson';
                          
                          return (
                            <tr key={req._id}>
                              <td>
                                <div>
                                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px' }}>{req.patientId?.name || 'N/A'}</div>
                                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', fontWeight: 600 }}>
                                    ID: {req.customId || `LAB-${req._id.substring(18).toUpperCase()}`}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span style={{ fontWeight: 700, color: '#334155' }}>
                                  {req.testName} {testCode && `(${testCode})`}
                                </span>
                              </td>
                              <td>
                                {isUrgent ? (
                                  <span className="status-badge-urgent-custom">
                                    URGENT
                                  </span>
                                ) : (
                                  <span className="status-badge-completed-custom">
                                    COMPLETED
                                  </span>
                                )}
                              </td>
                              <td>
                                <span style={{ fontWeight: 700, color: '#334155' }}>
                                  {uploadedBy}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontWeight: 600, color: '#64748B' }}>
                                  {formatReportDate(req.updatedAt || req.createdAt)}
                                </span>
                              </td>
                              <td>
                                <button 
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                  onClick={() => handleOpenDetails(req)}
                                  title="Download Report"
                                >
                                  <i data-lucide="download" style={{ width: '18px', height: '18px' }}></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {repPaginatedRequests.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontWeight: 600 }}>
                              No completed reports match the filter criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Reports Pagination Footer */}
                  {(() => {
                    const baseTotalReports = 1269;
                    const completedDbCount = labRequests.filter(r => r.status === 'Completed').length;
                    const displayTotalReports = baseTotalReports + 15 + completedDbCount;

                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                          Showing {(repCurrentPage - 1) * rowsPerPage + 1} to {Math.min(repCurrentPage * rowsPerPage, displayTotalReports)} of {displayTotalReports.toLocaleString()} reports
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            disabled={repCurrentPage === 1}
                            onClick={() => setRepCurrentPage(prev => prev - 1)}
                            className="page-btn"
                            style={{ width: 'auto', padding: '0 10px', opacity: repCurrentPage === 1 ? 0.5 : 1 }}
                          >
                            Previous
                          </button>
                          {Array.from({ length: repTotalPages }, (_, i) => i + 1).map(pageNum => (
                            <button 
                              key={pageNum}
                              className={`page-btn ${repCurrentPage === pageNum ? 'active' : ''}`}
                              onClick={() => setRepCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          ))}
                          <button 
                            disabled={repCurrentPage === repTotalPages}
                            onClick={() => setRepCurrentPage(prev => prev + 1)}
                            className="page-btn"
                            style={{ width: 'auto', padding: '0 10px', opacity: repCurrentPage === repTotalPages ? 0.5 : 1 }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                </div>

              </div>
            )}

            {/* Tab 4: Lab Inventory */}
            {activeTab === 'lab-inventory' && (
              <div className="tab-content active" style={{ animation: 'slideUp 0.4s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0, color: '#0F172A' }}>Lab Inventory</h1>
                  <button className="btn btn-primary" onClick={handleOpenAddLabItem}><i data-lucide="plus"></i> Add Item</button>
                </div>
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="table-responsive">
                    <table className="elite-table-custom">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Category</th>
                          <th>Stock Level</th>
                          <th>Alert Threshold</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labInventory.map(item => (
                          <tr key={item._id || item.id}>
                            <td><span style={{ fontWeight: 750 }}>{item.name}</span></td>
                            <td><span style={{ fontWeight: 600, color: '#334155' }}>{item.category}</span></td>
                            <td style={{ fontWeight: 700 }}>{item.stock} {item.unit}</td>
                            <td>{item.threshold} {item.unit}</td>
                            <td>
                              <span className={`status-badge ${item.status === 'Healthy' ? 'available' : 'critical'}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleOpenEditLabItem(item)}>Edit</button>
                                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleOpenRestockLabItem(item)}>Restock</button>
                                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--danger)', borderColor: '#FECACA' }} onClick={() => handleDeleteLabItem(item._id || item.id)}>Delete</button>
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
          </>
        )}
      </div>

      {/* Unified Manage Reagent/Supply Modal */}
      {showLabInventoryModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1300, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLabInventoryModal(false)}>
          <div className="modal-box glass-card" style={{ width: '90%', maxWidth: '500px', background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1D23', margin: 0 }}>
                {labModalMode === 'add' ? 'Add Reagent/Supply' : labModalMode === 'restock' ? 'Restock Lab Supply' : 'Edit Supply Details'}
              </h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }} onClick={() => setShowLabInventoryModal(false)}>
                <i data-lucide="x" style={{ width: '20px', height: '20px' }}></i>
              </button>
            </div>

            <form onSubmit={handleSaveLabItem}>
              {labModalMode !== 'restock' ? (
                <>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Supply Name</label>
                    <input type="text" style={inputStyle} value={labFormData.name} onChange={e => setLabFormData({...labFormData, name: e.target.value})} required placeholder="e.g. Hematology Reagent" />
                  </div>

                  <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={labelStyle}>Category</label>
                      <select style={inputStyle} value={labFormData.category} onChange={e => setLabFormData({...labFormData, category: e.target.value})} required>
                        <option value="Reagents">Reagents</option>
                        <option value="Consumables">Consumables</option>
                        <option value="Equipment">Equipment</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={labelStyle}>Unit Type</label>
                      <select style={inputStyle} value={labFormData.unit} onChange={e => setLabFormData({...labFormData, unit: e.target.value})} required>
                        <option value="L">L</option>
                        <option value="units">units</option>
                        <option value="boxes">boxes</option>
                        <option value="kits">kits</option>
                      </select>
                    </div>
                  </div>

                  <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={labelStyle}>Current Stock</label>
                      <input type="number" style={inputStyle} value={labFormData.stock} onChange={e => setLabFormData({...labFormData, stock: Number(e.target.value)})} required />
                    </div>

                    <div className="form-group">
                      <label style={labelStyle}>Low Threshold Alert</label>
                      <input type="number" style={inputStyle} value={labFormData.threshold} onChange={e => setLabFormData({...labFormData, threshold: Number(e.target.value)})} required />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Supply Item</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#1E293B' }}>{labFormData.name}</div>
                    <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Current Inventory</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)' }}>{labFormData.stock} {labFormData.unit} (Threshold: {labFormData.threshold})</div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={labelStyle}>Add Quantity</label>
                    <input type="number" style={inputStyle} value={labFormData.addQty} onChange={e => setLabFormData({...labFormData, addQty: Number(e.target.value)})} required min="1" />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', height: '44px', borderRadius: '12px' }} onClick={() => setShowLabInventoryModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} style={{ ...btnStyle, flex: 1 }}>
                  {loading ? 'Saving...' : labModalMode === 'add' ? 'Add Item' : labModalMode === 'restock' ? 'Restock Item' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LabDashboard;
