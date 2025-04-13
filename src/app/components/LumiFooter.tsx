import styles from './LumiFooter.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>© {new Date().getFullYear()} Face Institute · Lumi Assistant</p>
    </footer>
  );
}
