import React, { useState } from 'react';
import { Leaf, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { auth } from "../firebase";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";


interface LoginProps {
  onLogin: () => void;
  onNavigateToSignUp: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsLoading(true);
      setErrorMsg("");

      // Demo credentials for offline use
      if (email === 'demo@agri.com' && password === 'demo123') {
        localStorage.setItem('agroProfitAuth', 'true');
        localStorage.setItem('agroProfitUser', JSON.stringify({ email, password, name: 'Demo User' }));
        onLogin();
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('agroProfitAuth', 'true');
      onLogin();
    } catch (error: any) {
      console.log(error);
      if (error.code === "auth/invalid-credential") {
        setErrorMsg("Invalid email or password");
      } else if (error.code === "auth/user-not-found") {
        setErrorMsg("User not found");
      } else if (error.code === "auth/invalid-email") {
        setErrorMsg("Invalid email format");
      } else {
        setErrorMsg("Login failed: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMsg("");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      localStorage.setItem('agroProfitAuth', 'true');
      localStorage.setItem('agroProfitUser', JSON.stringify({
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid
      }));
      onLogin();
    } catch (error: any) {
      console.log(error);
      if (error.code === "auth/popup-closed-by-user") {
        setErrorMsg("Login cancelled");
      } else if (error.code === "auth/network-request-failed") {
        setErrorMsg("Network error. Check your connection");
      } else {
        setErrorMsg("Google login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-emerald-700 p-8 text-center">
           <div className="inline-flex bg-white/20 p-3 rounded-full mb-4">
             <Leaf className="w-8 h-8 text-white" />
           </div>
           <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
           <p className="text-emerald-100 mt-2">Sign in to access AgroProfit AI</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  placeholder="farmer@example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errorMsg}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition shadow-md flex items-center justify-center disabled:opacity-70"
            >
              {isLoading ? 'Signing In...' : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#1F2937" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#1F2937" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#1F2937" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#1F2937" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <button 
                onClick={onNavigateToSignUp}
                className="text-emerald-600 font-bold hover:underline focus:outline-none"
              >
                Create Account
              </button>
            </p>
            <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-xs text-emerald-700 font-medium">Demo Credentials:</p>
              <p className="text-xs text-emerald-600">Email: demo@agri.com</p>
              <p className="text-xs text-emerald-600">Password: demo123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;