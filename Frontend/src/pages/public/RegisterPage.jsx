import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const RegisterPage = () => {
  const [role, setRole] = useState('student'); // 'student' | 'company' (admin cannot be selected)
  const [formData, setFormData] = useState({
    // Account fields
    name: '',
    email: '',
    password: '',
    // Student profile fields
    rollNumber: '',
    branch: '',
    cgpa: '',
    tenthPercentage: '',
    twelfthPercentage: '',
    activeBacklogs: '0',
    skills: '',
    phone: '',
    // Company profile fields
    companyName: '',
    website: '',
    industry: '',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
  };

  const validateForm = () => {
    // 1. Account validation
    if (!formData.name.trim()) return 'Please enter your full name.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (!formData.password || formData.password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    // 2. Student specific validation
    if (role === 'student') {
      if (!formData.rollNumber.trim()) return 'Roll number is required.';
      if (!formData.branch.trim()) return 'Branch/Department is required.';

      const numCgpa = Number(formData.cgpa);
      if (formData.cgpa === '' || isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
        return 'CGPA must be a valid number between 0 and 10.';
      }

      if (formData.tenthPercentage !== '') {
        const numTenth = Number(formData.tenthPercentage);
        if (isNaN(numTenth) || numTenth < 0 || numTenth > 100) {
          return '10th percentage must be between 0 and 100.';
        }
      }

      if (formData.twelfthPercentage !== '') {
        const numTwelfth = Number(formData.twelfthPercentage);
        if (isNaN(numTwelfth) || numTwelfth < 0 || numTwelfth > 100) {
          return '12th percentage must be between 0 and 100.';
        }
      }

      if (formData.activeBacklogs !== '') {
        const numBacklogs = Number(formData.activeBacklogs);
        if (isNaN(numBacklogs) || numBacklogs < 0) {
          return 'Active backlogs cannot be negative.';
        }
      }
    }

    // 3. Company specific validation
    if (role === 'company') {
      if (!formData.companyName.trim()) {
        return 'Company name is required.';
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Build payload matching backend API requirements exactly
    let payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: role,
    };

    if (role === 'student') {
      // Parse skills comma-separated text into array of strings
      const skillsArray = formData.skills
        ? formData.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      payload = {
        ...payload,
        rollNumber: formData.rollNumber.trim().toUpperCase(),
        branch: formData.branch.trim(),
        cgpa: Number(formData.cgpa),
        tenthPercentage: formData.tenthPercentage !== '' ? Number(formData.tenthPercentage) : undefined,
        twelfthPercentage: formData.twelfthPercentage !== '' ? Number(formData.twelfthPercentage) : undefined,
        activeBacklogs: formData.activeBacklogs !== '' ? Number(formData.activeBacklogs) : 0,
        skills: skillsArray,
        phone: formData.phone.trim() || undefined,
      };
    } else if (role === 'company') {
      payload = {
        ...payload,
        companyName: formData.companyName.trim(),
        website: formData.website.trim() || undefined,
        industry: formData.industry.trim() || undefined,
        hrName: formData.hrName.trim() || formData.name.trim(),
        hrEmail: formData.hrEmail.trim() || formData.email.trim().toLowerCase(),
        hrPhone: formData.hrPhone.trim() || undefined,
      };
    }

    try {
      setLoading(true);
      const data = await register(payload);

      // Redirect based on role returned by backend
      const userRole = data?.user?.role;
      if (userRole === 'student') {
        navigate('/student', { replace: true });
      } else if (userRole === 'company') {
        navigate('/company', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.message;

        if (status === 400) {
          setError(serverMessage || 'Please check the entered information.');
        } else if (status === 409) {
          setError(serverMessage || 'An account with this email or roll number already exists.');
        } else if (status === 403) {
          setError(serverMessage || 'Registration restricted.');
        } else if (status >= 500) {
          setError('Server error occurred. Please try again later.');
        } else {
          setError(serverMessage || 'Registration failed.');
        }
      } else if (err.request) {
        setError('Cannot connect to the backend server. Please check your network.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '2rem auto' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Create Account</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Select your registration type and fill in your details
        </p>

        {/* Role Selector Tabs (Only Student or Company allowed) */}
        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => handleRoleChange('student')}
          >
            🎓 Student Candidate
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'company' ? 'active' : ''}`}
            onClick={() => handleRoleChange('company')}
          >
            🏢 Corporate Recruiter
          </button>
        </div>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Section 1: Account Credentials */}
          <div className="form-section-title">1. Account Credentials</div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Full Name <span className="req">*</span>
              </label>
              <input
                type="text"
                id="reg-name"
                name="name"
                className="form-control"
                placeholder={role === 'student' ? 'e.g. Aarav Sharma' : 'e.g. Priya HR'}
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email Address <span className="req">*</span>
              </label>
              <input
                type="email"
                id="reg-email"
                name="email"
                className="form-control"
                placeholder={role === 'student' ? 'e.g. aarav@college.edu' : 'e.g. hr@company.com'}
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              Password <span className="req">*</span>
            </label>
            <input
              type="password"
              id="reg-password"
              name="password"
              className="form-control"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              minLength={6}
              required
            />
            <div className="form-hint">Must be at least 6 characters long</div>
          </div>

          {/* Section 2: Student Profile Fields */}
          {role === 'student' && (
            <>
              <div className="form-section-title">2. Academic Information</div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-rollNumber">
                    Roll Number <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="reg-rollNumber"
                    name="rollNumber"
                    className="form-control"
                    placeholder="e.g. 2024CS101"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-branch">
                    Branch / Department <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="reg-branch"
                    name="branch"
                    className="form-control"
                    placeholder="e.g. CSE, IT, ECE"
                    value={formData.branch}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-cgpa">
                    CGPA (0 - 10) <span className="req">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    id="reg-cgpa"
                    name="cgpa"
                    className="form-control"
                    placeholder="e.g. 8.45"
                    value={formData.cgpa}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-activeBacklogs">
                    Active Backlogs
                  </label>
                  <input
                    type="number"
                    min="0"
                    id="reg-activeBacklogs"
                    name="activeBacklogs"
                    className="form-control"
                    placeholder="0"
                    value={formData.activeBacklogs}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-tenth">
                    10th Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    id="reg-tenth"
                    name="tenthPercentage"
                    className="form-control"
                    placeholder="e.g. 91.5"
                    value={formData.tenthPercentage}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-twelfth">
                    12th Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    id="reg-twelfth"
                    name="twelfthPercentage"
                    className="form-control"
                    placeholder="e.g. 88.0"
                    value={formData.twelfthPercentage}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-skills">
                  Technical Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  id="reg-skills"
                  name="skills"
                  className="form-control"
                  placeholder="e.g. React, Node.js, Python, MongoDB"
                  value={formData.skills}
                  onChange={handleChange}
                  disabled={loading}
                />
                <div className="form-hint">Separate individual skills with commas</div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="reg-phone"
                  name="phone"
                  className="form-control"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </>
          )}

          {/* Section 2: Company Profile Fields */}
          {role === 'company' && (
            <>
              <div className="form-section-title">2. Organization Details</div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-companyName">
                  Company Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="reg-companyName"
                  name="companyName"
                  className="form-control"
                  placeholder="e.g. Infosys Technologies Ltd"
                  value={formData.companyName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-website">
                    Company Website
                  </label>
                  <input
                    type="url"
                    id="reg-website"
                    name="website"
                    className="form-control"
                    placeholder="e.g. https://infosys.com"
                    value={formData.website}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-industry">
                    Industry / Domain
                  </label>
                  <input
                    type="text"
                    id="reg-industry"
                    name="industry"
                    className="form-control"
                    placeholder="e.g. Information Technology"
                    value={formData.industry}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-section-title">3. HR / Recruiter Contact</div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-hrName">
                    HR Contact Person
                  </label>
                  <input
                    type="text"
                    id="reg-hrName"
                    name="hrName"
                    className="form-control"
                    placeholder="e.g. Priya Verma"
                    value={formData.hrName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-hrPhone">
                    HR Phone Number
                  </label>
                  <input
                    type="tel"
                    id="reg-hrPhone"
                    name="hrPhone"
                    className="form-control"
                    placeholder="e.g. 9876501234"
                    value={formData.hrPhone}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Submitting Registration...' : `Register as ${role === 'student' ? 'Student' : 'Company'}`}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
