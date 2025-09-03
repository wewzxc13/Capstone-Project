"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for authentication status and role
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedRole = localStorage.getItem("userRole");
    const storedUserId = localStorage.getItem("userId");

    console.log('AuthContext: Initializing with localStorage data:', {
      storedAuth,
      storedRole,
      storedUserId
    });

    // Only set as authenticated if we have all required data
    const hasValidAuth = storedAuth === "true" && storedRole && storedUserId;
    
    console.log('AuthContext: Setting authentication state:', {
      hasValidAuth,
      role: storedRole
    });
    
    setIsAuthenticated(hasValidAuth);
    setRole(storedRole);
    setLoading(false);
  }, []);

  // Login function
  const login = (userData, userRole) => {
    console.log('AuthContext: Login called with:', { userData, userRole });
    setIsAuthenticated(true);
    setRole(userRole);

    // Store in localStorage for persistence
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userRole", userRole);
    
    // Also store userId if provided
    if (userData && userData.id) {
      localStorage.setItem("userId", userData.id);
    }

    // Optionally persist commonly used fields if provided
    if (userData && userData.email) {
      localStorage.setItem("userEmail", userData.email);
    }
    if (userData && (userData.fullName || userData.user_fullname)) {
      localStorage.setItem("userFullName", userData.fullName || userData.user_fullname);
    }

    // Notify the app that the authenticated user changed
    try {
      window.dispatchEvent(
        new CustomEvent('userChanged', {
          detail: {
            userId: userData ? userData.id : null,
            role: userRole,
          },
        })
      );
    } catch (err) {
      // no-op
    }

    return true;
  };

  // Logout function
  const logout = async () => {
    try {
      // Log logout to system logs before clearing localStorage
      const userId = localStorage.getItem("userId");
      if (userId) {
        // Set a flag to prevent other logout events from firing
        localStorage.setItem("logoutLogged", "true");
        
        await fetch("/php/Logs/create_system_log.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            action: "Logout"
          })
        });
      }
    } catch (error) {
      console.error("Failed to log logout:", error);
      // Continue with logout even if logging fails
    }

    setIsAuthenticated(false);
    setRole(null);

    // Clear localStorage
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userFullName");

    // Notify the app that the authenticated user changed (logged out)
    try {
      window.dispatchEvent(new CustomEvent('userChanged', { detail: { userId: null, role: null } }));
    } catch (err) {
      // no-op
    }
  };

  // Register function
  const register = async (userData) => {
    // In a real app, you would send this data to your backend
    console.log("Registering user:", userData);

    // For demo purposes, automatically log in as a parent after registration
    login(userData, "parent");
    return true;
  };

  // Function to check if user has all required authentication data
  const checkAuthStatus = () => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedRole = localStorage.getItem("userRole");
    const storedUserId = localStorage.getItem("userId");
    
    const hasValidAuth = storedAuth === "true" && storedRole && storedUserId;
    console.log("AuthContext: Checking auth status:", {
      storedAuth,
      storedRole,
      storedUserId,
      hasValidAuth
    });
    
    return hasValidAuth;
  };

  const value = {
    isAuthenticated,
    role,
    login,
    logout,
    register,
    loading,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
