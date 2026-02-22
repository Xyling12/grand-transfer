import styles from './page.module.css';
import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <main className={styles.main} style={{ paddingTop: '100px', maxWidth: '800px', margin: '0 auto', minHeight: '80vh', padding: '100px 20px 40px' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>Политика конфиденциальности</h1>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>1. Общие положения</h2>
                <p style={{ lineHeight: '1.6', color: 'var(--color-text-muted)' }}>Настоящая политика обработки персональных данных составлена в соответствии с требованиями Федерального закона от 27.07.2006. №152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных и меры по обеспечению безопасности персональных данных, предпринимаемые сервисом GrandTransfer (далее – Оператор).</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>2. Основные понятия, используемые в Политике</h2>
                <p style={{ lineHeight: '1.6', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>2.1. Автоматизированная обработка персональных данных – обработка персональных данных с помощью средств вычислительной техники;</p>
                <p style={{ lineHeight: '1.6', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>2.2. Блокирование персональных данных – временное прекращение обработки персональных данных (за исключением случаев, если обработка необходима для уточнения персональных данных);</p>
                <p style={{ lineHeight: '1.6', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>2.3. Веб-сайт – совокупность графических и информационных материалов, а также программ для ЭВМ и баз данных, обеспечивающих их доступность в сети интернет.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>3. Оператор может обрабатывать следующие персональные данные Пользователя</h2>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', lineHeight: '1.6', color: 'var(--color-text-muted)' }}>
                    <li>Фамилия, имя, отчество;</li>
                    <li>Номер телефона;</li>
                    <li>Маршрут поездки;</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>4. Цели обработки персональных данных</h2>
                <p style={{ lineHeight: '1.6', color: 'var(--color-text-muted)' }}>Цель обработки персональных данных Пользователя — информирование Пользователя посредством отправки электронных писем; заключение, исполнение и прекращение гражданско-правовых договоров; предоставление доступа Пользователю к сервисам, информации и/или материалам, содержащимся на веб-сайте.</p>
            </section>

            <div style={{ marginTop: '4rem', paddingBottom: '2rem', textAlign: 'center' }}>
                <Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'bold', border: '1px solid var(--color-primary)', padding: '10px 20px', borderRadius: '8px' }}>Вернуться на главную</Link>
            </div>
        </main>
    )
}
