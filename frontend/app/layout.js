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
import CustomCursor from "../components/CustomCursor";

export default function RootLayout({ children }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "422433249410-uacbkkkgj7joqfpc2utrbct0637hih8n.apps.googleusercontent.com";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300 cursor-default">
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
