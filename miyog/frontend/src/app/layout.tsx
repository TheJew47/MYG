import type { Metadata } from 'next'
import { ClerkProvider, SignIn, SignedIn, SignedOut } from '@clerk/nextjs'
import './globals.css'
import AppLayout from '@/components/layouts/AppLayout' // <--- Import the new wrapper

export const metadata: Metadata = {
  title: 'Miyog Studio',
  description: 'AI Video Production',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-app-bg text-text-main overflow-hidden">
          {/* SHOW THIS IF LOGGED OUT */}
          <SignedOut>
            <div className="h-screen w-screen flex items-center justify-center bg-black">
              <SignIn routing="hash" />
            </div>
          </SignedOut>

          {/* SHOW THIS IF LOGGED IN */}
          <SignedIn>
            {/* The AppLayout handles showing/hiding the sidebar */}
            <AppLayout>
                {children}
            </AppLayout>
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  )
}