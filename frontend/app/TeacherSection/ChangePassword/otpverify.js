"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import Topbar from "../../Topbar/Topbar";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.css";

const OTP_TIMEOUT = 300; // 5 minutes
const OTP_EXP_KEY = "otp_expiration_time_teacher";

function getRemainingTime() {
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
  const [isIncorrectOtp, setIsIncorrectOtp] = useState(false);
  const [isCorrectOtp, setIsCorrectOtp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // For demo, get email from localStorage or leave blank
    const storedEmail = localStorage.getItem("userEmail") || "";
    setEmail(storedEmail);
    // Check if OTP is expired on mount
    const remaining = getRemainingTime();
    if (remaining <= 0) {
      setIsExpired(true);
      setTimeLeft(0);
    } else {
      setIsExpired(false);
      setTimeLeft(remaining);
      if (!localStorage.getItem(OTP_EXP_KEY)) {
        const newExp = Date.now() + OTP_TIMEOUT * 1000;
        localStorage.setItem(OTP_EXP_KEY, newExp.toString());
        setTimeLeft(OTP_TIMEOUT);
      }
    }
    setHasMounted(true);
  }, []);

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
        document.getElementById(`otp-teacher-${index + 1}`).focus();
      }
    }
  };

  const handleSubmit = (e) => {
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
    // For now, just simulate success
    setIsCorrectOtp(true);
    toast.success("OTP verified! Password changed.");
    setTimeout(() => router.push("/TeacherSection/Dashboard"), 1500);
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setIsIncorrectOtp(false);
    setIsCorrectOtp(false);
    setResendLoading(true);
    setTimeout(() => {
      const newExp = Date.now() + OTP_TIMEOUT * 1000;
      localStorage.setItem(OTP_EXP_KEY, newExp.toString());
      setTimeLeft(OTP_TIMEOUT);
      setIsExpired(false);
      setResendLoading(false);
      toast.success("A new OTP has been sent to your email.");
    }, 1000);
  };

  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <ProtectedRoute role="Teacher">
    <div>
      <Topbar title="Change Password" onBack={() => router.back()} />
      <div>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-form-appear"
        >
          <button
            type="button"
            onClick={() => router.back()}
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
          <div className="flex justify-center gap-3 mb-4">
            {otp.map((value, index) => (
              <input
                key={index}
                id={`otp-teacher-${index}`}
                type="text"
                maxLength={1}
                value={value}
                onChange={(e) => handleChange(index, e.target.value)}
                className="w-12 h-14 text-center border border-gray-300 rounded-lg text-lg bg-[#f3f9ff] shadow-md focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            ))}
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className={isExpired ? "text-red-600 font-semibold" : "text-gray-600"}>
              {isExpired ? "OTP Expired" : `Time remaining: ${hasMounted ? formatTime(timeLeft) : ""}`}
            </span>
            <FaCheckCircle className={
              isCorrectOtp ? "text-green-500" :
              isIncorrectOtp ? "text-red-500" : 
              "text-gray-400"
            } />
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
