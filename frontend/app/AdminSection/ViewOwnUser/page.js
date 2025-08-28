"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaUser, FaPhone, FaEnvelope, FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../Context/ProtectedRoute";


export default function ViewOwnUserPage() {
  const [formData, setFormData] = useState({
    user_firstname: "",
    user_middlename: "",
    user_lastname: "",
    user_contact_no: "",
    user_email: "",
    role: "Admin",
    user_birthdate: "",
    tin_number: "",
    sss_number: "",
    pagibig_number: "",
    barangay: "",
    city: "",
    province: "",
    country: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        router.push("/LoginSection");
        return;
      }

      try {
        const response = await fetch('http://localhost/capstone-project/backend/Users/get_user_details.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });

        const data = await response.json();
        console.log("API Response:", data); // Debug log
        
        if (data.status === "success") {
          const userData = {
            user_firstname: data.user.firstName || "",
            user_middlename: data.user.middleName || "",
            user_lastname: data.user.lastName || "",
            user_contact_no: data.user.contactNo || "",
            user_email: data.user.email || "",
            user_birthdate: data.user.user_birthdate || "",
            role: data.user.role || "Admin",
            tin_number: data.user.tin_number || "",
            sss_number: data.user.sss_number || "",
            pagibig_number: data.user.pagibig_number || "",
            barangay: data.user.barangay || "",
            city: data.user.city || "",
            province: data.user.province || "",
            country: data.user.country || ""
          };
          
          console.log("Processed User Data:", userData); // Debug log
          setFormData(userData);
        } else {
          console.error("Failed to fetch user details:", data.message);
          alert("Failed to load user profile. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        alert("Error loading user profile. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [router]);

  const handleBack = () => {
    router.push("/AdminSection/Dashboard");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await fetch('http://localhost/capstone-project/backend/Users/update_user.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId,
          ...formData 
        }),
      });

      const data = await response.json();
      if (data.status === "success") {
        setShowToast(true);
        setIsEditing(false);
        // System log and notification for self-update
        const action = `Edited their own details.`;
        const notif_message = `Edited successfully their details.`;
        fetch("http://localhost/capstone-project/backend/Logs/create_system_log.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            action,
            notif_message,
            created_by: userId,
          }),
        });
        setTimeout(() => setShowToast(false), 3000);
      } else {
        alert("Failed to update profile: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload user data to reset any changes
    window.location.reload();
  };

  if (isLoading) {
    return (
      <ProtectedRoute role="Admin">
        <div className="flex bg-[#eef5ff] min-h-screen">
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading...</div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute role="Admin">
      <div className="flex flex-col md:flex-row bg-[#f0f6ff] min-h-screen">
        <main className="flex-1 p-2 sm:p-4 md:p-6">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[#2c2f6f] hover:text-[#1E2A79] mb-4"
          >
            <FaArrowLeft />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          {/* Profile Card */}
          <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-6 mb-8">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-[#b3e5fc] flex items-center justify-center text-white text-5xl shadow-md border-4 border-white">
                <FaUser className="text-[#1E2A79]" />
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                <div>
                  <div className="text-2xl font-bold text-[#1E2A79]">
                    {formData.user_firstname} {formData.user_middlename} {formData.user_lastname}
                  </div>
                  <div className="text-[#6b7280] font-medium">{formData.role}</div>
                </div>
                <div className="flex flex-col gap-2 mt-4 md:mt-0">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaPhone className="text-[#2c2f6f]" />
                    <span className="font-bold">{formData.user_contact_no}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaEnvelope className="text-[#2c2f6f]" />
                    <span>{formData.user_email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Editable Form */}
          <div className="bg-white p-4 sm:p-8 rounded shadow-lg border mt-2 max-w-3xl mx-auto">
            <form className="space-y-6 text-sm">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[ 
                  { name: "user_firstname", label: "First Name", required: true },
                  { name: "user_middlename", label: "Middle Name", required: false },
                  { name: "user_lastname", label: "Last Name", required: true },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="block font-semibold text-[#2c2f6f] mb-1">
                      {field.label}
                    </label>
                    {isEditing ? (
                      <input 
                        name={field.name}
                        type={field.type || "text"}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        required={field.required}
                        className="border w-full p-2 rounded"
                      />
                    ) : (
                      <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                        {formData[field.name] || 'Not specified'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[ 
                  { name: "user_birthdate", label: "Date of Birth", type: "date", required: true },
                  { name: "user_email", label: "Email Address", type: "email", required: true },
                  { name: "user_contact_no", label: "Contact Number", type: "text", required: true },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="block font-semibold text-[#2c2f6f] mb-1">
                      {field.label}
                    </label>
                    {isEditing ? (
                      <input 
                        name={field.name}
                        type={field.type || "text"}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        required={field.required}
                        className="border w-full p-2 rounded"
                      />
                    ) : (
                      <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                        {formData[field.name] || 'Not specified'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[ 
                  { name: "barangay", label: "Barangay" },
                  { name: "city", label: "City" },
                  { name: "province", label: "Province" },
                  { name: "country", label: "Country" },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="block font-semibold text-[#2c2f6f] mb-1">{field.label}</label>
                    {isEditing ? (
                      <input
                        name={field.name}
                        type="text"
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        className="border w-full p-2 rounded"
                      />
                    ) : (
                      <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                        {formData[field.name] || 'Not specified'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Government IDs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[ 
                  { name: "tin_number", label: "TIN", required: true },
                  { name: "sss_number", label: "SSS", required: true },
                  { name: "pagibig_number", label: "Pag-ibig", required: true },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="block font-semibold text-[#2c2f6f] mb-1">
                      {field.label}
                    </label>
                    {isEditing ? (
                      <input 
                        name={field.name}
                        type={field.type || "text"}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        required={field.required}
                        className="border w-full p-2 rounded"
                      />
                    ) : (
                      <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                        {formData[field.name] || 'Not specified'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block font-semibold text-[#2c2f6f] mb-1">Photo</label>
                <div 
                  className="border-dashed border-2 border-gray-300 rounded p-4 text-center text-xs text-gray-500 h-[80px] flex justify-center items-center cursor-pointer hover:border-gray-400"
                  onClick={() => isEditing && fileInputRef.current?.click()}
                >
                  {selectedPhoto ? selectedPhoto.name : 'No photo uploaded'}
                </div>
                {isEditing && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setSelectedPhoto(e.target.files[0])}
                  />
                )}
              </div>
            </form>
            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={handleBack}
                type="button"
                className="px-6 py-2 border border-[#2c2f6f] text-[#2c2f6f] rounded-full text-sm font-medium hover:bg-[#2c2f6f] hover:text-white"
              >
                Back
              </button>
              {isEditing ? (
                <>
                  <button 
                    onClick={handleCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-[#2c2f6f] text-white rounded-full text-sm font-medium hover:bg-[#1E2A79]"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
          <Toast message="Profile updated successfully!" show={showToast} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
