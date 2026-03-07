import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Публичная оферта — GrandTransfer (межгород.com)',
    description: 'Публичная оферта на оказание услуг по пассажирским перевозкам от GrandTransfer. Самозанятый Панкратов Роман Борисович, ИНН 500107263479.',
    alternates: {
        canonical: 'https://xn--c1acbe2apap.com/oferta',
    },
};

const sectionStyle: React.CSSProperties = {
    marginBottom: '2.5rem',
};

const h2Style: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: 'var(--color-primary)',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '8px',
};

const pStyle: React.CSSProperties = {
    lineHeight: '1.8',
    color: 'var(--color-text-muted)',
    marginBottom: '0.8rem',
};

const liStyle: React.CSSProperties = {
    marginBottom: '0.6rem',
    lineHeight: '1.8',
    color: 'var(--color-text-muted)',
};

export default function OfertaPage() {
    return (
        <main>
            <Header />
            <div style={{ maxWidth: '820px', margin: '0 auto', padding: '100px 24px 60px' }}>
                <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, marginBottom: '8px', color: 'var(--color-foreground)' }}>
                    Публичная оферта на оказание услуг по пассажирским перевозкам
                </h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
                    Редакция от 01.03.2026 · Вступает в силу с момента акцепта
                </p>

                {/* 1 */}
                <section style={sectionStyle}>
                    <h2 style={h2Style}>1. Общие положения и определения</h2>
                    <p style={pStyle}>
                        Настоящий документ является публичной офертой (далее — <strong>Оферта</strong>) в соответствии со ст. 435 и п. 2 ст. 437 Гражданского кодекса Российской Федерации и содержит все существенные условия договора на оказание транспортно-информационных услуг по пассажирским перевозкам.
                    </p>
                    <p style={pStyle}>
                        <strong>Исполнитель</strong> — Панкратов Роман Борисович, плательщик налога на профессиональный доход (НПД/Самозанятый), ИНН 500107263479, осуществляющий деятельность на территории Российской Федерации и стран СНГ, сайт: <strong>межгород.com</strong>.
                    </p>
                    <p style={pStyle}>
                        <strong>Заказчик</strong> — любое дееспособное физическое лицо, оставившее заявку на сайте Исполнителя и принявшее условия настоящей Оферты.
                    </p>
                    <p style={pStyle}>
                        <strong>Услуга</strong> — оказание транспортно-информационных услуг по организации и выполнению пассажирских перевозок на легковом автомобиле/минивэне по указанному Заказчиком маршруту.
                    </p>
                    <p style={pStyle}>
                        <strong>Акцепт</strong> — полное и безоговорочное принятие условий настоящей Оферты путём проставления отметки «Я принимаю условия Публичной оферты» и отправки заявки через сайт Исполнителя.
                    </p>
                </section>

                {/* 2 */}
                <section style={sectionStyle}>
                    <h2 style={h2Style}>2. Предмет договора</h2>
                    <p style={pStyle}>
                        Исполнитель обязуется по заявке Заказчика организовать и выполнить перевозку пассажира (пассажиров) и их багажа легковым автомобилем или минивэном по маршруту, указанному при оформлении заявки, а Заказчик обязуется оплатить оказанную услугу в соответствии с условиями настоящей Оферты.
                    </p>
                    <p style={pStyle}>
                        Договор считается заключённым с момента акцепта Оферты — отправки заявки с проставленной отметкой о принятии настоящих условий.
                    </p>
                </section>

                {/* 3 */}
                <section style={sectionStyle}>
                    <h2 style={h2Style}>3. Порядок оформления заказа</h2>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li style={liStyle}>Заказчик заполняет форму заявки на сайте: указывает маршрут (откуда/куда), тариф, дату и время, ФИО и контактный телефон.</li>
                        <li style={liStyle}>Заказчик проставляет отметку о принятии условий настоящей Оферты и обработке персональных данных, после чего отправляет заявку.</li>
                        <li style={liStyle}>После получения заявки Исполнитель связывается с Заказчиком для подтверждения заказа не позднее чем за 1 час до указанного времени подачи автомобиля.</li>
                        <li style={liStyle}>Договор считается исполненным после доставки пассажира(ов) в конечную точку маршрута.</li>
                    </ul>
                </section>

                {/* 4 */}
                <section style={sectionStyle}>
                    <h2 style={h2Style}>4. Стоимость услуги и порядок расчётов</h2>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li style={liStyle}>Стоимость услуги является фиксированной и определяется автоматическим калькулятором на сайте в момент оформления заявки на основе выбранного тарифа и расстояния маршрута.</li>
                        <li style={liStyle}>Расчёт производится наличными денежными средствами водителю по завершении поездки, либо безналичным переводом на реквизиты Исполнителя — по согласованию.</li>
                        <li style={liStyle}>Стоимость платных автодорог (М-11, М-4 и иных) по маршруту оплачивается Заказчиком отдельно сверх согласованной суммы.</li>
                        <li style={liStyle}>Исполнитель является плательщиком НПД. НДС не облагается. Чек самозанятого формируется по запросу.</li>
                    </ul>
                </section>

                {/* 5 */}
                <section style={sectionStyle}>
                    <h2 style={h2Style}>5. Права и обязанности Исполнителя</h2>
                    <p style={pStyle}><strong>Исполнитель обязуется:</strong></p>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li style={liStyle}>Подать технически исправный автомобиль заявленного класса в согласованное время и место.</li>
                        <li style={liStyle}>Обеспечить безопасность пассажира(ов) в соответствии с ПДД РФ.</li>
                        <li style={liStyle}>В случае поломки ТС в пути незамедлительно организовать подменный автомобиль аналогичного или более высокого класса без изменения стоимости поездки.</li>
                        <li style={liStyle}>Соблюдать конфиденциальность персональных данных Заказчика.</li>
                    </ul>
                    <p style={pStyle}><strong>Исполнитель вправе:</strong></p>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li style={liStyle}>Отказать в выполнении перевозки, если Заказчик находится в состоянии алкогольного или наркотического опьянения.</li>
                        <li style={liStyle}>Отказать в перевозке животных без переносной клетки/контейнера.</li>
                        <li style={liStyle}>Требовать компенсации за умышленное загрязнение или повреждение ТС.</li>
                    </ul>
                </section>

                {/* 6 */}
                <section style={sectionStyle}>
                    <h2 style={h2Style}>6. Права и обязанности Заказчика</h2>
                    <p style={pStyle}><strong>Заказчик обязуется:</strong></p>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li style={liStyle}>Предоставить достоверные контактные данные и точный маршрут.</li>
                        <li style={liStyle}>Находиться в месте подачи автомобиля в указанное время. Бесплатное ожидание водителя — 15 минут с момента прибытия.</li>
                        <li style={liStyle}>Оплатить услугу в полном объёме на условиях настоящей Оферты.</li>
                        <li style={liStyle}>Не перевозить предметы и вещества, запрещённые законодательством РФ.</li>
                        <li style={liStyle}>Пристегнуть ремень безопасности и обеспечить соблюдение этого требования всеми пассажирами.</li>
                    </ul>
                </section>

                {/* 7 */}
                <section style={sectionStyle}>
                    <h2 style={h2Style}>7. Порядок отмены заказа и возврата</h2>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li style={liStyle}><strong>Бесплатная отмена</strong> возможна не позднее чем за 12 часов до согласованного времени подачи автомобиля.</li>
                        <li style={liStyle}>При отмене менее чем за 12 часов Исполнитель вправе удержать компенсацию в размере 20% от стоимости поездки.</li>
                        <li style={liStyle}>При отмене менее чем за 2 часа или при неявке Заказчика к месту подачи — компенсация составляет 50% от стоимости поездки.</li>
                        <li style={liStyle}>Отмена производится по телефону или в мессенджере (WhatsApp/Telegram) с обязательным подтверждением от Исполнителя.</li>
                    </ul>
                </section>

                {/* 8 */}
                <section style={sectionStyle}>
                    <h2 style={h2Style}>8. Ответственность сторон</h2>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li style={liStyle}>Исполнитель несёт ответственность за вред, причинённый жизни или здоровью Заказчика по вине Исполнителя, в соответствии с законодательством РФ.</li>
                        <li style={liStyle}>Совокупная ответственность Исполнителя перед Заказчиком по имущественным претензиям не может превышать стоимость конкретной поездки.</li>
                        <li style={liStyle}>Исполнитель не несёт ответственности за задержку рейсов, поездов и иных видов транспорта, вызвавшую опоздание Заказчика.</li>
                        <li style={liStyle}>Стороны освобождаются от ответственности за неисполнение обязательств, наступившее вследствие форс-мажорных обстоятельств.</li>
                    </ul>
                </section>

                {/* 9 */}
                <section style={sectionStyle}>
                    <h2 style={h2Style}>9. Форс-мажор</h2>
                    <p style={pStyle}>
                        К обстоятельствам непреодолимой силы относятся: дорожно-транспортные происшествия не по вине водителя, стихийные бедствия, аварии на дорогах, действия государственных органов, эпидемии, прохождение контрольно-пропускных пунктов (КПП) на государственной границе. При наступлении форс-мажора Исполнитель обязан незамедлительно уведомить Заказчика и согласовать дальнейший порядок действий.
                    </p>
                </section>

                {/* 10 */}
                <section style={sectionStyle}>
                    <h2 style={h2Style}>10. Порядок разрешения споров</h2>
                    <p style={pStyle}>
                        Все споры разрешаются путём переговоров. В случае невозможности достигнуть соглашения — в судебном порядке по месту жительства Заказчика в соответствии с законодательством Российской Федерации.
                    </p>
                    <p style={pStyle}>
                        Претензии принимаются в письменном виде на адрес электронной почты: <a href="mailto:romanbatkovic1@yandex.ru" style={{ color: 'var(--color-primary)' }}>romanbatkovic1@yandex.ru</a> или через мессенджеры WhatsApp/Telegram по номеру: <a href="tel:+79935287878" style={{ color: 'var(--color-primary)' }}>+7 (993) 528-78-78</a>. Срок рассмотрения претензии — 10 рабочих дней.
                    </p>
                </section>

                {/* 11 */}
                <section style={sectionStyle}>
                    <h2 style={h2Style}>11. Прочие условия</h2>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li style={liStyle}>Исполнитель вправе в одностороннем порядке изменить условия настоящей Оферты. Новая редакция вступает в силу с момента публикации на сайте и не распространяется на заказы, оформленные до её публикации.</li>
                        <li style={liStyle}>Настоящая Оферта регулируется законодательством Российской Федерации.</li>
                        <li style={liStyle}>Отправляя заявку, Заказчик подтверждает, что ознакомлен с настоящей Офертой, полностью принимает её условия и заключает договор на указанных в ней условиях.</li>
                    </ul>
                </section>

                {/* 12 */}
                <section style={{ ...sectionStyle, background: 'var(--card-bg, #f8f9fa)', borderRadius: '16px', padding: '24px', border: '1px solid var(--glass-border)' }}>
                    <h2 style={{ ...h2Style, borderBottom: 'none', paddingBottom: 0 }}>12. Реквизиты Исполнителя</h2>
                    <div style={{ display: 'grid', gap: '8px', fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
                        <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-foreground)' }}>ФИО:</strong> Панкратов Роман Борисович</p>
                        <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-foreground)' }}>Статус:</strong> Самозанятый (плательщик НПД)</p>
                        <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-foreground)' }}>ИНН:</strong> 500107263479</p>
                        <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-foreground)' }}>Сайт:</strong> межгород.com (xn--c1acbe2apap.com)</p>
                        <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-foreground)' }}>Телефон:</strong> <a href="tel:+79935287878" style={{ color: 'var(--color-primary)' }}>+7 (993) 528-78-78</a></p>
                        <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-foreground)' }}>Email:</strong> <a href="mailto:romanbatkovic1@yandex.ru" style={{ color: 'var(--color-primary)' }}>romanbatkovic1@yandex.ru</a></p>
                        <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-foreground)' }}>Регион деятельности:</strong> Удмуртская Республика, территория РФ и СНГ</p>
                        <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-foreground)' }}>Дата публикации Оферты:</strong> 01.03.2026</p>
                    </div>
                </section>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Link href="/#booking" style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: 'var(--color-primary, #D4AF37)', color: '#000', borderRadius: '50px', fontWeight: 600, textDecoration: 'none' }}>
                        Оформить заказ
                    </Link>
                    <Link href="/" style={{ display: 'inline-block', padding: '12px 24px', border: '1px solid var(--glass-border)', borderRadius: '50px', color: 'var(--color-foreground)', fontWeight: 600, textDecoration: 'none' }}>
                        На главную
                    </Link>
                </div>
            </div>
            <Footer />
        </main>
    );
}
