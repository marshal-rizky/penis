import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sword } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import './Auth.css';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Sign up the user
      const { data, error: signUpError } = await signUp({ 
        email, 
        password,
        options: {
          data: { display_name: username }
        }
      });
      if (signUpError) throw signUpError;

      // 2. Create the profile record
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, username, email }]);
        
        if (profileError) throw profileError;
      }

      navigate('/maker');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex-center" style={{ minHeight: 'calc(100vh - 72px)', alignItems: 'center' }}>
      <div className="vault-panel-wrapper">
        <div className="vault-corner top-left"></div>
        <div className="vault-corner bottom-right"></div>
        
        <div className="vault-panel-inner">
          <div className="vault-icon-container">
            <div className="vault-icon-hexa">
              <Sword size={24} color="#0ac8b9" strokeWidth={2.5}/>
            </div>
          </div>
          
          <h2 className="vault-title">
            ARTIFACT VAULT<br/>REGISTRATION
          </h2>
          <p className="vault-subtitle">Join the vanguard of Runeterra.</p>
          
          {error && <div className="error-message mb-4" style={{color: '#ff4e4e', fontSize: '0.9rem'}}>{error}</div>}

          <form className="vault-form" onSubmit={handleSubmit}>
            <div className="form-group vault-form-group">
              <label>SUMMONER NAME (USERNAME)</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="Choose a username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group vault-form-group">
              <label>CONTACT CRYSTAL (EMAIL)</label>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group vault-form-group">
              <label>SECRET PHRASE (PASSWORD)</label>
              <div className="input-wrapper">
                <input 
                  type="password" 
                  placeholder="Create a password (min 6 chars)" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            
            <button type="submit" className="btn primary-btn full-width vault-btn" disabled={loading}>
              {loading ? 'REGISTERING...' : 'REGISTER'}
            </button>
          </form>
          
          <p className="auth-footer vault-footer">
            Already have an account? <Link to="/login">Login Here</Link>
            <br />
            <Link to="/lobby" style={{ color: "var(--hextech-magic)", marginTop: "10px", display: "inline-block" }}>or Play as Guest</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
