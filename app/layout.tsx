// app/layout.tsx
"use client";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import "./globals.css"; // Import the global CSS file

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </Provider>
  );
}
