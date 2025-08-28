// "use client";
// import { useState, useEffect } from "react";
// import LoginForm from "./LoginSection/page";
// import AdminDashboard from "./AdminDashboard/page";
// import ParentDashboard from "./ParentDashboard/page";
// import TeacherDashboard from "./TeacherDashboard/page";
// import { useRouter } from "next/navigation";

// export default function Home() {
//   const [page, setPage] = useState("login"); // Default to login page
//   const [isLoading, setIsLoading] = useState(true);
//   const router = useRouter();

//   // Define checkAuthentication outside useEffect so it can be passed as a prop
//   const checkAuthentication = () => {
//     const isAuthenticated = localStorage.getItem("isAuthenticated");
//     const userRole = localStorage.getItem("userRole");
//     if (!isAuthenticated || !userRole) {
//       setPage("login"); // Redirect to login if not authenticated
//       // Clear any stale auth data
//       localStorage.removeItem("isAuthenticated");
//       localStorage.removeItem("userRole");
//     } else {
//       switch (userRole) {
//         case "Admin":
//           setPage("AdminDashboard");
//           break;
//         case "Parent":
//           setPage("ParentDashboard");
//           break;
//         case "Teacher":
//           setPage("TeacherDashboard");
//           break;
//         default:
//           setPage("login"); // Default to login if role is unrecognized
//           // Clear invalid auth data
//           localStorage.removeItem("isAuthenticated");
//           localStorage.removeItem("userRole");
//       }
//     }
//     setIsLoading(false);
//   };

//   useEffect(() => {
//     const loadPageFromHash = () => {
//       const hash = window.location.hash.replace("/", ""); // Strip #/
//       if (hash) {
//         setPage(hash);
//       } else {
//         checkAuthentication();
//       }
//       setIsLoading(false);
//     };

//     // On load, check authentication first
//     checkAuthentication();

//     // Listen to hash changes and update page
//     window.addEventListener("hashchange", loadPageFromHash);

//     // Always redirect to login page when accessing root
//     router.push("/LoginSection");

//     return () => {
//       window.removeEventListener("hashchange", loadPageFromHash);
//     };
//   }, [router]);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         Loading...
//       </div>
//     );
//   }

//   if (page === "AdminDashboard") {
//     return <AdminDashboard />;
//   }
//   if (page === "ParentDashboard") {
//     return <ParentDashboard />;
//   }
//   if (page === "TeacherDashboard") {
//     return <TeacherDashboard />;
//   }

//   return <LoginForm onSuccessfulLogin={checkAuthentication} />;
// }
