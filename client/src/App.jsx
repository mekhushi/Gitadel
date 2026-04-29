import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import ThreeWorld from './components/ThreeWorld';
import WarZone from './components/WarZone';
import InitBackground from './components/InitBackground';
import { Zap, Shield, AlertTriangle, User, Star, GitFork, ChevronRight } from 'lucide-react';

const socket = io('http://localhost:3001');

const CustomCursor = () => {
  const cursorX = useSpring(0, { damping: 25, stiffness: 300 });
  const cursorY = useSpring(0, { damping: 25, stiffness: 300 });
  const scale = useSpring(1, { damping: 20, stiffness: 200 });

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };
    const handleDown = () => scale.set(0.8);
    const handleUp = () => scale.set(1);
    
    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '1px solid rgba(0, 255, 255, 0.4)',
        background: 'rgba(0, 255, 255, 0.05)',
        pointerEvents: 'none',
        zIndex: 9999,
        x: cursorX,
        y: cursorY,
        scale,
      }}
    />
  );
};

const KineticText = ({ text }) => {
  const letters = text.split("");
  const mouseX = useSpring(0, { damping: 50, stiffness: 400 });
  const mouseY = useSpring(0, { damping: 50, stiffness: 400 });

  useEffect(() => {
    const move = (e) => {
      mouseX.set((e.clientX - window.innerWidth / 2) * 0.05);
      mouseY.set((e.clientY - window.innerHeight / 2) * 0.05);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <motion.div 
      style={{ display: 'flex', overflow: 'hidden', x: mouseX, y: mouseY }}
    >
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          initial={{ y: "100%", rotate: 10 }}
          animate={{ y: 0, rotate: 0 }}
          transition={{
            delay: i * 0.03,
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1]
          }}
          style={{ display: 'inline-block' }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

function App() {
  const [repoData, setRepoData] = useState({ commits: [], branches: [], currentBranch: '', repoPath: null });
  const [loading, setLoading] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showWarZone, setShowWarZone] = useState(false);
  const [username, setUsername] = useState('');
  const [userRepos, setUserRepos] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    socket.on('repo-status', (msg) => {
      setLoading(true);
      setStatusMessage(msg);
    });

    socket.on('repo-data', (data) => {
      setRepoData(data);
      setLoading(false);
      setShowBriefing(true);
    });

    socket.on('repo-error', (msg) => {
      setError(msg);
      setLoading(false);
    });

    return () => {
      socket.off('repo_data');
      socket.off('clone_status');
      socket.off('repo-status');
    };
  }, []);

  const fetchUserRepos = async (e) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    setStatusMessage('FETCHING INTELLIGENCE...');
    try {
      const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated`);
      if (!response.ok) throw new Error('USER NOT FOUND');
      const data = await response.json();
      setUserRepos(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <CustomCursor />

      {/* WarZone Overlay */}
      <AnimatePresence>
        {showWarZone && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <WarZone 
              conflictFiles={repoData.conflicts || [
                { file: 'CORE_ENGINE.sys', content: '<<<<<<<\n// LOGIC CORE DELTA\n=======\n// LOGIC CORE OMEGA\n>>>>>>>' }
              ]} 
              onResolve={() => setShowWarZone(false)} 
              onCancel={() => setShowWarZone(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!repoData.repoPath ? (
          <motion.div 
            key="init"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.5 }}
            className="init-screen"
            style={{ position: 'fixed', inset: 0 }}
          >
            <InitBackground />
            
            <div style={{ zIndex: 10, textAlign: 'center', width: '100%', maxWidth: '1200px', padding: '0 20px' }}>
              <motion.div 
                className="outline-text hero-title"
                style={{ fontWeight: 700, lineHeight: 1, letterSpacing: '-0.05em', display: 'flex', justifyContent: 'center' }}
              >
                <KineticText text="GITADEL" />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ marginTop: '20px', color: '#333', fontSize: '0.6rem', letterSpacing: '8px' }}
              >
                GENERATIVE VISUALIZATION ENGINE / v2.1
              </motion.div>

              {!userRepos.length ? (
                <form onSubmit={fetchUserRepos} style={{ marginTop: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="ENTER GITHUB IDENTITY" 
                    className="input-field"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <div style={{ marginTop: '40px' }}>
                    <button type="submit" className="primary" style={{ padding: '20px 60px', fontSize: '0.8rem', letterSpacing: '2px' }}>
                      {loading ? statusMessage : 'ESTABLISH LINK'}
                    </button>
                  </div>
                </form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }}
                  style={{ width: '100%', marginTop: '100px', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', gap: '30px', marginBottom: '60px', alignItems: 'center', justifyContent: 'center' }}>
                    <button onClick={() => setUserRepos([])} style={{ fontSize: '0.6rem', padding: '10px 20px' }}>BACK</button>
                    <span style={{ fontSize: '0.6rem', fontWeight: 400, color: '#444', letterSpacing: '4px' }}>SELECTED IDENTITY / {username.toUpperCase()}</span>
                  </div>
                  <div className="mission-grid">
                    {userRepos.map((repo, i) => (
                      <motion.div
                        key={repo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.8 }}
                        className="mission-card"
                        onClick={() => {
                          setLoading(true);
                          setStatusMessage('ESTABLISHING SECURE LINK...');
                          socket.emit('set-repo-path', repo.clone_url);
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ fontWeight: 600, letterSpacing: '1px' }}>{repo.name.toUpperCase()}</h4>
                        </div>
                        
                        <p>{repo.description || "No mission intelligence provided for this sector."}</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                          <div style={{ fontSize: '0.5rem', color: '#444', letterSpacing: '2px', fontFamily: 'JetBrains Mono' }}>
                            STARS {repo.stargazers_count}
                          </div>
                          <motion.div
                            whileHover={{ x: 5 }}
                            style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 600, letterSpacing: '1px' }}
                          >
                            OPEN
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {loading && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ 
                          position: 'fixed', 
                          inset: 0, 
                          background: 'rgba(0,0,0,0.95)', 
                          backdropFilter: 'blur(30px)',
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center',
                          zIndex: 5000
                        }}
                      >
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          style={{ width: '40px', height: '40px', border: '1px solid #333', borderTopColor: '#fff', borderRadius: '50%' }}
                        />
                        <div style={{ marginTop: '30px', fontSize: '0.6rem', letterSpacing: '6px', color: '#fff' }}>
                          {statusMessage.toUpperCase()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ width: '100%', height: '100%' }}
          >
            <ThreeWorld 
              commits={repoData.commits} 
              branches={repoData.branches} 
              currentBranch={repoData.currentBranch}
              onSelectCommit={setSelectedCommit}
              selectedCommit={selectedCommit}
            />

            {/* Mission Briefing Overlay */}
            <AnimatePresence>
              {showBriefing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mission-briefing-overlay"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="briefing-card"
                  >
                    <div className="briefing-header">MISSION BRIEFING</div>
                    <div className="briefing-body">
                      <p>Commander, welcome to <strong>Gitadel City</strong>—a 3D representation of your project history.</p>
                      <ul>
                        <li><span>🏢</span> <strong>Towers:</strong> Each building is a saved step (Commit).</li>
                        <li><span>📈</span> <strong>Height:</strong> Taller towers mean more work was done.</li>
                        <li><span>🔍</span> <strong>Action:</strong> Click any tower to investigate the mission intel.</li>
                      </ul>
                    </div>
                    <button className="rts-btn" onClick={() => setShowBriefing(false)}>BEGIN MISSION</button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selection Details Panel */}
            <AnimatePresence>
              {selectedCommit && (
                <motion.div 
                  initial={{ x: 450, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 450, opacity: 0 }}
                  className="details-panel-glass"
                >
                  <div className="panel-header">
                    <div className="sector-tag">SECTOR: {selectedCommit.hash?.substring(0, 8)}</div>
                    <button className="close-panel" onClick={() => setSelectedCommit(null)}>×</button>
                  </div>
                  
                  <div className="panel-content">
                    <h2>{selectedCommit.message.toUpperCase()}</h2>
                    <div className="meta-row">
                      <span className="label">AUTHOR:</span>
                      <span className="value">{selectedCommit.author.toUpperCase()}</span>
                    </div>
                    <div className="meta-row">
                      <span className="label">TERRITORY:</span>
                      <span className="value">{repoData.currentBranch.toUpperCase()}</span>
                    </div>
                    
                    <div className="action-grid-mini">
                      <button className="rts-btn-small">CHECKOUT</button>
                      <button className="rts-btn-small outline">RECON</button>
                    </div>
                  </div>
                  
                  <button className="back-to-base" onClick={() => setSelectedCommit(null)}>
                    RETURN TO OVERVIEW
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="hud-container">
              <header className="top-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#fff', borderRadius: '50%' }} />
                  <h1 style={{ fontSize: '0.9rem' }}>GITADEL OS / 2026</h1>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="rts-btn-small" 
                    style={{ background: '#ff0055', color: '#fff' }}
                    onClick={() => setShowWarZone(true)}
                  >
                    TEST COMBAT PROTOCOL
                  </button>
                  <button 
                    className="rts-btn-small outline" 
                    onClick={() => {
                      setRepoData({ commits: [], branches: [], currentBranch: '', repoPath: null });
                      setUserRepos([]);
                      setUsername('');
                      setSelectedCommit(null);
                    }}
                  >
                    EXIT
                  </button>
                </div>
              </header>

              <div className="bottom-bar">
                <div className="hud-panel branch-list" style={{ width: '100%', maxWidth: '1400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ fontSize: '0.5rem', color: '#666', letterSpacing: '4px', marginBottom: '5px' }}>ACTIVE SECTOR / TERRITORY</h3>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{repoData.currentBranch.toUpperCase()}</h2>
                    </div>
                    <button 
                      className="primary" 
                      style={{ background: '#fff', color: '#000', padding: '15px 40px', fontSize: '0.7rem' }}
                      onClick={() => {
                        const target = prompt('ENTER TARGET SECTOR (BRANCH) TO MERGE INTO CURRENT:');
                        if (target) socket.emit('merge', target);
                      }}
                    >
                      INITIATE SECTOR MERGE
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {repoData.branches.map(branch => (
                      <motion.div 
                        key={branch} 
                        whileHover={{ y: -5 }}
                        className="mission-card"
                        style={{ 
                          padding: '15px 25px', 
                          minWidth: '180px',
                          cursor: 'pointer',
                          background: branch === repoData.currentBranch ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)',
                          borderColor: branch === repoData.currentBranch ? '#fff' : 'rgba(255,255,255,0.1)'
                        }}
                        onClick={() => socket.emit('checkout', branch)}
                      >
                        <div style={{ fontSize: '0.4rem', color: '#444', marginBottom: '5px' }}>SECTOR ID</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{branch.toUpperCase()}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Conflicts UI */}
      {/* (You can add WarZone back here if needed) */}
    </div>
  );
}

export default App;
