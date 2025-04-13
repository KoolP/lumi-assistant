import type { Metadata } from 'next';
import './globals.css';
import styles from './RootLayout.module.css';
import Footer from './components/LumiFooter';

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>
        <main className={styles.layout}>
          <div className={styles.intro}>
            <p>
              This is Lumi <br /> AI Assistant from Face Institute
            </p>
          </div>
          {children}
          <Footer />
        </main>
      </body>
    </html>
  );
}
