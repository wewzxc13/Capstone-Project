"use client";
import { useState, useEffect, useRef } from "react";
import { FaEye, FaEyeSlash, FaEnvelope, FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Topbar from "../../Topbar/Topbar";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ChangePassword({ onSuccess }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const policyRef = useRef(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try all possible keys for the user's email
    const storedEmail =
      localStorage.getItem("userEmail") ||
      localStorage.getItem("user_email") ||
      localStorage.getItem("email") ||
      "";
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

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
      const data = await response.json();
      if (data.success) {
        // Store for OTP verify
        localStorage.setItem("pendingPassword", password);
        localStorage.setItem("userId", data.user_id);
        localStorage.setItem("userEmail", data.email);
        toast.success("OTP sent to your email. Please check your inbox.");
        setTimeout(() => router.push("/TeacherSection/ChangePassword/otpverify"), 1200);
      } else {
        toast.error(data.message || "Failed to set password. Try again.");
      }
    } catch (err) {
      toast.error("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute role="Teacher">
    <div>
      <Topbar title="Change Password" />
      <div className="flex flex-1 flex-col items-center justify-start py-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md animate-form-appear"
        >
          <div className="relative mb-4 flex items-center" style={{ minHeight: "2.5rem" }}>
            <button
              type="button"
              onClick={() => router.back()}
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
                className="w-full px-4 py-3 pr-10 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff] text-gray-500 cursor-not-allowed"
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
                className="w-full px-4 py-3 pr-10 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff]"
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
                className="w-full px-4 py-3 pr-10 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff]"
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
                className="w-full px-4 py-3 pr-10 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff]"
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
          <button
            type="submit"
            className={`w-full py-3 rounded-lg shadow-md text-white text-lg font-semibold transition-all-smooth ${
              loading || !Object.values(passwordValidation).every(Boolean) || password !== confirmPassword || !email
                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                : 'bg-blue-400 hover:bg-blue-500'
            }`}
            disabled={loading || !Object.values(passwordValidation).every(Boolean) || password !== confirmPassword || !email}
          >
            {loading ? 'Processing...' : 'Save'}
          </button>
        </form>
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
      />
    </div>
    </ProtectedRoute>
  );
}
