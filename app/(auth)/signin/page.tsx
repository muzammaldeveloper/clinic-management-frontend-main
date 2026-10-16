'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { Eye, EyeOff, Stethoscope, Shield, AlertCircle, CheckCircle, Mail, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

export default function ClinicLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general login error
    if (loginError) {
      setLoginError('');
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.errors) {
          const backendErrors: Record<string, string> = {};
          data.errors.forEach((error: any) => {
            backendErrors[error.path] = error.msg;
          });
          setErrors(backendErrors);
        } else {
          setLoginError(data.message || 'Login failed');
        }
        return;
      }
      
      setLoginSuccess(true);
      
      if (data.token) {
        localStorage.setItem('clinic_token', data.token);
        localStorage.setItem('clinic_user', JSON.stringify(data.user));
      }
      
      resetForm();
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
    });
    setErrors({});
  };

  // Handle forgot password
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) {
      setForgotPasswordMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordMessage(null);

    try {
      await authAPI.forgotPassword(forgotPasswordEmail);
      setForgotPasswordMessage({
        type: 'success',
        text: 'Password reset link has been sent to your email. Please check your inbox.',
      });
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        setForgotPasswordMessage(null);
      }, 3000);
    } catch (err: any) {
      setForgotPasswordMessage({
        type: 'error',
        text: err.message || 'Failed to send password reset email. Please try again.',
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="w-full max-w-md space-y-4 mx-auto">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl shadow-lg">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Clinic<span className="text-teal-600">Care</span> Pro
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Sign in to access your clinic management dashboard
          </p>
        </div>

        {/* Success Message */}
        {loginSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2 animate-pulse">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-green-800 font-medium text-sm">Login Successful!</p>
              <p className="text-green-600 text-xs">Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-5">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800">Welcome Back</h2>
              <p className="text-gray-600 mt-1 text-sm">Please enter your credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-xl focus:ring-2 text-black outline-none focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-sm`}
                    placeholder="doctor@clinic.com"
                  />
                </div>
                {errors.email && (
                  <div className="mt-1 flex items-center text-red-600 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-teal-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-12 py-2.5 border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-xl focus:ring-2 text-black outline-none focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-sm`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-teal-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-teal-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div className="mt-1 flex items-center text-red-600 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    {errors.password}
                  </div>
                )}
              </div>

              {/* General Error Message */}
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center text-red-800">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="font-medium text-sm">{loginError}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white ${
                  isLoading
                    ? 'bg-teal-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in to Dashboard'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">New to ClinicCare?</span>
                </div>
              </div>

              {/* Register Link
              <div className="mt-3 text-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center text-xs font-medium text-teal-600 hover:text-teal-500 group"
                >
                  Create account
                  <svg
                    className="ml-1 h-3 w-3 transform group-hover:translate-x-0.5 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-xs sm:max-w-sm md:max-w-md p-4 sm:p-6 md:p-8 relative mx-auto">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotPasswordEmail('');
                setForgotPasswordMessage(null);
              }}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <div className="mb-4 sm:mb-6">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-teal-100 rounded-full">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
                </div>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 text-center">Reset Password</h2>
              <p className="text-gray-600 mt-1 sm:mt-2 text-center text-xs sm:text-sm px-2">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" />
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => {
                      setForgotPasswordEmail(e.target.value);
                      setForgotPasswordMessage(null);
                    }}
                    className="block w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 text-black outline-none focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-sm sm:text-base"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {forgotPasswordMessage && (
                <div
                  className={`rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 flex items-start space-x-2 sm:space-x-3 ${
                    forgotPasswordMessage.type === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {forgotPasswordMessage.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <p
                    className={`text-xs sm:text-sm ${
                      forgotPasswordMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {forgotPasswordMessage.text}
                  </p>
                </div>
              )}

              <div className="flex space-x-2 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                    setForgotPasswordMessage(null);
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-white font-medium transition-all text-sm sm:text-base ${
                    forgotPasswordLoading
                      ? 'bg-teal-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600'
                  }`}
                >
                  {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decorative Elements - Reduced size */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-5 left-5 w-32 h-32 bg-teal-100 rounded-full mix-blend-multiply filter blur-2xl opacity-15"></div>
        <div className="absolute bottom-5 right-5 w-32 h-32 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-15"></div>
      </div>
    </div>
  );
}