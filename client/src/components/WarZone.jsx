import React, { useState, useMemo } from 'react';
import { Sword, Shield, AlertTriangle, Zap } from 'lucide-react';

const WarZone = ({ conflictFiles, onResolve, onCancel }) => {
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const currentFile = conflictFiles[currentFileIndex];
  
  // Parse conflict markers from content
  const sections = useMemo(() => {
    if (!currentFile) return [];
    const lines = currentFile.content.split('\n');
    const result = [];
    let state = 'normal';
    let currentBlock = { type: 'normal', lines: [] };

    lines.forEach(line => {
      if (line.startsWith('<<<<<<<')) {
        result.push(currentBlock);
        currentBlock = { type: 'ours', lines: [] };
        state = 'ours';
      } else if (line.startsWith('=======')) {
        result.push(currentBlock);
        currentBlock = { type: 'theirs', lines: [] };
        state = 'theirs';
      } else if (line.startsWith('>>>>>>>')) {
        result.push(currentBlock);
        currentBlock = { type: 'normal', lines: [] };
        state = 'normal';
      } else {
        currentBlock.lines.push(line);
      }
    });
    result.push(currentBlock);
    return result.filter(s => s.lines.length > 0 || s.type !== 'normal');
  }, [currentFile]);

  const [resolutions, setResolutions] = useState({});

  const toggleResolution = (sectionIndex, side) => {
    setResolutions(prev => ({
      ...prev,
      [sectionIndex]: side
    }));
  };

  const handleFinish = () => {
    // Generate resolved content
    const resolvedContent = sections.map((section, i) => {
      if (section.type === 'normal') return section.lines.join('\n');
      if (section.type === 'ours') {
        const choice = resolutions[i] || resolutions[i+1]; // Find choice for this conflict pair
        if (choice === 'ours') return section.lines.join('\n');
        return null;
      }
      if (section.type === 'theirs') {
        const choice = resolutions[i-1] || resolutions[i];
        if (choice === 'theirs') return section.lines.join('\n');
        return null;
      }
      return '';
    }).filter(s => s !== null).join('\n');

    onResolve(currentFile.file, resolvedContent);
  };

  return (
    <div className="war-zone-overlay">
      <div className="hud-panel" style={{ width: '90%', maxWidth: '1200px', padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'var(--accent-danger)', padding: '10px', borderRadius: '50%' }}>
              <Sword color="white" size={32} />
            </div>
            <div>
              <h1 style={{ color: 'var(--accent-danger)' }}>War Zone: Merge Conflict</h1>
              <p className="rts-font" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Target File: <span style={{ color: 'white' }}>{currentFile?.file}</span>
              </p>
            </div>
          </div>
          <button onClick={onCancel} style={{ background: 'transparent', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)' }}>
            ABORT MISSION
          </button>
        </header>

        <div className="conflict-container">
          {sections.map((section, i) => {
            if (section.type === 'normal') {
              return (
                <div key={i} style={{ gridColumn: '1 / span 2', padding: '10px', opacity: 0.5, fontSize: '0.8rem', borderLeft: '2px solid gray' }}>
                  {section.lines.slice(0, 3).map((l, j) => <div key={j}>{l}</div>)}
                  {section.lines.length > 3 && <div>... {section.lines.length - 3} more lines</div>}
                </div>
              );
            }

            if (section.type === 'ours') {
              const pairIndex = i;
              const isSelected = resolutions[pairIndex] === 'ours';
              return (
                <div 
                  key={i} 
                  className={`conflict-side ours ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleResolution(pairIndex, 'ours')}
                  style={{ cursor: 'pointer', position: 'relative', border: isSelected ? '2px solid var(--accent-success)' : '1px solid var(--accent-primary)' }}
                >
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Shield size={16} color="var(--accent-primary)" />
                    <span className="rts-font" style={{ fontSize: '0.6rem' }}>ALLY CODE</span>
                  </div>
                  {section.lines.map((l, j) => <div key={j} style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{l}</div>)}
                </div>
              );
            }

            if (section.type === 'theirs') {
              const pairIndex = i - 1;
              const isSelected = resolutions[pairIndex] === 'theirs';
              return (
                <div 
                  key={i} 
                  className={`conflict-side theirs ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleResolution(pairIndex, 'theirs')}
                  style={{ cursor: 'pointer', position: 'relative', border: isSelected ? '2px solid var(--accent-success)' : '1px solid var(--accent-danger)' }}
                >
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sword size={16} color="var(--accent-danger)" />
                    <span className="rts-font" style={{ fontSize: '0.6rem' }}>ENEMY CODE</span>
                  </div>
                  {section.lines.map((l, j) => <div key={j} style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{l}</div>)}
                </div>
              );
            }
            return null;
          })}
        </div>

        <footer style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={handleFinish}
            style={{ padding: '15px 40px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '15px' }}
          >
            <Zap fill="white" /> FINISH BATTLE (RESOLVE)
          </button>
        </footer>
      </div>
    </div>
  );
};

export default WarZone;
