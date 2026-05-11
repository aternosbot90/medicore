/**
 * MediCore Master Workflow - Elite Professional Suite
 */

const MediCore = {
    doctors: [
        { 
            id: 1, 
            name: "Dr. William Harrison", 
            specialty: "Cardiology Specialist", 
            available: true, 
            image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400&h=400", 
            exp: "12 Years", 
            rating: "4.9", 
            patients: "2.4K", 
            bio: "Dr. William is a board-certified Cardiologist specializing in interventional cardiology and structural heart disease. He has performed over 1,000 successful procedures."
        },
        { 
            id: 2, 
            name: "Dr. Victoria Adams", 
            specialty: "Senior Urologist", 
            available: false, 
            image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400&h=400", 
            exp: "8 Years", 
            rating: "4.8", 
            patients: "1.2K", 
            bio: "Dr. Victoria leads the urology department with a focus on minimally invasive robotic surgery and oncology."
        },
        { 
            id: 3, 
            name: "Dr. Jonathan Bennett", 
            specialty: "Diagnostic Radiologist", 
            available: true, 
            image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400&h=400", 
            exp: "15 Years", 
            rating: "5.0", 
            patients: "3.1K", 
            bio: "With over 15 years in diagnostic imaging, Dr. Jonathan is a pioneer in early-stage detection using AI-assisted radiology."
        },
        { 
            id: 4, 
            name: "Dr. Natalie Brooks", 
            specialty: "ENT Surgeon", 
            available: true, 
            image: "https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=400&h=400", 
            exp: "10 Years", 
            rating: "4.7", 
            patients: "1.8K", 
            bio: "Dr. Natalie is an expert in micro-surgery and pediatric ENT cases, known for her gentle approach and high precision."
        }
    ],
    selectedVariant: null,

    saveAppointment: (pName, dName, time, status = "Confirmed") => {
        const apps = JSON.parse(localStorage.getItem('mc_appointments')) || [];
        apps.push({ 
            id: "#MC-" + Math.floor(1000+Math.random()*9000), 
            patient: pName, 
            doctor: dName, 
            time: time, 
            status: status 
        });
        localStorage.setItem('mc_appointments', JSON.stringify(apps));
    },

    getAppointments: () => JSON.parse(localStorage.getItem('mc_appointments')) || [],

    // ELITE PROFILE SYSTEM
    openDoctorProfile: (docId) => {
        const doc = MediCore.doctors.find(d => d.id === docId);
        if(!doc) return;

        const overlay = document.getElementById('profileOverlay');
        const content = document.getElementById('profileContent');
        
        content.innerHTML = `
            <div class="profile-modal">
                <div class="profile-header">
                    <img src="${doc.image}" style="width:120px; height:120px; border-radius:20px; border:4px solid white; object-fit:cover;">
                    <div>
                        <h2 style="font-size:28px; font-weight:800;">${doc.name}</h2>
                        <p style="opacity:0.9;">${doc.specialty}</p>
                    </div>
                </div>
                <div class="profile-body">
                    <div style="display:flex; gap:12px; margin-bottom:24px;">
                        <div class="info-pill"><i data-lucide="award"></i> ${doc.exp} Exp</div>
                        <div class="info-pill"><i data-lucide="star"></i> ${doc.rating} Rating</div>
                        <div class="info-pill"><i data-lucide="users"></i> ${doc.patients} Patients</div>
                    </div>
                    <h3 style="margin-bottom:12px;">Clinical Background</h3>
                    <p style="color:var(--text-muted); line-height:1.6; margin-bottom:32px;">${doc.bio}</p>
                    <div style="display:flex; gap:16px;">
                        <button class="btn btn-secondary" style="flex:1;" onclick="MediCore.closeProfile()">Close</button>
                        <button class="btn btn-primary" style="flex:1;" onclick="MediCore.bookFromProfile('${doc.name}')">Book Appointment</button>
                    </div>
                </div>
            </div>
        `;
        overlay.style.display = 'flex';
        lucide.createIcons();
    },

    closeProfile: () => { document.getElementById('profileOverlay').style.display = 'none'; },

    bookFromProfile: (name) => {
        MediCore.openBookingForm(name);
    },

    openBookingForm: (doctorName) => {
        const content = document.getElementById('profileContent');
        const docOptions = MediCore.doctors.map(d => `<option value="${d.name}" ${d.name === doctorName ? 'selected' : ''}>${d.name} (${d.specialty})</option>`).join('');
        
        content.innerHTML = `
            <div class="profile-modal animate-in" style="width:500px;">
                <div style="padding: 24px 32px; border-bottom: 1px solid var(--border); display:flex; align-items:center; justify-content:space-between; background: var(--primary-gradient); border-radius: 20px 20px 0 0; color: white;">
                    <div>
                        <h2 style="font-size:20px; font-weight:800; margin:0;">Book Appointment</h2>
                        <p style="font-size:13px; opacity:0.8; margin:4px 0 0;">Fill in the details to schedule a visit</p>
                    </div>
                    <button class="btn" style="padding:8px; background:rgba(255,255,255,0.2); border:none; color:white;" onclick="MediCore.closeProfile()"><i data-lucide="x" style="width:18px;"></i></button>
                </div>
                <div style="padding:32px;">
                    <div class="form-group">
                        <label style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; display:block;">Patient Name</label>
                        <input type="text" id="bookPatientName" class="form-control" placeholder="Enter full name" style="height:48px; border-radius:12px; font-weight:600;">
                    </div>
                    <div class="form-group">
                        <label style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; display:block;">Consulting Doctor</label>
                        <select id="bookDoctorName" class="form-control" style="height:48px; border-radius:12px; font-weight:600; appearance: none; background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 16px center; background-size: 16px;">
                            ${docOptions}
                        </select>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                        <div class="form-group">
                            <label style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; display:block;">Preferred Date</label>
                            <input type="date" id="bookDate" class="form-control" value="${new Date().toISOString().split('T')[0]}" style="height:48px; border-radius:12px; font-weight:600;">
                        </div>
                        <div class="form-group">
                            <label style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; display:block;">Visit Type</label>
                            <select id="bookVisitType" class="form-control" style="height:48px; border-radius:12px; font-weight:600;">
                                <option>Physical Visit</option>
                                <option>Video Consultation</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; display:block;">Available Slots</label>
                        <div class="slot-grid" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;">
                            <div class="slot-btn active">09:00 AM</div>
                            <div class="slot-btn">10:30 AM</div>
                            <div class="slot-btn">12:00 PM</div>
                            <div class="slot-btn">02:30 PM</div>
                            <div class="slot-btn">04:00 PM</div>
                            <div class="slot-btn">05:30 PM</div>
                        </div>
                    </div>
                    <button class="btn btn-primary" style="width:100%; margin-top:12px; height:54px; justify-content:center; border-radius:14px; font-weight:800; font-size:16px; background:var(--primary-gradient); box-shadow: 0 8px 20px rgba(59, 113, 254, 0.25);" onclick="MediCore.confirmBooking()">
                        Confirm Appointment
                    </button>
                </div>
            </div>
        `;
        if(window.lucide) lucide.createIcons();
        document.querySelectorAll('.slot-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    },

    confirmBooking: () => {
        const pName = document.getElementById('bookPatientName').value;
        const dName = document.getElementById('bookDoctorName').value;
        const date = document.getElementById('bookDate').value;
        const time = document.querySelector('.slot-btn.active').innerText;
        
        if(!pName) {
            alert("Please enter patient name");
            return;
        }

        MediCore.saveAppointment(pName, dName, `${date} ${time}`);
        alert(`Appointment confirmed for ${pName} with ${dName} at ${time}!`);
        MediCore.closeProfile();
    },

    renderAvailability: (targetId) => {
        const list = document.getElementById(targetId);
        if (!list) return;
        list.innerHTML = MediCore.doctors.map(doc => `
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${doc.image}" style="width:40px; height:40px; border-radius:10px; object-fit:cover;">
                    <div><div style="font-weight:700; font-size:14px;">${doc.name}</div><div style="font-size:12px; color:#64748B;">${doc.specialty}</div></div>
                </div>
                <span class="status-badge ${doc.available ? 'available' : 'unavailable'}">${doc.available ? 'On duty' : 'Off duty'}</span>
            </div>
        `).join('');
    },

    renderHospitalSchedule: (targetId, doctorName = null) => {
        const tbody = document.getElementById(targetId);
        if (!tbody) return;
        let apps = MediCore.getAppointments();
        if (doctorName) apps = apps.filter(a => a.doctor === doctorName);
        
        // Ensure we have data or show a fallback row
        if (apps.length === 0) {
            apps = [{ time: "10:30 AM", patient: "Johnathan Doe", doctor: "Dr. William Harrison", status: "Confirmed" }];
        }
        
        tbody.innerHTML = apps.map(app => {
            const pName = app.patient || "Unknown Patient";
            const dName = app.doctor || "Unassigned";
            const initials = pName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const statusClass = app.status === 'Critical' ? 'critical' : (app.status === 'Paid' || app.status === 'Confirmed' ? 'available' : 'pending');
            
            return `
                <tr class="animate-in" style="cursor:pointer;" onclick="MediCore.handleRowClick('${pName}')">
                    <td style="color:var(--primary); font-weight:700;">${app.time || '--:--'}</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:32px; height:32px; border-radius:8px; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px;">
                                ${initials}
                            </div>
                            <b>${pName}</b>
                        </div>
                    </td>
                    <td style="color:var(--text-muted);">${dName}</td>
                    <td><span class="status-badge ${statusClass}">${app.status || 'Confirmed'}</span></td>
                </tr>
            `;
        }).join('');
    },

    // 7-PAGE NAVIGATION & FLOW
    switchTab: (tabId) => {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        // Show target tab
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
            
            // Try to find and activate corresponding sidebar link
            const correspondingLink = document.querySelector(`.nav-link[data-tab="${tabId}"]`);
            if (correspondingLink) {
                correspondingLink.classList.add('active');
            }
        }

        if (window.lucide) lucide.createIcons();
        
        // Refresh specific tab data
        if (tabId === 'appointments') MediCore.renderFullQueue();
        if (tabId === 'patients') MediCore.renderPatients();
        if (tabId === 'lab-reports') MediCore.renderLabReports();
        if (tabId === 'prescriptions') MediCore.renderPrescriptionBuilder();
        if (tabId === 'dash') MediCore.renderDashboardData();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    setupNavigation: () => {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.onclick = (e) => {
                const tabId = link.dataset.tab;
                if (!tabId) return;
                e.preventDefault();
                MediCore.switchTab(tabId);
            };
        });
    },

    // DASHBOARD & QUEUE DATA
    mockQueue: [
        { id: 'A-42', name: 'Johnathan Doe', age: 42, gender: 'Male', wait: '12 min', status: 'Waiting', abha: '91-8821-2291-0112' },
        { id: 'A-43', name: 'Sarah Jenkins', age: 31, gender: 'Female', wait: '18 min', status: 'Waiting', abha: '91-1234-5678-9012' },
        { id: 'A-44', name: 'Robert Smith', age: 55, gender: 'Male', wait: '5 min', status: 'Waiting', abha: '91-9876-5432-1098' },
        { id: 'A-45', name: 'Emily Davis', age: 28, gender: 'Female', wait: '22 min', status: 'Waiting', abha: '91-5544-3322-1100' },
        { id: 'A-46', name: 'Michael Brown', age: 47, gender: 'Male', wait: '10 min', status: 'Waiting', abha: '91-1122-3344-5566' }
    ],
    
    mockLabReports: [
        { id: 'LAB-9921', name: 'Johnathan Doe', age: 42, gender: 'Male', test: 'Lipid Profile', date: '24 May 2024', status: 'Ready' },
        { id: 'LAB-9918', name: 'Sarah Jenkins', age: 31, gender: 'Female', test: 'CBC with ESR', date: '23 May 2024', status: 'Processing' },
        { id: 'LAB-9915', name: 'Robert Smith', age: 55, gender: 'Male', test: 'Liver Function Test', date: '22 May 2024', status: 'Ready' },
        { id: 'LAB-9912', name: 'Emily Davis', age: 28, gender: 'Female', test: 'Thyroid Profile', date: '21 May 2024', status: 'Ready' }
    ],

    renderDashboardData: () => {
        // Render Top 5 Appointments
        const topList = document.getElementById('topAppointmentsList');
        if (topList) {
            topList.innerHTML = MediCore.mockQueue.slice(0, 5).map(p => {
                const initials = p.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                return `
                    <tr>
                        <td><b style="color:var(--primary);">10:30 AM</b></td>
                        <td>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:36px; height:36px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px;">
                                    ${initials}
                                </div>
                                <div>
                                    <div style="font-weight:700;">${p.name}</div>
                                    <div style="font-size:11px; color:var(--text-muted);">ABHA: ${p.abha}</div>
                                </div>
                            </div>
                        </td>
                        <td><span style="font-size:12px; font-weight:700; color:#64748B;">Routine Checkup</span></td>
                        <td><span class="status-badge available" style="font-size:10px;">Confirmed</span></td>
                        <td><button class="btn btn-secondary" style="padding:6px 12px; font-size:11px;" onclick="MediCore.startConsultation('${p.id}')">View Case</button></td>
                    </tr>
                `;
            }).join('');
        }

        // Render Live Queue Panel (Right side)
        const queuePanel = document.getElementById('liveQueuePanel');
        if (queuePanel) {
            queuePanel.innerHTML = MediCore.mockQueue.slice(0, 3).map(p => `
                <div style="padding:16px; background:var(--bg-main); border-radius:16px; border:1px solid var(--border);">
                    <div class="flex-between" style="margin-bottom:8px;">
                        <span style="font-weight:800; font-size:14px;">#${p.id} | ${p.name}</span>
                        <span style="font-size:11px; color:var(--text-muted); font-weight:700;">${p.wait}</span>
                    </div>
                    <div class="flex-between">
                        <span style="font-size:11px; color:var(--text-muted);">${p.age} yrs • ${p.gender}</span>
                        <button class="btn btn-primary" style="padding:4px 12px; font-size:11px;" onclick="MediCore.startConsultation('${p.id}')">Start</button>
                    </div>
                </div>
            `).join('');
        }
    },
    renderLabReports: () => {
        const list = document.getElementById('labReportsList');
        if (!list) return;
        list.innerHTML = MediCore.mockLabReports.map((r, i) => {
            const initials = r.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const colors = ['#F0F4FF', '#F0FFF4', '#FFFBEB', '#FFF5F5', '#F5F3FF'];
            const textColors = ['#3B71FE', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];
            const color = colors[i % colors.length];
            const textColor = textColors[i % textColors.length];
            return `
                <tr>
                    <td style="font-weight:700; color:var(--primary);">#${r.id}</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:36px; height:36px; border-radius:50%; background:${color}; color:${textColor}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px;">
                                ${initials}
                            </div>
                            <div>
                                <div style="font-weight:700;">${r.name}</div>
                                <div style="font-size:11px; color:var(--text-muted);">${r.age}Y / ${r.gender}</div>
                            </div>
                        </div>
                    </td>
                    <td><span style="font-weight:600;">${r.test}</span></td>
                    <td>${r.date}</td>
                    <td><span class="status-badge ${r.status === 'Ready' ? 'available' : 'pending'}">${r.status}</span></td>
                    <td><button class="btn btn-secondary" style="padding:6px 12px; font-size:11px;" ${r.status !== 'Ready' ? 'disabled' : ''}>View Report</button></td>
                </tr>
            `;
        }).join('');
        if (window.lucide) lucide.createIcons();
    },

    renderPatients: () => {
        const grid = document.getElementById('fullPatientGrid');
        if (!grid) return;
        grid.innerHTML = MediCore.mockQueue.map(p => {
            const initials = p.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            return `
                <div class="patient-card animate-in">
                    <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
                        <div style="width:52px; height:52px; border-radius:14px; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px;">
                            ${initials}
                        </div>
                        <div>
                            <div style="font-weight:800; font-size:16px; color:#1A1D23;">${p.name}</div>
                            <div style="font-size:12px; color:var(--text-muted); font-weight:600;">ABHA: ${p.abha}</div>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px;">
                        <div style="padding:10px; background:#F8FAFC; border-radius:12px;">
                            <div style="font-size:10px; color:var(--text-muted); font-weight:700; margin-bottom:4px;">AGE/GENDER</div>
                            <div style="font-size:13px; font-weight:700;">${p.age}Y / ${p.gender}</div>
                        </div>
                        <div style="padding:10px; background:#F8FAFC; border-radius:12px;">
                            <div style="font-size:10px; color:var(--text-muted); font-weight:700; margin-bottom:4px;">LAST VISIT</div>
                            <div style="font-size:13px; font-weight:700;">20 May 2024</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-secondary" style="flex:1; font-size:12px;" onclick="MediCore.startConsultation('${p.id}')">View EHR</button>
                        <button class="btn btn-primary" style="flex:1; font-size:12px;" onclick="MediCore.startConsultation('${p.id}')">Consult</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderFullQueue: () => {
        const fullList = document.getElementById('fullLiveQueueList');
        if (!fullList) return;
        fullList.innerHTML = MediCore.mockQueue.map(p => {
            const initials = p.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            return `
                <tr>
                    <td><b style="color:var(--primary);">#${p.id}</b></td>
                    <td>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:32px; height:32px; border-radius:8px; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px;">
                                ${initials}
                            </div>
                            <b>${p.name}</b>
                        </div>
                    </td>
                    <td>${p.age} / ${p.gender}</td>
                    <td>${p.wait}</td>
                    <td><span class="status-badge pending">${p.status}</span></td>
                    <td><button class="btn btn-primary" onclick="MediCore.startConsultation('${p.id}')">Start Consultation</button></td>
                </tr>
            `;
        }).join('');
    },

    renderPrescriptionBuilder: () => {
        const tbody = document.getElementById('prescriptionBuilderBody');
        if (!tbody) return;
        
        // Initial mock data for the builder as per image
        if (!MediCore.builderMeds || MediCore.builderMeds.length === 0) {
            MediCore.builderMeds = [
                { name: 'Paracetamol', dosage: '500 mg', freq: 'Twice a Day', dur: '5 Days', instr: 'After Food' },
                { name: 'Paracetamol', dosage: '500 mg', freq: 'Twice a Day', dur: '5 Days', instr: 'After Food' },
                { name: 'Paracetamol', dosage: '500 mg', freq: 'Twice a Day', dur: '5 Days', instr: 'After Food' }
            ];
        }
        
        MediCore.renderBuilderTable();
    },

    renderBuilderTable: () => {
        const container = document.getElementById('prescriptionBuilderBody');
        if (!container) return;
        
        container.innerHTML = MediCore.builderMeds.map((m, i) => `
            <div class="med-card ${i === 0 ? 'active' : ''}" style="display:grid; grid-template-columns: 36px 1.8fr 1fr 1.6fr 1fr 1.6fr 52px; gap:8px; align-items:center; padding:16px; background:white; border:1px solid #E2E8F0; border-radius:16px; transition:0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                <div style="text-align:center; font-weight:700; color:var(--text-muted);">${i + 1}</div>
                
                <!-- Medicine -->
                <div class="pill-input-box">
                    <input type="text" value="${m.name}" placeholder="Medicine">
                    <i data-lucide="chevron-down"></i>
                </div>

                <!-- Dosage -->
                <div class="pill-input-box">
                    <select>
                        <option>${m.dosage}</option>
                        <option>250 mg</option>
                        <option>650 mg</option>
                    </select>
                    <i data-lucide="chevron-down"></i>
                </div>

                <!-- Frequency -->
                <div class="pill-input-box">
                    <select>
                        <option>${m.freq}</option>
                        <option>Once a Day</option>
                        <option>Three Times a Day</option>
                    </select>
                    <i data-lucide="chevron-down"></i>
                </div>

                <!-- Duration -->
                <div class="pill-input-box">
                    <select>
                        <option>${m.dur}</option>
                        <option>3 Days</option>
                        <option>7 Days</option>
                    </select>
                    <i data-lucide="chevron-down"></i>
                </div>

                <!-- Instructions -->
                <div class="pill-input-box">
                    <select>
                        <option>${m.instr}</option>
                        <option>Before Food</option>
                    </select>
                    <i data-lucide="chevron-down"></i>
                </div>

                <!-- Action -->
                <div style="text-align:right;">
                    <button class="med-delete-btn" onclick="MediCore.removeBuilderRow(${i})">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');
        if (window.lucide) lucide.createIcons();
    },

    addPrescriptionMedicineRow: () => {
        MediCore.builderMeds.push({ name: '', dosage: '500 mg', freq: 'Twice a Day', dur: '5 Days', instr: 'After Food' });
        MediCore.renderBuilderTable();
    },

    removeBuilderRow: (i) => {
        MediCore.builderMeds.splice(i, 1);
        MediCore.renderBuilderTable();
    },

    builderMeds: [],

    // CONSULTATION FLOW
    startNextConsultation: () => {
        if (MediCore.mockQueue.length > 0) {
            MediCore.startConsultation(MediCore.mockQueue[0].id);
        }
    },

    startConsultation: (patientId) => {
        const patient = MediCore.mockQueue.find(p => p.id === patientId);
        if (!patient) return;

        // Show Consultation Tab in Sidebar
        const navCons = document.getElementById('nav-consultation');
        navCons.style.display = 'flex';
        
        // Update Consultation UI with patient data
        document.getElementById('activePatientName').innerText = patient.name;
        document.getElementById('activePatientMeta').innerText = `${patient.age} yrs • ${patient.gender} • Token #${patient.id} • ABHA ID: ${patient.abha}`;
        
        // Switch to Consultation Tab
        navCons.click();
        
        // Reset Prescription Builder
        MediCore.consultationMeds = [
            { name: "Amlodipine 5mg", dosage: "1 tab", freq: "1-0-1", dur: "30 Days", instr: "After food" }
        ];
        MediCore.renderConsultationPrescription();
    },

    consultationMeds: [],
    renderConsultationPrescription: () => {
        const tbody = document.getElementById('consultationPrescriptionBody');
        if (!tbody) return;
        tbody.innerHTML = MediCore.consultationMeds.map((m, i) => `
            <tr>
                <td><input type="text" class="form-control" value="${m.name}" style="border:none; background:transparent; font-weight:700;"></td>
                <td><input type="text" class="form-control" value="${m.dosage}" style="border:none; background:transparent;"></td>
                <td><input type="text" class="form-control" value="${m.freq}" style="border:none; background:transparent;"></td>
                <td><input type="text" class="form-control" value="${m.dur}" style="border:none; background:transparent;"></td>
                <td><input type="text" class="form-control" value="${m.instr}" style="border:none; background:transparent;"></td>
                <td><button class="btn" style="color:var(--danger);" onclick="MediCore.removeMedicineRow(${i})"><i data-lucide="trash-2" style="width:16px;"></i></button></td>
            </tr>
        `).join('');
        if (window.lucide) lucide.createIcons();
    },

    addMedicineRow: () => {
        MediCore.consultationMeds.push({ name: "", dosage: "", freq: "", dur: "", instr: "" });
        MediCore.renderConsultationPrescription();
    },

    removeMedicineRow: (i) => {
        MediCore.consultationMeds.splice(i, 1);
        MediCore.renderConsultationPrescription();
    },

    saveConsultationDraft: () => {
        alert("Consultation draft saved successfully.");
    },

    finalizeConsultation: () => {
        const patientName = document.getElementById('activePatientName').innerText;
        const prescription = {
            id: 'RX-' + Math.floor(Math.random() * 9000 + 1000),
            doctor: 'Dr. Andrew Clark',
            patient: patientName,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toLocaleDateString(),
            medicines: MediCore.consultationMeds.filter(m => m.name !== '')
        };

        // Save to localStorage for Pharmacy real-time flow
        const pendingRx = JSON.parse(localStorage.getItem('mc_pending_prescriptions') || '[]');
        pendingRx.unshift(prescription);
        localStorage.setItem('mc_pending_prescriptions', JSON.stringify(pendingRx));

        alert("Prescription sent to Pharmacy successfully! Redirecting to Dashboard...");
        
        // Hide consultation nav and go back to dashboard
        document.getElementById('nav-consultation').style.display = 'none';
        document.querySelector('[data-tab=dash]').click();

        // Trigger custom event for real-time simulation if pharmacy page is open in another tab
        window.dispatchEvent(new Event('storage'));
    },

    // PHARMACY REAL-TIME SYNC
    renderPharmacyPending: () => {
        const grid = document.getElementById('pendingPrescriptionGrid');
        if (!grid) return;
        
        const pendingRx = JSON.parse(localStorage.getItem('mc_pending_prescriptions') || '[]');
        
        if (pendingRx.length === 0) {
            grid.innerHTML = '<div style="grid-column: span 2; padding: 40px; text-align:center; color:var(--text-muted);">No pending prescriptions from doctors.</div>';
            return;
        }

        grid.innerHTML = pendingRx.map(rx => `
            <div class="glass-card animate-in" style="padding:24px; border-left:4px solid var(--primary);">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:36px; height:36px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center;"><i data-lucide="user"></i></div>
                        <div>
                            <div style="font-weight:800; font-size:14px;">${rx.doctor}</div>
                            <div style="font-size:11px; color:var(--text-muted);">Patient: ${rx.patient}</div>
                        </div>
                    </div>
                    <span style="font-size:11px; color:var(--text-muted); font-weight:700;">${rx.time}</span>
                </div>
                
                <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:24px;">
                    ${rx.medicines.map(m => `
                        <div class="flex-between" style="background:#F8FAFC; padding:10px 16px; border-radius:12px;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <i data-lucide="pill" style="width:14px; color:var(--text-muted);"></i>
                                <span style="font-size:13px; font-weight:600;">${m.name} - ${m.dur}</span>
                            </div>
                            <span class="status-badge available" style="font-size:11px;">In Stock</span>
                        </div>
                    `).join('')}
                </div>
                
                <button class="btn btn-primary" style="width:100%; justify-content:center; height:48px;" onclick="MediCore.processPrescriptionUI('${rx.id}')">
                    Process & Dispense
                </button>
            </div>
        `).join('');
        if (window.lucide) lucide.createIcons();
    },

    processPrescriptionUI: (rxId) => {
        // In a real app, find rx from storage or API
        const modal = document.getElementById('pharmacyModal');
        if (!modal) return;
        modal.style.display = 'flex';
        
        // Handle Payment Method Selection UI
        const opts = document.querySelectorAll('.payment-opt');
        opts.forEach(opt => {
            opt.parentElement.onclick = () => {
                opts.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                // Simple style toggle
                opts.forEach(o => {
                    o.style.borderColor = 'var(--border)';
                    o.style.background = 'transparent';
                });
                opt.style.borderColor = 'var(--primary)';
                opt.style.background = 'var(--primary-light)';
                opt.parentElement.querySelector('input').checked = true;
            };
        });

        if (window.lucide) lucide.createIcons();
    },

    completePharmacyFlow: (rxId) => {
        const modal = document.getElementById('pharmacyModal');
        const invoice = document.getElementById('invoiceModal');
        
        if (modal) modal.style.display = 'none';
        if (invoice) invoice.style.display = 'flex';
        
        if (window.lucide) lucide.createIcons();

        // Simulate storage update if rxId exists
        if (rxId) {
            let pendingRx = JSON.parse(localStorage.getItem('mc_pending_prescriptions') || '[]');
            pendingRx = pendingRx.filter(r => r.id !== rxId);
            localStorage.setItem('mc_pending_prescriptions', JSON.stringify(pendingRx));
            if (MediCore.renderPharmacyPending) MediCore.renderPharmacyPending();
        }
    },

    // INITIALIZATION
    init: () => {
        setInterval(() => {
            const clock = document.getElementById('liveClock');
            if (clock) {
                const now = new Date();
                clock.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        }, 1000);

        window.onload = () => {
            if (window.lucide) lucide.createIcons();
            MediCore.setupNavigation();
            
            // Auto-load dashboard or pharmacy data based on page
            if (document.getElementById('dash') && window.location.href.includes('doctor.html')) {
                MediCore.renderDashboardData();
            }
            if (document.getElementById('pendingPrescriptionGrid') && window.location.href.includes('pharmacy.html')) {
                MediCore.renderPharmacyPending();
                // Simulated WebSocket: Listen for storage changes
                window.addEventListener('storage', () => {
                    MediCore.renderPharmacyPending();
                });
            }

            // Messages simulation
            const chatBox = document.getElementById('clinicalChatMessages');
            if (chatBox) {
                chatBox.innerHTML = `
                    <div style="padding:16px; margin:8px; background:white; border-radius:12px; align-self:flex-start; max-width:80%; border:1px solid var(--border);">
                        <b>Receptionist:</b> Dr. Clark, Patient Johnathan is waiting at the desk. Should I send him in?
                    </div>
                    <div style="padding:16px; margin:8px; background:var(--primary-light); color:var(--primary); border-radius:12px; align-self:flex-end; max-width:80%; font-weight:600;">
                        Yes, please send him in 2 minutes.
                    </div>
                `;
            }
        };
    },

    switchConsultTab: function(tabBtn, contentId) {
        document.querySelectorAll('.consult-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.consult-content').forEach(c => c.classList.remove('active'));

        tabBtn.classList.add('active');
        document.getElementById(contentId).classList.add('active');
        
        if (window.lucide) lucide.createIcons();
    },

    switchProfileTab: function(tabBtn, contentId) {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));

        tabBtn.classList.add('active');
        document.getElementById(contentId).classList.add('active');
        
        if (window.lucide) lucide.createIcons();
    },

    handleRowClick(patientName) {
        this.switchTab('patient-details');
    },

    toggleDropdown(id) {
        const container = document.getElementById(id);
        const options = container.querySelector('.dropdown-options-box');
        const trigger = container.querySelector('.custom-dropdown-trigger');
        const icon = trigger.querySelector('i');
        
        const isOpen = options.classList.contains('show');
        
        // Close all other dropdowns first
        document.querySelectorAll('.dropdown-options-box').forEach(box => box.classList.remove('show'));
        document.querySelectorAll('.custom-dropdown-trigger').forEach(trig => trig.classList.remove('active'));
        document.querySelectorAll('.custom-dropdown-trigger i').forEach(i => i.style.transform = 'rotate(0deg)');

        if (!isOpen) {
            options.classList.add('show');
            trigger.classList.add('active');
            icon.style.transform = 'rotate(180deg)';
        }
    },

    selectedSymptoms: [],
    selectSymptom(symptom) {
        if (this.selectedSymptoms.includes(symptom)) return;
        
        this.selectedSymptoms.push(symptom);
        this.renderSymptomTags();
    },

    removeSymptom(symptom) {
        this.selectedSymptoms = this.selectedSymptoms.filter(s => s !== symptom);
        this.renderSymptomTags();
    },

    renderSymptomTags() {
        const container = document.getElementById('selected-symptoms');
        if (this.selectedSymptoms.length === 0) {
            container.innerHTML = '<span style="color:#94A3B8; font-weight:500;">Type symptoms</span>';
            return;
        }
        
        container.innerHTML = this.selectedSymptoms.map(s => `
            <div class="symptom-tag">
                ${s}
                <i data-lucide="x" onclick="event.stopPropagation(); MediCore.removeSymptom('${s}')"></i>
            </div>
        `).join('');
        
        lucide.createIcons();
    }
};

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-dropdown-container')) {
        document.querySelectorAll('.dropdown-options-box').forEach(box => box.classList.remove('show'));
        document.querySelectorAll('.custom-dropdown-trigger').forEach(trig => trig.classList.remove('active'));
        document.querySelectorAll('.custom-dropdown-trigger i').forEach(i => i.style.transform = 'rotate(0deg)');
    }
});

MediCore.init();
