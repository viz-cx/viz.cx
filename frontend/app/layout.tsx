import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import Navbar from "@/components/Navbar"
import { VizProvider } from "@/contexts/VizContext"

export const metadata: Metadata = {
  title: "VIZ.cx",
  description: "Community platform on VIZ blockchain",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://unpkg.com/viz-js-lib@0.11.0/dist/viz.min.js"
          integrity="sha384-6zzLU/fC8MXPjENrqpQqYhNGTidBDIqhBB7hREYSCFQCVPqBEVMf67PYiGBkMhMg"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <VizProvider>
          <Navbar />
          <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4">
            {children}
          </main>
          <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-200 dark:border-gray-700">
            &copy; 2018&ndash;{new Date().getFullYear()} VIZ.cx
            {" · "}
            <a href="https://github.com/viz-cx/viz.cx" target="_blank" rel="noopener noreferrer">github</a>
            {" · "}
            <a href="https://t.me/viz_cx" target="_blank" rel="noopener noreferrer">telegram</a>
          </footer>
        </VizProvider>
      </body>
    </html>
  )
}
