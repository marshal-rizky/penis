import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, Trophy, Medal } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import './QuizPlayer.css';

export default function QuizPlayer() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // Game State
  const { user } = useAuth();
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'reveal', 'finished'
  const [leaderboard, setLeaderboard] = useState([]);
  const [submittingScore, setSubmittingScore] = useState(false);

  // References to solve race conditions
  const scoreRef = useRef(0);
  const isRevealingRef = useRef(false);

  const fetchGameplayData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Question Data for this quiz
      const { data: qsData, error: qsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId);
        
      if (qsError) throw qsError;
      if (!qsData || qsData.length === 0) {
        throw new Error("No questions found for this quiz.");
      }

      // 2. Fetch Options for these questions
      const qIds = qsData.map(q => q.id);
      const { data: optsData, error: optsError } = await supabase
        .from('options')
        .select('*')
        .in('question_id', qIds);
        
      if (optsError) throw optsError;

      // 3. Increment play count (fire and forget)
      supabase.from('quizzes').select('plays').eq('id', quizId).single().then(({ data }) => {
        if (data) {
          supabase.from('quizzes').update({ plays: (data.plays || 0) + 1 }).eq('id', quizId).then();
        }
      });

      // Reconstruct for gameplay
      const formattedQuestions = qsData.map(q => {
        const qOpts = optsData.filter(o => o.question_id === q.id);
        return {
          id: q.id,
          text: q.text,
          image: q.image_url,
          options: qOpts.map(o => ({
            id: o.id,
            text: o.text,
            isCorrect: o.is_correct,
            colorId: o.color
          }))
        };
      });
      
      setQuestions(formattedQuestions);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchGameplayData();
  }, [fetchGameplayData]);

  // Timer logic
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    if (timeLeft === 0) {
      handleTimeUp();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  const handleOptionSelect = (opt) => {
    if (gameState !== 'playing' || isRevealingRef.current) return;
    
    setSelectedOption(opt);
    
    // Auto submit logic can go here, or we wait for time up
    // In Kahoot, selecting early just locks it in. Wait for timer or everyone.
    // For single player: immediately reveal.
    handleReveal(opt);
  };

  const handleReveal = (chosenOpt = null) => {
    if (isRevealingRef.current) return;
    isRevealingRef.current = true;

    setGameState('reveal');
    const q = questions[currentQIndex];
    const correctOpt = q.options.find(o => o.isCorrect);
    
    const isCorrect = chosenOpt ? chosenOpt.isCorrect : false;
    
    if (isCorrect) {
      // Score calculation based on time
      const timeBonus = timeLeft * 10;
      const points = 100 + timeBonus;
      scoreRef.current += points;
      setScore(scoreRef.current);
    }
    
    setTimeout(() => {
      if (currentQIndex < questions.length - 1) {
        // Next question
        setCurrentQIndex(prev => prev + 1);
        setTimeLeft(20);
        setSelectedOption(null);
        setGameState('playing');
        isRevealingRef.current = false;
      } else {
        // Game over
        finishGame(scoreRef.current);
      }
    }, 3000); // Wait 3 seconds to show correct answer
  };

  const finishGame = async (finalScore) => {
    setGameState('finished');
    setSubmittingScore(true);

    try {
      // 1. Submit score ONLY if user is logged in
      if (user) {
        const playerName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Summoner';
        
        // 1a. Check if this user already has a score for this quiz
        const { data: existingScores, error: checkError } = await supabase
          .from('leaderboards')
          .select('id, score')
          .eq('quiz_id', quizId)
          .eq('summoner_name', playerName)
          .order('score', { ascending: false });

        if (checkError) console.error("Error checking existing score:", checkError);

        // If there are multiple entries for the same user (from before the fix), keep the highest and delete the rest
        let bestScore = null;
        if (existingScores && existingScores.length > 0) {
          bestScore = existingScores[0];
          
          if (existingScores.length > 1) {
             const idsToDelete = existingScores.slice(1).map(s => s.id);
             const { error: delErr } = await supabase.from('leaderboards').delete().in('id', idsToDelete);
             if (delErr) console.error("Delete duplicates error:", delErr);
          }
        }

        // 1b. Insert or Update only if new score is higher
        if (!bestScore) {
          await supabase.from('leaderboards').insert([{
            quiz_id: quizId,
            summoner_name: playerName,
            score: finalScore
          }]);
        } else if (finalScore > bestScore.score) {
          const { error: updErr } = await supabase.from('leaderboards')
            .update({ score: finalScore })
            .eq('id', bestScore.id);
          if (updErr) console.error("Update score error:", updErr);
        }
      }

      // 2. Fetch Top 10 Leaderboard
      const { data: boardData, error: boardErr } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('quiz_id', quizId)
        .order('score', { ascending: false })
        .limit(10);
        
      if (boardErr) throw boardErr;
      setLeaderboard(boardData || []);

    } catch (err) {
      console.error("Leaderboard error:", err);
    } finally {
      setSubmittingScore(false);
    }
  };

  const handleTimeUp = () => {
    handleReveal(selectedOption);
  };

  if (loading) {
    return (
      <div className="gameplay-container flex-center">
        <Loader className="animate-spin text-hextech-magic" size={60} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="gameplay-container flex-center flex-col text-center">
        <h2 style={{color: '#ff4e4e'}}>{error}</h2>
        <button className="btn outline-btn mt-4" onClick={() => navigate('/lobby')}>Return to Lobby</button>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="gameplay-container flex-center flex-col text-center" style={{ padding: '2rem' }}>
        <div className="glass-panel w-100" style={{ maxWidth: '600px', padding: '3rem 2rem' }}>
          <Trophy size={60} color="var(--hextech-gold)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{fontSize: '2.5rem', color: 'var(--hextech-gold)', marginBottom: '0.5rem', letterSpacing: '2px', fontFamily: 'var(--font-heading)'}}>TRIAL COMPLETED</h2>
          <p style={{fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2rem'}}>
            Your Score: <strong style={{color: 'var(--hextech-magic)', fontSize: '1.5rem'}}>{score}</strong>
          </p>

          <div className="leaderboard-section mt-4 mb-4">
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--hextech-gold-light)' }}>
              <Medal size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
              GLOBAL HALL OF FAME
            </h3>
            
            {submittingScore ? (
              <Loader className="animate-spin text-hextech-magic mx-auto my-4" size={30} />
            ) : leaderboard.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No scores recorded yet.</p>
            ) : (
              <div className="leaderboard-list" style={{ textAlign: 'left', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1rem' }}>
                {leaderboard.map((entry, idx) => (
                  <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: idx < leaderboard.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none', color: idx === 0 ? 'var(--hextech-gold)' : (idx === 1 ? '#C0C0C0' : (idx === 2 ? '#CD7F32' : 'white')), fontWeight: idx < 3 ? 'bold' : 'normal' }}>
                    <span style={{ display: 'flex', gap: '1rem' }}>
                      <span style={{ opacity: 0.7, width: '20px' }}>#{idx + 1}</span>
                      <span>{entry.summoner_name}</span>
                    </span>
                    <span style={{ color: 'var(--hextech-magic)' }}>{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn primary-btn mt-4 full-width" onClick={() => navigate('/lobby')}>RETURN TO VAULT</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className="gameplay-container">
      <div className="game-header">
        <div className="progress-display">Question {currentQIndex + 1} / {questions.length}</div>
        <div className={`timer ${timeLeft <= 5 && gameState === 'playing' ? 'timer-danger' : ''}`}>
          {gameState === 'playing' ? timeLeft : '--'}
        </div>
        <div className="score-display">Score: {score}</div>
      </div>

      <div className="question-section">
        <h2 className="question-text">{currentQ.text}</h2>
        {currentQ.image && (
          <div className="question-image-container">
            <img src={currentQ.image} alt="Question" className="question-image" />
          </div>
        )}
        
        {gameState === 'reveal' && (
          <div className="reveal-banner text-center" style={{marginTop: '2rem', animation: 'fadeIn 0.5s'}}>
             {selectedOption?.isCorrect ? (
               <h3 style={{color: '#47a04f', fontSize: '2rem'}}>Correct!</h3>
             ) : selectedOption ? (
               <h3 style={{color: '#ff4e4e', fontSize: '2rem'}}>Incorrect!</h3>
             ) : (
               <h3 style={{color: '#d69837', fontSize: '2rem'}}>Time's Up!</h3>
             )}
          </div>
        )}
      </div>

      <div className="options-grid">
        {currentQ.options.map((opt) => {
          let extraClasses = '';
          
          if (gameState === 'reveal') {
            if (opt.isCorrect) extraClasses = 'correct-reveal';
            else if (selectedOption?.id === opt.id && !opt.isCorrect) extraClasses = 'incorrect-reveal';
            else extraClasses = 'dim-reveal';
          } else if (selectedOption?.id === opt.id) {
            extraClasses = 'selected';
          }

          return (
            <button 
              key={opt.id}
              className={`option-btn ${extraClasses}`}
              style={{ '--btn-color': `var(--option-${opt.colorId})` }}
              onClick={() => handleOptionSelect(opt)}
              disabled={gameState !== 'playing'}
            >
              <span className="skill-key">{opt.colorId.toUpperCase()}</span>
              <span className="option-text">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
