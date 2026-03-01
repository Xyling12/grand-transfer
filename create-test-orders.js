const http = require('http');

const orders = [
    { fromCity: 'Москва, ул. Ленина 1', toCity: 'Казань, ул. Баумана 5', tariff: 'standart', customerName: 'Иван Петров', customerPhone: '+79001112233', passengers: 2, comments: 'Нужно детское кресло' },
    { fromCity: 'Ижевск, ул. Пушкина 10', toCity: 'Пермь, ул. Мира 3', tariff: 'comfort', customerName: 'Анна Сидорова', customerPhone: '+79004445566', passengers: 1, comments: '' },
    { fromCity: 'Казань, ул. Кремлёвская 2', toCity: 'Набережные Челны, пр. Мира 15', tariff: 'econom', customerName: 'Сергей Козлов', customerPhone: '+79007778899', passengers: 3, comments: 'Большой багаж' },
];

function createOrder(order, idx) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(order);
        const req = http.request({
            hostname: '127.0.0.1', port: 3000,
            path: '/api/order', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
            timeout: 8000,
        }, (res) => {
            let body = '';
            res.on('data', (c) => body += c);
            res.on('end', () => {
                console.log(`✅ Заявка ${idx + 1}: ${order.fromCity} → ${order.toCity} (${res.statusCode})`);
                resolve();
            });
        });
        req.on('error', (e) => { console.error(`❌ Заявка ${idx + 1}: ${e.message}`); reject(e); });
        req.write(data);
        req.end();
    });
}

(async () => {
    console.log('Создаю тестовые заявки...\n');
    for (let i = 0; i < orders.length; i++) {
        await createOrder(orders[i], i);
    }
    console.log('\n🎉 Готово! Обнови список заказов в приложении (потяни вниз)');
})();
