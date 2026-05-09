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

    saveAppointment: (pName, dName, time) => {
        const apps = JSON.parse(localStorage.getItem('mc_appointments')) || [];
        apps.push({ id: "#MC-" + Math.floor(1000+Math.random()*9000), patient: pName, doctor: dName, time: time, status: "Confirmed" });
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
        MediCore.saveAppointment("Johnathan Doe", name, "02:30 PM");
        alert("Appointment Booked Successfully!");
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
            
            return `
                <tr class="animate-in">
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
                    <td><span class="status-badge available">${app.status || 'Confirmed'}</span></td>
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
        };
    }
};

MediCore.init();
