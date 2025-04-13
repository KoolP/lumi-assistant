import styles from './LumiFooter.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>© {new Date().getFullYear()} Face Institute · AI Assistant</p>
      <div className={styles.bottom} />
    </footer>
  );
}
