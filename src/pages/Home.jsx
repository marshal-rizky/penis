import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sword, Trophy, Users, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect them to the dashboard
    if (user) {
      console.log("[AUTH] Redirecting logged in user to dashboard");
      navigate('/maker', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="home-container">
      <main className="hero-section">
        
        <div className="hero-icon-wrapper">
          <div className="hero-icon-inner">
            <Sword size={40} color="#0ac8b9" />
          </div>
        </div>

        <h1 className="hero-title">
          WELCOME TO<br/>
          <span className="hero-title-highlight">HEXTECH TRIVIA</span>
        </h1>
        
        <p className="hero-subtitle">
          Forge custom trials, test your lore knowledge, and challenge<br/>
          summoners across Runeterra. Are you ready to prove your worth?
        </p>
        
        <div className="hero-actions">
          <Link to="/login" className="btn primary-btn hero-btn">
            LOG IN TO VAULT
          </Link>
          <Link to="/signup" className="btn secondary-btn hero-btn">
            CREATE ACCOUNT
          </Link>
        </div>
        
        <div className="guest-link-wrapper">
          <span className="or-text">or</span>
          <Link to="/lobby" className="guest-link">
            <Play size={12} fill="#0ac8b9" /> Play as Guest
          </Link>
        </div>

      </main>

      <section className="feature-cards-container">
        <div className="feature-card">
          <div className="feature-icon">
            <Sword size={24} color="#0ac8b9" />
          </div>
          <h3>CREATE TRIALS</h3>
          <p>Design intricate quizzes with custom imagery, timers, and bounty points.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Trophy size={24} color="#c8aa6e" />
          </div>
          <h3>CLIMB RANKS</h3>
          <p>Score points based on speed and accuracy to achieve Challenger rank.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Users size={24} color="#3776d6" />
          </div>
          <h3>GUEST MODE</h3>
          <p>Jump right into the action as a wanderer to play community-made artifacts.</p>
        </div>
      </section>
    </div>
  );
}
