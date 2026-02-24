const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('rm -rf /var/www/grand-transfer/node_modules /var/www/grand-transfer/grand-transfer.tar.gz && docker image prune -a -f && df -h', (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('close', (code, signal) => {
            console.log(output);
            conn.end();
        }).on('data', (data) => {
            output += data;
        }).stderr.on('data', (data) => {
            // ignore
        });
    });
}).connect({
    host: '155.212.216.227',
    port: 22,
    username: 'root',
    password: 'nQ%RJGoHF7kZ'
});
