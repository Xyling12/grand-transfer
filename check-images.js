const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`docker exec -i grandtransfer-site-hvs52s-web-1 ls -la /app/public/images/tariffs/ || echo "not found"`, (err, stream) => {
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
