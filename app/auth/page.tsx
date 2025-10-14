'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BottomGradient, LabelInputContainer } from "@/components/ui/form-utils";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  IconBrandGithub,
  IconBrandGoogle,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { ApiService } from "@/lib/api-service";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    keepSignedIn: false
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    channelName: '',
    email: '',
    password: ''
  });

  const tabs = [
    { id: "login", label: "Sign In" },
    { id: "signup", label: "Sign Up" }
  ];

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  // Clear error when switching tabs
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (activeTab === 'login') {
        const response = await ApiService.login({
          email: loginData.email,
          password: loginData.password
        });

        console.log('Login response:', response );

        if ( response.token) {
          // Store authentication data
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_data', JSON.stringify(response.user));
          localStorage.setItem('user_name', response.user?.channelName || response.user?.email || 'User');
          localStorage.setItem('channel_name', response.user?.channelName || response.user?.email || 'User');

          // Redirect to dashboard
          router.push('/dashboard');
        } else {
          setError(response.message || 'Login failed. Please check your credentials.');
        }   
      } else {
        const response = await ApiService.register({
          email: signupData.email,
          password: signupData.password,
          channel_name: signupData.channelName
        });

     

        if (response.message === "User registered successfully") {

        setSuccess(response.message);
        

          // Redirect to home
          handleTabChange("login");
        } else {
          setError(response.message || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <Image
            src="/TFN-new.png"
            alt="TFN Logo"
            width={120}
            height={120}
            priority
            className="drop-shadow-lg"
          />
        </motion.div>

        {/* Animated Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <AnimatedTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            className="w-full"
          />
        </motion.div>

        {/* Form Container */}
        <motion.div
          className="shadow-input mx-auto w-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-8 dark:bg-black/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Stream, Watch & Listen Now
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <LabelInputContainer>
                    <Label htmlFor="login-email" className="text-white">
                      Email Address
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="john@gmail.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </LabelInputContainer>

                  <LabelInputContainer>
                    <Label htmlFor="login-password" className="text-white">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <IconEyeOff className="w-4 h-4" />
                        ) : (
                          <IconEye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </LabelInputContainer>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="keep-signed-in"
                      checked={loginData.keepSignedIn}
                      onCheckedChange={(checked) => setLoginData(prev => ({ ...prev, keepSignedIn: checked as boolean }))}
                    />
                    <Label htmlFor="keep-signed-in" className="text-slate-400 text-sm">
                      Keep me signed in
                    </Label>
                  </div>

                  <button
                    className="group/btn relative block h-12 w-full rounded-md bg-gradient-to-br from-blue-600 to-blue-700 font-medium text-white shadow-[0px_1px_0px_0px_#3b82f6_inset,0px_-1px_0px_0px_#1e40af_inset] transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In →'}
                    <BottomGradient />
                  </button>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-red-400 text-sm text-center">{error}</p>
                    </div>
                  )}

                  <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

                  {/* <div className="flex flex-col space-y-4">
                    <button
                      className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50/10 border border-white/10 px-4 font-medium text-white backdrop-blur-sm hover:bg-gray-50/20 transition-all"
                      type="button"
                    >
                      <IconBrandGithub className="h-4 w-4 text-white" />
                      <span className="text-sm text-white">Continue with GitHub</span>
                      <BottomGradient />
                    </button>
                    <button
                      className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50/10 border border-white/10 px-4 font-medium text-white backdrop-blur-sm hover:bg-gray-50/20 transition-all"
                      type="button"
                    >
                      <IconBrandGoogle className="h-4 w-4 text-white" />
                      <span className="text-sm text-white">Continue with Google</span>
                      <BottomGradient />
                    </button>
                  </div> */}

                  <div className="text-center">
                    <span className="text-slate-400 text-sm">
                      Don't have an account?{" "}
                    </span>
                    <button
                      type="button"
                      className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
                      onClick={() => handleTabChange("signup")}
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Join TFN
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Sign up to start exploring and engaging with the content you love.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <LabelInputContainer>
                    <Label htmlFor="signup-channel" className="text-white">
                      Channel Name
                    </Label>
                    <Input
                      id="signup-channel"
                      type="text"
                      placeholder="Glorious praise"
                      value={signupData.channelName}
                      onChange={(e) => setSignupData(prev => ({ ...prev, channelName: e.target.value }))}
                      required
                    />
                  </LabelInputContainer>

                  <LabelInputContainer>
                    <Label htmlFor="signup-email" className="text-white">
                      Email Address
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="john@gmail.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </LabelInputContainer>

                  <LabelInputContainer>
                    <Label htmlFor="signup-password" className="text-white">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <IconEyeOff className="w-4 h-4" />
                        ) : (
                          <IconEye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </LabelInputContainer>

                  <button
                    className="group/btn relative block h-12 w-full rounded-md bg-gradient-to-br from-blue-600 to-blue-700 font-medium text-white shadow-[0px_1px_0px_0px_#3b82f6_inset,0px_-1px_0px_0px_#1e40af_inset] transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Get Started →'}
                    <BottomGradient />
                  </button>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-red-400 text-sm text-center">{error}</p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-green-400 text-sm text-center">{success}</p>
                    </div>
                  )}

                  <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

                  {/* <div className="flex flex-col space-y-4">
                    <button
                      className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50/10 border border-white/10 px-4 font-medium text-white backdrop-blur-sm hover:bg-gray-50/20 transition-all"
                      type="button"
                    >
                      <IconBrandGithub className="h-4 w-4 text-white" />
                      <span className="text-sm text-white">Continue with GitHub</span>
                      <BottomGradient />
                    </button>
                    <button
                      className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50/10 border border-white/10 px-4 font-medium text-white backdrop-blur-sm hover:bg-gray-50/20 transition-all"
                      type="button"
                    >
                      <IconBrandGoogle className="h-4 w-4 text-white" />
                      <span className="text-sm text-white">Continue with Google</span>
                      <BottomGradient />
                    </button>
                  </div> */}

                  <div className="text-center">
                    <span className="text-slate-400 text-sm">
                      Already have an account?{" "}
                    </span>
                    <button
                      type="button"
                      className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
                      onClick={() => handleTabChange("login")}
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Legal Links */}
        <div className="text-center mt-8 pt-6 border-t border-slate-700">
          <div className="flex justify-center space-x-6 text-sm">
            <button
              onClick={() => router.push('/privacy')}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => router.push('/terms')}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              Terms & Conditions
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-2">
            By using TFN Network, you agree to our Terms & Conditions and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
