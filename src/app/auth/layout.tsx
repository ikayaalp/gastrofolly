import AuthBackground from "./AuthBackground"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <AuthBackground />
      {children}
    </div>
  )
}


