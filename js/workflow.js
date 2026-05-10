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

    setupNavigation: () => {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.onclick = (e) => {
                if (!link.dataset.tab) return;
                e.preventDefault();
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.getElementById(link.dataset.tab).classList.add('active');
                link.classList.add('active');
                if (window.lucide) lucide.createIcons();
            };
        });
    },

    // EMERGENCY FLOW LOGIC
    handleRowClick: (name) => {
        if(window.location.href.includes('doctor.html')) {
            MediCore.openConsultation('#MC-9921', name);
        } else {
            MediCore.viewPatientProfile(name);
        }
    },

    viewPatientProfile: (name) => {
        const overlay = document.getElementById('profileOverlay') || document.getElementById('registrationModal'); // Reuse overlay if needed or create new
        // For simplicity, I'll use the registrationModal but clear it for profile view if it exists, 
        // but better to have a dedicated profile modal.
        
        // I will create a dynamic modal for patient detail
        let modal = document.getElementById('patientDetailModal');
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'patientDetailModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-box" style="width: 800px; padding:0;">
                <div style="background:var(--primary-gradient); padding:32px; color:white; display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; align-items:center; gap:20px;">
                        <div style="width:64px; height:64px; border-radius:16px; background:rgba(255,255,255,0.2); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800;">
                            ${name.charAt(0)}
                        </div>
                        <div>
                            <h2 style="font-size:24px; font-weight:800;">${name}</h2>
                            <p style="opacity:0.8;">Patient Profile | ID: #MC-${Math.floor(Math.random()*9000)+1000}</p>
                        </div>
                    </div>
                    <button class="btn" style="background:rgba(255,255,255,0.2); color:white;" onclick="document.getElementById('patientDetailModal').style.display='none'">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div style="padding:32px; display:grid; grid-template-columns: 1fr 280px; gap:32px;">
                    <div>
                        <h3 style="margin-bottom:16px; font-size:16px;"><i data-lucide="activity"></i> Clinical Snapshot</h3>
                        <div class="kpi-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom:24px;">
                            <div class="vital-input"><label>Blood Pressure</label><b>128/84</b></div>
                            <div class="vital-input"><label>Pulse</label><b>76 bpm</b></div>
                            <div class="vital-input"><label>SPO2</label><b>98%</b></div>
                            <div class="vital-input"><label>Temp</label><b>98.4 F</b></div>
                        </div>

                        <h3 style="margin-bottom:16px; font-size:16px;"><i data-lucide="history"></i> Medical Timeline</h3>
                        <div style="border-left:2px solid var(--border); padding-left:20px; margin-left:10px;">
                            <div style="position:relative; margin-bottom:20px;">
                                <div style="position:absolute; left:-27px; top:0; width:12px; height:12px; border-radius:50%; background:var(--primary);"></div>
                                <div style="font-size:12px; font-weight:700;">TODAY - 02:30 PM</div>
                                <div style="font-size:14px;">Consultation with Dr. William Harrison (Cardiology)</div>
                            </div>
                            <div style="position:relative; margin-bottom:20px;">
                                <div style="position:absolute; left:-27px; top:0; width:12px; height:12px; border-radius:50%; background:var(--border);"></div>
                                <div style="font-size:12px; font-weight:700;">MAY 05, 2025</div>
                                <div style="font-size:14px;">Laboratory: Lipid Profile Report Uploaded</div>
                            </div>
                        </div>
                    </div>
                    <div style="border-left:1px solid var(--border); padding-left:32px;">
                        <h3 style="margin-bottom:16px; font-size:16px;">Quick Actions</h3>
                        <button class="btn btn-primary" style="width:100%; margin-bottom:12px; justify-content:center;"><i data-lucide="calendar"></i> Reschedule</button>
                        <button class="btn btn-secondary" style="width:100%; margin-bottom:12px; justify-content:center;"><i data-lucide="file-text"></i> View Reports</button>
                        <button class="btn btn-secondary" style="width:100%; margin-bottom:12px; justify-content:center;"><i data-lucide="credit-card"></i> Pay Dues</button>
                        <div style="margin-top:24px; padding:16px; background:var(--bg-main); border-radius:12px; text-align:center;">
                            <div style="font-size:11px; font-weight:700; color:var(--text-muted);">ABHA LINKED</div>
                            <div style="font-size:14px; font-weight:800; color:var(--success);">91-8821-2291-0112</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
        if(window.lucide) lucide.createIcons();
    },

    viewDoctorSchedule: (doctorName) => {
        let modal = document.getElementById('doctorScheduleModal');
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'doctorScheduleModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        const apps = MediCore.getAppointments().filter(a => a.doctor === doctorName);
        const appListHtml = apps.length > 0 
            ? apps.map(a => `
                <div style="padding:16px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <div style="font-weight:800;">${a.patient}</div>
                        <div style="font-size:12px; color:var(--text-muted);">${a.time}</div>
                    </div>
                    <span class="status-badge available" style="font-size:10px;">${a.status}</span>
                </div>
            `).join('')
            : '<div style="padding:40px; text-align:center; color:var(--text-muted);">No appointments found for today.</div>';

        modal.innerHTML = `
            <div class="modal-box" style="width: 500px; padding:0;">
                <div style="padding:24px; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:space-between;">
                    <h2 style="font-weight:800; font-size:20px;">Schedule: ${doctorName}</h2>
                    <button class="btn btn-secondary" onclick="document.getElementById('doctorScheduleModal').style.display='none'"><i data-lucide="x"></i></button>
                </div>
                <div style="max-height:400px; overflow-y:auto;">
                    ${appListHtml}
                </div>
                <div style="padding:24px; border-top:1px solid var(--border); text-align:center;">
                    <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="document.getElementById('doctorScheduleModal').style.display='none'; MediCore.openRegistration()">Book New Slot</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
        if(window.lucide) lucide.createIcons();
    },

    openEmergencyModal: () => {
        document.getElementById('emergencyModal').style.display = 'flex';
        MediCore.resetEmergencyForm();
    },
    closeEmergencyModal: () => {
        document.getElementById('emergencyModal').style.display = 'none';
    },
    resetEmergencyForm: () => {
        document.getElementById('emergencyStep1').style.display = 'block';
        document.getElementById('emergencyStep2').style.display = 'none';
        document.getElementById('eName').value = '';
        document.getElementById('eAge').value = '';
        document.getElementById('eComplaint').value = '';
        MediCore.selectedVariant = null;
        document.querySelectorAll('.emergency-variant-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('btnConfirmEmergency').disabled = true;
    },
    nextEmergencyStep: () => {
        if(!document.getElementById('eName').value) { alert("Please enter patient name"); return; }
        document.getElementById('emergencyStep1').style.display = 'none';
        document.getElementById('emergencyStep2').style.display = 'block';
        if(window.lucide) lucide.createIcons();
    },
    prevEmergencyStep: () => {
        document.getElementById('emergencyStep1').style.display = 'block';
        document.getElementById('emergencyStep2').style.display = 'none';
    },
    selectVariant: (v) => {
        MediCore.selectedVariant = v;
        document.querySelectorAll('.emergency-variant-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('variant' + v).classList.add('selected');
        document.getElementById('btnConfirmEmergency').disabled = false;
    },
    confirmEmergency: () => {
        const name = document.getElementById('eName').value;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const status = MediCore.selectedVariant === 'TreatFirst' ? 'Critical' : 'Paid';
        
        MediCore.saveAppointment(name, "Emergency Unit", time, status);
        alert(`Emergency Registered: ${MediCore.selectedVariant} Flow Activated`);
        MediCore.closeEmergencyModal();
        MediCore.renderHospitalSchedule('receptionSchedule');
        if(window.lucide) lucide.createIcons();
    },

    // REGISTRATION LOGIC
    openRegistration: () => {
        document.getElementById('registrationModal').style.display = 'flex';
    },
    saveRegistration: () => {
        const name = document.getElementById('regName').value;
        const phone = document.getElementById('regPhone').value;
        const age = document.getElementById('regAge').value;
        
        if(!name || !phone) {
            alert("Please enter Name and Phone Number");
            return;
        }

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        MediCore.saveAppointment(name, "Dr. William Harrison", time, "Confirmed");
        
        alert(`Patient ${name} registered successfully! Token generated for Dr. William Harrison.`);
        document.getElementById('registrationModal').style.display = 'none';
        
        // Reset form
        document.getElementById('regName').value = "";
        document.getElementById('regPhone').value = "";
        document.getElementById('regAge').value = "";
        
        MediCore.renderHospitalSchedule('receptionistQueue');
    },

    // EMERGENCY ALERTS FOR DOCTOR
    renderEmergencyAlerts: () => {
        const target = document.getElementById('emergencyAlertSection');
        if(!target) return;
        
        const apps = MediCore.getAppointments();
        const criticalApps = apps.filter(a => a.status === 'Critical' || a.doctor === 'Emergency Unit');
        
        if(criticalApps.length === 0) {
            target.innerHTML = '';
            return;
        }

        target.innerHTML = criticalApps.map(app => `
            <div class="emergency-alert-banner animate-in">
                <div style="display:flex; align-items:center; gap:24px;">
                    <div style="width:64px; height:64px; border-radius:18px; background:#DC2626; color:white; display:flex; align-items:center; justify-content:center; box-shadow: 0 8px 16px rgba(220, 38, 38, 0.3);">
                        <i data-lucide="alert-triangle" style="width:32px; height:32px;"></i>
                    </div>
                    <div>
                        <h3 style="color:#991B1B; font-weight:800; font-size:20px; margin-bottom:4px;">CRITICAL EMERGENCY: ${app.patient}</h3>
                        <p style="color:#B91C1C; font-size:15px; opacity:0.9;">Incoming at ${app.time} • Patient is in the Emergency Unit</p>
                    </div>
                </div>
                <button class="btn btn-emergency" style="padding:16px 32px; background:#DC2626; font-size:15px; border-radius:14px; box-shadow: 0 8px 20px rgba(220, 38, 38, 0.4);" onclick="MediCore.openConsultation('${app.id}', '${app.patient}')">
                    Attend Immediately
                </button>
            </div>
        `).join('');
        if(window.lucide) lucide.createIcons();
    },

    // CONSULTATION LOGIC
    openConsultation: (id, name) => {
        const modal = document.getElementById('consultationModal');
        if(!modal) return;
        document.getElementById('cPatientName').innerText = "Consultation: " + name;
        document.getElementById('cPatientMeta').innerText = "ID: #MC-9921 | Age: 42 | Gender: Male";
        modal.style.display = 'flex';
        MediCore.renderPrescription();
    },
    closeConsultation: () => {
        document.getElementById('consultationModal').style.display = 'none';
    },
    prescriptions: [
        { name: "Amlodipine", dosage: "5mg", freq: "1-0-1", dur: "30 Days" },
        { name: "Atorvastatin", dosage: "20mg", freq: "0-0-1", dur: "30 Days" }
    ],
    renderPrescription: () => {
        const tbody = document.getElementById('prescriptionBody');
        if(!tbody) return;
        tbody.innerHTML = MediCore.prescriptions.map((p, index) => `
            <tr>
                <td><input type="text" class="form-control" value="${p.name}" style="border:none; background:transparent; font-weight:700;"></td>
                <td><input type="text" class="form-control" value="${p.dosage}" style="border:none; background:transparent;"></td>
                <td><input type="text" class="form-control" value="${p.freq}" style="border:none; background:transparent;"></td>
                <td><input type="text" class="form-control" value="${p.dur}" style="border:none; background:transparent;"></td>
                <td><button class="btn" style="color:var(--danger); padding:4px;" onclick="MediCore.removePrescriptionRow(${index})"><i data-lucide="trash-2" style="width:18px;"></i></button></td>
            </tr>
        `).join('');
        if(window.lucide) lucide.createIcons();
    },
    addPrescriptionRow: () => {
        MediCore.prescriptions.push({ name: "", dosage: "", freq: "", dur: "" });
        MediCore.renderPrescription();
    },
    removePrescriptionRow: (index) => {
        MediCore.prescriptions.splice(index, 1);
        MediCore.renderPrescription();
    },
    finalizeConsultation: () => {
        alert("Consultation Finalized. Digital Prescription sent to Pharmacy and saved to Patient Vault.");
        MediCore.closeConsultation();
    },

    // PHARMACY LOGIC
    processPrescription: (id, name) => {
        const modal = document.getElementById('pharmacyModal');
        if(!modal) return;
        document.getElementById('pPatientName').innerText = "Process Rx: " + name;
        document.getElementById('pPatientId').innerText = "Patient ID: #MC-" + (Math.floor(Math.random()*9000)+1000);
        
        const medList = document.getElementById('pMedList');
        // Simulate meds and clinical context from doctor
        const meds = [
            { name: "Amlodipine 5mg", qty: "30 Tabs", stock: 450, status: "Low Stock" },
            { name: "Atorvastatin 20mg", qty: "15 Tabs", stock: 820, status: "In Stock" }
        ];

        medList.innerHTML = `
            <div style="background:var(--bg-main); border-radius:16px; padding:16px; margin-bottom:20px; border:1px solid var(--border);">
                <div style="font-size:11px; font-weight:700; color:var(--text-muted); margin-bottom:4px;">DOCTOR'S DIAGNOSIS</div>
                <div style="font-weight:700; color:var(--danger);">Hypertension & Hyperlipidemia</div>
            </div>
        ` + meds.map(m => `
            <div style="background:white; border:1px solid var(--border); border-radius:16px; padding:20px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-weight:800; font-size:16px;">${m.name}</div>
                    <div style="font-size:12px; color:var(--text-muted);">Quantity: ${m.qty}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:11px; font-weight:700; margin-bottom:4px; color:${m.stock < 500 ? '#D97706' : '#059669'}">
                        STOCK: ${m.stock}
                    </div>
                    <span class="stock-alert ${m.stock < 500 ? 'low' : 'available'}" style="font-size:10px;">${m.status}</span>
                </div>
            </div>
        `).join('');

        modal.style.display = 'flex';
        if(window.lucide) lucide.createIcons();
    },
    completePharmacyFlow: () => {
        alert("Medicines Dispensed. Invoice Generated. Inventory Updated.");
        document.getElementById('pharmacyModal').style.display = 'none';
    },

    init: () => {
        setInterval(() => {
            const clock = document.getElementById('liveClock');
            if (clock) clock.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }, 1000);

        window.onload = () => {
            if (window.lucide) lucide.createIcons();
            MediCore.renderAvailability('availabilityList');
            MediCore.renderHospitalSchedule('receptionSchedule');
            MediCore.renderHospitalSchedule('doctorScheduleList', 'Dr. William Harrison');
            MediCore.renderEmergencyAlerts();
            
            // Poll for emergencies every 5 seconds (simulated WebSocket)
            setInterval(MediCore.renderEmergencyAlerts, 5000);
        };
    }
};

MediCore.init();
