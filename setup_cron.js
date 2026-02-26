const { Client } = require('ssh2');

const conn = new Client();
console.log('Connecting to VPS 185.171.82.112 to setup cron...');

conn.on('ready', () => {
    console.log('Client :: ready. Setting up nightly cron job...');

    // This command appends the cleanup job to the root crontab to run at 3:00 AM every night
    // and checks if it already exists to prevent duplicates.
    const cronJob = '0 3 * * * /usr/bin/docker system prune -af --volumes >/dev/null 2>&1 && journalctl --vacuum-time=1d >/dev/null 2>&1 && apt-get clean >/dev/null 2>&1';

    // Command to add the cron job safely
    const cmd = `(crontab -l 2>/dev/null | grep -v "docker system prune -af"; echo "${cronJob}") | crontab - && crontab -l`;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Cron setup complete. Connection closed.');
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
