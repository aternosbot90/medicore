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
        content.innerHTML = `
            <div class="profile-modal animate-in" style="width:500px;">
                <div style="padding: 32px; border-bottom: 1px solid var(--border); display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <h2 style="font-size:20px; font-weight:800;">Book Appointment</h2>
                        <p style="font-size:13px; color:var(--text-muted);">${doctorName}</p>
                    </div>
                    <button class="btn btn-secondary" style="padding:8px;" onclick="MediCore.closeProfile()"><i data-lucide="x" style="width:18px;"></i></button>
                </div>
                <div style="padding:32px;">
                    <div class="form-group">
                        <label>Preferred Date</label>
                        <input type="date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Available Slots</label>
                        <div class="slot-grid">
                            <div class="slot-btn active">09:00 AM</div>
                            <div class="slot-btn">10:30 AM</div>
                            <div class="slot-btn">12:00 PM</div>
                            <div class="slot-btn">02:30 PM</div>
                            <div class="slot-btn">04:00 PM</div>
                            <div class="slot-btn">05:30 PM</div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Visit Type</label>
                        <div style="display:flex; gap:12px;">
                            <label style="flex:1; padding:12px; border:1px solid var(--border); border-radius:12px; display:flex; align-items:center; gap:8px; cursor:pointer;">
                                <input type="radio" name="visitType" checked> <span>Physical</span>
                            </label>
                            <label style="flex:1; padding:12px; border:1px solid var(--border); border-radius:12px; display:flex; align-items:center; gap:8px; cursor:pointer;">
                                <input type="radio" name="visitType"> <span>Video</span>
                            </label>
                        </div>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label>Reason for Visit</label>
                        <textarea class="form-control" placeholder="Briefly describe your concern..." style="min-height:80px;"></textarea>
                    </div>
                    <button class="btn btn-primary" style="width:100%; margin-top:32px; height:54px; justify-content:center;" onclick="MediCore.confirmBooking('${doctorName}')">
                        Confirm Appointment
                    </button>
                </div>
            </div>
        `;
        if(window.lucide) lucide.createIcons();
        // Add click listener for slots
        document.querySelectorAll('.slot-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    },

    confirmBooking: (doctorName) => {
        const time = document.querySelector('.slot-btn.active').innerText;
        MediCore.saveAppointment("Johnathan Doe", doctorName, time);
        alert(`Appointment confirmed with ${doctorName} at ${time}!`);
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
    setupNavigation: () => {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.onclick = (e) => {
                const tabId = link.dataset.tab;
                if (!tabId) return;
                e.preventDefault();
                
                // If switching away from consultation, hide the consultation nav link if it's not active
                if (tabId !== 'consultation') {
                    // document.getElementById('nav-consultation').style.display = 'none';
                }

                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                
                const targetTab = document.getElementById(tabId);
                if (targetTab) targetTab.classList.add('active');
                link.classList.add('active');
                
                if (window.lucide) lucide.createIcons();
                
                // Refresh specific tab data
                if (tabId === 'livequeue') MediCore.renderFullQueue();
                if (tabId === 'dash') MediCore.renderDashboardData();
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

    renderDashboardData: () => {
        // Render Top 5 Appointments
        const topList = document.getElementById('topAppointmentsList');
        if (topList) {
            topList.innerHTML = MediCore.mockQueue.slice(0, 5).map(p => `
                <tr>
                    <td style="color:var(--primary); font-weight:700;">10:30 AM</td>
                    <td><b>${p.name}</b></td>
                    <td>#${p.id}</td>
                    <td><span class="status-badge available">Confirmed</span></td>
                </tr>
            `).join('');
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

    renderFullQueue: () => {
        const fullList = document.getElementById('fullLiveQueueList');
        if (!fullList) return;
        fullList.innerHTML = MediCore.mockQueue.map(p => `
            <tr>
                <td><b>#${p.id}</b></td>
                <td><b>${p.name}</b></td>
                <td>${p.age} / ${p.gender}</td>
                <td>${p.wait}</td>
                <td><span class="status-badge pending">${p.status}</span></td>
                <td><button class="btn btn-primary" onclick="MediCore.startConsultation('${p.id}')">Start Consultation</button></td>
            </tr>
        `).join('');
    },

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

    // Consultation Tab Switching (Internal)
    switchConsultTab: function(tabBtn, contentId) {
        document.querySelectorAll('.consult-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.consult-content').forEach(c => c.classList.remove('active'));

        tabBtn.classList.add('active');
        document.getElementById(contentId).classList.add('active');
        
        if (window.lucide) lucide.createIcons();
    }
};

MediCore.init();
