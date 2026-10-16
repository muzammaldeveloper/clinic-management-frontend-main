'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ClinicSignupPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'staff' // Default role
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [signupError, setSignupError] = useState('');

    // Handle input changes
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

        // Clear general signup error
        if (signupError) {
            setSignupError('');
        }
    };

    // Validation function
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Username validation
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

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

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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
        setSignupError('');

        try {
            // Prepare data for API (exclude confirmPassword)
            const { confirmPassword, ...signupData } = formData;

            // Call your backend API
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signupData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle validation errors from backend
                if (data.errors) {
                    const backendErrors: Record<string, string> = {};
                    data.errors.forEach((error: any) => {
                        backendErrors[error.path] = error.msg;
                    });
                    setErrors(backendErrors);
                } else {
                    setSignupError(data.message || 'Signup failed. Please try again.');
                }
                return;
            }

            // Signup successful
            setSignupSuccess(true);
            console.log('Signup successful:', data);

            // Store token and user data if provided
            if (data.token) {
                localStorage.setItem('clinic_token', data.token);
                localStorage.setItem('clinic_user', JSON.stringify(data.user));
            }

            // Reset form
            resetForm();

            // Redirect after successful signup
            setTimeout(() => {
                window.location.href = '/signin'; // Redirect to login page
            }, 2000);

        } catch (error) {
            console.error('Signup error:', error);
            setSignupError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'staff'
        });
        setErrors({});
    };

    // Demo signup for testing
    const handleDemoSignup = () => {
        setFormData({
            username: 'demo_user',
            email: 'demo@clinic.com',
            password: 'demo123',
            confirmPassword: 'demo123',
            role: 'staff'
        });
    };

    return (
        <div className="h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-2 sm:p-3 overflow-hidden">
            <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl space-y-2 sm:space-y-3 md:space-y-4">
                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-1 sm:mb-2">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg sm:rounded-xl shadow-lg">
                            <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                        </div>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                        Clinic<span className="text-teal-600">Care</span> Pro
                    </h1>
                   
                </div>

                {/* Success Message */}
                {signupSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 flex items-center space-x-2 animate-pulse">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                        <div>
                            <p className="text-green-800 font-medium text-xs sm:text-sm">Account Created Successfully!</p>
                            <p className="text-green-600 text-xs">Redirecting to login page...</p>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="p-3 sm:p-4 md:p-5">
                        <div className="mb-3 sm:mb-4">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Create Account</h2>
                         </div>

                        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                            {/* Username Field */}
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                <div>
                                    <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" />
                                        </div>
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className={`block w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 border ${errors.username ? 'border-red-300' : 'border-gray-300'
                                                } rounded-lg sm:rounded-xl focus:ring-2 text-black outline-none focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-xs sm:text-sm`}
                                            placeholder="john_doe"
                                        />
                                    </div>
                                    {errors.username && (
                                        <div className="mt-0.5 sm:mt-1 flex items-center text-red-600 text-xs">
                                            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                            {errors.username}
                                        </div>
                                    )}
                                </div>

                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`block w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 border ${errors.email ? 'border-red-300' : 'border-gray-300'
                                                } rounded-lg sm:rounded-xl focus:ring-2 text-black outline-none focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-xs sm:text-sm`}
                                            placeholder="doctor@clinic.com"
                                        />
                                    </div>
                                    {errors.email && (
                                        <div className="mt-0.5 sm:mt-1 flex items-center text-red-600 text-xs">
                                            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                            {errors.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Role Field */}
                            <div>
                                <label htmlFor="role" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                                    Role
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" />
                                    </div>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="block w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 text-black outline-none focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50 appearance-none text-xs sm:text-sm"
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="doctor">Doctor</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                {/* Password Field */}
                                <div>
                                    <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`block w-full pl-8 sm:pl-10 pr-9 sm:pr-12 py-2 sm:py-2.5 border ${errors.password ? 'border-red-300' : 'border-gray-300'
                                                } rounded-lg sm:rounded-xl focus:ring-2 text-black outline-none focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-xs sm:text-sm`}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-teal-600" />
                                            ) : (
                                                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-teal-600" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <div className="mt-0.5 sm:mt-1 flex items-center text-red-600 text-xs">
                                            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                            {errors.password}
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className={`block w-full pl-8 sm:pl-10 pr-9 sm:pr-12 py-2 sm:py-2.5 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                                } rounded-lg sm:rounded-xl focus:ring-2 text-black outline-none focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-xs sm:text-sm`}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-teal-600" />
                                            ) : (
                                                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-teal-600" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <div className="mt-0.5 sm:mt-1 flex items-center text-red-600 text-xs">
                                            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                            {errors.confirmPassword}
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* General Error Message */}
                            {signupError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-2 sm:p-3">
                                    <div className="flex items-center text-red-800">
                                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                        <span className="font-medium text-xs sm:text-sm">{signupError}</span>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full flex justify-center items-center py-2 sm:py-2.5 px-3 sm:px-4 border border-transparent rounded-lg sm:rounded-xl shadow-sm text-xs sm:text-sm font-medium text-white ${isLoading
                                    ? 'bg-teal-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200`}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        <span className="text-xs sm:text-sm">Creating Account...</span>
                                    </>
                                ) : (
                                    <span className="text-xs sm:text-sm">Create Account</span>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                                </div>
                            </div>

                            {/* Login Link */}
                            <div className="mt-2 sm:mt-3 text-center">
                                <Link
                                    href="/signin"
                                    className="inline-flex items-center text-xs font-medium text-teal-600 hover:text-teal-500 group"
                                >
                                    Sign in to existing account
                                    <svg
                                        className="ml-1 h-3 w-3 transform group-hover:translate-x-0.5 transition-transform"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative Elements - Reduced size */}
            <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-5 left-5 w-32 h-32 bg-teal-100 rounded-full mix-blend-multiply filter blur-2xl opacity-15"></div>
                <div className="absolute bottom-5 right-5 w-32 h-32 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-15"></div>
            </div>
        </div>
    );
}