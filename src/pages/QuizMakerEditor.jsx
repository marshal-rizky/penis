import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Image as ImageIcon, Loader, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import './QuizMaker.css';

const OFFICIAL_TAGS = [
  "Map Awareness",
  "Wave Management",
  "Champion Matchups",
  "Lane Macro",
  "Fighting Mechanics"
];

export default function QuizMakerEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [questions, setQuestions] = useState([
    {
      id: crypto.randomUUID(),
      text: '',
      dbId: null,
      imageUrl: null, // New image url field
      options: [
        { id: crypto.randomUUID(), colorId: 'q', text: '', isCorrect: true, dbId: null },
        { id: crypto.randomUUID(), colorId: 'w', text: '', isCorrect: false, dbId: null },
        { id: crypto.randomUUID(), colorId: 'e', text: '', isCorrect: false, dbId: null },
        { id: crypto.randomUUID(), colorId: 'r', text: '', isCorrect: false, dbId: null }
      ]
    }
  ]);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(id !== 'new');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (id === 'new') return;
    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();
        
      if (quizError) throw quizError;
      setTitle(quizData.title);
      setSelectedTags(quizData.tags || []);

      const { data: qsData, error: qsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', id)
        .order('id', { ascending: true }); // ensure consistent ordering
        
      if (qsError) throw qsError;

      if (qsData && qsData.length > 0) {
        const qIds = qsData.map(q => q.id);
        const { data: optsData, error: optsError } = await supabase
          .from('options')
          .select('*')
          .in('question_id', qIds);
          
        if (optsError) throw optsError;

        const loadedQuestions = qsData.map(q => {
          const qOpts = optsData.filter(o => o.question_id === q.id);
          return {
            id: q.id,
            dbId: q.id,
            text: q.text,
            imageUrl: q.image_url,
            options: qOpts.map(o => ({
              id: o.id,
              dbId: o.id,
              colorId: o.color,
              text: o.text,
              isCorrect: o.is_correct
            }))
          };
        });
        
        setQuestions(loadedQuestions);
      }
    } catch (error) {
      console.error("Error loading quiz:", error);
      alert("Failed to load quiz.");
    } finally {
      setLoading(false);
    }
  };

  /* ----- Form Handlers ----- */
  const handleTitleChange = (e) => setTitle(e.target.value);

  const handleQuestionTextChange = (text) => {
    const updated = [...questions];
    updated[activeQuestion].text = text;
    setQuestions(updated);
  };

  const handleOptionTextChange = (optIndex, text) => {
    const updated = [...questions];
    updated[activeQuestion].options[optIndex].text = text;
    setQuestions(updated);
  };

  const toggleTag = useCallback((tag) => {
    console.log("[DEBUG] Toggling tag:", tag);
    setSelectedTags(prev => {
      const isAlreadySelected = prev.includes(tag);
      const next = isAlreadySelected 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag];
      console.log("[DEBUG] New tags state:", next);
      return next;
    });
  }, []);

  const setCorrectOption = (optIndex) => {
    const updated = [...questions];
    updated[activeQuestion].options.forEach((o, i) => {
      o.isCorrect = i === optIndex;
    });
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        text: '',
        dbId: null,
        imageUrl: null,
        options: [
          { id: crypto.randomUUID(), colorId: 'q', text: '', isCorrect: true, dbId: null },
          { id: crypto.randomUUID(), colorId: 'w', text: '', isCorrect: false, dbId: null },
          { id: crypto.randomUUID(), colorId: 'e', text: '', isCorrect: false, dbId: null },
          { id: crypto.randomUUID(), colorId: 'r', text: '', isCorrect: false, dbId: null }
        ]
      }
    ]);
    setActiveQuestion(questions.length);
  };

  const removeQuestion = (idxToRemove) => {
    if (questions.length === 1) return;
    const updated = questions.filter((_, idx) => idx !== idxToRemove);
    setQuestions(updated);
    if (activeQuestion >= updated.length) {
      setActiveQuestion(updated.length - 1);
    }
  };

  /* ----- Image Uploading ----- */
  const handleImageUpload = async (e) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      setUploadingImage(true);

      const { error: uploadError } = await supabase.storage
        .from('quiz-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('quiz-images')
        .getPublicUrl(filePath);

      const updated = [...questions];
      updated[activeQuestion].imageUrl = publicUrl;
      setQuestions(updated);

    } catch (error) {
      console.error('Error uploading image: ', error.message);
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };

  const removeImage = () => {
    const updated = [...questions];
    updated[activeQuestion].imageUrl = null;
    setQuestions(updated);
  };

  /* ----- Save Logic ----- */
  const saveQuiz = async () => {
    if (!title.trim()) {
      alert("Please give your quiz a title!");
      return;
    }
    
    setIsSaving(true);
    try {
      let currentQuizId = id;

      if (currentQuizId === 'new') {
        console.log("[SAVE] Creating new quiz with tags:", selectedTags);
        const { data: newQuiz, error: insertError } = await supabase
          .from('quizzes')
          .insert([{ title, creator_id: user.id, tags: selectedTags }])
          .select()
          .single();
          
        if (insertError) throw insertError;
        currentQuizId = newQuiz.id;
        console.log("[SAVE] New quiz ID generated:", currentQuizId);
      } else {
        console.log("[SAVE] Updating existing quiz", currentQuizId, "with tags:", selectedTags);
        const { error: updateError } = await supabase
          .from('quizzes')
          .update({ title, tags: selectedTags })
          .eq('id', currentQuizId);
        if (updateError) throw updateError;
      }

      // --- CRITICAL FIX: EXPLICIT DELETION TO PREVENT DOUBLING ---
      if (id !== 'new') {
        console.log("[SAVE] Cleaning up old data for quiz:", currentQuizId);
        
        // 1. Get all question IDs for this quiz
        const { data: existingQs } = await supabase
          .from('questions')
          .select('id')
          .eq('quiz_id', currentQuizId);
        
        if (existingQs && existingQs.length > 0) {
          const qIds = existingQs.map(q => q.id);
          
          // 2. Delete all options for these questions
          console.log("[SAVE] Deleting old options...");
          const { error: optDelErr } = await supabase
            .from('options')
            .delete()
            .in('question_id', qIds);
          if (optDelErr) console.warn("Option cleanup warning:", optDelErr);
          
          // 3. Delete all questions
          console.log("[SAVE] Deleting old questions...");
          const { error: qDelErr } = await supabase
            .from('questions')
            .delete()
            .eq('quiz_id', currentQuizId);
          if (qDelErr) throw qDelErr;
        }
      }

      console.log("[SAVE] Batch inserting new questions and options...");
      for (const q of questions) {
        // ... rest of the question insertion remains the same ...
        const { data: newQ, error: qError } = await supabase
          .from('questions')
          .insert([{ quiz_id: currentQuizId, text: q.text, image_url: q.imageUrl }])
          .select()
          .single();
          
        if (qError) throw qError;

        const optionsToInsert = q.options.map(o => ({
          question_id: newQ.id,
          text: o.text,
          is_correct: o.isCorrect,
          color: o.colorId
        }));

        const { error: oError } = await supabase
          .from('options')
          .insert(optionsToInsert);

        if (oError) throw oError;
      }

      console.log("[SAVE] Save complete!");
      alert("Quiz saved successfully!");
      
      // If we were creating a NEW quiz, redirect to the EDIT page of that quiz
      // This prevents "doubling" if the user hits save twice without refreshing
      if (id === 'new') {
        navigate(`/maker/edit/${currentQuizId}`);
      }
      
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save quiz: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteQuiz = async () => {
    if (id === 'new') {
      navigate('/maker');
      return;
    }
    if (!window.confirm("Are you sure you want to delete this quiz forever?")) return;
    
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      navigate('/maker');
    } catch (error) {
      console.error('Error deleting quiz:', error.message);
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex-center">
        <Loader className="animate-spin text-hextech-magic" size={48} />
      </div>
    );
  }

  const q = questions[activeQuestion];

  return (
    <div className="centered-editor-layout page-container">
      
      {/* Top Navigation / Actions Bar */}
      <div className="editor-top-nav glass-panel mb-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <button className="icon-btn" onClick={() => navigate('/maker')} title="Back to Dashboard">
            <ArrowLeft size={20} />
          </button>
          <input 
            type="text" 
            className="title-input" 
            placeholder="Enter Quiz Title..." 
            value={title}
            onChange={handleTitleChange}
            style={{ maxWidth: '400px', borderBottom: 'none', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '4px' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {id !== 'new' && (
            <button className="btn outline-btn" onClick={deleteQuiz} style={{ color: '#ff4e4e', borderColor: '#ff4e4e' }}>
              <Trash2 size={20} /> Delete Quiz
            </button>
          )}
          <button className="btn primary-btn" onClick={saveQuiz} disabled={isSaving}>
            <Save size={20} /> {isSaving ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </div>

      <div className="editor-main-content">
        {/* TRIAL SPECIALIZATIONS - ULTRA SLIM BAR */}
        <div className="editor-tags-wide glass-panel mb-2" style={{ padding: '0.3rem 1.2rem', minHeight: 'auto', display: 'flex', alignItems: 'center' }}>
          <span style={{ color: 'var(--hextech-gold)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px', marginRight: '1rem', whiteSpace: 'nowrap' }}>
            SPECIALIZATIONS:
          </span>
          <div className="tags-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 0 }}>
            {OFFICIAL_TAGS.map(tag => {
              const isActive = selectedTags.includes(tag);
              return (
                <button 
                  key={tag} 
                  type="button"
                  className={`tag-widget ${isActive ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {isActive && <span className="tag-unselect-x">×</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="editor-grid-container">
          {/* Sidebar - Question List (Left) */}
          <div className="editor-sidebar glass-panel">
            <h3>Questions</h3>
            <div className="question-list">
              {questions.map((question, index) => (
                <div 
                  key={question.id} 
                  className={`sidebar-item ${activeQuestion === index ? 'active' : ''}`}
                  onClick={() => setActiveQuestion(index)}
                >
                  <span className="q-num">{index + 1}</span>
                  <span className="q-preview">{question.text || 'Empty Question'}</span>
                </div>
              ))}
            </div>
            <button 
              className="btn outline-btn full-width mt-4" 
              onClick={addQuestion}
            >
              <Plus size={16} /> Add Question
            </button>
          </div>

          {/* Main Editor Area (Right) */}
          {q && (
            <div className="question-editor glass-panel">
              <div className="editor-top-bar">
              <h4>Question {activeQuestion + 1}</h4>
              <button 
                className="icon-btn danger" 
                onClick={() => removeQuestion(activeQuestion)}
                disabled={questions.length <= 1}
                title="Delete Question"
              >
                <Trash2 size={20}/>
              </button>
            </div>
            
            <textarea 
              className="question-textarea" 
              placeholder="Start typing your question..."
              value={q.text}
              onChange={(e) => handleQuestionTextChange(e.target.value)}
            />

            {/* Image Uploading Section */}
            <div className={`image-upload-area ${q.imageUrl ? 'has-image' : ''}`} onClick={() => !q.imageUrl && fileInputRef.current?.click()}>
              {uploadingImage ? (
                <Loader className="animate-spin text-hextech-magic" size={40} />
              ) : q.imageUrl ? (
                <div className="uploaded-image-preview">
                  <img src={q.imageUrl} alt="Question Graphic" />
                  <button className="remove-image-btn" onClick={(e) => { e.stopPropagation(); removeImage(); }}>
                    <X size={16} /> Remove
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <ImageIcon size={40} />
                  <p>Click to attach an image (Max 5MB)</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/png, image/jpeg, image/webp, image/gif" 
                style={{ display: 'none' }} 
              />
            </div>

            <div className="options-editor-grid mt-4">
              {q.options.map((opt, optIndex) => (
                <div key={opt.id} className="option-edit-box" style={{'--opt-color': `var(--option-${opt.colorId})`}}>
                  <input 
                    type="radio" 
                    name={`correct-answer`} 
                    checked={opt.isCorrect} 
                    onChange={() => setCorrectOption(optIndex)} 
                    title="Mark as correct answer"
                  />
                  <input 
                    type="text" 
                    className="option-input" 
                    value={opt.text} 
                    onChange={(e) => handleOptionTextChange(optIndex, e.target.value)}
                    placeholder={`Option ${opt.colorId.toUpperCase()}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
