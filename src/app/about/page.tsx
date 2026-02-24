import styles from './page.module.css';
import Link from 'next/link';
import Image from 'next/image';

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
                    <h2>Наш автопарк и руководство</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', marginTop: '30px', marginBottom: '40px', padding: '0 10px' }}>
                        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ position: 'relative', width: '100%', height: '350px', maxHeight: '45vh' }}>
                                <Image src="/images/founder.jpg" alt="Панкратов Роман Борисович - руководитель" fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover', objectPosition: 'center top' }} />
                            </div>
                            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary)' }}>Панкратов Р. Б.</h3>
                                <p style={{ margin: '5px 0 0', fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>Основатель сервиса GrandTransfer</p>
                            </div>
                        </div>
                        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ position: 'relative', width: '100%', height: '350px', maxHeight: '45vh' }}>
                                <Image src="/images/car.jpg" alt="Автомобиль такси межгород KIA" fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover', objectPosition: 'center' }} />
                            </div>
                            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary)' }}>Надежный автопарк</h3>
                                <p style={{ margin: '5px 0 0', fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>Комфортные автомобили не старше 7 лет</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.contentBlock}>
                    <h2>Юридическая информация и контакты</h2>
                    <div className={styles.contactCard}>
                        <p><strong>Правовой статус:</strong> Плательщик налога на профессиональный доход (Самозанятый)</p>
                        <p><strong>Услуги:</strong> Информационные услуги в сфере пассажирских перевозок</p>
                        <p><strong>ФИО:</strong> Панкратов Роман Борисович</p>
                        <p><strong>ИНН:</strong> 500107263479</p>
                        <p><strong>Регион деятельности:</strong> Вся территория РФ и страны СНГ</p>
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
