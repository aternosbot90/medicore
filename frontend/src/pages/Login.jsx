import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Login = () => {
  // Mode toggling
  const [isSignUp, setIsSignUp] = useState(false);

  // Sign In states
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  
  // Sign Up states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [signUpContact, setSignUpContact] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  
  // Mandatory clinical state variables for signup
  const [signUpAge, setSignUpAge] = useState('');
  const [signUpGender, setSignUpGender] = useState('Male');
  const [signUpBloodGroup, setSignUpBloodGroup] = useState('O+');
  const [signUpAllergies, setSignUpAllergies] = useState('');
  const [signUpHistory, setSignUpHistory] = useState('');

  // Multi-Tenant SaaS states
  const [tenantId, setTenantId] = useState('city_hospital');
  const [customTenantId, setCustomTenantId] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Google Login modal simulation
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user && user.role) {
      switch (user.role) {
        case 'admin': navigate('/admin'); break;
        case 'doctor': navigate('/doctor'); break;
        case 'receptionist': navigate('/receptionist'); break;
        case 'patient': navigate('/patient'); break;
        case 'lab': navigate('/lab'); break;
        case 'pharmacy': navigate('/pharmacy'); break;
        default: break;
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [isSignUp, showPassword, showConfirmPassword, showGoogleModal]);

  // Dynamic Password Strength Calculator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: 'No Password', color: '#CBD5E1', width: '0%' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd) && pwd.length >= 8) score++;

    if (score === 0 || score === 1) return { score: 1, text: 'Weak', color: '#EF4444', width: '33%' };
    if (score === 2) return { score: 2, text: 'Medium', color: '#F59E0B', width: '66%' };
    if (score === 3) return { score: 3, text: 'Strong', color: '#10B981', width: '100%' };
    return { score: 1, text: 'Weak', color: '#EF4444', width: '33%' };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resolvedTenant = tenantId === 'custom' ? customTenantId.trim().toLowerCase() : tenantId;
      const response = await api.post('/auth/login', {
        staff_id: staffId,
        password: password,
        tenantId: resolvedTenant || 'city_hospital'
      }, {
        headers: { 'x-tenant-id': resolvedTenant || 'city_hospital' }
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('tenantId', user.tenantId || resolvedTenant || 'city_hospital');

      // Redirect based on role
      switch (user.role) {
        case 'admin': navigate('/admin'); break;
        case 'doctor': navigate('/doctor'); break;
        case 'receptionist': navigate('/receptionist'); break;
        case 'patient': navigate('/patient'); break;
        case 'lab': navigate('/lab'); break;
        case 'pharmacy': navigate('/pharmacy'); break;
        default: navigate('/'); break;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (signUpPassword !== signUpConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const resolvedTenant = tenantId === 'custom' ? customTenantId.trim().toLowerCase() : tenantId;
      const response = await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        contact: signUpContact,
        password: signUpPassword,
        age: parseInt(signUpAge),
        gender: signUpGender,
        bloodGroup: signUpBloodGroup,
        allergies: signUpAllergies,
        history: signUpHistory,
        tenantId: resolvedTenant || 'city_hospital'
      }, {
        headers: { 'x-tenant-id': resolvedTenant || 'city_hospital' }
      });

      const { token, user } = response.data;
      
      setSuccess('Account created successfully!');
      
      setTimeout(() => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('tenantId', user.tenantId || resolvedTenant || 'city_hospital');
        navigate('/patient');
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength = getPasswordStrength(signUpPassword);

  return (
    <div className="login-container">
      {/* Scoped CSS Injector for Layout and Media Queries */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Urbanist:wght@400;500;600;700;800&display=swap');
        
        .login-container {
          display: flex;
          width: 100%;
          min-height: 100vh;
          background: #F8FAFC;
          color: #0F172A;
          font-family: 'Urbanist', sans-serif;
        }
        
        .left-pane {
          width: 55vw;
          background: radial-gradient(circle at 30% 30%, #FFFFFF 0%, #DBEAFE 100%);
          border-right: 1px solid #BFDBFE;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 60px;
          position: relative;
          overflow: hidden;
        }
        
        .right-pane {
          width: 45vw;
          background: #F8FAFC;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
          position: relative;
          box-sizing: border-box;
        }
        
        @media (max-width: 1024px) {
          .left-pane {
            display: none !important;
          }
          .right-pane {
            width: 100vw !important;
            padding: 20px;
            background: #F8FAFC;
          }
        }
        
        .instagram-card {
          width: 100%;
          max-width: 380px;
          background: #FFFFFF;
          border: 1px solid #BFDBFE;
          border-radius: 12px;
          padding: 32px 28px;
          box-shadow: 0 20px 25px -5px rgba(59, 113, 254, 0.05), 0 10px 10px -5px rgba(59, 113, 254, 0.03);
          box-sizing: border-box;
          transition: max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .instagram-card.signup-mode {
          max-width: 520px;
        }
        
        .instagram-card-secondary {
          width: 100%;
          max-width: 380px;
          background: #FFFFFF;
          border: 1px solid #BFDBFE;
          border-radius: 12px;
          padding: 20px;
          margin-top: 12px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(59, 113, 254, 0.02);
          box-sizing: border-box;
          transition: max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .instagram-card-secondary.signup-mode {
          max-width: 520px;
        }

        .ig-input-group {
          position: relative;
          margin-bottom: 12px;
        }

        .ig-input {
          width: 100%;
          height: 42px;
          background: #FFFFFF !important;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 13px;
          color: #0F172A !important;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        
        .ig-input:focus {
          border-color: #3B71FE;
          box-shadow: 0 0 0 3px rgba(59, 113, 254, 0.15);
        }

        .ig-input::placeholder {
          color: #94A3B8;
          font-size: 12px;
        }

        .ig-btn-primary {
          width: 100%;
          height: 40px;
          background: linear-gradient(135deg, #3B71FE 0%, #2563EB 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s, transform 0.1s;
        }

        .ig-btn-primary:hover:not(:disabled) {
          background: #1D4ED8;
        }

        .ig-btn-primary:active:not(:disabled) {
          transform: scale(0.98);
        }

        .ig-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ig-btn-google {
          width: 100%;
          height: 40px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          color: #1E293B;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .ig-btn-google:hover {
          background: #F8FAFC;
        }

        .neon-gradient-text {
          background: linear-gradient(135deg, #2563EB 0%, #93C5FD 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
        }

        .mockup-image-container {
          position: relative;
          margin: 0 auto;
          width: 100%;
          max-width: 440px;
          height: auto;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .mockup-img {
          width: 100%;
          height: auto;
          max-height: 42vh;
          object-fit: contain;
          filter: drop-shadow(0 20px 25px rgba(59, 113, 254, 0.15));
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          margin-top: 40px;
          font-size: 11px;
          color: #94A3B8;
        }

        .footer-links a {
          color: #94A3B8;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: #64748B;
        }

        /* Custom Scrollbar for signup form */
        .signup-scroll-area {
          overscroll-behavior: contain !important;
        }

        .signup-scroll-area::-webkit-scrollbar {
          width: 6px;
        }
        
        .signup-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .signup-scroll-area::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 4px;
        }
        
        .signup-scroll-area::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }

        /* Grid layout for signup */
        .signup-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .signup-full {
          grid-column: span 2;
        }

        /* Lucide icons adjustment */
        .ig-icon-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          color: #94A3B8;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .ig-icon-btn:hover {
          color: #64748B;
        }
      `}</style>

      {/* Left Column: Media Presentation */}
      <div className="left-pane">
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B71FE 0%, #FFFFFF 100%)', color: '#2563EB', fontWeight: 900, fontSize: '20px', boxShadow: '0 0 20px rgba(59, 113, 254, 0.2)' }}>
            M
          </div>
          <span style={{ fontSize: '20px', fontWeight: 900, color: '#2563EB', letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>MediCore</span>
        </div>

        {/* Visual Content Block */}
        <div style={{ margin: 'auto 0' }}>
          <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, color: '#0F172A', lineHeight: '1.2', margin: '0 0 16px 0', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
            Track and manage <span className="neon-gradient-text">everyday clinical moments</span> for your patients.
          </h1>
          <p style={{ fontSize: '14px', color: '#475569', fontWeight: 500, margin: '0 0 40px 0', lineHeight: '1.5', maxWidth: '440px' }}>
            Empower your healthcare operations with structured laboratory management, real-time analytics, and secure client communication workflows.
          </p>

          <div className="mockup-image-container">
            <img 
              src="/medicore_login_promo.png" 
              alt="MediCore App Mockup" 
              className="mockup-img"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Footer Brand copyright */}
        <div>
          <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>© 2026 MediCore Healthcare Systems. All rights reserved.</p>
        </div>
      </div>

      {/* Right Column: Authentication Panel */}
      <div className="right-pane">
        {/* Main Instagram Auth Card */}
        <div className={`instagram-card ${isSignUp ? 'signup-mode' : ''}`}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B71FE 0%, #FFFFFF 100%)', color: '#2563EB', fontWeight: 900, fontSize: '20px', marginBottom: '12px', boxShadow: '0 0 20px rgba(59, 113, 254, 0.2)' }}>
              M
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
              {isSignUp ? 'Sign up to MediCore' : 'Log in to MediCore'}
            </h2>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.06)', color: '#EF4444', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px', border: '1px solid rgba(239, 68, 68, 0.15)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i data-lucide="alert-circle" style={{ width: '14px', flexShrink: 0 }}></i>
              <span style={{ flexGrow: 1 }}>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(16, 185, 129, 0.06)', color: '#10B981', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px', border: '1px solid rgba(16, 185, 129, 0.15)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i data-lucide="check-circle" style={{ width: '14px', flexShrink: 0 }}></i>
              <span style={{ flexGrow: 1 }}>{success}</span>
            </div>
          )}

          {!isSignUp ? (
            /* SIGN IN FORM */
            <form onSubmit={handleLogin}>
              <div className="ig-input-group">
                <input 
                  type="text" 
                  className="ig-input" 
                  placeholder="Staff ID / Contact Number"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value.toLowerCase())}
                  required
                />
              </div>
              
              <div className="ig-input-group" style={{ marginBottom: '16px' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="ig-input" 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="ig-icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i data-lucide={showPassword ? "eye-off" : "eye"} style={{ width: '16px', height: '16px' }}></i>
                </button>
              </div>
              
              <button 
                type="submit" 
                className="ig-btn-primary" 
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>

              <div style={{ position: 'relative', margin: '20px 0 16px 0', textAlign: 'center' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#E2E8F0', zIndex: 1 }}></div>
                <span style={{ position: 'relative', background: '#FFFFFF', padding: '0 10px', fontSize: '11px', color: '#94A3B8', fontWeight: 700, zIndex: 2 }}>OR</span>
              </div>

              <button 
                type="button" 
                className="ig-btn-google"
                onClick={() => setShowGoogleModal(true)}
              >
                <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.62-1.05-1.37-1.35-2.22z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Log in with Google
              </button>
            </form>
          ) : (
            /* SIGN UP FORM (Scrollable Content inside the card) */
            <form onSubmit={handleSignUp}>
              <div className="signup-scroll-area" data-lenis-prevent style={{ maxHeight: '310px', overflowY: 'auto', paddingRight: '4px', marginBottom: '16px' }}>
                <div className="signup-grid">
                  
                  {/* First Name */}
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px', display: 'block' }}>First Name</label>
                    <input 
                      type="text" 
                      className="ig-input" 
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px', display: 'block' }}>Last Name</label>
                    <input 
                      type="text" 
                      className="ig-input" 
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="signup-full">
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px', display: 'block' }}>Email ID</label>
                    <input 
                      type="email" 
                      className="ig-input" 
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {/* Contact Number */}
                  <div className="signup-full">
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px', display: 'block' }}>Contact / Mobile Number</label>
                    <input 
                      type="text" 
                      className="ig-input" 
                      placeholder="e.g. 9876543210"
                      value={signUpContact}
                      onChange={(e) => setSignUpContact(e.target.value)}
                      required
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px', display: 'block' }}>Age (Years)</label>
                    <input 
                      type="number" 
                      className="ig-input" 
                      placeholder="Age"
                      value={signUpAge}
                      onChange={(e) => setSignUpAge(e.target.value)}
                      required
                      min="1"
                      max="120"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px', display: 'block' }}>Gender</label>
                    <select 
                      className="ig-input" 
                      value={signUpGender}
                      onChange={(e) => setSignUpGender(e.target.value)}
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px', display: 'block' }}>Blood Group</label>
                    <select 
                      className="ig-input" 
                      value={signUpBloodGroup}
                      onChange={(e) => setSignUpBloodGroup(e.target.value)}
                      required
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  {/* Allergies */}
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px', display: 'block' }}>Allergies</label>
                    <select 
                      className="ig-input" 
                      value={signUpAllergies}
                      onChange={(e) => setSignUpAllergies(e.target.value)}
                      required
                    >
                      <option value="">Select option</option>
                      <option value="None">None</option>
                      <option value="Dust/Pollen">Dust / Pollen</option>
                      <option value="Food (Nuts, Dairy, etc.)">Food (Nuts, Dairy, etc.)</option>
                      <option value="Medications (Penicillin, etc.)">Medications (Penicillin, etc.)</option>
                      <option value="Pet Dander">Pet Dander</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* History */}
                  <div className="signup-full">
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px', display: 'block' }}>Medical History</label>
                    <select 
                      className="ig-input" 
                      value={signUpHistory}
                      onChange={(e) => setSignUpHistory(e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="Diabetes">Diabetes</option>
                      <option value="Hypertension (Blood Pressure)">Hypertension (Blood Pressure)</option>
                      <option value="Asthma">Asthma</option>
                      <option value="Heart Disease">Heart Disease</option>
                      <option value="Thyroid Disorder">Thyroid Disorder</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Password */}
                  <div className="signup-full">
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px', display: 'block' }}>Password</label>
                    <div className="ig-input-group" style={{ marginBottom: 0 }}>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="ig-input" 
                        placeholder="Password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                      />
                      <button 
                        type="button" 
                        className="ig-icon-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i data-lucide={showPassword ? "eye-off" : "eye"} style={{ width: '15px', height: '15px' }}></i>
                      </button>
                    </div>

                    {/* Password strength indicator */}
                    {signUpPassword && (
                      <div style={{ marginTop: '4px', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748B' }}>Strength</span>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: pwdStrength.color }}>{pwdStrength.text}</span>
                        </div>
                        <div style={{ height: '4px', width: '100%', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            width: pwdStrength.width, 
                            background: pwdStrength.color, 
                            transition: 'all 0.3s ease-in-out' 
                          }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="signup-full" style={{ marginBottom: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px', display: 'block' }}>Confirm Password</label>
                    <div className="ig-input-group" style={{ marginBottom: 0 }}>
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        className="ig-input" 
                        placeholder="Re-type Password"
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        required
                      />
                      <button 
                        type="button" 
                        className="ig-icon-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <i data-lucide={showConfirmPassword ? "eye-off" : "eye"} style={{ width: '15px', height: '15px' }}></i>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              <button 
                type="submit" 
                className="ig-btn-primary" 
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          )}
        </div>

        {/* Toggle secondary box */}
        <div className={`instagram-card-secondary ${isSignUp ? 'signup-mode' : ''}`}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button 
                  type="button" 
                  style={{ background: 'transparent', border: 'none', padding: 0, color: '#2563EB', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => {
                    setIsSignUp(false);
                    setError('');
                    setSuccess('');
                  }}
                >
                  Log In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button 
                  type="button" 
                  style={{ background: 'transparent', border: 'none', padding: 0, color: '#2563EB', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => {
                    setIsSignUp(true);
                    setError('');
                    setSuccess('');
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </span>
        </div>

        {/* Support Links in Instagram footer format */}
        <div className="footer-links">
          <a href="#about" onClick={(e) => e.preventDefault()}>About</a>
          <span>•</span>
          <a href="#services" onClick={(e) => e.preventDefault()}>Services</a>
          <span>•</span>
          <a href="#careers" onClick={(e) => e.preventDefault()}>Careers</a>
          <span>•</span>
          <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy</a>
          <span>•</span>
          <a href="#terms" onClick={(e) => e.preventDefault()}>Terms</a>
          <span>•</span>
          <a href="#help" onClick={(e) => e.preventDefault()}>Help</a>
          <span>•</span>
          <a href="#status" onClick={(e) => e.preventDefault()}>System Status</a>
        </div>
      </div>

      {/* Simulated Google OAuth Account Selection Modal */}
      {showGoogleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ width: '380px', padding: '28px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box' }}>
            
            {/* Google Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <svg style={{ width: '32px', height: '32px' }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.62-1.05-1.37-1.35-2.22z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            
            <h3 style={{ textAlign: 'center', margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>Choose an account</h3>
            <p style={{ textAlign: 'center', margin: '0 0 20px 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>to continue to <span style={{ color: '#2563EB', fontWeight: 700 }}>MediCore</span></p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[
                { name: 'John Doe', email: 'john.doe@gmail.com', avatar: 'JD' },
                { name: 'Jane Smith', email: 'jane.smith@gmail.com', avatar: 'JS' }
              ].map(account => (
                <div 
                  key={account.email} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    border: '1px solid #E2E8F0', 
                    cursor: 'pointer', 
                    transition: '0.2s',
                    background: '#F8FAFC'
                  }}
                  onClick={async () => {
                    setShowGoogleModal(false);
                    setLoading(true);
                    try {
                      const contactNum = account.name === 'John Doe' ? '9998887771' : '9998887772';
                      const resolvedTenant = tenantId === 'custom' ? customTenantId.trim().toLowerCase() : tenantId;
                      try {
                        const regRes = await api.post('/auth/register', {
                          firstName: account.name.split(' ')[0],
                          lastName: account.name.split(' ')[1],
                          email: account.email,
                          contact: contactNum,
                          password: 'google_oauth_password',
                          tenantId: resolvedTenant || 'city_hospital'
                        }, {
                          headers: { 'x-tenant-id': resolvedTenant || 'city_hospital' }
                        });
                        const { token, user } = regRes.data;
                        localStorage.setItem('token', token);
                        localStorage.setItem('user', JSON.stringify(user));
                        localStorage.setItem('tenantId', user.tenantId || resolvedTenant || 'city_hospital');
                        navigate('/patient');
                      } catch (regErr) {
                        const loginRes = await api.post('/auth/login', {
                          staff_id: contactNum,
                          password: 'google_oauth_password',
                          tenantId: resolvedTenant || 'city_hospital'
                        }, {
                          headers: { 'x-tenant-id': resolvedTenant || 'city_hospital' }
                        });
                        const { token, user } = loginRes.data;
                        localStorage.setItem('token', token);
                        localStorage.setItem('user', JSON.stringify(user));
                        localStorage.setItem('tenantId', user.tenantId || resolvedTenant || 'city_hospital');
                        navigate('/patient');
                      }
                    } catch (gErr) {
                      setError('Simulated Google Authentication failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#EFF6FF';
                    e.currentTarget.style.borderColor = '#2563EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                    {account.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{account.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>{account.email}</div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="ig-btn-google" 
              style={{ width: '100%', height: '38px', color: '#64748B', border: '1px solid #CBD5E1' }}
              onClick={() => setShowGoogleModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
