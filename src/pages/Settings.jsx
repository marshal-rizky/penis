import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { User, Save } from 'lucide-react';
import './Auth.css'; // Reusing vault styles for consistency

export default function Settings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user && user.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    } else if (user && user.email) {
      // Default to start of email if no display name
      setDisplayName(user.email.split('@')[0]);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });

      if (error) throw error;
      
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex-center" style={{ minHeight: 'calc(100vh - 72px)', alignItems: 'center' }}>
      <div className="vault-panel-wrapper" style={{ maxWidth: '500px' }}>
        <div className="vault-corner top-left"></div>
        <div className="vault-corner bottom-right"></div>
        
        <div className="vault-panel-inner">
          <div className="vault-icon-container">
            <div className="vault-icon-hexa">
              <User size={24} color="#0ac8b9" />
            </div>
          </div>
          
          <h2 className="vault-title" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
            SUMMONER PROFILE
          </h2>
          
          {message.text && (
            <div className={`mb-4 w-100 p-2 text-center rounded ${message.type === 'error' ? 'text-red-500 bg-red-500/10' : 'text-teal-400 bg-teal-400/10'}`} style={{ color: message.type === 'error' ? '#ff4e4e' : '#0ac8b9', border: `1px solid ${message.type === 'error' ? '#ff4e4e' : '#0ac8b9'}`, borderRadius: '4px', padding: '10px', width: '100%' }}>
              {message.text}
            </div>
          )}

          <form className="vault-form" onSubmit={handleSave}>
            <div className="form-group vault-form-group">
              <label>SUMMONER NAME</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="Enter your summoner name" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="form-group vault-form-group">
              <label>EMAIL ADDRESS (READ ONLY)</label>
              <div className="input-wrapper" style={{ opacity: 0.6 }}>
                <input 
                  type="email" 
                  value={user?.email || ''}
                  readOnly
                  disabled
                />
              </div>
            </div>
            
            <button type="submit" className="btn primary-btn full-width vault-btn mt-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
              <Save size={18} /> {loading ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
