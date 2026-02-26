const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    conn.exec('free -h && echo "---" && docker ps -a', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('\nStream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect({
    host: '185.171.82.112',
    port: 22,
    username: 'root',
    password: 'g4wJm5J8_8J@we',
    readyTimeout: 15000
});
