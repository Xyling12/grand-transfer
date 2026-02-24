import styles from '../privacy/page.module.css';
import Link from 'next/link';

export const metadata = {
    title: 'Условия использования | GrandTransfer',
    description: 'Пользовательское соглашение и условия предоставления услуг междугороднего такси GrandTransfer.',
};

export default function TermsOfService() {
    return (
        <main className={styles.main} style={{ paddingTop: '100px', maxWidth: '800px', margin: '0 auto', minHeight: '80vh', padding: '100px 20px 40px' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem', color: 'var(--color-primary)' }}>Пользовательское соглашение</h1>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>1. Общие положения</h2>
                <p style={{ lineHeight: '1.6', color: 'var(--color-text-muted)' }}>Настоящее Пользовательское соглашение (далее — Соглашение) регламентирует отношения между сервисом GrandTransfer (далее — Исполнитель) и дееспособным физическим лицом (далее — Пользователь), надлежащим образом использующим сайт сервиса для заказа транспортных услуг.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>2. Порядок оказания услуг</h2>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', lineHeight: '1.6', color: 'var(--color-text-muted)' }}>
                    <li style={{ marginBottom: '0.5rem' }}>Исполнитель обязуется предоставить транспортное средство(ТС) в согласованное время и место для выполнения пассажирской перевозки по маршруту, указанному Пользователем при оформлении заявки.</li>
                    <li style={{ marginBottom: '0.5rem' }}>Стоимость поездки является фиксированной и определяется тарифом, рассчитанным на Сайте в момент бронирования.</li>
                    <li style={{ marginBottom: '0.5rem' }}>Пользователь имеет право бесплатно отказаться от поездки не менее чем за 12 часов до времени подачи ТС.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>3. Права и обязанности сторон</h2>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-foreground)' }}>Пользователь обязуется:</h3>
                <p style={{ lineHeight: '1.6', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Предоставить достоверные контактные данные; не перевозить запрещенные законодательством РФ предметы; соблюдать чистоту в салоне ТС и правила пристегивания ремнями безопасности.</p>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-foreground)' }}>Исполнитель обязуется:</h3>
                <p style={{ lineHeight: '1.6', color: 'var(--color-text-muted)' }}>Предоставить технически исправный автомобиль заявленного класса; обеспечить безопасность пассажира в пути; в случае поломки ТС оперативно предоставить подменный автомобиль аналогичного или более высокого класса без изменения стоимости поездки.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>4. Ограничение ответственности</h2>
                <p style={{ lineHeight: '1.6', color: 'var(--color-text-muted)' }}>Исполнитель не несет ответственности за пробки на дорогах, погодные условия и задержки на контрольно-пропускных пунктах (КПП), которые могут повлиять на время прибытия.</p>
            </section>

            <div style={{ marginTop: '4rem', paddingBottom: '2rem', textAlign: 'center' }}>
                <Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'bold', border: '1px solid var(--color-primary)', padding: '10px 20px', borderRadius: '8px' }}>Вернуться на главную</Link>
            </div>
        </main>
    )
}
