const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    conn.exec("docker logs grandtransfer-dark-ygfq1b-web-1 2>&1 | tail -n 100", (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        });
    });
}).connect({
    host: '185.171.82.112',
    port: 22,
    username: 'root',
    password: 'g4wJm5J8_8J@we'
});
