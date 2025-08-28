"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaEye, FaEyeSlash, FaEnvelope } from "react-icons/fa";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false
  });
  const [showPolicy, setShowPolicy] = useState(false);
  const policyRef = useRef(null);
  const router = useRouter();



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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Password validation
    const missingRequirements = [];
    if (!passwordValidation.hasLowercase) missingRequirements.push("one lowercase letter");
    if (!passwordValidation.hasUppercase) missingRequirements.push("one uppercase letter");
    if (!passwordValidation.hasNumber) missingRequirements.push("one number");
    if (!passwordValidation.hasSpecialChar) missingRequirements.push("one special character");
    if (!passwordValidation.hasMinLength) missingRequirements.push("minimum 8 characters");

    if (missingRequirements.length > 0) {
      toast.error(`Password must contain: ${missingRequirements.join(", ")}`);
      setLoading(false);
      return;
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost/capstone-project/backend/changepassword.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          new_password: password,
          confirm_password: confirmPassword,
          mode: "forgot" // Explicitly set mode to forgot password
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
        localStorage.setItem("userId", data.user_id);
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("pendingPassword", password);
        // Clear any previous password change logging flag
        localStorage.removeItem("passwordChangeLogged");
        // Send OTP
        const formData = new FormData();
        formData.append("user_id", data.user_id);
        formData.append("email", data.email);

        const otpRes = await fetch("http://localhost/capstone-project/backend/send_otp.php", {
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
          toast.success("OTP sent to your email. Please check your inbox.");
          setTimeout(() => {
            setLoading(false);
            router.push("/LoginSection/OTPVerify");
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
  
  return (
    <div className="flex flex-col md:flex-row h-screen w-full relative overflow-hidden bg-[#f3f9ff]">
      {/* Left side */}
      <div
        className="hidden md:flex w-1/2 h-full relative flex-col items-center justify-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #aee9fa 0%, #7fd0fa 60%, #62b0df 100%)",
        }}
      >
        <div className="absolute blob-green" />
        <div className="absolute blob-blue" />
        <div className="absolute blob-blue-circle" />
        <div className="absolute blob-white" />
        <div className="relative z-10 flex flex-col items-center px-4">
          <Image
            src="/assets/image/villelogo.png"
            width={180}
            height={180}
            alt="Learners' Ville Logo"
            className="mb-2 animate-logo-float w-[180px] h-[180px]"
            priority
          />
          <h1 className="text-5xl font-extrabold mt-4 flex items-center flex-wrap justify-center">
            <span className="text-blue-900">LEARNERS'</span>
            <span className="text-yellow-400 ml-2">VILLE</span>
          </h1>
          <p className="text-center text-gray-800 mt-2 text-base font-medium">
            6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines
          </p>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden w-full flex flex-col items-center pt-6 pb-2 bg-transparent z-20">
        <Image
          src="/assets/image/villelogo.png"
          width={110}
          height={110}
          alt="Learners' Ville Logo"
          className="mb-2 animate-logo-float w-[90px] h-[90px]"
          priority
        />
        <h1 className="text-2xl font-extrabold flex items-center justify-center">
          <span className="text-blue-900">LEARNERS'</span>
          <span className="text-yellow-400 ml-2">VILLE</span>
        </h1>
        <p className="text-center text-gray-800 mt-1 text-xs font-medium px-2 break-words w-full max-w-xs">
          6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines
        </p>
      </div>

      {/* Right side - form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-blue-200 relative min-h-[60vh] md:min-h-0">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 md:p-10 rounded-2xl shadow-xl w-[98%] md:w-[500px] max-w-full mx-1 md:mx-4 animate-form-appear mt-4 md:mt-0"
        >
          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            Reset Password
          </h2>
         

          <div className="mb-4">
            <label className="block text-sm font-semibold text-blue-900 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff] caret-[#232c67]"
              />
              <FaEnvelope className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
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
                className="w-full px-4 py-3 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff] pr-10 caret-[#232c67]"
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
                  <p className="text-gray-600 mb-1">Password must contain:</p>
                  <div className="space-y-1">
                    <div className={`${allValid ? 'text-green-600' : 'text-gray-600'}`}>One lowercase letter (a-z)</div>
                    <div className={`${allValid ? 'text-green-600' : 'text-gray-600'}`}>One uppercase letter (A-Z)</div>
                    <div className={`${allValid ? 'text-green-600' : 'text-gray-600'}`}>One number (0-9)</div>
                    <div className={`${allValid ? 'text-green-600' : 'text-gray-600'}`}>One special character (!@#$%^&*)</div>
                    <div className={`${allValid ? 'text-green-600' : 'text-gray-600'}`}>Minimum 8 characters</div>
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
                className="w-full px-4 py-3 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff] pr-10 caret-[#232c67]"
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

          <div className="text-center mt-2">
            <button
              type="button"
              className="text-sm md:text-base text-blue-900 hover:underline bg-transparent border-none outline-none cursor-pointer"
              onClick={() => router.push("/LoginSection")}
            >
              Back to Login
            </button>
            <br />
          </div>

        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
