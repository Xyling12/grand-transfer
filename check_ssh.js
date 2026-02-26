const { spawn } = require('child_process');

const p = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ConnectTimeout=15',
    'root@185.171.82.112',
    'free -m && echo "---" && docker ps'
]);

p.stdout.on('data', d => process.stdout.write(d.toString()));
p.stderr.on('data', d => process.stderr.write(d.toString()));

p.stdin.write('g4wJm5J8_8J@we\n');

setTimeout(() => {
    console.log("Timeout reached, closing script.");
    p.kill();
}, 15000);
