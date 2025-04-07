
import { Inter } from "next/font/google";
import "./globals.css";
import ReduxProvider from '../lib/providers/ReduxProvider.js'
import { AuthProvider } from '@/context/AuthContext';
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Dashboard App",
  description: "Next.js Dashboard with Firebase",
};

export default function RootLayout({ children,}) 
{
  return (
    <>
    <html lang="en">
    <head>
       <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
    </head>
      <body className={inter.className}>
        <AuthProvider>
       <ReduxProvider>
          {children}
          </ReduxProvider>
        </AuthProvider>
      </body>
    </html>
    </>
  );
}