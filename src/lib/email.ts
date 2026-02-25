import nodemailer from 'nodemailer';

// Since the user didn't provide SMTP credentials yet, we will use Ethereal (a fake SMTP service for testing) 
// or a basic direct transport. To make it actually work out of the box without asking for passwords,
// we will try to use the Yandex direct MX routing or standard Yandex SMTP if they provide it.
// For now, I will write the code to use Yandex SMTP but without a password it will fail.
// So, I'll structure it to use a free testing account by default, but logging the output so we know it works,
// OR if they want it on Yandex, they have to provide an App Password.

// Wait, the user said "make orders come to romanbatkovic1@yandex.ru".
// The simplest zero-config way to send emails from a Node app without authenticating through Gmail/Yandex 
// is to use `nodemailer` with a direct transport, but that often gets flagged as spam.
// Let's set up the structure and add a note.

const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER || 'romanbatkovic1@yandex.ru',
        pass: process.env.EMAIL_PASS || 'тут_нужен_пароль_приложения' // Need real password here
    }
});

export async function sendEmailNotification(orderData: any) {
    // If no password is provided in ENV, we can't authenticate with Yandex SMTP.
    if (!process.env.EMAIL_PASS) {
        console.warn("⚠️ EMAIL_PASS is not set in environment variables. Email will not be sent.");
        return;
    }

    const {
        fromCity, toCity, tariff, passengers, priceEstimate,
        customerName, customerPhone, comments, dateTime, id
    } = orderData;

    const htmlContent = `
        <h2>🚨 Новая заявка на трансфер!</h2>
        <ul>
            <li><b>Откуда:</b> ${fromCity}</li>
            <li><b>Куда:</b> ${toCity}</li>
            <li><b>Тариф:</b> ${tariff}</li>
            <li><b>Пассажиров:</b> ${passengers}</li>
            <li><b>Цена (примерно):</b> ${priceEstimate ? priceEstimate + ' ₽' : 'Не рассчитана'}</li>
            <li><b>Клиент:</b> ${customerName || 'Не указано'}</li>
            <li><b>Телефон:</b> ${customerPhone || 'Не указано'}</li>
            <li><b>Дата/Время:</b> ${dateTime || 'Сразу'}</li>
            <li><b>Комментарий:</b> ${comments || 'Нет'}</li>
            <li><b>ID в базе:</b> ${id}</li>
            <li><b>Маршрут на карте:</b> <a href="https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=${encodeURIComponent(fromCity)}~${encodeURIComponent(toCity)}">📍 Открыть в Яндекс Картах</a></li>
        </ul>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"Grand Transfer" <${process.env.EMAIL_USER || 'romanbatkovic1@yandex.ru'}>`,
            to: 'romanbatkovic1@yandex.ru',
            subject: `🚕 Новая заявка: ${fromCity} -> ${toCity}`,
            html: htmlContent,
        });

        console.log("Message sent to Yandex: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email to Yandex:", error);
    }
}
