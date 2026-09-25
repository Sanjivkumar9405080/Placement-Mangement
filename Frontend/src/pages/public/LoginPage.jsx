import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validate required fields
    const trimmedEmail = formData.email.trim();
    const trimmedPassword = formData.password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      // 2. Submit login request through AuthContext
      const data = await login(trimmedEmail, trimmedPassword);

      // 3. Role-based redirect determined strictly by backend user role
      const userRole = data?.user?.role;
      if (userRole === 'student') {
        navigate('/student', { replace: true });
      } else if (userRole === 'company') {
        navigate('/company', { replace: true });
      } else if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      // 4. User-friendly error message handling (400, 401, 403, 500)
      if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.message;

        if (status === 401) {
          setError(serverMessage || 'Invalid email or password.');
        } else if (status === 403) {
          setError(serverMessage || 'Your account is inactive. Please contact the administrator.');
        } else if (status === 400) {
          setError(serverMessage || 'Please check the entered information.');
        } else if (status >= 500) {
          setError('Server error occurred. Please try again later.');
        } else {
          setError(serverMessage || 'Login failed. Please try again.');
        }
      } else if (err.request) {
        setError('Cannot connect to the backend server. Please verify the backend is running.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '2rem auto' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Welcome Back</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Enter your credentials to access your dashboard
        </p>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address <span className="req">*</span>
            </label>
            <input
              type="email"
              id="login-email"
              name="email"
              className="form-control"
              placeholder="e.g. yourname@college.edu"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password <span className="req">*</span>
            </label>
            <input
              type="password"
              id="login-password"
              name="password"
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
