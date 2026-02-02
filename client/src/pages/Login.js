import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { requestOTP, verifyOTP } = useAuth();
  const [step, setStep] = useState('email'); // 'email' or 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestOTP(email);
      setStep('code');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOTP(email, code);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <span className="login-logo">🤖</span>
          <h1>AI Project CRM</h1>
          <p>{step === 'email' ? 'Enter your email to sign in' : 'Enter the code sent to your email'}</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        {step === 'email' ? (
          <form onSubmit={handleRequestOTP}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Sending code...' : 'Send Login Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label className="form-label">6-Digit Code</label>
              <input
                type="text"
                className="form-input otp-input"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                required
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>

            <div className="login-footer">
              <button
                type="button"
                className="login-toggle"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
              >
                ← Use a different email
              </button>
              <button
                type="button"
                className="login-toggle"
                onClick={handleRequestOTP}
                disabled={loading}
                style={{ marginLeft: '1rem' }}
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        {step === 'email' && (
          <div className="login-footer">
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              No password required. We'll send a one-time code to your email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
