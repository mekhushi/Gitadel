import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import ThreeWorld from './components/ThreeWorld';
import WarZone from './components/WarZone';
import InitBackground from './components/InitBackground';
import { Zap, Shield, AlertTriangle, User, Star, GitFork, ChevronRight, Box, BarChart2, ScanSearch, Cpu, Terminal } from 'lucide-react';

const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3001');

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
            delay: i * 0.015,
            duration: 0.5,
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
            style={{ position: 'fixed', inset: 0, overflowY: 'auto' }}
          >
            <InitBackground />
            
            <div style={{ 
              zIndex: 10, textAlign: 'center', width: '100%', maxWidth: '1200px', padding: '0 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              minHeight: '100vh', 
              justifyContent: userRepos.length ? 'flex-start' : 'center',
              paddingTop: userRepos.length ? '40px' : '0'
            }}>
              <motion.div 
                className="outline-text hero-title"
                style={{ fontWeight: 700, lineHeight: 1, letterSpacing: '-0.05em', display: 'flex', justifyContent: 'center' }}
                animate={{ 
                  scale: userRepos.length ? 0.4 : 1,
                  marginTop: userRepos.length ? '20px' : '0px',
                }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <KineticText text="GITADEL" />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: userRepos.length ? 0 : 1, 
                  height: userRepos.length ? 0 : 'auto',
                  marginTop: userRepos.length ? 0 : '20px'
                }}
                transition={{ duration: 0.3 }}
                style={{ color: '#333', fontSize: '0.6rem', letterSpacing: '8px', overflow: 'hidden' }}
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
                  initial={{ opacity: 0, y: 50 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ width: '100%', marginTop: '0px', textAlign: 'left', flex: 1 }}
                >
                  <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', alignItems: 'center', justifyContent: 'center' }}>
                    <button onClick={() => setUserRepos([])} style={{ fontSize: '0.6rem', padding: '10px 20px' }}>BACK</button>
                    <span style={{ fontSize: '0.6rem', fontWeight: 400, color: '#444', letterSpacing: '4px' }}>SELECTED IDENTITY / {username.toUpperCase()}</span>
                  </div>
                  <div className="mission-grid">
                    {userRepos.map((repo, i) => (
                      <motion.div
                        key={repo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02, duration: 0.3 }}
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
                    initial={{ scale: 0.95, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="briefing-card-clean"
                  >
                    <div className="briefing-header-clean">
                      <div className="header-icon-ring">
                        <Terminal size={18} strokeWidth={1.5} />
                      </div>
                      <h3>Project Initialization</h3>
                    </div>
                    
                    <div className="briefing-content-clean">
                      <h2>Welcome to Gitadel</h2>
                      <p className="briefing-subtext-clean">
                        Your repository history has been parsed and mapped into a spatial visualization. Review the legend below to navigate the environment.
                      </p>

                      <div className="briefing-list-clean">
                        <motion.div className="briefing-list-item" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
                          <div className="icon-box"><Box size={18} strokeWidth={1.5} /></div>
                          <div className="item-text">
                            <h4>Commit Nodes</h4>
                            <p>Each structural tower represents a single commit in your history.</p>
                          </div>
                        </motion.div>
                        <motion.div className="briefing-list-item" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                          <div className="icon-box"><BarChart2 size={18} strokeWidth={1.5} /></div>
                          <div className="item-text">
                            <h4>Metrics</h4>
                            <p>Tower height correlates with the volume of code changes.</p>
                          </div>
                        </motion.div>
                        <motion.div className="briefing-list-item" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                          <div className="icon-box"><ScanSearch size={18} strokeWidth={1.5} /></div>
                          <div className="item-text">
                            <h4>Inspection</h4>
                            <p>Select any node to view detailed author and diff information.</p>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    <div className="briefing-footer-clean">
                      <button className="btn-clean" onClick={() => setShowBriefing(false)}>
                        <span>Enter Workspace</span>
                        <ChevronRight size={16} strokeWidth={2} />
                      </button>
                    </div>
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
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="details-panel-clean"
                >
                  <div className="panel-header-clean">
                    <div className="sector-tag-clean">
                      <GitFork size={14} /> Commit {selectedCommit.hash?.substring(0, 8)}
                    </div>
                    <button className="close-panel-clean" onClick={() => setSelectedCommit(null)}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  
                  <div className="panel-content-clean">
                    <h2 className="commit-title-clean">{selectedCommit.message}</h2>
                    
                    <div className="meta-box-clean">
                      <div className="meta-row-clean">
                        <span className="label"><User size={14} /> Author</span>
                        <span className="value">{selectedCommit.author_name || selectedCommit.author}</span>
                      </div>
                      <div className="meta-row-clean">
                        <span className="label"><GitFork size={14} /> Branch</span>
                        <span className="value">{repoData.currentBranch}</span>
                      </div>
                      <div className="meta-row-clean">
                        <span className="label"><Box size={14} /> Date</span>
                        <span className="value">
                          {selectedCommit.date 
                            ? new Date(selectedCommit.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                            : 'Unknown Date'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="action-grid-clean">
                      <button 
                        className="btn-clean primary-btn" 
                        onClick={() => {
                          setLoading(true);
                          setStatusMessage('CHECKING OUT COMMIT...');
                          socket.emit('checkout', selectedCommit.hash);
                          setSelectedCommit(null);
                        }}
                      >
                        Checkout
                      </button>
                      <button 
                        className="btn-clean secondary-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedCommit.hash);
                          alert('Commit hash copied!');
                        }}
                      >
                        Copy Hash
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="hud-container">
              <header className="top-bar-clean">
                <div className="brand-logo">
                  <div className="logo-dot" />
                  <h1>Gitadel Workspace</h1>
                </div>
                <div className="top-actions">
                  <button 
                    className="btn-clean danger-btn" 
                    onClick={() => setShowWarZone(true)}
                  >
                    Resolve Conflicts
                  </button>
                  <button 
                    className="btn-clean secondary-btn" 
                    onClick={() => {
                      setRepoData({ commits: [], branches: [], currentBranch: '', repoPath: null });
                      setSelectedCommit(null);
                    }}
                  >
                    Exit Workspace
                  </button>
                </div>
              </header>

              <div className="bottom-bar">
                <div className="hud-panel-glass branch-list">
                  <div className="hud-header-clean">
                    <div className="active-sector-info">
                      <h3>Active Branch</h3>
                      <h2>{repoData.currentBranch}</h2>
                    </div>
                    <button 
                      className="btn-clean primary-btn" 
                      onClick={() => {
                        const target = prompt('Enter target branch to merge into current:');
                        if (target) socket.emit('merge', target);
                      }}
                    >
                      Initiate Merge
                    </button>
                  </div>

                  <div className="branch-scroll-container">
                    {repoData.branches.map(branch => (
                      <motion.div 
                        key={branch} 
                        whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.06)' }}
                        className={`branch-card-glass ${branch === repoData.currentBranch ? 'active' : ''}`}
                        onClick={() => socket.emit('checkout', branch)}
                        title={`Branch: ${branch}`}
                      >
                        <div className="branch-label">Branch</div>
                        <div className="branch-name">
                          {branch}
                        </div>
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
