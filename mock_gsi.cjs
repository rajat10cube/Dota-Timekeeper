const http = require('http');

let clock = 165; // Start at 2:45 to test the 3-minute bounty, lotus, and stacking timers!

setInterval(() => {
  const payload = JSON.stringify({
    map: {
      game_state: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS',
      clock_time: clock
    }
  });

  const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/gsi',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = http.request(options, (res) => {
      // Ignored
  });

  req.on('error', (e) => {
      // Just console error if the endpoint isn't up
  });

  req.write(payload);
  req.end();

  clock++;
}, 1000);

console.log('Mock GSI running. Starting at game time ' + clock);
