import styles from './page.module.css';
import Link from 'next/link';

export const metadata = {
    title: 'О компании | GrandTransfer',
    description: 'Информация о сервисе междугородних перевозок GrandTransfer. Наши гарантии, автопарк, контакты и юридическая информация.',
};

export default function AboutPage() {
    return (
        <main className={styles.main}>
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
                <h1 className={styles.title}>О компании GrandTransfer</h1>

                <section className={styles.contentBlock}>
                    <h2>Надежный междугородний трансфер</h2>
                    <p>
                        GrandTransfer — это профессиональный сервис пассажирских перевозок по всей России и странам СНГ. Мы специализируемся на комфортабельных междугородних поездках и трансферах до пограничных контрольно-пропускных пунктов (КПП).
                    </p>
                    <p>
                        Наша миссия — сделать дальние поездки безопасными, предсказуемыми и максимально комфортными. Мы отказались от динамического ценообразования агрегаторов в пользу честных фиксированных тарифов.
                    </p>
                </section>

                <section className={styles.contentBlock}>
                    <h2>Наши стандарты (E-E-A-T)</h2>
                    <ul className={styles.list}>
                        <li><strong>Опыт и Профессионализм:</strong> Все наши водители проходят строгий отбор, имеют безаварийный стаж от 5 лет и прекрасно знают федеральные трассы.</li>
                        <li><strong>Доверие и Безопасность:</strong> Мы не передаем заказы третьим лицам. Весь автопарк проходит регулярное техническое обслуживание.</li>
                        <li><strong>Фиксированные цены:</strong> Стоимость, названная при бронировании, окончательная. Никаких скрытых платежей за багаж или ожидание в пробках.</li>
                    </ul>
                </section>

                <section className={styles.contentBlock}>
                    <h2>Юридическая информация и контакты</h2>
                    <div className={styles.contactCard}>
                        <p><strong>Правовой статус:</strong> Плательщик налога на профессиональный доход (Самозанятый)</p>
                        <p><strong>Услуги:</strong> Информационные услуги в сфере пассажирских перевозок</p>
                        <p><strong>ФИО:</strong> Баткович Р.</p>
                        <p><strong>ИНН:</strong> (Укажите ваш ИНН)</p>
                        <p><strong>Регион деятельности:</strong> г. Москва и РФ</p>
                        <hr style={{ margin: '15px 0', borderColor: 'var(--glass-border)' }} />
                        <p><strong>Телефон:</strong> <a href="tel:+79991234567">+7 (999) 123-45-67</a></p>
                        <p><strong>Email:</strong> <a href="mailto:info@grand-transfer.com">info@grand-transfer.com</a></p>
                        <p><strong>Режим работы:</strong> Круглосуточно, 24/7</p>
                    </div>
                </section>

                <div style={{ marginTop: '40px' }}>
                    <Link href="/" className={styles.backLink}>
                        Вернуться на главную
                    </Link>
                </div>
            </div>
        </main>
    );
}
