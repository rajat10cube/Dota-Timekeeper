import { useEffect, useState, useRef } from 'react';
import './App.css';

function App() {
  const [clockTime, setClockTime] = useState(null);
  const [gameState, setGameState] = useState('Waiting for Match...');
  const gameStateRef = useRef('Waiting for Match...');
  const [alerts, setAlerts] = useState([]);
  const [appLocation, setAppLocation] = useState('top-right');
  
  // Track events we have already beeped for to prevent multiple beeps
  const beepTracking = useRef({});
  const settingsRef = useRef({
    showBounty: true,
    showPower: true,
    showWisdom: true,
    showLotus: true,
    showStacking: true,
    location: 'top-right'
  });

  useEffect(() => {
    if (window.electronAPI) {
      if (window.electronAPI.onSettingsUpdate) {
        window.electronAPI.onSettingsUpdate((newSettings) => {
          settingsRef.current = newSettings;
          if (newSettings.location) {
            setAppLocation(newSettings.location);
          }
          setClockTime(prev => {
            if (prev !== null) calculateAlerts(prev);
            return prev;
          });
        });
      }

      window.electronAPI.onGSIUpdate((payload) => {
        if (payload && payload.map) {
          if (payload.map.game_state !== undefined) {
             setGameState(payload.map.game_state);
             gameStateRef.current = payload.map.game_state;
          }

          if (payload.map.game_state === 'DOTA_GAMERULES_STATE_POST_GAME' || payload.map.game_state === 'DOTA_GAMERULES_STATE_DISCONNECT') {
             setClockTime(null);
             setAlerts([]);
          } else if (payload.map.clock_time !== undefined) {
             setClockTime(payload.map.clock_time);
             calculateAlerts(payload.map.clock_time);
          }
        } else {
          setClockTime(null);
          setGameState('Waiting for Match...');
          setAlerts([]);
        }
      });
    }
  }, []);

  const formatTime = (seconds) => {
    if (seconds === null) return '00:00';
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const m = Math.floor(absSeconds / 60);
    const s = absSeconds % 60;
    return `${isNegative ? '-' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine'; 
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.8);

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05); // Fade in to avoid click
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) {
      // Audio might fail if no user interaction, but electron can bypass this via webPreferences ideally
    }
  };

  const checkBeep = (name, timeVal) => {
    const key = `${name}-${timeVal}`;
    if (!beepTracking.current[key]) {
      playChime();
      beepTracking.current[key] = true;
    }
  };

  const calculateAlerts = (time) => {
    if (time <= 0 && gameStateRef.current.includes('PRE_GAME')) {
      setAlerts([]);
      return;
    }
    
    let newAlerts = [];
    const WARN_TIME = 15;
    const settings = settingsRef.current;

    // --- BOUNTY RUNES ---
    if (settings.showBounty) {
      const nextBounty = Math.ceil(time / 180) * 180;
      if (nextBounty - time <= WARN_TIME && nextBounty > 0 && nextBounty - time > 0) {
        newAlerts.push({ name: 'Bounty Runes', timer: nextBounty - time, color: '#eab308' });
        if (nextBounty - time === WARN_TIME || nextBounty - time === WARN_TIME - 1) checkBeep('bounty', nextBounty);
      }
    }

    // --- POWER RUNES ---
    if (settings.showPower) {
      const nextPower = Math.ceil(time / 120) * 120;
      if (nextPower >= 120 && nextPower - time <= WARN_TIME && nextPower - time > 0) {
        newAlerts.push({ name: 'Power / Water Runes', timer: nextPower - time, color: '#3b82f6' });
        if (nextPower - time === WARN_TIME || nextPower - time === WARN_TIME - 1) checkBeep('power', nextPower);
      }
    }

    // --- WISDOM RUNES ---
    if (settings.showWisdom) {
      const nextWisdom = Math.ceil(time / 420) * 420;
      if (nextWisdom >= 420 && nextWisdom - time <= WARN_TIME && nextWisdom - time > 0) {
        newAlerts.push({ name: 'Wisdom Rune', timer: nextWisdom - time, color: '#8b5cf6' });
        if (nextWisdom - time === WARN_TIME || nextWisdom - time === WARN_TIME - 1) checkBeep('wisdom', nextWisdom);
      }
    }

    // --- HEALING LOTUS ---
    if (settings.showLotus) {
      const nextLotus = Math.ceil(time / 180) * 180;
      if (nextLotus >= 180 && nextLotus - time <= WARN_TIME && nextLotus - time > 0) {
        newAlerts.push({ name: 'Healing Lotus', timer: nextLotus - time, color: '#ec4899' });
        if (nextLotus - time === WARN_TIME || nextLotus - time === WARN_TIME - 1) checkBeep('lotus', nextLotus);
      }
    }

    // --- CAMP STACKING ---
    if (settings.showStacking) {
      // Neutral camps first spawn at 1:00. The very first stack attempt happens at 1:53.
      if (time >= 60) {
        const minuteMark = Math.ceil((time + 1) / 60) * 60; 
        const stackPullTime = minuteMark - 7; 
        if (stackPullTime > time && stackPullTime - time <= 10) { 
            newAlerts.push({ name: 'Camp Stacking', timer: stackPullTime - time, color: '#22c55e' });
            if (stackPullTime - time === 10 || stackPullTime - time === 9) checkBeep('stack', stackPullTime);
        }
      }
    }

    setAlerts(newAlerts);
  };

  const getContainerStyle = () => {
    switch(appLocation) {
      case 'top-left': return { top: '50px', left: '50px' };
      case 'top-right': return { top: '50px', right: '50px' };
      case 'center-left': return { top: '50%', left: '50px', transform: 'translateY(-50%)' };
      case 'center-right': return { top: '50%', right: '50px', transform: 'translateY(-50%)' };
      case 'bottom-left': return { bottom: '50px', left: '50px' };
      case 'bottom-right': return { bottom: '50px', right: '50px' };
      default: return { top: '50px', right: '50px' };
    }
  };

  return (
    <div className="overlay-container" style={getContainerStyle()}>
      <div className="top-banner" style={{ display: clockTime === null ? 'none' : 'flex' }}>
        <h2>{formatTime(clockTime)}</h2>
        <span className="status">{gameState.replace('DOTA_GAMERULES_STATE_', '').replace(/_/g, ' ')}</span>
      </div>

      <div className="empty-state" style={{ display: clockTime === null ? 'flex' : 'none' }}>
        <h2>{gameState === 'DOTA_GAMERULES_STATE_POST_GAME' ? 'Game Over' : 'Waiting for Dota 2...'}</h2>
        <p>{gameState === 'DOTA_GAMERULES_STATE_POST_GAME' ? 'Waiting for the next match to start.' : 'Make sure to start the game.'}</p>
      </div>

      <div className="alerts-container">
        {alerts.map((alert, idx) => (
          <div key={idx} className="alert-card" style={{ borderColor: alert.color, boxShadow: `0 0 20px ${alert.color}55` }}>
             <h3 style={{ color: alert.color }}>{alert.name}</h3>
             <p>in {alert.timer}s</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
