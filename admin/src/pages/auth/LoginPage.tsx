
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdmin } from "@/lib/AdminProvider";
import LoadingScreen from "@/components/shared/LoadingScreen";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { isAuthenticated, loading: authLoading, refresh } = useAdmin()

  const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000'

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard/report', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Show loading while checking auth
  if (authLoading) {
    return <LoadingScreen />
  }

  const handleLogin = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/user/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      })

      // handle non-JSON responses (vite dev server 404 returns HTML)
      const text = await res.text()
      let data: any = {}
      try {
        data = JSON.parse(text)
      } catch {
        data = { error: text }
      }

      if (!res.ok) throw new Error(data.error || 'Login failed')

      // store token and refresh auth state
      localStorage.setItem('admin_token', data.token)
      
      // Trigger auth state update
      await refresh()
      
      // Navigate to dashboard
      navigate('/dashboard/report', { replace: true })
    } catch (err: any) {
      console.error('Login error', err)
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      {/* White Login Box */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <img 
              src="https://res.cloudinary.com/dia8x6y6u/image/upload/v1752997496/logo_kszbod.png"
              alt="Vanavihari Logo"
              className="w-full h-20 mx-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Vanavihari Admin
          </h1>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              required
            />
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
            onClick={() => handleLogin()}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          {error && (
            <div className="text-red-600 text-sm text-center mt-2">{error}</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;