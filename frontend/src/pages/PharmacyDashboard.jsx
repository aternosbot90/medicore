import React, { useState, useEffect, useRef } from 'react';
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

const PharmacyDashboard = () => {
  const [activeTab, setActiveTab] = useState('dash');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('All'); // 'All', 'Urgent', 'New', 'In Progress'
  const [prescriptionsFilter, setPrescriptionsFilter] = useState('Pending'); // 'All', 'Pending', 'In Progress', 'Dispensed', 'Cancelled'
  const navigate = useNavigate();
  
  // Real logged-in user or premium default fallback
  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Ankit Sharma","role":"Pharmacy","email":"ankit.sharma@medicore.com"}');

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

    // Sync from backend database for cross-browser / cross-device support
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

  const [inventory, setInventory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Toast status notifications
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modal states for inventory operations
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'restock'
  const [formData, setFormData] = useState({
    name: '',
    category: 'Pain Relief',
    sku: '',
    stock: 0,
    unit: 'Strip',
    mrp: 0,
    expiry: ''
  });
  const [currentId, setCurrentId] = useState(null);

  // Barcode / Webcam scanning states
  const [isWebcamScanning, setIsWebcamScanning] = useState(false);
  const [webcamScanner, setWebcamScanner] = useState(null);
  const [scanDebugLog, setScanDebugLog] = useState('');

  // Auto cleanup webcam on modal close
  useEffect(() => {
    if (!showMedicineModal) {
      if (webcamScanner) {
        try {
          if (window.Quagga) window.Quagga.stop();
        } catch (e) { console.error(e); }
        setIsWebcamScanning(false);
        setWebcamScanner(null);
      } else {
        setIsWebcamScanning(false);
      }
    }
  }, [showMedicineModal]);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800 Hz beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12); // Short beep duration
    } catch (e) {
      console.warn("Audio Context beep error", e);
    }
  };

  const handleBarcodeFound = async (barcode) => {
    const trimmed = barcode.trim();
    if (!trimmed) return;

    setFormData(prev => ({ ...prev, sku: trimmed }));
    setSuccessMessage(`Barcode scanned: ${trimmed}. Looking up product...`);

    // Step 1: Check local database first
    try {
      const response = await api.get(`/medicines/barcode/${trimmed}`);
      if (response.data && response.data.name) {
        setFormData({
          name: response.data.name,
          category: response.data.category,
          sku: response.data.sku,
          stock: '',
          unit: response.data.unit,
          mrp: response.data.mrp,
          expiry: response.data.expiry
        });
        setSuccessMessage(`✅ Found in inventory: ${response.data.name}`);
        setTimeout(() => setSuccessMessage(''), 4000);
        return;
      }
    } catch (err) {
      console.log("Not in local DB, trying public APIs...");
    }

    // Step 2: Try Open Food Facts API (free, no key needed)
    try {
      const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${trimmed}.json`);
      const offData = await offRes.json();
      if (offData.status === 1 && offData.product) {
        const p = offData.product;
        const productName = p.product_name || p.product_name_en || '';
        const brand = p.brands || '';
        const categories = p.categories || '';
        const fullName = brand ? `${brand} - ${productName}` : productName;
        
        if (fullName) {
          setFormData(prev => ({
            ...prev,
            name: fullName,
            sku: trimmed,
            category: categories.split(',')[0]?.trim() || prev.category || 'General'
          }));
          setSuccessMessage(`✅ Found online: ${fullName}`);
          setTimeout(() => setSuccessMessage(''), 4000);
          return;
        }
      }
    } catch (e) {
      console.log("Open Food Facts lookup failed:", e.message);
    }

    // Step 3: Try UPC ItemDB API (free, no key needed)
    try {
      const upcRes = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${trimmed}`);
      const upcData = await upcRes.json();
      if (upcData.items && upcData.items.length > 0) {
        const item = upcData.items[0];
        const productName = item.title || '';
        const brand = item.brand || '';
        const category = item.category || '';
        const fullName = brand && productName ? `${brand} - ${productName}` : (productName || brand);

        if (fullName) {
          setFormData(prev => ({
            ...prev,
            name: fullName,
            sku: trimmed,
            category: category.split(',')[0]?.trim() || prev.category || 'General'
          }));
          setSuccessMessage(`✅ Found online: ${fullName}`);
          setTimeout(() => setSuccessMessage(''), 4000);
          return;
        }
      }
    } catch (e) {
      console.log("UPC ItemDB lookup failed:", e.message);
    }

    // Step 4: No lookup found — barcode set, user fills rest
    setSuccessMessage(`Barcode ${trimmed} not found in any database. Please fill details manually.`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleSkuKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      playBeep();
      handleBarcodeFound(e.target.value);
    }
  };

  const handleZoomChange = (zoomVal) => {
    try {
      const videoElem = document.querySelector("#barcode-webcam-reader video");
      if (videoElem && videoElem.srcObject) {
        const stream = videoElem.srcObject;
        const tracks = stream.getVideoTracks();
        if (tracks && tracks.length > 0) {
          const track = tracks[0];
          const capabilities = track.getCapabilities ? track.getCapabilities() : {};
          if (capabilities.zoom) {
            const min = capabilities.zoom.min || 1;
            const max = capabilities.zoom.max || 4;
            const constrainedVal = Math.max(min, Math.min(zoomVal, max));
            track.applyConstraints({
              advanced: [{ zoom: constrainedVal }]
            }).catch(e => console.log("Failed to apply zoom constraints", e));
          }
        }
      }
    } catch (e) {
      console.warn("Zoom constraint failed", e);
    }
  };

  const initWebcamReader = () => {
    setIsWebcamScanning(true);
    setScanDebugLog('Initializing QuaggaJS...');
    setTimeout(() => {
      try {
        if (!window.Quagga) {
          setScanDebugLog('ERROR: QuaggaJS not loaded!');
          return;
        }

        const targetEl = document.getElementById('barcode-webcam-reader');
        if (!targetEl) {
          setScanDebugLog('ERROR: Container not found!');
          return;
        }

        let frameCount = 0;
        let detected = false;

        window.Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: targetEl,
            constraints: {
              facingMode: "environment",
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          },
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "code_128_reader",
              "code_39_reader",
              "upc_reader",
              "upc_e_reader"
            ]
          },
          locate: true,
          frequency: 10
        }, function(err) {
          if (err) {
            console.error('Quagga init error:', err);
            setScanDebugLog('Camera error: ' + (err.message || err));
            setIsWebcamScanning(false);
            return;
          }
          setScanDebugLog('Camera active! Scanning for EAN-13, EAN-8, CODE-128, UPC...');
          window.Quagga.start();
          setWebcamScanner({ type: 'quagga' });

          // Style the video to fill container
          const video = targetEl.querySelector('video');
          if (video) {
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            video.style.borderRadius = '12px';
          }
          const canvas = targetEl.querySelector('canvas');
          if (canvas) {
            canvas.style.display = 'none';
          }
        });

        window.Quagga.onProcessed(function(result) {
          frameCount++;
          if (frameCount % 50 === 0) {
            setScanDebugLog(`Frame ${frameCount}: Scanning... (no barcode yet)`);
          }
        });

        window.Quagga.onDetected(function(result) {
          if (detected) return;
          const code = result.codeResult.code;
          const format = result.codeResult.format;
          if (!code) return;
          detected = true;
          setScanDebugLog(`✅ DECODED: "${code}" (${format})`);
          playBeep();
          handleBarcodeFound(code);
          try {
            window.Quagga.stop();
          } catch(e) {}
          setIsWebcamScanning(false);
          setWebcamScanner(null);
        });

      } catch (err) {
        console.error(err);
        setScanDebugLog('Error: ' + err.message);
      }
    }, 200);
  };

  const startWebcamScanner = () => {
    if (!window.Quagga) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/@ericblade/quagga2/dist/quagga.min.js";
      script.async = true;
      script.onload = () => initWebcamReader();
      script.onerror = () => alert('Failed to load scanner library.');
      document.body.appendChild(script);
    } else {
      initWebcamReader();
    }
  };

  const stopWebcamScanner = () => {
    try {
      if (window.Quagga) window.Quagga.stop();
    } catch (e) { console.error(e); }
    setIsWebcamScanning(false);
    setWebcamScanner(null);
  };

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Active Date for Calendar
  const [activeCalendarDate, setActiveCalendarDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/medicines');
      setInventory(res.data);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    }
  };

  const fetchData = async () => {
    try {
      const res = await api.get('/prescriptions');
      setPrescriptions(res.data);
      await fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  // Compute stock alerts dynamically from real inventory
  const alerts = inventory
    .filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock')
    .map((item, idx) => ({
      _id: item._id,
      id: `ALT-${idx + 1}`,
      item: item.name,
      type: item.status,
      severity: item.status === 'Out of Stock' ? 'High' : 'Medium',
      date: 'Today',
      rawItem: item
    }));

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, showProfileMenu, showMedicineModal, activeSubTab, prescriptionsFilter]);

  // Freeze background page scroll when any Modal Dialog is active
  useEffect(() => {
    if (showMedicineModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showMedicineModal, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const dispensePrescription = async (id) => {
    try {
      await api.put(`/prescriptions/${id}`, { status: 'Dispensed' });
      fetchData();
      setSuccessMessage('Prescription Dispensed Successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to dispense prescription');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({
      name: '',
      category: 'Pain Relief',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      stock: 50,
      unit: 'Strip',
      mrp: 20.00,
      expiry: '31/12/2025'
    });
    setShowMedicineModal(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setCurrentId(item._id);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku,
      stock: item.stock,
      unit: item.unit,
      mrp: item.mrp,
      expiry: item.expiry
    });
    setShowMedicineModal(true);
  };

  const handleOpenRestock = (item) => {
    setModalMode('restock');
    setCurrentId(item._id);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku,
      stock: item.stock,
      unit: item.unit,
      mrp: item.mrp,
      expiry: item.expiry
    });
    setShowMedicineModal(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await api.post('/medicines', formData);
        setSuccessMessage('Medicine added successfully');
      } else {
        await api.put(`/medicines/${currentId}`, formData);
        setSuccessMessage('Medicine updated successfully');
      }
      setShowMedicineModal(false);
      fetchInventory();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Failed to save medicine');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await api.delete(`/medicines/${id}`);
        setSuccessMessage('Medicine deleted successfully');
        fetchInventory();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error(err);
        setErrorMessage('Failed to delete medicine');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  // Beautiful calendar days generator (Mon-Sun layout)
  const getCalendarDays = () => {
    const year = activeCalendarDate.getFullYear();
    const month = activeCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Align Mon = 0
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    
    const daysList = [];
    // Previous Month padding
    for (let i = startDay - 1; i >= 0; i--) {
      daysList.push({ day: daysInPrev - i, current: false });
    }
    // Current Month days
    for (let i = 1; i <= daysInMonth; i++) {
      daysList.push({ day: i, current: true });
    }
    // Next Month padding
    const remaining = 35 - daysList.length;
    for (let i = 1; i <= remaining; i++) {
      daysList.push({ day: i, current: false });
    }
    return daysList;
  };

  const handlePrevMonth = () => {
    setActiveCalendarDate(new Date(activeCalendarDate.getFullYear(), activeCalendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setActiveCalendarDate(new Date(activeCalendarDate.getFullYear(), activeCalendarDate.getMonth() + 1, 1));
  };

  // High fidelity default data lists matching the design screenshot
  const defaultPrescriptions = [
    { id: '#RX-99882', name: 'Ravi Kumar', age: 33, gender: 'Male', docName: 'Dr. Ankit Sharma', specialty: 'General Medicine', time: '10:20 AM', items: 5, amount: '₹550.00', status: 'Pending' },
    { id: '#RX-99885', name: 'Neha Singh', age: 28, gender: 'Female', docName: 'Dr. Pooja Mehta', specialty: 'Dermatology', time: '10:15 AM', items: 3, amount: '₹320.00', status: 'Pending' },
    { id: '#RX-99890', name: 'Amit Verma', age: 45, gender: 'Male', docName: 'Dr. Rajesh Gupta', specialty: 'Orthopedics', time: '10:10 AM', items: 6, amount: '₹780.00', status: 'In Progress' },
    { id: '#RX-99895', name: 'Vikram Joshi', age: 52, gender: 'Male', docName: 'Dr. Meera Nair', specialty: 'Cardiology', time: '09:55 AM', items: 7, amount: '₹920.00', status: 'Dispensed' }
  ];

  // Blend real backend prescriptions and mock presets
  const getPrescriptionsList = () => {
    // Convert real backend list to table-compatible schema
    const formattedBackend = prescriptions.map((p, index) => {
      const pId = p._id ? `#RX-${p._id.substring(18).toUpperCase()}` : `#RX-00${index}`;
      return {
        id: pId,
        name: p.patientId?.name || 'Unknown Patient',
        age: p.patientId?.age || 35,
        gender: p.patientId?.gender || 'Male',
        docName: p.doctorId?.name || 'Dr. Self',
        specialty: p.doctorId?.specialty || 'General Practitioner',
        time: p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
        items: p.items ? p.items.length : 2,
        amount: `₹${(p.items ? p.items.length * 110 : 220).toFixed(2)}`,
        status: p.status === 'Pending Pharmacy Dispatch' ? 'Pending' : p.status,
        rawObj: p
      };
    });

    // Merge lists prioritising backend rows
    const merged = [...formattedBackend];
    defaultPrescriptions.forEach(def => {
      if (!merged.some(m => m.name.toLowerCase() === def.name.toLowerCase())) {
        merged.push(def);
      }
    });

    // Filter by Sub Tab
    if (activeSubTab === 'Urgent') {
      return merged.filter(p => p.status === 'Pending').slice(0, 2); // Simulate urgent slice
    } else if (activeSubTab === 'New') {
      return merged.filter(p => p.status === 'Pending');
    } else if (activeSubTab === 'In Progress') {
      return merged.filter(p => p.status === 'In Progress');
    }
    return merged;
  };

  const getDedicatedPrescriptionsList = () => {
    // Convert real backend list to table-compatible schema
    const formattedBackend = prescriptions.map((p, index) => {
      const pId = p._id ? `RX${p._id.substring(18).toUpperCase()}` : `RX10${10 + index}`;
      return {
        id: pId,
        name: p.patientId?.name || 'Ravi Kumar',
        age: p.patientId?.age || 33,
        gender: p.patientId?.gender || 'Male',
        docName: p.doctorId?.name || 'Dr. Ankit Sharma',
        specialty: p.doctorId?.specialty || 'General Medicine',
        time: p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:20 AM',
        dateStr: p.createdAt ? new Date(p.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '24 May 2024',
        items: p.items ? p.items.length : 5,
        amount: `₹${(p.items ? p.items.length * 110 : 550).toFixed(2)}`,
        status: p.status === 'Pending Pharmacy Dispatch' ? 'Pending' : p.status,
        rawObj: p
      };
    });

    // Merge lists prioritising backend rows
    const merged = [...formattedBackend];
    
    // Fill up with high fidelity mockup defaults to match screenshot
    const mockupDefaults = [
      { id: 'RX10058', name: 'Ravi Kumar', age: 33, gender: 'Male', docName: 'Dr. Ankit Sharma', specialty: 'General Medicine', time: '10:20 AM', dateStr: '24 May 2024', items: 5, amount: '₹550.00', status: 'Pending' },
      { id: 'RX10058', name: 'Ravi Kumar', age: 33, gender: 'Male', docName: 'Dr. Ankit Sharma', specialty: 'General Medicine', time: '10:20 AM', dateStr: '24 May 2024', items: 5, amount: '₹550.00', status: 'Pending' },
      { id: 'RX10058', name: 'Ravi Kumar', age: 33, gender: 'Male', docName: 'Dr. Ankit Sharma', specialty: 'General Medicine', time: '10:20 AM', dateStr: '24 May 2024', items: 5, amount: '₹550.00', status: 'Pending' },
      { id: 'RX10058', name: 'Ravi Kumar', age: 33, gender: 'Male', docName: 'Dr. Ankit Sharma', specialty: 'General Medicine', time: '10:20 AM', dateStr: '24 May 2024', items: 5, amount: '₹550.00', status: 'Pending' },
      { id: 'RX10058', name: 'Ravi Kumar', age: 33, gender: 'Male', docName: 'Dr. Ankit Sharma', specialty: 'General Medicine', time: '10:20 AM', dateStr: '24 May 2024', items: 5, amount: '₹550.00', status: 'Pending' },
      { id: 'RX10058', name: 'Ravi Kumar', age: 33, gender: 'Male', docName: 'Dr. Ankit Sharma', specialty: 'General Medicine', time: '10:20 AM', dateStr: '24 May 2024', items: 5, amount: '₹550.00', status: 'Pending' },
      { id: 'RX10058', name: 'Ravi Kumar', age: 33, gender: 'Male', docName: 'Dr. Ankit Sharma', specialty: 'General Medicine', time: '10:20 AM', dateStr: '24 May 2024', items: 5, amount: '₹550.00', status: 'Pending' },
      { id: 'RX10058', name: 'Ravi Kumar', age: 33, gender: 'Male', docName: 'Dr. Ankit Sharma', specialty: 'General Medicine', time: '10:20 AM', dateStr: '24 May 2024', items: 5, amount: '₹550.00', status: 'Pending' }
    ];

    mockupDefaults.forEach(def => {
      // Allow duplicate-looking rows for the high-fidelity mock feel exactly like screenshot
      if (merged.length < 8) {
        merged.push(def);
      }
    });

    // Filter based on prescriptionFilter state
    if (prescriptionsFilter === 'All') {
      return merged;
    } else {
      return merged.filter(p => p.status.toLowerCase() === prescriptionsFilter.toLowerCase());
    }
  };

  const activeQueue = getPrescriptionsList();
  const activeTabPrescriptions = getDedicatedPrescriptionsList();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap');

        /* Box sizing safeguard for layout alignments */
        *, *::before, *::after {
          box-sizing: border-box !important;
        }

        html, body {
          background-color: #F8FAFC !important;
          font-family: 'Urbanist', sans-serif !important;
          overflow-y: scroll !important;
          margin: 0 !important;
          padding: 0 !important;
          scrollbar-gutter: stable !important;
        }

        .modal-overlay {
          display: flex !important;
          z-index: 1300 !important;
          background: rgba(15, 23, 42, 0.45) !important;
          backdrop-filter: blur(8px) !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          align-items: center !important;
          justify-content: center !important;
        }

        /* SIDEBAR OVERRIDES */
        .sidebar {
          width: 240px !important;
          background: #ffffff !important;
          border-right: 1px solid #F1F5F9 !important;
          box-shadow: none !important;
          padding: 16px 0 !important;
          height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          z-index: 100 !important;
        }
        .sidebar-logo {
          padding: 8px 24px 20px !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          font-size: 22px !important;
          font-weight: 900 !important;
          color: #0F172A !important;
          letter-spacing: -0.5px !important;
        }
        .sidebar-logo svg, .sidebar-logo i {
          color: #2563EB !important;
          width: 24px !important;
          height: 24px !important;
        }
        .sidebar nav {
          display: flex !important;
          flex-direction: column !important;
          height: calc(100% - 130px) !important;
          overflow-y: auto !important;
        }
        .sidebar .nav-link {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          padding: 12px 20px !important;
          margin: 4px 16px !important;
          border-radius: 8px !important;
          color: #64748B !important;
          font-weight: 600 !important;
          text-decoration: none !important;
          transition: all 0.2s ease !important;
          border-left: none !important;
          position: relative !important;
        }
        .sidebar .nav-link:hover {
          background: #F8FAFC !important;
          color: #0F172A !important;
        }
        .sidebar .nav-link.active {
          background: #EFF6FF !important;
          color: #2563EB !important;
          font-weight: 700 !important;
          position: relative !important;
          border-left: none !important;
        }

        .sidebar-profile-card {
          margin-top: auto !important;
          margin-bottom: 8px !important;
          padding: 16px 24px !important;
          border-top: 1px solid #F1F5F9 !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          cursor: pointer !important;
          transition: background 0.2s ease !important;
          position: relative !important;
        }
        .sidebar-profile-card:hover {
          background: #F8FAFC !important;
        }
        .sidebar-profile-avatar {
          width: 38px !important;
          height: 38px !important;
          border-radius: 50% !important;
          object-fit: cover !important;
        }
        .sidebar-profile-info {
          display: flex !important;
          flex-direction: column !important;
          flex-grow: 1 !important;
        }
        .sidebar-profile-name {
          font-size: 13.5px !important;
          font-weight: 700 !important;
          color: #0F172A !important;
          line-height: 1.3 !important;
        }
        .sidebar-profile-role {
          font-size: 11px !important;
          color: #64748B !important;
          font-weight: 600 !important;
        }
        .sidebar-profile-chevron {
          color: #94A3B8 !important;
          width: 16px !important;
          height: 16px !important;
        }

        /* TOP NAV OVERRIDES */
        .top-nav {
          margin-left: 240px !important;
          height: 72px !important;
          padding: 0 32px !important;
          border-bottom: 1px solid #F1F5F9 !important;
          background: #ffffff !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          left: 0 !important;
          z-index: 99 !important;
          gap: 20px !important;
        }

        .main-content {
          margin-left: 240px !important;
          margin-top: 72px !important;
          padding: 32px !important;
          background-color: #F8FAFC !important;
          min-height: calc(100vh - 72px) !important;
        }

        /* CUSTOM GLASS CARDS */
        .glass-card {
          background: #ffffff !important;
          border: 1px solid #F1F5F9 !important;
          border-radius: 16px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.01) !important;
          padding: 24px !important;
        }

        .kpi-grid {
          display: grid !important;
          grid-template-columns: repeat(5, 1fr) !important;
          gap: 20px !important;
          margin-bottom: 24px !important;
        }

        .premium-kpi-card {
          background: #ffffff !important;
          border: 1px solid #F1F5F9 !important;
          border-radius: 16px !important;
          padding: 20px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          transition: transform 0.2s, box-shadow 0.2s !important;
          cursor: pointer !important;
        }
        .premium-kpi-card:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.02) !important;
        }

        .kpi-val {
          font-size: 28px !important;
          font-weight: 800 !important;
          color: #0F172A !important;
          line-height: 1.2 !important;
        }
        
        .kpi-lbl {
          font-size: 11.5px !important;
          color: #64748B !important;
          font-weight: 700 !important;
          margin-bottom: 4px !important;
        }

        .kpi-trend {
          font-size: 11px !important;
          font-weight: 700 !important;
          display: flex !important;
          align-items: center !important;
          gap: 4px !important;
        }

        .trend-up {
          color: #10B981 !important;
        }
        .trend-danger {
          color: #EF4444 !important;
        }

        .icon-box-kpi {
          width: 44px !important;
          height: 44px !important;
          border-radius: 12px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        /* TABLES */
        .premium-table {
          width: 100% !important;
          border-collapse: collapse !important;
          text-align: left !important;
        }
        .premium-table th {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #94A3B8 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          padding: 12px 16px !important;
          border-bottom: 1px solid #F1F5F9 !important;
        }
        .premium-table td {
          padding: 16px !important;
          border-bottom: 1px solid #F8FAFC !important;
        }
        .premium-table tbody tr:hover {
          background-color: #F8FAFC !important;
        }

        /* BADGES */
        .pill-badge {
          padding: 4px 10px !important;
          border-radius: 6px !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          display: inline-flex !important;
        }
        .badge-pending {
          background: #EFF6FF !important;
          color: #2563EB !important;
        }
        .badge-progress {
          background: #F5F3FF !important;
          color: #7C3AED !important;
        }
        .badge-dispensed {
          background: #ECFDF5 !important;
          color: #10B981 !important;
        }
        .badge-low {
          background: #FEF2F2 !important;
          color: #EF4444 !important;
        }

        /* SUB TABS */
        .subtab-pill {
          padding: 6px 14px !important;
          border-radius: 8px !important;
          font-size: 12.5px !important;
          font-weight: 700 !important;
          color: #64748B !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        }
        .subtab-pill:hover {
          background: #F1F5F9 !important;
          color: #0F172A !important;
        }
        .subtab-pill.active {
          background: #EFF6FF !important;
          color: #2563EB !important;
        }

        /* CALENDAR */
        .calendar-cell {
          width: 28px !important;
          height: 28px !important;
          margin: 0 auto !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 11.5px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          border-radius: 50% !important;
          transition: all 0.15s !important;
        }
        .calendar-cell.inactive {
          color: #CBD5E1 !important;
        }
        .calendar-cell.active {
          background: #2563EB !important;
          color: #ffffff !important;
          font-weight: 700 !important;
        }
        .calendar-cell:hover:not(.active) {
          background: #F1F5F9 !important;
        }

        @keyframes slideUp {
          from {
            transform: translateY(12px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .mobile-menu-toggle {
          display: none !important;
        }

        .top-nav-search {
          position: relative;
          width: 320px;
        }

        @media (max-width: 1200px) {
          .kpi-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 1024px) {
          .kpi-grid {
            grid-template-columns: 1fr !important;
          }
          .sidebar {
            left: -240px !important;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            display: flex !important;
            z-index: 2000 !important;
          }
          .sidebar.mobile-open {
            left: 0 !important;
            z-index: 2010 !important;
          }
          .top-nav, .main-content {
            margin-left: 0 !important;
          }
          .top-nav {
            padding: 0 16px !important;
            justify-content: space-between !important;
            left: 0 !important;
          }
          .mobile-menu-toggle {
            display: flex !important;
            z-index: 100 !important;
          }
          .top-nav-search {
            width: auto !important;
            max-width: 180px !important;
            flex: 1 !important;
          }
          .modal-overlay {
            left: 0 !important;
            width: 100% !important;
          }
          .mobile-backdrop {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background-color: rgba(15, 23, 42, 0.4) !important;
            backdrop-filter: blur(4px) !important;
            z-index: 1999 !important;
            animation: fadeIn 0.2s ease-out !important;
          }

          /* Safe-area spacing overrides for bottom sidebar profile on mobile */
          .sidebar-profile-card {
            padding-bottom: calc(16px + env(safe-area-inset-bottom, 24px)) !important;
            margin-bottom: 0 !important;
          }
          .sidebar-profile-popover {
            bottom: calc(80px + env(safe-area-inset-bottom, 24px)) !important;
          }
        }

        /* ----- PHARMACY DASHBOARD RESPONSIVE SPLIT LAYOUT ----- */
        .pharmacy-split-section {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .pharmacy-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        @media (max-width: 1024px) {
          .pharmacy-split-section {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .pharmacy-card-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .pharmacy-card-header .subtab-container {
            width: 100% !important;
            overflow-x: auto !important;
            display: flex !important;
            white-space: nowrap !important;
            padding-bottom: 4px !important;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>

      {/* Sidebar Layout */}
      <div className={"sidebar " + (mobileSidebarOpen ? "mobile-open" : "")} data-lenis-prevent>
        <div className="sidebar-logo">
          <i data-lucide="stethoscope"></i>
          <span>MediCore</span>
        </div>
        <nav>
          <a href="#" className={`nav-link ${activeTab === 'dash' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dash'); setMobileSidebarOpen(false); }}>
            <i data-lucide="layout-grid"></i> Overview
          </a>
          <a href="#" className={`nav-link ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('prescriptions'); setMobileSidebarOpen(false); }}>
            <i data-lucide="file-text"></i> Prescriptions
          </a>
          <a href="#" className={`nav-link ${activeTab === 'internal' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('internal'); setMobileSidebarOpen(false); }}>
            <i data-lucide="git-pull-request"></i> Internal requests
          </a>
          <a href="#" className={`nav-link ${activeTab === 'sales' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('sales'); setMobileSidebarOpen(false); }}>
            <i data-lucide="credit-card"></i> Sales
          </a>
          <a href="#" className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('inventory'); setMobileSidebarOpen(false); }}>
            <i data-lucide="package"></i> Inventory
          </a>
          <a href="#" className={`nav-link ${activeTab === 'returns' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('returns'); setMobileSidebarOpen(false); }}>
            <i data-lucide="refresh-cw"></i> Returns
          </a>
          <a href="#" className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('reports'); setMobileSidebarOpen(false); }}>
            <i data-lucide="trending-up"></i> Reports
          </a>
          <a href="#" className={`nav-link ${activeTab === 'profile-tab' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('profile-tab'); setMobileSidebarOpen(false); }}>
            <i data-lucide="user"></i> Profile
          </a>

          {/* DYNAMIC COVERAGE INTEGRATION LINKS */}
          {(Object.keys(coverageState || {}).some(k => k.startsWith('rc-') && coverageState[k]?.on)) && (
            <a href="#" className={`nav-link ${activeTab === 'receptionist_cover' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('receptionist_cover'); setMobileSidebarOpen(false); }} style={{ color: '#E11D48', fontWeight: 800 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', flexShrink: 0 }}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              Receptionist Cover
            </a>
          )}
          {(Object.keys(coverageState || {}).some(k => k.startsWith('lt-') && coverageState[k]?.on)) && (
            <a href="#" className={`nav-link ${activeTab === 'lab_cover' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('lab_cover'); setMobileSidebarOpen(false); }} style={{ color: '#059669', fontWeight: 800 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', flexShrink: 0 }}><path d="M6 18H18"/><path d="M10 14H14"/><path d="M12 2v20"/><path d="M18 10H6"/></svg>
              Lab Cover
            </a>
          )}
        </nav>

        {/* Bottom Profile Popover Dropdown */}
        {showProfileMenu && (
          <div 
            className="glass-card sidebar-profile-popover" 
            style={{ 
              position: 'absolute', 
              bottom: '80px', 
              left: '16px', 
              width: '208px', 
              zIndex: 3000, 
              padding: '8px', 
              boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', 
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              animation: 'slideUp 0.2s ease-out'
            }}
          >
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', marginBottom: '6px' }}>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A' }}>{user.name}</div>
              <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>Pharmacy Manager</div>
            </div>
            <div 
              style={{ 
                padding: '10px 12px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                fontSize: '13px', 
                fontWeight: 700, 
                color: '#DC2626', 
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={handleLogout}
            >
              <i data-lucide="log-out" style={{ width: '16px', height: '16px' }}></i> Logout
            </div>
          </div>
        )}

        {/* Bottom Profile Card */}
        <div className="sidebar-profile-card" onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }}>
          <img 
            className="sidebar-profile-avatar" 
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80" 
            alt="Pharmacist Avatar" 
          />
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">{user.name}</span>
            <span className="sidebar-profile-role">Pharmacy</span>
          </div>
          <i data-lucide="chevron-down" className="sidebar-profile-chevron"></i>
        </div>
      </div>

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div className="mobile-backdrop" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Top Navbar */}
      <div className="top-nav" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Hamburger Mobile Menu Toggle Button */}
        <button 
          className="mobile-menu-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setMobileSidebarOpen(!mobileSidebarOpen);
          }}
          style={{
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

        <div className="top-nav-search">
          <i data-lucide="search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', width: '16px' }}></i>
          <input 
            type="text" 
            style={{ 
              paddingLeft: '40px', 
              width: '100%', 
              height: '40px', 
              borderRadius: '8px', 
              border: '1px solid #E2E8F0', 
              background: '#F8FAFC', 
              fontSize: '13px', 
              color: '#1E293B', 
              outline: 'none' 
            }} 
            placeholder="Search patient by mobile/ID" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Notification Bell */}
        <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#64748B' }}>
          <i data-lucide="bell" style={{ width: '18px', height: '18px' }}></i>
          <span style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', background: '#2563EB', borderRadius: '50%', border: '2px solid white' }}></span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        
        {successMessage && (
          <div style={{ color: '#15803D', background: '#F0FDF4', border: '1px solid #DCFCE7', padding: '12px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i data-lucide="check-circle" style={{ width: '16px' }}></i>{successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{ color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FEE2E2', padding: '12px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i data-lucide="alert-triangle" style={{ width: '16px' }}></i>{errorMessage}
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'dash' && (
          <div style={{ animation: 'slideUp 0.3s ease-out' }}>
            
            {/* 5 KPI Cards Grid */}
            <div className="kpi-grid">
              
              {/* Card 1: Today's Prescriptions */}
              <div className="premium-kpi-card" onClick={() => setActiveTab('prescriptions')}>
                <div>
                  <div className="kpi-lbl">Today's Prescriptions</div>
                  <div className="kpi-val">{prescriptions.length + 35}</div>
                  <div className="kpi-trend trend-up">
                    <span>+15%</span> <span style={{ color: '#94A3B8' }}>from yesterday</span>
                  </div>
                </div>
                <div className="icon-box-kpi" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  <i data-lucide="file-text" style={{ width: '20px' }}></i>
                </div>
              </div>

              {/* Card 2: Pending to Dispense */}
              <div className="premium-kpi-card" onClick={() => setActiveTab('prescriptions')}>
                <div>
                  <div className="kpi-lbl">Pending to Dispense</div>
                  <div className="kpi-val">{prescriptions.filter(p => p.status === 'Pending Pharmacy Dispatch').length + 15}</div>
                  <div className="kpi-trend trend-danger">
                    <span>8 Urgent</span>
                  </div>
                </div>
                <div className="icon-box-kpi" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                  <i data-lucide="edit-3" style={{ width: '20px' }}></i>
                </div>
              </div>

              {/* Card 3: Prescriptions Dispensed */}
              <div className="premium-kpi-card" onClick={() => setActiveTab('prescriptions')}>
                <div>
                  <div className="kpi-lbl">Prescriptions Dispensed</div>
                  <div className="kpi-val">{prescriptions.filter(p => p.status === 'Dispensed').length + 28}</div>
                  <div className="kpi-trend trend-up">
                    <span>+10%</span> <span style={{ color: '#94A3B8' }}>from yesterday</span>
                  </div>
                </div>
                <div className="icon-box-kpi" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                  <i data-lucide="check" style={{ width: '20px' }}></i>
                </div>
              </div>

              {/* Card 4: Today's Sales */}
              <div className="premium-kpi-card" onClick={() => setActiveTab('sales')}>
                <div>
                  <div className="kpi-lbl">Today's Sales</div>
                  <div className="kpi-val">₹32,450</div>
                  <div className="kpi-trend trend-up">
                    <span>+18%</span> <span style={{ color: '#94A3B8' }}>from yesterday</span>
                  </div>
                </div>
                <div className="icon-box-kpi" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                  <i data-lucide="credit-card" style={{ width: '20px' }}></i>
                </div>
              </div>

              {/* Card 5: Low Stock Items */}
              <div className="premium-kpi-card" onClick={() => setActiveTab('inventory')}>
                <div>
                  <div className="kpi-lbl">Low Stock Items</div>
                  <div className="kpi-val">{inventory.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock').length + 8}</div>
                  <div className="kpi-trend" style={{ color: '#2563EB', textDecoration: 'underline' }}>
                    <span>View All</span>
                  </div>
                </div>
                <div className="icon-box-kpi" style={{ background: '#FDF2F8', color: '#DB2777' }}>
                  <i data-lucide="alert-triangle" style={{ width: '20px' }}></i>
                </div>
              </div>

            </div>

            {/* Split Section: Table and Calendar */}
            <div className="pharmacy-split-section">
              
              {/* Prescriptions Queue */}
              <div className="glass-card">
                <div className="pharmacy-card-header">
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Prescriptions Queue</h3>
                  <div className="subtab-container" style={{ display: 'flex', gap: '8px' }}>
                    {['All', 'Urgent', 'New', 'In Progress'].map(tab => (
                      <span 
                        key={tab} 
                        className={`subtab-pill ${activeSubTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveSubTab(tab)}
                      >
                        {tab} {tab === 'All' ? '(23)' : tab === 'Urgent' ? '(8)' : tab === 'New' ? '(10)' : '(5)'}
                      </span>
                    ))}
                  </div>
                  <a href="#" style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); setActiveTab('prescriptions'); }}>View All →</a>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Patient Details</th>
                        <th>Doctor</th>
                        <th>Time</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeQueue.slice(0, 5).map((p, idx) => (
                        <tr key={idx}>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{p.name}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{p.age} Y, {p.gender}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#334155' }}>{p.docName}</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>{p.specialty}</div>
                          </td>
                          <td style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                            <div>{p.time}</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Today</div>
                          </td>
                          <td style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{p.items}</td>
                          <td style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{p.amount}</td>
                          <td>
                            <span className={`pill-badge ${p.status === 'Pending' ? 'badge-pending' : (p.status === 'In Progress' ? 'badge-progress' : 'badge-dispensed')}`}>
                              {p.status}
                            </span>
                          </td>
                          <td>
                            {p.status === 'Pending' && p.rawObj && (
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', background: '#2563EB', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700 }}
                                onClick={() => dispensePrescription(p.rawObj._id)}
                              >
                                Dispense
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                  <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>Showing 1 to 5 of 23 prescriptions</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <i data-lucide="chevron-left" style={{ width: '16px', color: '#64748B', cursor: 'pointer' }}></i>
                    <span style={{ width: '28px', height: '28px', background: '#2563EB', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 700 }}>1</span>
                    <span style={{ width: '28px', height: '28px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 700 }}>2</span>
                    <span style={{ width: '28px', height: '28px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 700 }}>3</span>
                    <i data-lucide="chevron-right" style={{ width: '16px', color: '#64748B', cursor: 'pointer' }}></i>
                  </div>
                </div>
              </div>

              {/* Today's Overview (Calendar Card) */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Today's Overview</h3>
                  <i data-lucide="calendar" style={{ width: '18px', color: '#64748B' }}></i>
                </div>

                {/* Calendar Selector */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A' }}>
                    {activeCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <div style={{ display: 'flex', gap: '12px', color: '#64748B' }}>
                    <i data-lucide="chevron-left" style={{ width: '16px', cursor: 'pointer' }} onClick={handlePrevMonth}></i>
                    <i data-lucide="chevron-right" style={{ width: '16px', cursor: 'pointer' }} onClick={handleNextMonth}></i>
                  </div>
                </div>

                {/* Week headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '8px' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <span key={day} style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8' }}>{day}</span>
                  ))}
                </div>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '24px' }}>
                  {getCalendarDays().map((d, idx) => (
                    <div 
                      key={idx} 
                      className={`calendar-cell ${!d.current ? 'inactive' : ''} ${d.current && d.day === activeCalendarDate.getDate() ? 'active' : ''}`}
                      onClick={() => d.current && setActiveCalendarDate(new Date(activeCalendarDate.getFullYear(), activeCalendarDate.getMonth(), d.day))}
                    >
                      {d.day}
                    </div>
                  ))}
                </div>

                {/* Bullet Stats list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }}></span>
                      <span>Prescriptions</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>58</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EA580C' }}></span>
                      <span>Dispensed</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>35</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8' }}></span>
                      <span>Pending</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>23</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></span>
                      <span>Cancelled</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>0</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom 4-Card Analytics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
              
              {/* Card 1: Inventory Snapshot */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Inventory Snapshot</h4>
                  <i data-lucide="package" style={{ width: '16px', color: '#2563EB' }} onClick={() => setActiveTab('inventory')}></i>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                      <i data-lucide="folder" style={{ width: '14px' }}></i>
                      <span>Total Items</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>1,245</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                      <i data-lucide="check-circle" style={{ width: '14px', color: '#2563EB' }}></i>
                      <span>In Stock</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#2563EB' }}>985</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                      <i data-lucide="alert-triangle" style={{ width: '14px', color: '#EA580C' }}></i>
                      <span>Low Stock</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#EA580C' }}>12</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                      <i data-lucide="x-circle" style={{ width: '14px', color: '#EF4444' }}></i>
                      <span>Out of Stock</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>8</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Top Selling */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Top Selling</h4>
                  <i data-lucide="trending-up" style={{ width: '16px', color: '#2563EB' }}></i>
                </div>

                {/* SVG Donut Chart */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '110px' }}>
                  <svg width="100" height="100" viewBox="0 0 36 36">
                    <path
                      className="pharmacy-donut-ring"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#F1F5F9"
                      strokeWidth="3.5"
                    />
                    <path
                      className="pharmacy-donut-segment"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#854D0E" // Brownish/Primary accent matching screenshot
                      strokeWidth="3.5"
                      strokeDasharray="60 40"
                      strokeDashoffset="25"
                    />
                    <path
                      className="pharmacy-donut-segment"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#2563EB" // Blue
                      strokeWidth="3.5"
                      strokeDasharray="20 80"
                      strokeDashoffset="85"
                    />
                  </svg>
                  <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Total Sales</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A' }}>₹32,450</span>
                  </div>
                </div>

                {/* Legends list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }}></span>
                      Paracetamol 650mg
                    </span>
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>₹6,450 (20%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#854D0E' }}></span>
                      Amoxicillin 500mg
                    </span>
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>₹5,250 (16%)</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Low Stock Alerts */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Low Stock Alerts</h4>
                  <a href="#" style={{ fontSize: '11.5px', fontWeight: 700, color: '#2563EB', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); setActiveTab('inventory'); }}>View All</a>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F8FAFC', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Amoxicillin 500mg</div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Stock: 8</div>
                    </div>
                    <span className="pill-badge badge-low">Low</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F8FAFC', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Paracetamol 650mg</div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Stock: 15</div>
                    </div>
                    <span className="pill-badge badge-low">Low</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F8FAFC', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Cetirizine 10mg</div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Stock: 10</div>
                    </div>
                    <span className="pill-badge badge-low">Low</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Payment Summary */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Payment Summary</h4>
                  <i data-lucide="wallet" style={{ width: '16px', color: '#2563EB' }}></i>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>
                      <i data-lucide="banknote" style={{ width: '14px' }}></i>
                      <span>Cash</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>₹12,650</div>
                      <div style={{ fontSize: '10px', color: '#94A3B8' }}>38.9%</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>
                      <i data-lucide="qr-code" style={{ width: '14px' }}></i>
                      <span>UPI</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>₹10,450</div>
                      <div style={{ fontSize: '10px', color: '#94A3B8' }}>32.1%</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>
                      <i data-lucide="credit-card" style={{ width: '14px' }}></i>
                      <span>Card</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>₹7,850</div>
                      <div style={{ fontSize: '10px', color: '#94A3B8' }}>24.2%</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#475569' }}>Total Collection</span>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: '#2563EB' }}>₹32,450.00</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: PRESCRIPTIONS LIST */}
        {activeTab === 'prescriptions' && (
          <div style={{ animation: 'slideUp 0.3s ease-out' }}>
            
            {/* Header and Filter Buttons Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Prescriptions List</h2>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                  <i data-lucide="calendar" style={{ width: '16px', color: '#64748B' }}></i>
                  24 May 2024
                </button>
                
                <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                  <i data-lucide="filter" style={{ width: '16px', color: '#64748B' }}></i>
                  Filter
                </button>
                
                <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', color: '#64748B', cursor: 'pointer' }}>
                  <i data-lucide="download" style={{ width: '16px' }}></i>
                </button>
              </div>
            </div>

            {/* Sub-Tab Filter Pills */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {[
                { key: 'All', count: prescriptions.length + 54 },
                { key: 'Pending', count: prescriptions.filter(p => p.status === 'Pending Pharmacy Dispatch').length + 20 },
                { key: 'In Progress', count: 15 },
                { key: 'Dispensed', count: prescriptions.filter(p => p.status === 'Dispensed').length + 32 },
                { key: 'Cancelled', count: 2 }
              ].map(item => {
                const isActive = prescriptionsFilter.toLowerCase() === item.key.toLowerCase();
                return (
                  <button
                    key={item.key}
                    onClick={() => setPrescriptionsFilter(item.key)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '24px',
                      border: isActive ? '1px solid #2563EB' : '1px solid #E2E8F0',
                      background: isActive ? '#EFF6FF' : 'white',
                      color: isActive ? '#2563EB' : '#64748B',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                  >
                    {item.key} ({item.count})
                  </button>
                );
              })}
            </div>

            {/* Prescriptions Database Table */}
            <div className="glass-card" style={{ padding: '0 24px 24px 24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th style={{ padding: '16px' }}>Prescription ID</th>
                      <th style={{ padding: '16px' }}>Patient</th>
                      <th style={{ padding: '16px' }}>Doctor</th>
                      <th style={{ padding: '16px' }}>Time</th>
                      <th style={{ padding: '16px', textAlign: 'center' }}>Items</th>
                      <th style={{ padding: '16px' }}>Amount</th>
                      <th style={{ padding: '16px' }}>Status</th>
                      <th style={{ padding: '16px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTabPrescriptions.map((p, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                          <span style={{ color: '#2563EB', fontWeight: 800, fontSize: '13.5px' }}>{p.id}</span>
                        </td>
                        
                        <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0F172A' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginTop: '2px' }}>{p.age} Y, {p.gender}</div>
                        </td>
                        
                        <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 800, fontSize: '13px', color: '#334155' }}>{p.docName}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginTop: '2px' }}>{p.specialty}</div>
                        </td>
                        
                        <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>{p.time}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginTop: '2px' }}>{p.dateStr}</div>
                        </td>
                        
                        <td style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
                          {p.items}
                        </td>
                        
                        <td style={{ padding: '16px', verticalAlign: 'middle', fontWeight: 800, fontSize: '13.5px', color: '#0F172A' }}>
                          {p.amount}
                        </td>
                        
                        <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                          <span 
                            className="pill-badge" 
                            style={{ 
                              background: p.status === 'Pending' ? '#FFF7ED' : p.status === 'In Progress' ? '#F5F3FF' : '#ECFDF5', 
                              color: p.status === 'Pending' ? '#EA580C' : p.status === 'In Progress' ? '#7C3AED' : '#10B981',
                              fontWeight: 700,
                              fontSize: '11px',
                              padding: '4px 10px',
                              borderRadius: '6px'
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                        
                        <td style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {p.status === 'Pending' ? (
                            <button 
                              className="btn-outline-dispense" 
                              style={{ 
                                border: '1px solid #2563EB', 
                                background: 'white', 
                                color: '#2563EB', 
                                fontWeight: 700, 
                                padding: '6px 16px', 
                                borderRadius: '8px', 
                                fontSize: '12.5px', 
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                outline: 'none'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#2563EB';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.color = '#2563EB';
                              }}
                              onClick={() => {
                                if (p.rawObj) {
                                  dispensePrescription(p.rawObj._id);
                                } else {
                                  setSuccessMessage('Prescription Dispensed Successfully (Mock)');
                                  setTimeout(() => setSuccessMessage(''), 3000);
                                }
                              }}
                            >
                              Dispense
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>
                              <i data-lucide="check" style={{ width: '14px', marginRight: '4px', verticalAlign: 'middle', color: '#10B981' }}></i>
                              Fulfilled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>Showing 1 to 8 of 58 prescriptions</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <i data-lucide="chevron-left" style={{ width: '16px', color: '#64748B', cursor: 'pointer' }}></i>
                  <span style={{ width: '28px', height: '28px', background: '#2563EB', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 700 }}>1</span>
                  <span style={{ width: '28px', height: '28px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 700 }}>2</span>
                  <span style={{ width: '28px', height: '28px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 700 }}>3</span>
                  <span style={{ color: '#94A3B8', fontSize: '12.5px', fontWeight: 700 }}>...</span>
                  <span style={{ width: '28px', height: '28px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 700 }}>8</span>
                  <i data-lucide="chevron-right" style={{ width: '16px', color: '#64748B', cursor: 'pointer' }}></i>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: INVENTORY MANAGEMENT */}
        {activeTab === 'inventory' && (
          <div style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', margin: 0 }}>Pharmacy Catalog</h2>
              <button 
                className="btn btn-primary" 
                style={{ padding: '10px 20px', fontSize: '13px', borderRadius: '10px', background: '#2563EB', border: 'none', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                onClick={handleOpenAdd}
              >
                <i data-lucide="plus" style={{ width: '16px' }}></i> Add Medication
              </button>
            </div>

            <div className="glass-card">
              <div style={{ overflowX: 'auto' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Category</th>
                      <th>SKU Code</th>
                      <th>Stock Quantity</th>
                      <th>Unit</th>
                      <th>MRP (₹)</th>
                      <th>Expiry</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(inv => (
                      <tr key={inv._id}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0F172A' }}>{inv.name}</div>
                        </td>
                        <td style={{ fontWeight: 600, color: '#64748B' }}>{inv.category}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>{inv.sku}</td>
                        <td>
                          <b style={{ color: inv.stock > 20 ? '#10B981' : '#EF4444', fontWeight: 800 }}>
                            {inv.stock}
                          </b>
                        </td>
                        <td style={{ fontWeight: 600, color: '#64748B' }}>{inv.unit}</td>
                        <td style={{ fontWeight: 800, color: '#0F172A' }}>₹{inv.mrp ? inv.mrp.toFixed(2) : '0.00'}</td>
                        <td style={{ fontWeight: 600, color: '#475569' }}>{inv.expiry}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #E2E8F0', background: 'transparent', color: '#475569', fontWeight: 700, cursor: 'pointer' }} 
                              onClick={() => handleOpenEdit(inv)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #FEE2E2', background: 'transparent', color: '#EF4444', fontWeight: 700, cursor: 'pointer' }} 
                              onClick={() => handleDeleteMedicine(inv._id)}
                            >
                              Delete
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

        {/* TAB 4: INTERNAL REQUESTS */}
        {activeTab === 'internal' && (
          <div style={{ animation: 'slideUp 0.3s ease-out' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginBottom: '24px' }}>Internal Clinic Requests</h2>
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <i data-lucide="git-pull-request" style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#2563EB' }}></i>
              <h3>Reagent & Stock Indents</h3>
              <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 20px' }}>Review and fulfill internal medicine indents and consumable supplies requested from Lab, Doctor consult chambers, or Ward nurses.</p>
              <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 700 }}>No active internal requests pending for this shift.</span>
            </div>
          </div>
        )}

        {/* TAB 5: SALES LOG */}
        {activeTab === 'sales' && (
          <div style={{ animation: 'slideUp 0.3s ease-out' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginBottom: '24px' }}>Sales & Settlement Logs</h2>
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <i data-lucide="credit-card" style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#2563EB' }}></i>
              <h3>Today's Billing Batches</h3>
              <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 20px' }}>Monitor live billing settlements, download invoice drafts, and review total daily collections isolated to the active hospital branch.</p>
              <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px', borderRadius: '10px', background: '#2563EB', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                <i data-lucide="download" style={{ width: '16px', marginRight: '6px' }}></i> Export Transaction Report
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: RETURNS */}
        {activeTab === 'returns' && (
          <div style={{ animation: 'slideUp 0.3s ease-out' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginBottom: '24px' }}>Returns & Expiries</h2>
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <i data-lucide="refresh-cw" style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#EA580C' }}></i>
              <h3>Medication Returns</h3>
              <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 20px' }}>Log patient returns or initiate supplier chargebacks for batch expiries. Standard DPDP compliance logs are recorded automatically.</p>
              <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 700 }}>No medication return logs created today.</span>
            </div>
          </div>
        )}

        {/* TAB 7: REPORTS */}
        {activeTab === 'reports' && (
          <div style={{ animation: 'slideUp 0.3s ease-out' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginBottom: '24px' }}>Pharmacy Analytics & Reports</h2>
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <i data-lucide="trending-up" style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#2563EB' }}></i>
              <h3>Download CSV Reports</h3>
              <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 20px' }}>Compile complete records of inventories, stock movements, purchase orders, and sales receipts scoped to this clinical tenant.</p>
              <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px', borderRadius: '10px', background: '#2563EB', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                <i data-lucide="download" style={{ width: '16px', marginRight: '6px' }}></i> Generate CSV
              </button>
            </div>
          </div>
        )}

        {/* TAB 8: PROFILE */}
        {activeTab === 'profile-tab' && (
          <div style={{ animation: 'slideUp 0.3s ease-out' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginBottom: '24px' }}>Staff Profile</h2>
            <div className="glass-card" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <img 
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80" 
                alt="Pharmacist Avatar" 
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #EFF6FF' }} 
              />
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>{user.name}</h3>
                <p style={{ margin: '4px 0 12px', fontSize: '13px', color: '#64748B', fontWeight: 700 }}>Pharmacy Operations Manager</p>
                <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                  <div>Email: <b>{user.email || 'ankit.sharma@medicore.com'}</b></div>
                  <div style={{ marginTop: '4px' }}>Shift Status: <span style={{ color: '#10B981', fontWeight: 800 }}>Active Shift</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Unified Manage Medicine Modal */}
      {showMedicineModal && (
        <div className="modal-overlay" data-lenis-prevent onClick={() => setShowMedicineModal(false)}>
          <div className="modal-box glass-card" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', background: 'white', padding: '28px 28px 20px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <style>{`
              .modal-scroll-body::-webkit-scrollbar {
                width: 6px;
              }
              .modal-scroll-body::-webkit-scrollbar-track {
                background: transparent;
              }
              .modal-scroll-body::-webkit-scrollbar-thumb {
                background: #CBD5E1;
                border-radius: 3px;
              }
              .modal-scroll-body::-webkit-scrollbar-thumb:hover {
                background: #94A3B8;
              }
            `}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1D23', margin: 0 }}>
                {modalMode === 'add' ? 'Add New Medicine' : modalMode === 'restock' ? 'Restock Medicine' : 'Edit Medicine Details'}
              </h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }} onClick={() => setShowMedicineModal(false)}>
                <i data-lucide="x" style={{ width: '20px', height: '20px' }}></i>
              </button>
            </div>

            <form onSubmit={handleSaveMedicine} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Scrollable Form Fields Body */}
              <div className="modal-scroll-body" data-lenis-prevent style={{ overflowY: 'auto', flex: 1, paddingRight: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
                {modalMode !== 'restock' ? (
                <>
                  {/* Premium Scanner Toolbar */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
                    <button 
                      type="button" 
                      onClick={isWebcamScanning ? stopWebcamScanner : startWebcamScanner} 
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        height: '42px', 
                        borderRadius: '10px', 
                        border: '1px solid #E2E8F0', 
                        background: isWebcamScanning ? '#FFF1F2' : '#F0F9FF', 
                        color: isWebcamScanning ? '#E11D48' : '#0284C7', 
                        fontWeight: 700, 
                        fontSize: '12.5px', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s' 
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      {isWebcamScanning ? 'Stop Camera Scanning' : 'Scan with Webcam'}
                    </button>
                  </div>

                  {/* Live Webcam Scanner Reader Viewport */}
                  {isWebcamScanning && (
                    <div style={{ marginBottom: '16px', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', background: '#F8FAFC', flexShrink: 0 }}>
                      <style>{`
                        @keyframes scanLineMove {
                          0% { top: 25%; }
                          50% { top: 75%; }
                          100% { top: 25%; }
                        }
                      `}</style>
                      <div style={{ padding: '8px 12px', background: '#F1F5F9', fontSize: '11px', fontWeight: 700, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Webcam Barcode Scan View</span>
                        <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'pulse 1s infinite' }}></span> Active Camera
                        </span>
                      </div>
                      {/* Resilient video track container wrapper */}
                      <div style={{ width: '100%', minHeight: '220px', background: '#000', position: 'relative' }}>
                        {/* Pure mount container for html5-qrcode video track */}
                        <div id="barcode-webcam-reader" style={{ width: '100%' }}></div>
                        
                        {/* Glowing red laser scanning animation line overlays cleanly on top */}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '10%',
                          width: '80%',
                          height: '2px',
                          background: '#EF4444',
                          boxShadow: '0 0 10px #EF4444, 0 0 4px #EF4444',
                          zIndex: 10,
                          pointerEvents: 'none',
                          animation: 'scanLineMove 2.2s infinite ease-in-out'
                        }}></div>
                      </div>
                    </div>
                  )}
                  {/* Debug status bar */}
                  {scanDebugLog && (
                    <div style={{ padding: '8px 12px', marginBottom: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: '#92400E', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      🔬 {scanDebugLog}
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>Medicine Name</label>
                    <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>Category</label>
                      <select className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: 'white' }}>
                        <option value="Pain Relief">Pain Relief</option>
                        <option value="Antibiotic">Antibiotic</option>
                        <option value="Anti-Allergic">Anti-Allergic</option>
                        <option value="Antacid">Antacid</option>
                        <option value="Cough Syrup">Cough Syrup</option>
                        <option value="Vitamins">Vitamins</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>SKU Code (or scan physical gun)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formData.sku} 
                        onChange={e => setFormData({...formData, sku: e.target.value})} 
                        onKeyDown={handleSkuKeyDown}
                        placeholder="Scan or Enter barcode"
                        required 
                        style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', outline: 'none' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>Unit Type</label>
                      <select className="form-control" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} required style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: 'white' }}>
                        <option value="Strip">Strip</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Bottle">Bottle</option>
                        <option value="Tablet">Tablet</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>MRP (₹)</label>
                      <input type="number" step="0.01" className="form-control" value={formData.mrp} onChange={e => setFormData({...formData, mrp: Number(e.target.value)})} required style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', outline: 'none' }} />
                    </div>
                  </div>
                </>
              ) : null}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>
                    {modalMode === 'restock' ? 'New Stock Quantity' : 'Initial Stock'}
                  </label>
                  <input type="number" className="form-control" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} required style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', outline: 'none' }} />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>Expiry Date</label>
                  <input type="text" className="form-control" placeholder="DD/MM/YYYY" value={formData.expiry} onChange={e => setFormData({...formData, expiry: e.target.value})} required style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>

              </div>

              {/* Sticky Action Footer */}
              <div style={{ display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px solid #F1F5F9', flexShrink: 0 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', height: '48px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'transparent', color: '#64748B', fontWeight: 700, cursor: 'pointer' }} onClick={() => setShowMedicineModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', height: '48px', borderRadius: '12px', background: '#2563EB', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  {modalMode === 'add' ? 'Add Medicine' : modalMode === 'restock' ? 'Verify Restock' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PharmacyDashboard;
