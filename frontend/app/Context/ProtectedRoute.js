"use client";
import { useAuth } from "../Context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ProtectedRoute = ({ role, children }) => {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    const expectedRole = String(role || '').trim().toLowerCase();
    // Fall back to localStorage to avoid race conditions after auth updates
    const lsRole = typeof window !== 'undefined' ? String(localStorage.getItem('userRole') || '').trim().toLowerCase() : '';
    const actualRole = String(auth.role || lsRole || '').trim().toLowerCase();
    const lsAuth = typeof window !== 'undefined' ? localStorage.getItem('isAuthenticated') === 'true' && !!localStorage.getItem('userId') : false;
    const isAuthed = Boolean(auth.isAuthenticated || lsAuth);

    if (!auth.loading && (!isAuthed || (expectedRole && actualRole !== expectedRole))) {
      router.push("/LoginSection");
    }
  }, [auth.isAuthenticated, auth.role, role, router, auth.loading]);

  // Show nothing while checking authentication
  if (auth.loading) {
    return null;
  }
  const lsAuth = typeof window !== 'undefined' ? localStorage.getItem('isAuthenticated') === 'true' && !!localStorage.getItem('userId') : false;
  if (!(auth.isAuthenticated || lsAuth)) {
    return null;
  }
  const actualRole = String(auth.role || (typeof window !== 'undefined' ? localStorage.getItem('userRole') : '') || '').trim().toLowerCase();
  const expectedRole = String(role || '').trim().toLowerCase();
  if (expectedRole && actualRole !== expectedRole) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
