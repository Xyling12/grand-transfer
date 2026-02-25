const { Client } = require('ssh2');

const conn = new Client();
console.log('Connecting to VPS 185.171.82.112...');

conn.on('ready', () => {
    console.log('Client :: ready. Running cleanup commands...');

    // Cleaning docker cache, unused volumes, apt cache, and old journalctl logs
    const cmd = "docker system prune -af --volumes && journalctl --vacuum-time=1d && apt-get clean && df -h";

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Cleanup complete. Connection closed.');
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).on('error', (err) => {
    console.error('Connection error:', err);
}).connect({
    host: '185.171.82.112',
    port: 22,
    username: 'root',
    password: 'g4wJm5J8_8J@we'
});
