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
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 50%, #EFF6FF 0%, #F8FAFC 100%)', padding: '40px 20px', boxSizing: 'border-box' }}>
      
      <div className="glass-card" style={{ width: '480px', padding: '40px', borderRadius: '20px', background: 'white', border: '1px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)' }}>
        
        {/* Logo and Headings */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-gradient)', color: 'white', fontWeight: 800, fontSize: '20px', marginBottom: '16px', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)' }}>
            M
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', margin: '0 0 6px 0', fontFamily: "'Outfit', sans-serif" }}>
            {isSignUp ? 'Create your Account' : 'Welcome to MediCore'}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0, fontWeight: 500 }}>
            {isSignUp ? 'Enter your credentials to get registered' : 'Sign in to access your dashboard panel'}
          </p>
        </div>
        
        {error && (
          <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', border: '1px solid #FCA5A5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i data-lucide="alert-circle" style={{ width: '16px', flexShrink: 0 }}></i>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#F0FDF4', color: '#16A34A', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', border: '1px solid #86EFAC', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i data-lucide="check-circle" style={{ width: '16px', flexShrink: 0 }}></i>
            {success}
          </div>
        )}

        {!isSignUp ? (
          /* SIGN IN FORM */
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '8px', display: 'block' }}>Hospital Branch / Tenant</label>
              <select 
                className="form-control" 
                style={{ height: '46px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '14px', fontSize: '14px', fontWeight: 600, width: '100%', background: 'white' }}
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              >
                <option value="city_hospital">City General Hospital (Default)</option>
                <option value="metro_clinic">Metro Health Clinic</option>
                <option value="downtown_medical">Downtown Medical Center</option>
                <option value="custom">-- Enter Custom Hospital ID --</option>
              </select>
            </div>

            {tenantId === 'custom' && (
              <div className="form-group" style={{ marginBottom: '20px', animation: 'fadeIn 0.2s ease-out' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '8px', display: 'block' }}>Custom Hospital ID / Key</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. city_hospital"
                  style={{ height: '46px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '14px', fontSize: '14px', fontWeight: 600 }}
                  value={customTenantId}
                  onChange={(e) => setCustomTenantId(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '8px', display: 'block' }}>Staff ID / Contact Number</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. rec123 or mobile number"
                style={{ height: '46px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '14px', fontSize: '14px', fontWeight: 600 }}
                value={staffId}
                onChange={(e) => setStaffId(e.target.value.toLowerCase())}
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '8px', display: 'block' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-control" 
                  placeholder="Enter Password"
                  style={{ height: '46px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '14px', paddingRight: '44px', fontSize: '14px', fontWeight: 600 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i data-lucide={showPassword ? "eye-off" : "eye"} style={{ width: '18px', height: '18px' }}></i>
                </button>
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px', justifyContent: 'center', fontWeight: 800, borderRadius: '8px', background: 'var(--primary-gradient)' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSignUp}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Hospital Branch / Tenant</label>
              <select 
                className="form-control" 
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '10px', fontSize: '13px', fontWeight: 600, width: '100%', background: 'white' }}
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              >
                <option value="city_hospital">City General Hospital (Default)</option>
                <option value="metro_clinic">Metro Health Clinic</option>
                <option value="downtown_medical">Downtown Medical Center</option>
                <option value="custom">-- Enter Custom Hospital ID --</option>
              </select>
            </div>

            {tenantId === 'custom' && (
              <div className="form-group" style={{ marginBottom: '16px', animation: 'fadeIn 0.2s ease-out' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Custom Hospital ID / Key</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. city_hospital"
                  style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600 }}
                  value={customTenantId}
                  onChange={(e) => setCustomTenantId(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>First Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="First"
                  style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600 }}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Last Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Last"
                  style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600 }}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Email ID</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="name@example.com"
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Contact / Mobile Number</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. 9876543210"
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600 }}
                value={signUpContact}
                onChange={(e) => setSignUpContact(e.target.value)}
                required
              />
            </div>

            {/* Clinical Health Fields Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Age (Years) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="e.g. 25"
                  style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', fontSize: '13px', fontWeight: 600, width: '100%' }}
                  value={signUpAge}
                  onChange={(e) => setSignUpAge(e.target.value)}
                  required
                  min="1"
                  max="120"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Gender *</label>
                <select 
                  className="form-control" 
                  style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '10px', fontSize: '13px', fontWeight: 600, width: '100%', background: 'white' }}
                  value={signUpGender}
                  onChange={(e) => setSignUpGender(e.target.value)}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Clinical Health Fields Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Blood Group *</label>
                <select 
                  className="form-control" 
                  style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '10px', fontSize: '13px', fontWeight: 600, width: '100%', background: 'white' }}
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
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Any Allergies? *</label>
                <select 
                  className="form-control" 
                  style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '10px', fontSize: '13px', fontWeight: 600, width: '100%', background: 'white' }}
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
            </div>

            {/* Clinical Health Fields Row 3 */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Pre-existing Conditions / Medical History</label>
              <select 
                  className="form-control" 
                  style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '10px', fontSize: '13px', fontWeight: 600, width: '100%', background: 'white' }}
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

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-control" 
                  placeholder="Enter Password"
                  style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', paddingRight: '40px', fontSize: '13px', fontWeight: 600 }}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i data-lucide={showPassword ? "eye-off" : "eye"} style={{ width: '16px', height: '16px' }}></i>
                </button>
              </div>

              {/* Password strength feedback */}
              {signUpPassword && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B' }}>Password Strength</span>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: pwdStrength.color }}>{pwdStrength.text}</span>
                  </div>
                  <div style={{ height: '5px', width: '100%', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
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

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  className="form-control" 
                  placeholder="Re-type Password"
                  style={{ height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', paddingLeft: '12px', paddingRight: '40px', fontSize: '13px', fontWeight: 600 }}
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i data-lucide={showConfirmPassword ? "eye-off" : "eye"} style={{ width: '16px', height: '16px' }}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px', justifyContent: 'center', fontWeight: 800, borderRadius: '8px', background: 'var(--primary-gradient)' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        )}

        {/* Continue with Google */}
        <div style={{ position: 'relative', margin: '24px 0 16px 0', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#F1F5F9', zIndex: 1 }}></div>
          <span style={{ position: 'relative', background: '#FFFFFF', padding: '0 12px', fontSize: '12px', color: '#94A3B8', fontWeight: 800, zIndex: 2 }}>OR</span>
        </div>

        <button 
          type="button" 
          className="btn btn-secondary" 
          style={{ width: '100%', height: '46px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontWeight: 700, borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer' }}
          onClick={() => {
            setShowGoogleModal(true);
          }}
        >
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.62-1.05-1.37-1.35-2.22z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        {/* Toggle between Login and Register */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                  setSuccess('');
                }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                  setSuccess('');
                }}
              >
                Sign Up
              </button>
            </span>
          )}
        </div>

      </div>

      {/* simulated google OAuth accounts selection modal */}
      {showGoogleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
          <div className="glass-card" style={{ width: '420px', padding: '32px', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            {/* Google Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <svg style={{ width: '36px', height: '36px' }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.62-1.05-1.37-1.35-2.22z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            
            <h3 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>Choose an account</h3>
            <p style={{ textAlign: 'center', margin: '0 0 24px 0', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>to continue to <span style={{ color: 'var(--primary)', fontWeight: 700 }}>MediCore</span></p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {[
                { name: 'John Doe', email: 'john.doe@gmail.com', avatar: 'JD' },
                { name: 'Jane Smith', email: 'jane.smith@gmail.com', avatar: 'JS' }
              ].map(account => (
                <div 
                  key={account.email} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    padding: '12px 16px', 
                    borderRadius: '10px', 
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
                  onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#F8FAFC'}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                    {account.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{account.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>{account.email}</div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', height: '44px', justifyContent: 'center', fontWeight: 700 }}
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
