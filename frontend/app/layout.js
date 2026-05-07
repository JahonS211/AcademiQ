import "./globals.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Providers from "../components/Providers";
import { GoogleOAuthProvider } from "@react-oauth/google";

export const metadata = {
  title: "AcademiQ | Aql bilan o'qing",
  description: "Zamonaviy AI student platformasi",
  icons: {
    icon: "/logo.png"
  }
};

import PageWrapper from "../components/PageWrapper";

export default function RootLayout({ children }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  return (
    <html lang="en">
      <body className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <GoogleOAuthProvider clientId={googleClientId}>
          <Providers>
            <Navbar />
            <Sidebar />
            <PageWrapper>
              {children}
            </PageWrapper>
          </Providers>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
