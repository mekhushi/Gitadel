import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import ThreeWorld from './components/ThreeWorld';
import { Terminal, GitBranch, Layers, Zap } from 'lucide-react';

const socket = io('http://localhost:3001');

function App() {
  const [repoData, setRepoData] = useState({ commits: [], branches: [], currentBranch: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to Git Server');
      socket.emit('get-repo-data');
    });

    socket.on('repo-data', (data) => {
      setRepoData(data);
      setLoading(false);
    });

    return () => {
      socket.off('connect');
      socket.off('repo-data');
    };
  }, []);

  const handleMerge = (source) => {
    socket.emit('merge', { source, target: repoData.currentBranch });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ThreeWorld commits={repoData.commits} />
      
      <div className="hud-container">
        <header className="hud-panel top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Zap color="var(--accent-primary)" fill="var(--accent-primary)" size={24} />
            <h1 style={{ fontSize: '1.2rem', margin: 0 }}>Git Command Center</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitBranch size={20} color="var(--accent-secondary)" />
            <span className="rts-font" style={{ fontSize: '0.9rem' }}>{repoData.currentBranch || 'N/A'}</span>
          </div>
        </header>

        <footer className="bottom-bar">
          <div className="hud-panel branch-list">
            <h3 style={{ fontSize: '0.8rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} /> Territories (Branches)
            </h3>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
              {repoData.branches.map(branch => (
                <div 
                  key={branch} 
                  className={`hud-panel ${branch === repoData.currentBranch ? 'active' : ''}`}
                  style={{ 
                    padding: '10px 15px', 
                    minWidth: '150px',
                    border: branch === repoData.currentBranch ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{branch}</span>
                  {branch !== repoData.currentBranch && (
                    <button onClick={() => handleMerge(branch)} style={{ fontSize: '0.6rem', padding: '5px 10px' }}>
                      CAPTURE (MERGE)
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="hud-panel commit-details">
            <h3 style={{ fontSize: '0.8rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={16} /> Latest Recon
            </h3>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              {repoData.commits.slice(0, 5).map(commit => (
                <div key={commit.hash} style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>
                  <div style={{ color: 'var(--accent-primary)' }}>{commit.hash.substring(0, 7)}</div>
                  <div>{commit.message}</div>
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {loading && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <h1 className="rts-font">Scanning Repository...</h1>
        </div>
      )}
    </div>
  );
}

export default App;
