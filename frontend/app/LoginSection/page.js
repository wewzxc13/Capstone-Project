"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "./Forms/loginform";
import { ToastContainer } from "react-toastify";


export default function LoginSection() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full relative overflow-hidden">
      {/* Left Side - Logo and Info Section (hidden on mobile) */}
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
      {/* Logo and address for mobile */}
      <div className="md:hidden w-full flex flex-col items-center pt-2 pb-0 bg-transparent z-20">
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
      {/* Right Side - Login Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-blue-200 relative min-h-[55vh] md:min-h-0">
        <div className="bg-white p-2 md:p-10 rounded-2xl shadow-xl w-[98%] md:w-[500px] max-w-full mx-1 md:mx-4 animate-form-appear mt-1 md:mt-0">
          <LoginForm setIsSignup={setIsSignup} />
        </div>
      </div>
      <ToastContainer
        containerId="login"
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
        style={{ zIndex: 99999 }}
      />
    </div>
  );
}

// Add keyframe animations
const styles = `
  @keyframes formAppear {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes logoFloat {
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

  .animate-form-appear {
    animation: formAppear 0.6s ease-out forwards;
  }

  .animate-logo-float {
    animation: logoFloat 3s ease-in-out infinite;
  }

  .blob-green {
    width: 440px;
    height: 200px;
    background: #b6e59e;
    border-bottom-right-radius: 320px 140px;
    border-top-left-radius: 220px 120px;
    left: -80px;
    top: -60px;
    z-index: 1;
    filter: blur(2px);
    opacity: 0.95;
    transform: scale(0.8);
  }

  .blob-blue {
    width: 950px;
    height: 200px;
    background: #62dadf;
    border-bottom-left-radius: 420px 140px;
    border-top-right-radius: 340px 120px;
    left: -140px;
    top: -80px;
    z-index: 2;
    transform: rotate(-7deg);
    filter: blur(1.5px);
    opacity: 0.92;
  }

  .blob-blue-circle {
    width: 300px;
    height: 300px;
    background: #62b0df;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.38;
    right: -100px;
    top: 100px;
    z-index: 3;
  }

  .blob-white {
    width: 170px;
    height: 170px;
    background: #fff;
    border-radius: 50%;
    filter: blur(50px);
    opacity: 0.45;
    left: 360px;
    bottom: 60px;
    z-index: 3;
  }

  @media (max-width: 768px) {
    .animate-logo-float {
      animation: logoFloat 2.5s ease-in-out infinite;
    }

    .blob-green {
      transform: scale(0.5);
    }

    .blob-blue {
      transform: rotate(-7deg) scale(0.5);
    }

    .blob-blue-circle {
      transform: scale(0.5);
    }

    .blob-white {
      transform: scale(0.5);
      left: 180px;
    }
  }
`;

// Add style tag to document
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export const checkAuth = () => {
  if (typeof window !== "undefined") {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const userRole = localStorage.getItem("userRole");
    return { isAuthenticated, userRole };
  }
  return { isAuthenticated: false, userRole: null };
};

export const clearAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.clear();
  }
};
