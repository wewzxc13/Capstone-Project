"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash, FaRedo, FaCheckCircle, FaEnvelope } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuth } from "../../Context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRef } from "react"; // at the top
import { API } from '@/config/api';



// Define keyframe animations to be injected into the document
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

    @keyframes slideInUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes checkmarkDraw {
      0% {
        stroke-dashoffset: 100;
      }
      100% {
        stroke-dashoffset: 0;
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

    @keyframes bounce {
      0%,
      20%,
      50%,
      80%,
      100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }

    @keyframes float {
      0% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
      100% {
        transform: translateY(0px);
      }
    }

    @keyframes glow {
      0% {
        box-shadow: 0 0 5px rgba(66, 153, 225, 0.5);
      }
      50% {
        box-shadow: 0 0 20px rgba(66, 153, 225, 0.8);
      }
      100% {
        box-shadow: 0 0 5px rgba(66, 153, 225, 0.5);
      }
    }

    @keyframes slideInLeft {
      from {
        transform: translateX(-50px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .animate-fade-in {
      animation: fadeIn 0.5s ease-in-out;
    }

    .animate-fade-out {
      animation: fadeOut 0.5s ease-in-out;
    }

    .animate-shake {
      animation: shake 0.5s ease-in-out;
    }

    .animate-pulse {
      animation: pulse 1.5s infinite ease-in-out;
    }

    .animate-slide-in-up {
      animation: slideInUp 0.5s ease-out;
    }

    .animate-checkmark {
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      animation: checkmarkDraw 1s ease-in-out forwards;
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    .animate-bounce {
      animation: bounce 1s ease infinite;
    }

    .animate-float {
      animation: float 3s ease-in-out infinite;
    }

    .animate-glow {
      animation: glow 2s ease-in-out infinite;
    }

    .animate-slide-in-left {
      animation: slideInLeft 0.5s ease-out;
    }

    /* Enhanced focus states */
    .focus-ring:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
      transition: box-shadow 0.3s ease-in-out;
    }

    /* Transition effects */
    .transition-all-smooth {
      transition: all 0.3s ease-in-out;
    }

    .scale-hover:hover {
      transform: scale(1.02);
      transition: transform 0.2s ease;
    }
  `}</style>
);

// Loading spinner component
const LoadingSpinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);



const CustomCaptcha = ({ onCaptchaChange, disabled = false, shake }) => {
  // Initialize state with values from localStorage
  const [captchaState, setCaptchaState] = useState(() => {
    try {
      const savedValues = localStorage.getItem("captchaNumbers");
      if (savedValues) {
        const { num1, num2 } = JSON.parse(savedValues);
        return {
          num1: parseInt(num1),
          num2: parseInt(num2),
          input: localStorage.getItem("captchaInput") || "",
        };
      }
    } catch (e) {
      console.log("Error loading captcha from localStorage");
    }

    // Generate new values if nothing in localStorage
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;

    // Save to localStorage
    localStorage.setItem("captchaNumbers", JSON.stringify({ num1, num2 }));

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
      localStorage.setItem("captchaNumbers", JSON.stringify({ num1, num2 }));
      localStorage.setItem("captchaInput", "");

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
    localStorage.setItem("captchaInput", value);

    if (onCaptchaChange) {
      onCaptchaChange(value);
    }
  };

  return (
    <div
      className={`flex items-center justify-center space-x-2 my-4 ${shake ? "animate-shake" : ""
        }`}
    >
      <div className="flex items-center">
        {/* First number */}
        <div
          className={`border border-gray-300 rounded-md w-12 h-12 flex items-center justify-center text-lg text-gray-700 bg-white transition-all-smooth ${isRefreshing ? "animate-pulse" : ""
            }`}
        >
          {captchaState.num1}
        </div>

        {/* Plus sign */}
        <div className="mx-2 text-xl text-gray-700">+</div>

        {/* Second number */}
        <div
          className={`border border-gray-300 rounded-md w-12 h-12 flex items-center justify-center text-lg text-gray-700 bg-white transition-all-smooth ${isRefreshing ? "animate-pulse" : ""
            }`}
        >
          {captchaState.num2}
        </div>

        {/* Equals sign */}
        <div className="mx-2 text-xl text-gray-700">=</div>

        {/* Input field for answer */}
        <input
          type="number"
          value={captchaState.input}
          onChange={handleInputChange}
          disabled={disabled}
          className="border border-gray-300 rounded-md w-12 h-12 text-center text-lg focus-ring transition-all-smooth caret-[#232c67]"
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
        onClick={generateCaptcha} // Force new CAPTCHA
        disabled={disabled}
        className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-all-smooth"
        aria-label="Refresh captcha"
      >
        <FaRedo
          size={16}
          className={`${disabled ? "opacity-50" : ""} ${isRefreshing ? "animate-spin" : ""
            }`}
        />
      </button>
    </div>
  );
};

// Modified LoginForm implementation with enhanced UX
export default function LoginForm({ setIsSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [responseUserData, setResponseUserData] = useState(null);
  const [captchaInput, setCaptchaInput] = useState(() => {
    return localStorage.getItem("captchaInput") || "";
  });
  const [attempts, setAttempts] = useState(() => {
    return parseInt(localStorage.getItem("loginAttempts") || "5");
  });
  const [cooldown, setCooldown] = useState(() => {
    const storedCooldown = localStorage.getItem("cooldown");
    if (storedCooldown) {
      const remainingTime = Math.max(
        0,
        parseInt(storedCooldown) - Math.floor(Date.now() / 1000)
      );
      return remainingTime > 0 ? remainingTime : 0;
    }
    return 0;
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shakeCaptcha, setShakeCaptcha] = useState(false); // State for shaking effect
  const [loginSuccess, setLoginSuccess] = useState(false); // State for success message
  const [inputFocus, setInputFocus] = useState(null); // Track which input is focused
  const [isCaptchaValid, setIsCaptchaValid] = useState(false); // Track if captcha is correct
  const router = useRouter();
  const auth = useAuth();
  const prevAttemptsRef = useRef(attempts);
  const cooldownToastShownRef = useRef(false);
  const cooldownToastIdRef = useRef(null);

  // Add this useEffect after state declarations
  useEffect(() => {
    // On mount, check if cooldown is expired or missing, and reset attempts if needed
    const storedCooldown = localStorage.getItem("cooldown");
    const storedAttempts = localStorage.getItem("loginAttempts");
    const now = Math.floor(Date.now() / 1000);

    // Only reset attempts when a stored cooldown exists but is already expired
    if (storedCooldown && parseInt(storedCooldown) <= now) {
      localStorage.removeItem("cooldown");
      setAttempts(5);
      localStorage.setItem("loginAttempts", "5");
      return;
    }

    // If there is no record of attempts yet, initialize to 5
    if (storedAttempts === null) {
      setAttempts(5);
      localStorage.setItem("loginAttempts", "5");
    } else {
      // Ensure state reflects persisted attempts on mount (e.g., 3 does not reset to 5)
      const parsed = parseInt(storedAttempts);
      if (!Number.isNaN(parsed)) setAttempts(parsed);
    }
  }, []);

  // Handle cooldown timer and persist absolute end time so refreshes keep the same lock
  useEffect(() => {
    if (cooldown > 0) {
      const now = Math.floor(Date.now() / 1000);
      // If there is an existing end time, reuse it, otherwise set a new one for exactly `cooldown` seconds
      let endTime = parseInt(localStorage.getItem("cooldown") || "0");
      if (!endTime || endTime <= now) {
        endTime = now + cooldown;
        localStorage.setItem("cooldown", endTime.toString());
      }

      const timer = setInterval(() => {
        const currentTime = Math.floor(Date.now() / 1000);
        const savedEnd = parseInt(localStorage.getItem("cooldown") || endTime.toString());
        const remaining = Math.max(0, savedEnd - currentTime);

        if (remaining === 0) {
          clearInterval(timer);
          localStorage.removeItem("cooldown");
          setAttempts(5);
          localStorage.setItem("loginAttempts", "5");
        }
        setCooldown(remaining);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [cooldown]);

  // Persist attempts whenever they change
  useEffect(() => {
    localStorage.setItem("loginAttempts", attempts.toString());
  }, [attempts]);

  // Keep toast and button lock in sync with cooldown; update text without recreating toast
  useEffect(() => {
    if (cooldown > 0) {
      // Show once or update existing toast with remaining seconds
      if (!cooldownToastShownRef.current || !cooldownToastIdRef.current) {
        cooldownToastIdRef.current = toast.warning(
          `Too many failed attempts. Please wait ${cooldown} seconds before trying again.`,
          { containerId: 'login', autoClose: false, closeOnClick: false, draggable: false, pauseOnHover: false }
        );
        cooldownToastShownRef.current = true;
        // If we didn't log (e.g., refreshed at 0 attempts), ensure we insert the Unauthorized entry once per cooldown
        (async () => {
          try {
            if (localStorage.getItem('loginAttempts') === '0' && !localStorage.getItem('cooldownLogged')) {
              localStorage.setItem('cooldownLogged', '1');
              const clientIp = await axios.get(API.external.getClientIP())
                .then(res => res.data.ip)
                .catch(() => 'Unknown');
              try {
                await axios.post(API.logs.createSystemLog(), {
                  user_id: null,
                  action: `Unauthorized login attempt detected from IP ${clientIp}`
                });
              } catch (_) { /* no-op */ }
            }
          } catch (_) { /* no-op */ }
        })();
      } else if (cooldownToastIdRef.current) {
        try {
          toast.update(cooldownToastIdRef.current, {
            render: `Too many failed attempts. Please wait ${cooldown} seconds before trying again.`,
            containerId: 'login',
            autoClose: false,
            closeOnClick: false,
            draggable: false,
            pauseOnHover: false
          });
        } catch (_) { /* no-op */ }
      }
    } else {
      // Cooldown finished — enable UI and remove toast immediately
      cooldownToastShownRef.current = false;
      try { localStorage.removeItem('cooldownLogged'); } catch (_) { /* no-op */ }
      if (cooldownToastIdRef.current) {
        try { toast.dismiss(cooldownToastIdRef.current); } catch (_) { /* no-op */ }
        cooldownToastIdRef.current = null;
      }
    }
  }, [cooldown]);

  // In the useEffect that logs when attempts transitions from 1 to 0, also setCooldown(30)
  useEffect(() => {
    if (prevAttemptsRef.current === 1 && attempts === 0) {
      setCooldown(30);
      (async () => {
        // Mark that we've initiated logging for this cooldown window
        try { localStorage.setItem("cooldownLogged", "1"); } catch (_) { /* no-op */ }
        const clientIp = await axios.get(API.external.getClientIP())
          .then(res => res.data.ip)
          .catch(() => 'Unknown');
        try {
          await axios.post(API.logs.createSystemLog(), {
            user_id: null,
            action: `Unauthorized login attempt detected from IP ${clientIp}`
          });
        } catch (err) {
          // Quietly handle logging failures so they don't surface as overlay errors in dev
          try {
            const status = err?.response?.status;
            const message = err?.response?.data?.message || err?.message || 'Unknown error';
            if (process.env.NODE_ENV !== 'production') {
              console.warn('Log API failed:', status, message);
            }
          } catch (_) { /* no-op */ }
        }
      })();
    }
    prevAttemptsRef.current = attempts;
  }, [attempts]);



  const handleCaptchaChange = (value) => {
    setCaptchaInput(value);
    // Check if the answer is correct
    const storedCaptcha = localStorage.getItem("captchaNumbers");
    if (storedCaptcha) {
      const { num1, num2 } = JSON.parse(storedCaptcha);
      setIsCaptchaValid(parseInt(value) === parseInt(num1) + parseInt(num2));
    } else {
      setIsCaptchaValid(false);
    }
  };

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginSuccess(false);

    let attemptDecremented = false;

    // Email validation
    if (!email || !validateEmail(email)) {
      toast.error("Please enter a valid email address", { containerId: 'login' });
      setAttempts((prev) => prev > 0 ? prev - 1 : 0);
      attemptDecremented = true;
      return;
    }

    // Password validation
    if (!password || password.trim() === "") {
      toast.error("Please enter your password", { containerId: 'login' });
      if (!attemptDecremented) setAttempts((prev) => prev > 0 ? prev - 1 : 0);
      attemptDecremented = true;
      return;
    }

    // Captcha blank
    if (!captchaInput || captchaInput.trim() === "") {
      toast.error("Answer the CAPTCHA", { containerId: 'login' });
      if (!attemptDecremented) setAttempts((prev) => prev > 0 ? prev - 1 : 0);
      attemptDecremented = true;
      setShakeCaptcha(true);
      setTimeout(() => setShakeCaptcha(false), 500);
      return;
    }

    // Captcha math
    const storedCaptcha = localStorage.getItem("captchaNumbers");
    if (storedCaptcha) {
      const { num1, num2 } = JSON.parse(storedCaptcha);
      if (parseInt(captchaInput) !== parseInt(num1) + parseInt(num2)) {
        toast.error("Incorrect CAPTCHA. Please try again.", { containerId: 'login' });
        if (!attemptDecremented) setAttempts((prev) => prev > 0 ? prev - 1 : 0);
        attemptDecremented = true;
        setShakeCaptcha(true);
        setTimeout(() => setShakeCaptcha(false), 500);
        return;
      }
    }

    setLoading(true);

    try {
      const response = await axios.post(API.auth.login(), {
        email,
        password,
      });

      if (response.data.success) {
        // Clear localStorage on successful login
        localStorage.removeItem("captchaInput");

        // Set success state and user data immediately
        setLoginSuccess(true);
        setResponseUserData(response.data.userData);
        console.log('userData:', response.data.userData); // Debug: check if email is present
        console.log('DEBUG: login response', response.data);

        // Normalize role for consistency
        let normalizedRole = response.data.role;
        console.log('Login: Original role from backend:', response.data.role, 'Type:', typeof response.data.role);
        
        if (typeof normalizedRole === "string") {
          const r = normalizedRole.trim().toLowerCase();
          if (r === "teacher") normalizedRole = "Teacher";
          else if (r === "super admin" || r === "superadmin") normalizedRole = "Super Admin";
          else if (r === "admin") normalizedRole = "Admin";
          else if (r === "parent") normalizedRole = "Parent";
        } else if (typeof normalizedRole === "number") {
          // Handle numeric roles from backend
          switch (normalizedRole) {
            case 1:
              normalizedRole = "Super Admin";
              break;
            case 2:
              normalizedRole = "Admin";
              break;
            case 3:
              normalizedRole = "Teacher";
              break;
            case 4:
              normalizedRole = "Parent";
              break;
            default:
              normalizedRole = "User";
          }
        }
        
        console.log('Login: Normalized role:', normalizedRole);

        localStorage.setItem("userId", response.data.userData.id);
        localStorage.setItem("userRole", normalizedRole);
        localStorage.setItem("userEmail", response.data.userData.email); // Store user email
        
        console.log('Login: Stored in localStorage:', {
          userId: response.data.userData.id,
          userRole: normalizedRole,
          userEmail: response.data.userData.email
        });
        // Set userFullName in localStorage
        const fullName = [
          response.data.userData.firstName || response.data.userData.user_firstname || "",
          response.data.userData.middleName || response.data.userData.user_middlename || "",
          response.data.userData.lastName || response.data.userData.user_lastname || ""
        ].filter(Boolean).join(" ");
        localStorage.setItem("userFullName", fullName);

        // Show success notification (login page container)
        toast.success("Successfully logged in!", {
          containerId: 'login',
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        // Queue fallback toast for next page in case of fast navigation
        try {
          localStorage.setItem(
            "next_toast",
            JSON.stringify({ message: "Successfully logged in!", type: "success", duration: 3000 })
          );
        } catch (_) { /* no-op */ }

        // Short timeout to show the success message and animation before redirecting
        setTimeout(() => {
          auth.login(response.data.userData, normalizedRole);
          // Immediately broadcast a user change for any listeners
          try {
            window.dispatchEvent(new CustomEvent('userChanged', { detail: { userId: response.data.userData.id, role: normalizedRole } }));
          } catch (err) {
            // no-op
          }
          setTimeout(() => {
            if (response.data.userData.is_new === "Yes") {
              router.push("/LoginSection/ForgotPassword");
            } else {
              switch (normalizedRole) {
                case "Admin":
                  router.push("/AdminSection/Dashboard");
                  break;
                case "Parent":
                  router.push("/ParentSection/Dashboard");
                  break;
                case "Teacher":
                  router.push("/TeacherSection/Dashboard");
                  break;
                case "Super Admin":
                  router.push("/SuperAdminSection/Dashboard");
                  break;
                default:
                  toast.error("Unknown role.");
                  auth.logout();
              }
            }
          }, 100); // Short delay to allow AuthContext to update
        }, 1800); // Slightly longer delay to show the animation
      } else {
        toast.error(response.data.message || "Invalid credentials!", { containerId: 'login' });
        if (!attemptDecremented) setAttempts((prev) => prev > 0 ? prev - 1 : 0);
        attemptDecremented = true;

        // If attempts reached 0 now, a separate effect will set cooldown and log unauthorized attempt
        if (attempts - 1 <= 0) {
          // no-op here; handled by attempts effect
        }
      }
    } catch (error) {
      toast.error("Invalid credentials!", { containerId: 'login' });
      if (!attemptDecremented) setAttempts((prev) => prev > 0 ? prev - 1 : 0);
      attemptDecremented = true;
    } finally {
      if (!loginSuccess) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Include keyframe animations */}
      <KeyframeStyles />

      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
        opacity: 0;
        display: none;
      }
      `}</style>

      {/* Header */}
      <h2 className="text-2xl font-bold text-center mb-3 md:mb-6 text-blue-900">
        Log in
      </h2>

      <form onSubmit={handleLogin} className="space-y-2.5 md:space-y-4 animate-slide-in-left">
        {/* Email */}
        <div className="mb-1 md:mb-2">
          <label className="block text-sm font-semibold text-blue-900 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              className="w-full px-4 py-2 pr-10 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f7fafd] text-gray-800 caret-[#232c67]"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={cooldown > 0 || loginSuccess}
            />
            <FaEnvelope className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

        {/* Password */}
        <div className="mb-1 md:mb-2">
          <label className="block text-sm font-semibold text-blue-900 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-4 py-2 rounded-lg shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-[#f7fafd] text-gray-800 pr-10 caret-[#232c67]"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={cooldown > 0 || loginSuccess}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              disabled={cooldown > 0 || loginSuccess}
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>
          <p className="text-[11px] text-red-700 mt-1">
            * First-time access user needs to enter the default password.
            <br />
            Hint Password:{" "}
            <span className="text-xs text-gray-500 mt-1">"Learnersville"</span>
          </p>
        </div>

        {/* Captcha styled box */}
        <div className="mb-1 md:mb-2">
          <label className="block text-sm font-semibold text-blue-900 mb-1">
            Solve to Continue <span className="text-red-500">*</span>
          </label>
          <div className="bg-[#eaf6ff] p-2.5 md:p-4 rounded-xl border border-blue-100 shadow flex flex-col items-center">
            <CustomCaptcha
              onCaptchaChange={handleCaptchaChange}
              disabled={cooldown > 0 || loginSuccess}
              shake={shakeCaptcha}
            />
            <div className="w-full flex justify-between items-center mt-1 md:mt-2">
              <span className="text-sm text-gray-600">
                Attempt remaining:{" "}
                <span
                  className={
                    attempts <= 2 ? "text-red-500 font-bold" : "font-semibold"
                  }
                >
                  {attempts}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Log In Button */}
        <button
          type="submit"
          className={`w-full py-2 md:py-3 rounded-lg shadow-md flex items-center justify-center text-lg font-semibold transition-all-smooth animate-glow ${loading || cooldown > 0 || loginSuccess || !isCaptchaValid
            ? "bg-blue-200 cursor-not-allowed"
            : "bg-blue-400 hover:bg-blue-500"
            } text-white`}
          disabled={loading || cooldown > 0 || loginSuccess || !isCaptchaValid}
        >
          {loading ? (
            <span className="flex items-center">
              <LoadingSpinner />
              <span className="ml-2">Logging in...</span>
            </span>
          ) : loginSuccess ? (
            <span className="flex items-center">
              <FaCheckCircle size={18} className="mr-2" />
              Logged in!
            </span>
          ) : (
            "Log in"
          )}
        </button>

        {/* Forgot Password */}
        <div className="text-center mt-1 md:mt-2">
          <button
            type="button"
            className="text-sm md:text-base text-blue-900 hover:underline bg-transparent border-none outline-none cursor-pointer"
            onClick={() => router.push("/LoginSection/ForgotPassword")}
          >
            Forgot Password?
          </button>
        </div>





      </form>
    </div>
  );
}
