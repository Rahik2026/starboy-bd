import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";

export const metadata: Metadata = {
  title: "STARBOY BD | Premium Menswear & Lifestyle",
  description:
    "Elevate your style with STARBOY BD. Premium ready-to-wear collections, urban streetwear, premium shirts, and leather goods in Bangladesh.",
  keywords: ["STARBOY BD", "menswear", "fashion", "Bangladesh", "premium shirts", "leather goods", "urban street"],
  openGraph: {
    title: "STARBOY BD | The Modern Standard",
    description: "Premium ready-to-wear collections for the modern man.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-ink-900 antialiased">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AnnouncementBar />
              <Navbar />
              <main className="relative">{children}</main>
              <Footer />
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: "#1a1a1a",
                    color: "#FAF9F6",
                    border: "1px solid rgba(184,134,11,0.3)",
                  },
                  success: { iconTheme: { primary: "#b8860b", secondary: "#1a1a1a" } },
                }}
              />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
