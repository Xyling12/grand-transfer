const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    conn.exec(`
    set -e
    export DEBIAN_FRONTEND=noninteractive
    echo "--> Updating APT"
    apt-get update -y
    echo "--> Installing deps"
    apt-get install -y curl git make g++ gcc sqlite3 nginx
    echo "--> Installing Node"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "--> Installing pm2"
    npm install -g pm2
    
    echo "--> Cloning repo"
    rm -rf /var/www/grand-transfer
    mkdir -p /var/www
    git clone https://github.com/Xyling12/grand-transfer.git /var/www/grand-transfer
    cd /var/www/grand-transfer
    
    echo "--> Creating .env"
    cat << 'EOF' > .env
TELEGRAM_BOT_TOKEN="8410817305:AAE6vTlmSuBBWA2Wbwf9_p5wy3QzqF6INz8"
TELEGRAM_CHAT_ID="376060133"
DATABASE_URL="file:./dev.db"
EOF

    echo "--> Installing modules"
    npm install
    echo "--> Generating prisma"
    npx prisma generate
    echo "--> Pushing db"
    npx prisma db push
    echo "--> Building Next.js"
    npm run build
    
    echo "--> Starting pm2"
    pm2 delete grand-transfer || true
    pm2 start npm --name "grand-transfer" -- run start
    pm2 save
    pm2 startup | tail -n 1 | bash - || true
    
    echo "--> Configuring Nginx"
    cat << 'EOF' > /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    server_name xn--c1adbj4b9a7c.com www.xn--c1adbj4b9a7c.com localhost;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
    }
}
EOF
    systemctl restart nginx
    
    echo "--> Setting up SSL"
    apt-get install -y certbot python3-certbot-nginx
    certbot --nginx -n -m admin@xn--c1adbj4b9a7c.com --agree-tos -d xn--c1adbj4b9a7c.com -d www.xn--c1adbj4b9a7c.com || echo "SSL Setup skipped/failed (DNS not propagated yet)"
    
    echo "--> DEPLOYMENT SUCCESSFUL"
  `, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
}).connect({
    host: '155.212.216.227',
    port: 22,
    username: 'root',
    password: 'nQ%RJGoHF7kZ',
    readyTimeout: 20000
});
