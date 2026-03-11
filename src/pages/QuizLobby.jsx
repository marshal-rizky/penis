import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Loader, Search, Filter, Hash, User, Target } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import './QuizLobby.css';

const OFFICIAL_TAGS = [
  "Map Awareness",
  "Wave Management",
  "Champion Matchups",
  "Lane Macro",
  "Fighting Mechanics"
];

export default function QuizLobby() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    fetchPublicQuizzes();
  }, []);

  const fetchPublicQuizzes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          profiles (username)
        `)
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
    let result = quizzes;
    
    if (searchQuery.trim()) {
      result = result.filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (selectedTags.length > 0) {
      // Show quiz if it has AT LEAST ONE of the selected tags (OR filtering)
      result = result.filter(q => 
        q.tags && q.tags.some(tag => selectedTags.includes(tag))
      );
    }
    
    return result;
  }, [quizzes, searchQuery, selectedTags]);

  const toggleFilterTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--hextech-gold-light)', fontSize: '3rem', marginBottom: '0.5rem', letterSpacing: '3px' }}>
          ARCHIVE OF KNOWLEDGE
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          Browse community-forged trials and enhance your mastery.
        </p>
      </div>

      <div className="lobby-main">
        <aside className="lobby-sidebar">
          <div className="search-box glass-panel" style={{ padding: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} color="var(--hextech-magic)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search trials..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem', 
                  borderRadius: '4px', 
                  border: '1px solid rgba(10, 200, 185, 0.2)', 
                  background: 'rgba(0,0,0,0.3)', 
                  color: 'white'
                }}
              />
            </div>
          </div>

          <div className="tag-filter-group glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--hextech-gold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} /> SPECIALIZATIONS
            </h4>
            <button 
              className={`tag-btn ${selectedTags.length === 0 ? 'active' : ''}`} 
              onClick={() => setSelectedTags([])}
            >
              All Trials
            </button>
            {OFFICIAL_TAGS.map(tag => (
              <button 
                key={tag} 
                className={`tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleFilterTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <button className="btn outline-btn" onClick={() => navigate('/')}>
            Exit Vault
          </button>
        </aside>

        <section className="quiz-content">
          {loading ? (
            <div className="flex-center py-4" style={{ height: '300px' }}>
              <Loader className="animate-spin text-hextech-magic" size={50} />
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="glass-panel" style={{ padding: '5rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <Target size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '1.5rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No trials match your current filters.</p>
              <button onClick={() => {setSearchQuery(''); setSelectedTags([]);}} className="back-link mt-4">Clear All Filters</button>
            </div>
          ) : (
            <div className="quiz-grid">
              {filteredQuizzes.map(quiz => (
                <div key={quiz.id} className="card-wide glass-panel">
                  <div className="card-banner">
                    <Hash size={40} color="rgba(10, 200, 185, 0.1)" />
                  </div>
                  <div className="card-content">
                    <h3 style={{ fontSize: '1.4rem', color: 'white', fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>{quiz.title}</h3>
                    
                    <div className="card-tags">
                      {quiz.tags && quiz.tags.length > 0 ? quiz.tags.map(t => (
                        <span key={t} className="mini-tag">{t}</span>
                      )) : <span className="mini-tag" style={{opacity: 0.5}}>General</span>}
                    </div>

                    <div className="card-meta">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={14} /> {quiz.profiles?.username || 'Ancient Mage'}
                      </span>
                      <span style={{ color: 'var(--hextech-magic)', fontWeight: 'bold' }}>
                        {quiz.plays || 0} PLAYS
                      </span>
                    </div>

                    <button 
                      className="btn primary-btn full-width mt-4" 
                      onClick={() => navigate(`/play/${quiz.id}`)}
                    >
                      CHALLENGE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
