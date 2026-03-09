import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Loader, Search } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function QuizLobby() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPublicQuizzes();
  }, []);

  const fetchPublicQuizzes = async () => {
    try {
      setLoading(true);
      // Fetch all public quizzes (RLS allows select for everyone)
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching public quizzes:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = useMemo(() => {
    if (!searchQuery.trim()) return quizzes;
    return quizzes.filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [quizzes, searchQuery]);

  return (
    <div className="page-container flex-center" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <div className="glass-panel auth-panel text-center" style={{ maxWidth: '800px', width: '100%', padding: '3rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--hextech-gold-light)', fontSize: '2.5rem', marginBottom: '0.5rem', letterSpacing: '2px' }}>ARTIFACT VAULT</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Browse all community-forged trials. Rank up your summoner profile or wander as a guest.</p>
        
        <div style={{ position: 'relative', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
          <Search size={20} color="var(--hextech-magic)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search for a trial by title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '1rem 1rem 1rem 3rem', 
              borderRadius: '4px', 
              border: '1px solid rgba(10, 200, 185, 0.3)', 
              background: 'rgba(0,0,0,0.5)', 
              color: 'white',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div className="quiz-list my-4" style={{ textAlign: 'left', maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '1rem' }}>
          {loading ? (
             <div className="flex-center py-4">
               <Loader className="animate-spin text-hextech-magic" size={40} />
             </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No matches found matching "{searchQuery}". Try a different name.</p>
            </div>
          ) : filteredQuizzes.map(quiz => (
            <div key={quiz.id} className="quiz-card glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid var(--hextech-magic)' }}>
              <div className="quiz-info">
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem', fontFamily: 'var(--font-heading)', color: 'white' }}>{quiz.title}</h3>
                <p className="meta-text" style={{ color: 'var(--hextech-magic)', margin: 0, fontSize: '0.9rem' }}>{quiz.plays} plays</p>
              </div>
              <div className="quiz-actions">
                <button 
                  className="btn primary-btn" 
                  onClick={() => navigate(`/play/${quiz.id}`)}
                  style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Play size={16} /> ENTER TRIAL
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="back-link block mt-4" onClick={() => navigate('/')} style={{ margin: '0 auto' }}>
          Abandon Queue
        </button>
      </div>
    </div>
  );
}
