import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Play, Trash2, Settings, Loader, Sword } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import './QuizMaker.css';

export default function QuizMakerDashboard() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyQuizzes();
  }, [user]);

  const fetchMyQuizzes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (e, id) => {
    e.stopPropagation(); // prevent clicking through to the edit page
    if (!window.confirm("Are you sure you want to delete this trial?")) return;
    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      if (error) throw error;
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  return (
    <div className="forge-container page-container">
      {/* Hero Banner for Dashboard */}
      <div className="forge-hero glass-panel">
        <div className="forge-hero-content">
          <div className="forge-badge">
            <Sword size={24} color="#0ac8b9" />
          </div>
          <div className="forge-text">
            <h2>QUIZ FORGE</h2>
            <p>Create and manage your customized Runeterra trials. Challenge summoners globally.</p>
          </div>
        </div>
        <Link to="/maker/edit/new" className="btn primary-btn new-quiz-btn">
          <Plus size={20} /> NEW TRIAL
        </Link>
      </div>

      <div className="forge-main">
        <div className="forge-header">
          <h3>YOUR ARTIFACTS ({quizzes.length})</h3>
        </div>

        {loading ? (
          <div className="flex-center py-5">
            <Loader className="animate-spin text-hextech-magic" size={40} />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="empty-forge glass-panel">
            <div className="empty-state-icon">
              <Sword size={48} color="var(--text-secondary)" />
            </div>
            <h3>No Trials Forged Yet</h3>
            <p>Begin your journey by creating a new trivia challenge.</p>
            <Link to="/maker/edit/new" className="btn secondary-btn mt-4">
              <Plus size={16} style={{marginRight: '8px'}} /> FORGE A TRIAL
            </Link>
          </div>
        ) : (
          <div className="quiz-grid">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="quiz-card glass-panel">
                <div className="quiz-card-header">
                  <h4>{quiz.title}</h4>
                  <div className="quiz-stats">
                    <span className="play-count"><Play size={12}/> {quiz.plays || 0} plays</span>
                  </div>
                </div>

                <div className="quiz-card-footer">
                  <span className="quiz-date">
                    Created {new Date(quiz.created_at).toLocaleDateString()}
                  </span>
                  
                  <div className="quiz-actions">
                    <Link to={`/play/${quiz.id}`} className="icon-btn tool-btn" title="Play">
                      <Play size={18} />
                    </Link>
                    <Link to={`/maker/edit/${quiz.id}`} className="icon-btn tool-btn" title="Edit">
                      <Settings size={18} />
                    </Link>
                    <button className="icon-btn danger tool-btn" onClick={(e) => deleteQuiz(e, quiz.id)} title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
