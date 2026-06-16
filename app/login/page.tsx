'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { sendOtp, verifyOtp, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleSendOtp = async () => {
    setError('');
    const cleanPhone = phone.trim().replace(/\s/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(cleanPhone);
      setPhone(cleanPhone);
      setShowOtp(true);
      toast.success('OTP sent successfully');
    } catch {
      setError('Failed to send OTP. Check the phone number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError('');

      if (otpValue.length !== 6) {
        setError('Please enter the 6-digit OTP');
        return;
      }

      const cleanPhone = phone.trim().replace(/\s/g, '');
      console.log('Verifying OTP:', otpValue, 'for phone:', cleanPhone);
      await verifyOtp(cleanPhone, otpValue);

      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 300);
    } catch (err: unknown) {
      console.error('Verify error:', err);
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setShowOtp(false);
    setOtpValue('');
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-3/5 flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: '#0D1B2A' }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, #1565C0 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1565C0 0%, transparent 50%)',
          }}
        />
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-brand-500 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-white text-3xl font-bold">N</span>
            </div>
            <h1 className="text-white text-4xl font-bold">Nivasi</h1>
            <p className="text-brand-300 text-xl font-medium mt-1">Command Centre</p>
          </div>
          <p className="text-base text-white/60 mb-12 leading-relaxed">
            Manage societies, partners and subscriptions from a single powerful dashboard.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {['🏢 Multi-society', '👥 Partner Network', '📊 Analytics'].map((pill) => (
              <span
                key={pill}
                className="px-4 py-2 rounded-full text-sm font-medium border border-white/20 text-white/80 backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
        <p className="absolute bottom-8 text-white/30 text-xs">© 2026 Nivasi Technologies</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#1565C0' }}
          >
            <span className="text-white text-lg font-bold">N</span>
          </div>
          <span className="text-xl font-bold" style={{ color: '#0D1B2A' }}>
            Nivasi
          </span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#0D1B2A' }}>
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 mb-8">Sign in to your admin account</p>

          {!showOtp ? (
            <>
              {/* Step 1: Phone input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <div className="flex items-center border border-gray-200 rounded-xl h-12 overflow-hidden focus-within:ring-1 transition-all" style={{ outline: 'none' }}>
                  <span className="px-3 text-gray-500 text-sm font-medium border-r border-gray-200 h-full flex items-center bg-gray-50">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    className="flex-1 h-full px-4 text-sm outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full h-12 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1565C0' }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </>
          ) : (
            <>
              {/* Step 2: OTP input */}
              <p className="text-sm text-gray-600 mb-1">
                OTP sent to{' '}
                <span className="font-semibold" style={{ color: '#0D1B2A' }}>
                  +91 {phone}
                </span>
              </p>
              <p className="text-xs text-gray-400 mb-3">Phone: [{phone}] Length: {phone.length}</p>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
                  <button
                    onClick={handleChangeNumber}
                    className="text-xs font-medium"
                    style={{ color: '#1565C0' }}
                  >
                    Change Number
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    className="w-full h-14 text-center text-2xl font-bold tracking-[0.5em] border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="• • • • • •"
                    autoFocus
                  />
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-gray-400 text-center">Dev OTP: 123456</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full h-12 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1565C0' }}
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <p className="mt-auto pt-12 text-xs text-gray-300">Nivasi Command Centre v1.0</p>
      </div>
    </div>
  );
}
