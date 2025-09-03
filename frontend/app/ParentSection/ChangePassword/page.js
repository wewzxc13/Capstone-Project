"use client";
import { useState, useEffect, useRef } from "react";
import { FaEye, FaEyeSlash, FaEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Topbar from "../../Topbar/Topbar";
import { toast, ToastContainer } from "react-toastify";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useAuth } from "../../Context/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.css";

const OTP_TIMEOUT = 300; // 5 minutes
const OTP_EXP_KEY = "otp_expiration_time_parent";

function getRemainingTime() {
  const exp = localStorage.getItem(OTP_EXP_KEY);
  if (!exp) return 0;
  const now = Date.now();
  const diff = Math.floor((parseInt(exp) - now) / 1000);
  return diff > 0 ? diff : 0;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const auth = useAuth();
  const [step, setStep] = useState("form"); // Default to form step
  const [isClient, setIsClient] = useState(false); // Track if we're on client side
  const [mounted, setMounted] = useState(false); // Track if component is mounted
  // Form states
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const policyRef = useRef(null);
  const [passwordValidation, setPasswordValidation] = useState({
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false
  });
  const [loading, setLoading] = useState(false);

  // OTP states
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(OTP_TIMEOUT);
  const [isExpired, setIsExpired] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isIncorrectOtp, setIsIncorrectOtp] = useState(false);
  const [isCorrectOtp, setIsCorrectOtp] = useState(false);

  // Client-side initialization
  useEffect(() => {
    setIsClient(true);
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      // Check if we were on OTP step before refresh
      const savedStep = localStorage.getItem("changePasswordStep");
      const hasRequiredData = localStorage.getItem("userId") && 
                             localStorage.getItem("userEmail") && 
                             localStorage.getItem("pendingPassword");
      
      // Only restore OTP step if we have the required data
      if (savedStep === "otp" && hasRequiredData) {
        setStep("otp");
      }
    }
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return; // Don't run on server side
    
    // Try all possible keys for the user's email
    const storedEmail =
      localStorage.getItem("userEmail") ||
      localStorage.getItem("user_email") ||
      localStorage.getItem("email") ||
      "";
    if (storedEmail) {
      setEmail(storedEmail);
    }
    
    // If we're on OTP step but missing required data, go back to form
    if (step === "otp") {
      const hasRequiredData = localStorage.getItem("userId") && 
                             localStorage.getItem("userEmail") && 
                             localStorage.getItem("pendingPassword");
      if (!hasRequiredData) {
        setStep("form");
        localStorage.setItem("changePasswordStep", "form");
      }
    }
  }, [step, isClient]);

  // For simplicity, we'll always show the current password field
  // The backend API will handle the validation logic based on is_new status

  // Cleanup effect to clear step when component unmounts
  useEffect(() => {
    return () => {
      // Only clear if user navigates away (not on successful completion)
      if (step === "otp" && typeof window !== 'undefined') {
        localStorage.removeItem("changePasswordStep");
      }
    };
  }, [step]);

  // Password validation effect
  useEffect(() => {
    const validation = {
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      hasMinLength: password.length >= 8
    };
    setPasswordValidation(validation);
  }, [password]);

  const allValid = Object.values(passwordValidation).every(Boolean);

  // Close password policy popover on outside click or Escape
  useEffect(() => {
    if (!showPolicy) return;
    const handleClickOutside = (e) => {
      if (policyRef.current && !policyRef.current.contains(e.target)) {
        setShowPolicy(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setShowPolicy(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showPolicy]);

  // OTP timer effect
  useEffect(() => {
    if (step === "otp" && timeLeft > 0 && !isExpired) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft, isExpired]);

  // Initialize OTP timer when step changes to OTP
  useEffect(() => {
    if (step === "otp") {
      const remaining = getRemainingTime();
      if (remaining <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
      } else {
        setIsExpired(false);
        setTimeLeft(remaining);
      }
      setHasMounted(true);
    }
  }, [step]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/php/changepassword.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          current_password: currentPassword,
          new_password: password,
          confirm_password: confirmPassword,
          mode: "change"
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        toast.error("Server error: Invalid response from server.");
        console.error("changepassword.php returned invalid JSON", jsonErr);
        return;
      }

      if (data.success) {
        // Store for OTP verify
        localStorage.setItem("pendingPassword", password);
        localStorage.setItem("userId", data.user_id);
        localStorage.setItem("userEmail", data.email);
        
        // Send OTP
        const formData = new FormData();
        formData.append("user_id", data.user_id);
        formData.append("email", data.email);

        const otpRes = await fetch("/php/send_otp.php", {
          method: "POST",
          body: formData,
        });

        let otpData;
        try {
          otpData = await otpRes.json();
        } catch (jsonErr) {
          toast.error("Server error: Invalid OTP response.");
          setLoading(false);
          console.error("send_otp.php returned invalid JSON", jsonErr);
          return;
        }

        if (otpData.status === "success") {
          // Set new OTP expiration time (5 minutes from now)
          if (typeof window !== 'undefined') {
            const expirationTime = Date.now() + (OTP_TIMEOUT * 1000);
            localStorage.setItem(OTP_EXP_KEY, expirationTime.toString());
          }
          
          toast.success("OTP sent to your email. Please check your inbox.");
          setTimeout(() => {
            setLoading(false);
            setStep("otp");
            if (typeof window !== 'undefined') {
              localStorage.setItem("changePasswordStep", "otp");
            }
          }, 1500);
        } else {
          toast.error(otpData.message || "Failed to send OTP. Try again.");
          setLoading(false);
        }
      } else {
        toast.error(data.message || "Failed to set password. Try again.");
        setLoading(false);
      }
    } catch (error) {
      toast.error("Network error: " + error.message);
      setLoading(false);
      console.error("Network or fetch error:", error);
    }
  };

  const handleOtpChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const updatedOtp = [...otp];
      updatedOtp[index] = value;
      setOtp(updatedOtp);
      
      // Reset OTP states when user starts typing
      if (isIncorrectOtp) {
        setIsIncorrectOtp(false);
      }
      if (isCorrectOtp) {
        setIsCorrectOtp(false);
      }
      
      if (value !== "" && index < 5) {
        document.getElementById(`otp-superadmin-${index + 1}`).focus();
      }
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }
    if (isExpired || timeLeft <= 0) {
      toast.error("OTP has expired. Please request a new one.");
      return;
    }

    try {
      const formData = new FormData();
      if (typeof window !== 'undefined') {
        formData.append("user_id", localStorage.getItem("userId"));
        formData.append("otp", code);
        formData.append("new_password", localStorage.getItem("pendingPassword"));
      }

      const response = await fetch("/php/otpverify.php", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.status === "success") {
        setIsCorrectOtp(true);
        toast.success("Successfully changed password.");

        // Cleanup local storage; backend logs the password change
        if (typeof window !== 'undefined') {
          localStorage.removeItem("pendingPassword");
          localStorage.removeItem(OTP_EXP_KEY); // Clear OTP expiration
          localStorage.removeItem("changePasswordStep");
        }

        // Ensure auth persistence and proper role before redirect
        try {
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("userRole", "Parent");
          const currentUserId = localStorage.getItem("userId");
          const currentEmail = localStorage.getItem("userEmail");
          if (auth && typeof auth.login === 'function') {
            auth.login({ id: currentUserId, email: currentEmail }, "Parent");
          }
          try {
            window.dispatchEvent(new CustomEvent('userChanged', { detail: { userId: currentUserId, role: 'Parent' } }));
          } catch (_) { /* no-op */ }
        } catch (_) { /* no-op */ }
        try {
          localStorage.setItem(
            "next_toast",
            JSON.stringify({ message: "Password changed successfully.", type: "success", duration: 3000 })
          );
        } catch (_) { /* no-op */ }
        setTimeout(() => router.push("/ParentSection/ParentDetails"), 500);
      } else {
        setIsIncorrectOtp(true);
        toast.error(data.message || "OTP verification failed.");
        
        // If OTP expired, clear the form
        if (data.message && data.message.includes("expired")) {
          setOtp(["", "", "", "", "", ""]);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(OTP_EXP_KEY);
          }
        }
      }
    } catch (error) {
      setIsIncorrectOtp(true);
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleResend = async () => {
    setOtp(["", "", "", "", "", ""]);
    setIsIncorrectOtp(false);
    setIsCorrectOtp(false);
    setResendLoading(true);

    const formData = new FormData();
    if (typeof window !== 'undefined') {
      formData.append("user_id", localStorage.getItem("userId"));
      formData.append("email", localStorage.getItem("userEmail"));
    }

    try {
      const response = await fetch("/php/send_otp.php", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.status === "success") {
        toast.success("A new OTP has been sent to your email.");
        const newExp = Date.now() + OTP_TIMEOUT * 1000;
        if (typeof window !== 'undefined') {
          localStorage.setItem(OTP_EXP_KEY, newExp.toString());
        }
        setTimeLeft(OTP_TIMEOUT);
        setIsExpired(false);
      } else {
        toast.error(data.message || "Failed to resend OTP. Try again.");
      }
    } catch (error) {
      toast.error("An error occurred while resending OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Don't render until component is mounted on client side
  if (!mounted) {
    return null;
  }

  return (
    <ProtectedRoute role="Parent">
    <div suppressHydrationWarning>
      <Topbar title="Change Password" />
      <div className="flex flex-1 flex-col items-center">
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md animate-form-appear">
          {step === "form" ? (
            <>
              <div className="relative mb-4 flex items-center" style={{ minHeight: "2.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem("changePasswordStep"); // Clear step when going back
                    }
                    router.back();
                  }}
                  className="absolute left-0 p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                  title="Back to Dashboard"
                  aria-label="Back"
                >
                  <FaArrowLeft className="text-blue-900 text-lg" />
                </button>
                <h2 className="w-full text-2xl font-bold text-blue-900 text-center">
                  Create New Password
                </h2>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-blue-900 mb-1">
                  Account Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    readOnly
                    className="w-full px-4 py-3 pr-10 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff] text-gray-500 cursor-not-allowed caret-[#1E2A79]"
                  />
                  <FaEnvelope className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-blue-900 mb-1">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff] caret-[#1E2A79]"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-blue-900 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff] caret-[#1E2A79]"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                  </button>
                </div>
                {/* Password Policy popover */}
                <div className="mt-2 text-xs relative">
                  <button
                    type="button"
                    className={`${allValid ? 'text-green-600' : 'text-gray-600'} hover:underline`}
                    onClick={() => setShowPolicy((p) => !p)}
                    aria-haspopup="dialog"
                    aria-expanded={showPolicy}
                    aria-controls="password-policy-popover"
                    title="View password policy"
                  >
                    Password Policy
                  </button>
                  {showPolicy && (
                    <div
                      id="password-policy-popover"
                      ref={policyRef}
                      className="absolute z-20 mt-2 right-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
                    >
                      <p className={`${allValid ? 'text-green-600' : 'text-gray-600'} mb-1`}>Password must contain:</p>
                      <div className="space-y-1">
                        <div className={`${passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-600'}`}>One lowercase letter (a-z)</div>
                        <div className={`${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-600'}`}>One uppercase letter (A-Z)</div>
                        <div className={`${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-600'}`}>One number (0-9)</div>
                        <div className={`${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-600'}`}>One special character (!@#$%^&*)</div>
                        <div className={`${passwordValidation.hasMinLength ? 'text-green-600' : 'text-gray-600'}`}>Minimum 8 characters</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-blue-900 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff] caret-[#1E2A79]"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit}>
                <button
                  type="submit"
                  className={`w-full py-3 rounded-lg shadow-md text-white text-lg font-semibold transition-all-smooth ${
                    loading || !Object.values(passwordValidation).every(Boolean) || password !== confirmPassword || !email || !currentPassword
                      ? 'bg-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-blue-400 hover:bg-blue-500'
                  }`}
                  disabled={loading || !Object.values(passwordValidation).every(Boolean) || password !== confirmPassword || !email || !currentPassword}
                >
                  {loading ? 'Processing...' : 'Save'}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  if (typeof window !== 'undefined') {
                    localStorage.setItem("changePasswordStep", "form");
                  }
                }}
                className="text-blue-900 flex items-center text-sm mb-4"
                title="Back to Dashboard"
              >
                <FaArrowLeft className="mr-2" /> Back
              </button>
              <h2 className="text-2xl font-bold text-blue-900 mb-2 text-center">Enter OTP</h2>
              {email && (
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Code sent to <strong>{email}</strong>
                </p>
              )}
              <p className="text-xs text-gray-500 mb-4 text-center">
                Enter the 6-digit code from your email. The code will expire in 5 minutes.
              </p>
              <div className="flex justify-center gap-3 mb-4">
                {otp.map((value, index) => (
                  <input
                    key={index}
                    id={`otp-superadmin-${index}`}
                    type="text"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-12 h-14 text-center border border-gray-300 rounded-lg text-lg bg-[#f3f9ff] shadow-md focus:ring-2 focus:ring-blue-300 focus:outline-none caret-[#1E2A79]"
                  />
                ))}
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className={`${isExpired ? "text-red-600 font-semibold" : timeLeft <= 60 ? "text-orange-600 font-semibold" : "text-gray-600"}`}>
                    {isExpired ? "OTP Expired" : `Time remaining: ${hasMounted ? formatTime(timeLeft) : "5:00"}`}
                  </span>
                  <FaCheckCircle className={
                    isCorrectOtp ? "text-green-500" :
                    isIncorrectOtp ? "text-red-500" : 
                    "text-gray-400"
                  } />
                </div>
                {!isExpired && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        timeLeft <= 60 ? "bg-orange-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${(timeLeft / OTP_TIMEOUT) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
              <form onSubmit={handleOtpSubmit}>
                <button
                  type="submit"
                  className={`w-full py-3 rounded-lg font-semibold transition-all-smooth ${
                    otp.join("").length === 6 && !isExpired
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-400 cursor-not-allowed text-white opacity-60"
                  }`}
                  disabled={otp.join("").length !== 6 || isExpired}
                >
                  {isExpired ? "OTP Expired" : "Confirm"}
                </button>
              </form>
              <div className="text-center mt-3">
                <p className="text-s text-gray-500">
                  Didn't receive a code?{" "}
                  <span
                    className={`text-blue-900 hover:underline cursor-pointer ${
                      (!isExpired && timeLeft > 0) || resendLoading ? "pointer-events-none opacity-50" : ""
                    }`}
                    onClick={isExpired && !resendLoading ? handleResend : undefined}
                  >
                    {resendLoading ? "Sending..." : isExpired ? "Request New OTP" : "Resend"}
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        suppressHydrationWarning={true}
      />
    </div>
    </ProtectedRoute>
  );
} 