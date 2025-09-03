"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";

const OTP_TIMEOUT = 300; // 5 minutes
const OTP_EXP_KEY = "otp_expiration_time";

function getRemainingTime() {
  if (typeof window === 'undefined') return 0;
  const exp = localStorage.getItem(OTP_EXP_KEY);
  if (!exp) return 0;
  const now = Date.now();
  const diff = Math.floor((parseInt(exp) - now) / 1000);
  return diff > 0 ? diff : 0;
}

export default function OTPVerify() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(OTP_TIMEOUT);
  const [isExpired, setIsExpired] = useState(false);
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isIncorrectOtp, setIsIncorrectOtp] = useState(false);
  const [isCorrectOtp, setIsCorrectOtp] = useState(false);
  const router = useRouter();

  // Client-side initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;
    
    const storedEmail = localStorage.getItem("userEmail");
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) router.push("/");
    if (storedEmail) setEmail(storedEmail);

    // Check if OTP is expired on mount
    const remaining = getRemainingTime();
    if (remaining <= 0) {
      // If no timer exists or timer has expired, start a new 5-minute timer
      const newExp = Date.now() + OTP_TIMEOUT * 1000;
      localStorage.setItem(OTP_EXP_KEY, newExp.toString());
      setTimeLeft(OTP_TIMEOUT);
      setIsExpired(false);
    } else {
      // Use existing timer
      setIsExpired(false);
      setTimeLeft(remaining);
    }
  }, [router, isClient]);

  useEffect(() => {
    if (timeLeft > 0 && !isExpired) {
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
  }, [timeLeft, isExpired]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleChange = (index, value) => {
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
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }

    // Check if OTP has expired before submitting
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

        // Log the password change only when OTP is successfully verified
        if (typeof window !== 'undefined') {
          const userId = localStorage.getItem("userId");
          
          // Add a flag to prevent duplicate logging
          if (!localStorage.getItem("passwordChangeLogged")) {
            fetch("/php/Logs/create_system_log.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: userId,
                target_user_id: userId,
                action: "Changed password"
              })
            }).then(() => {
              // Set flag to prevent duplicate logging
              localStorage.setItem("passwordChangeLogged", "true");
            }).catch(err => {
              console.error("Failed to log password change:", err);
            });
          }
          
          localStorage.removeItem("pendingPassword");
          localStorage.removeItem(OTP_EXP_KEY); // Clear OTP expiration
        }

        setTimeout(() => router.push("/LoginSection"), 2000);
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
    } catch (err) {
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
    } catch (err) {
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

  return (
    <div className="flex flex-col md:flex-row h-screen w-full relative overflow-hidden bg-[#f3f9ff]">
      {/* Left Side */}
      <div
        className="hidden md:flex w-1/2 h-full relative flex-col items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #aee9fa 0%, #7fd0fa 60%, #62b0df 100%)",
        }}
      >
        <Image
          src="/assets/image/villelogo.png"
          width={180}
          height={180}
          alt="Learners' Ville Logo"
          className="mb-4 animate-logo-float"
          priority
        />
        <h1 className="text-4xl font-extrabold text-blue-900">LEARNERS' VILLE</h1>
        <p className="text-center text-gray-800 mt-2 text-base font-medium">
          6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines
        </p>
      </div>

      {/* Right Side */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-blue-200">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl shadow-lg w-[95%] max-w-md"
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="text-blue-900 flex items-center text-sm mb-4"
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
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                value={value}
                onChange={(e) => handleChange(index, e.target.value)}
                className="w-12 h-14 text-center border border-gray-300 rounded-lg text-lg bg-[#f3f9ff] shadow-md focus:ring-2 focus:ring-blue-300 focus:outline-none caret-[#232c67]"
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
        </form>
      </div>
    </div>
  );
}
