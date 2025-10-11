"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaEye, FaEyeSlash, FaEnvelope, FaRedo } from "react-icons/fa";
import { toast } from "react-toastify";
import { API } from '@/config/api';

// Define keyframe animations
const KeyframeStyles = () => (
  <style jsx global>{`
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    @keyframes shake {
      0%,
      100% {
        transform: translateX(0);
      }
      10%,
      30%,
      50%,
      70%,
      90% {
        transform: translateX(-5px);
      }
      20%,
      40%,
      60%,
      80% {
        transform: translateX(5px);
      }
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
      100% {
        transform: scale(1);
      }
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .animate-shake {
      animation: shake 0.5s ease-in-out;
    }

    .animate-pulse {
      animation: pulse 1.5s infinite ease-in-out;
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    .transition-all-smooth {
      transition: all 0.3s ease-in-out;
    }

    .focus-ring:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
      transition: box-shadow 0.3s ease-in-out;
    }
  `}</style>
);

// Custom Captcha Component
const CustomCaptcha = ({ onCaptchaChange, disabled = false, shake }) => {
  // Initialize state with values from localStorage
  const [captchaState, setCaptchaState] = useState(() => {
    try {
      const savedValues = localStorage.getItem("forgotPasswordCaptchaNumbers");
      if (savedValues) {
        const { num1, num2 } = JSON.parse(savedValues);
        return {
          num1: parseInt(num1),
          num2: parseInt(num2),
          input: localStorage.getItem("forgotPasswordCaptchaInput") || "",
        };
      }
    } catch (e) {
      console.log("Error loading captcha from localStorage");
    }

    // Generate new values if nothing in localStorage
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;

    // Save to localStorage
    localStorage.setItem("forgotPasswordCaptchaNumbers", JSON.stringify({ num1, num2 }));

    return { num1, num2, input: "" };
  });

  // Animation state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Let parent know about initial input value (if any)
  useEffect(() => {
    if (onCaptchaChange && captchaState.input) {
      onCaptchaChange(captchaState.input);
    }
  }, [captchaState.input, onCaptchaChange]);

  const generateCaptcha = () => {
    setIsRefreshing(true);

    // Generate new captcha after brief animation
    setTimeout(() => {
      const num1 = Math.floor(Math.random() * 20) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;

      // Update state
      setCaptchaState({ num1, num2, input: "" });

      // Save to localStorage
      localStorage.setItem("forgotPasswordCaptchaNumbers", JSON.stringify({ num1, num2 }));
      localStorage.setItem("forgotPasswordCaptchaInput", "");

      setIsRefreshing(false);
    }, 500);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;

    // Update state
    setCaptchaState((prev) => ({
      ...prev,
      input: value,
    }));

    // Save to localStorage
    localStorage.setItem("forgotPasswordCaptchaInput", value);

    if (onCaptchaChange) {
      onCaptchaChange(value);
    }
  };

  return (
    <div
      className={`flex items-center justify-center space-x-1 sm:space-x-2 my-2 sm:my-4 ${shake ? "animate-shake" : ""
        }`}
    >
      <div className="flex items-center">
        {/* First number */}
        <div
          className={`border border-gray-300 rounded-md w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-base sm:text-lg text-gray-700 bg-white transition-all-smooth ${isRefreshing ? "animate-pulse" : ""
            }`}
        >
          {captchaState.num1}
        </div>

        {/* Plus sign */}
        <div className="mx-1 sm:mx-2 text-lg sm:text-xl text-gray-700">+</div>

        {/* Second number */}
        <div
          className={`border border-gray-300 rounded-md w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-base sm:text-lg text-gray-700 bg-white transition-all-smooth ${isRefreshing ? "animate-pulse" : ""
            }`}
        >
          {captchaState.num2}
        </div>

        {/* Equals sign */}
        <div className="mx-1 sm:mx-2 text-lg sm:text-xl text-gray-700">=</div>

        {/* Input field for answer */}
        <input
          type="number"
          value={captchaState.input}
          onChange={handleInputChange}
          disabled={disabled}
          className="border border-gray-300 rounded-md w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg focus-ring transition-all-smooth caret-[#232c67]"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder=""
          aria-label="Enter captcha result"
          min="0"
          step="1"
        />
      </div>

      {/* Refresh button */}
      <button
        type="button"
        onClick={generateCaptcha}
        disabled={disabled}
        className="text-gray-500 hover:text-gray-700 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-all-smooth"
        aria-label="Refresh captcha"
      >
        <FaRedo
          size={14}
          className={`sm:w-4 sm:h-4 ${disabled ? "opacity-50" : ""} ${isRefreshing ? "animate-spin" : ""
            }`}
        />
      </button>
    </div>
  );
};

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
  const [captchaInput, setCaptchaInput] = useState(() => {
    return localStorage.getItem("forgotPasswordCaptchaInput") || "";
  });
  const [shakeCaptcha, setShakeCaptcha] = useState(false);
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
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

  // Handle captcha change
  const handleCaptchaChange = (value) => {
    setCaptchaInput(value);
    // Check if the answer is correct
    const storedCaptcha = localStorage.getItem("forgotPasswordCaptchaNumbers");
    if (storedCaptcha) {
      const { num1, num2 } = JSON.parse(storedCaptcha);
      setIsCaptchaValid(parseInt(value) === parseInt(num1) + parseInt(num2));
    } else {
      setIsCaptchaValid(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Email validation
    if (!email || email.trim() === "") {
      toast.error("Please enter your email address");
      setLoading(false);
      return;
    }

    // Captcha blank validation
    if (!captchaInput || captchaInput.trim() === "") {
      toast.error("Answer the CAPTCHA");
      setLoading(false);
      setShakeCaptcha(true);
      setTimeout(() => setShakeCaptcha(false), 500);
      return;
    }

    // Captcha correctness validation
    const storedCaptcha = localStorage.getItem("forgotPasswordCaptchaNumbers");
    if (storedCaptcha) {
      const { num1, num2 } = JSON.parse(storedCaptcha);
      if (parseInt(captchaInput) !== parseInt(num1) + parseInt(num2)) {
        toast.error("Incorrect CAPTCHA. Please try again.");
        setLoading(false);
        setShakeCaptcha(true);
        setTimeout(() => setShakeCaptcha(false), 500);
        return;
      }
    }

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
      const response = await fetch(API.auth.changePassword(), {
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
        // Clear captcha data
        localStorage.removeItem("forgotPasswordCaptchaInput");
        localStorage.removeItem("forgotPasswordCaptchaNumbers");
        // Send OTP
        const formData = new FormData();
        formData.append("user_id", data.user_id);
        formData.append("email", data.email);

        const otpRes = await fetch(API.auth.sendOTP(), {
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
    <div className="flex flex-col md:flex-row min-h-screen w-full relative bg-[#f3f9ff]">
      {/* Include keyframe animations */}
      <KeyframeStyles />
      
      {/* Left side */}
      <div
        className="hidden md:flex md:w-1/2 h-screen md:sticky md:top-0 relative flex-col items-center justify-center overflow-hidden"
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
      <div className="md:hidden w-full flex flex-col items-center pt-4 pb-2 bg-transparent z-20">
        <Image
          src="/assets/image/villelogo.png"
          width={110}
          height={110}
          alt="Learners' Ville Logo"
          className="mb-1 animate-logo-float w-[80px] h-[80px]"
          priority
        />
        <h1 className="text-xl font-extrabold flex items-center justify-center">
          <span className="text-blue-900">LEARNERS'</span>
          <span className="text-yellow-400 ml-2">VILLE</span>
        </h1>
        <p className="text-center text-gray-800 mt-1 text-[10px] font-medium px-2 break-words w-full max-w-xs">
          6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines
        </p>
      </div>

      {/* Right side - form */}
      <div className="w-full md:w-1/2 flex items-start md:items-center justify-center bg-blue-200 relative py-4 md:py-0 md:min-h-screen">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 sm:p-6 md:p-10 rounded-2xl shadow-xl w-[96%] sm:w-[90%] md:w-[500px] max-w-full mx-2 md:mx-4 animate-form-appear my-2 md:my-4"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4 sm:mb-6">
            Reset Password
          </h2>
         

          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-semibold text-blue-900 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff] caret-[#232c67] text-sm sm:text-base"
              />
              <FaEnvelope className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>


          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-semibold text-blue-900 mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff] pr-10 caret-[#232c67] text-sm sm:text-base"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
            
            {/* Password Policy popover */}
            <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs relative">
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
                  className="absolute z-20 mt-2 left-0 sm:right-0 w-64 sm:w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 sm:p-3 text-xs"
                >
                  <p className={`${allValid ? 'text-green-600' : 'text-gray-600'} mb-1`}>Password must contain:</p>
                  <div className="space-y-0.5 sm:space-y-1">
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

          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-semibold text-blue-900 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f3f9ff] pr-10 caret-[#232c67] text-sm sm:text-base"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          {/* Captcha Section */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-semibold text-blue-900 mb-1">
              Solve to Continue <span className="text-red-500">*</span>
            </label>
            <div className="bg-[#eaf6ff] p-2 sm:p-3 md:p-4 rounded-xl border border-blue-100 shadow flex flex-col items-center">
              <CustomCaptcha
                onCaptchaChange={handleCaptchaChange}
                disabled={loading}
                shake={shakeCaptcha}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-2.5 sm:py-3 rounded-lg shadow-md text-white text-base sm:text-lg font-semibold transition-all-smooth ${
              loading || !Object.values(passwordValidation).every(Boolean) || password !== confirmPassword || !email || !isCaptchaValid
                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                : 'bg-blue-400 hover:bg-blue-500'
            }`}
            disabled={loading || !Object.values(passwordValidation).every(Boolean) || password !== confirmPassword || !email || !isCaptchaValid}
          >
            {loading ? 'Processing...' : 'Save'}
          </button>

          <div className="text-center mt-3 sm:mt-4">
            <button
              type="button"
              className="text-xs sm:text-sm md:text-base text-blue-900 hover:underline bg-transparent border-none outline-none cursor-pointer"
              onClick={() => router.push("/LoginSection")}
            >
              Back to Login
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
