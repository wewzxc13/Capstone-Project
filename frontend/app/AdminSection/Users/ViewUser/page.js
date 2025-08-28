"use client";

import React, { useState, useRef } from "react";
import { FaUser, FaPhone, FaEnvelope, FaArrowLeft } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "../../../Context/ProtectedRoute";

const mockUsers = {
  Admin: {
    user_firstname: "Snow",
    user_middlename: "B.",
    user_lastname: "Admin",
    user_contact_no: "+63 234 567 8902",
    user_email: "snow.admin@example.com",
    role: "Admin",
    user_birthdate: "1990-01-01",
    tin_number: "123-456-789-000",
    sss_number: "34-5678901-2",
    pagibig_number: "1234-5678-9012",
    barangay: "Barangay 1",
    city: "Cagayan de Oro",
    province: "Misamis Oriental",
    country: "Philippines"
  },
  Teacher: {
    user_firstname: "Christine",
    user_middlename: "",
    user_lastname: "Bacsarsa",
    user_contact_no: "+63 234 567 8901",
    user_email: "christine.bacsarsa@example.com",
    role: "Teacher",
    user_birthdate: "1990-05-15",
    tin_number: "123-456-789-000",
    sss_number: "34-5678901-2",
    pagibig_number: "1234-5678-9012",
    barangay: "Barangay 2",
    city: "Cagayan de Oro",
    province: "Misamis Oriental",
    country: "Philippines",
    class: "Age 2"
  },
  Parent: {
    user_firstname: "Kristopher",
    user_middlename: "",
    user_lastname: "Dichos",
    user_contact_no: "63+ 123-456-7890",
    user_email: "kristopher.dichos@example.com",
    role: "Parent",
    user_birthdate: "1980-03-10",
    barangay: "Barangay 3",
    city: "Cagayan de Oro",
    province: "Misamis Oriental",
    country: "Philippines"
  },
  Student: {
    user_firstname: "Christian Ejay",
    user_middlename: "",
    user_lastname: "Clarino",
    user_contact_no: "63+ 123-456-7890",
    user_email: "christian.clarino@example.com",
    role: "Student",
    user_birthdate: "2015-01-15",
    gender: "Male",
    handedness: "Right Handed",
    mother_name: "Maria Clarino",
    mother_contact: "63+ 987-654-3210",
    father_name: "Kristopher Dichos",
    father_contact: "63+ 123-456-7890",
    class_schedule: "Morning"
  }
};

export default function ViewUserPage({ formData: initialFormData }) {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "Teacher";
  const [formData, setFormData] = useState(initialFormData || mockUsers[role]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const handleBack = () => {
    router.push("/AdminSection/Users");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsEditing(false);
    // Save logic here (UI only)
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this user?")) {
      // Delete logic here (UI only)
      router.push("/AdminSection/Users");
    }
  };

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
            <span className="text-sm font-medium">Back to Users</span>
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
                  <div className="text-2xl font-bold text-[#1E2A79]">{formData.user_firstname} {formData.user_middlename} {formData.user_lastname}</div>
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

              {/* Address Fields for All Roles except Student */}
              {formData.role !== "Student" && (
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
              )}

              {/* Address for Parent only */}
              {formData.role === "Parent" && (
                <div>
                  <label className="block font-semibold text-[#2c2f6f] mb-1">Address</label>
                  {isEditing ? (
                    <input
                      name="user_address"
                      type="text"
                      value={formData.user_address || ""}
                      onChange={handleChange}
                      className="border w-full p-2 rounded"
                    />
                  ) : (
                    <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                      {formData.user_address || 'Not specified'}
                    </div>
                  )}
                </div>
              )}

              {/* Government IDs for Teacher/Admin only */}
              {(formData.role === "Teacher" || formData.role === "Admin") && (
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
              )}

              {/* Class Selection for Teacher */}
              {formData.role === "Teacher" && (
                <div>
                  <label className="block font-semibold text-[#2c2f6f] mb-1">
                    Assigned Class
                  </label>
                  {isEditing ? (
                    <select
                      name="class"
                      value={formData.class || ""}
                      onChange={handleChange}
                      className="border w-full p-2 rounded"
                    >
                      <option value="">Select Class</option>
                      <option value="Age 2">Age 2</option>
                      <option value="Age 3">Age 3</option>
                      <option value="Age 4">Age 4</option>
                    </select>
                  ) : (
                    <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                      {formData.class || 'Not assigned'}
                    </div>
                  )}
                </div>
              )}

              {/* Parent Details for Student only */}
              {/* {formData.role === "Student" && (
                // <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                //   <div>
                //     <label className="block font-semibold text-[#2c2f6f] mb-1">Mother's Name</label>
                //     {isEditing ? (
                //       <input
                //         name="mother_name"
                //         type="text"
                //         value={formData.mother_name || ""}
                //         onChange={handleChange}
                //         className="border w-full p-2 rounded"
                //       />
                //     ) : (
                //       <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                //         {formData.mother_name || 'Not specified'}
                //       </div>
                //     )}
                //   </div>
                //   <div>
                //     <label className="block font-semibold text-[#2c2f6f] mb-1">Mother's Age</label>
                //     {isEditing ? (
                //       <input
                //         name="mother_age"
                //         type="text"
                //         value={formData.mother_age || ""}
                //         onChange={handleChange}
                //         className="border w-full p-2 rounded"
                //       />
                //     ) : (
                //       <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                //         {formData.mother_age || 'Not specified'}
                //       </div>
                //     )}
                //   </div>
                //   <div>
                //     <label className="block font-semibold text-[#2c2f6f] mb-1">Mother's Occupation</label>
                //     {isEditing ? (
                //       <input
                //         name="mother_occupation"
                //         type="text"
                //         value={formData.mother_occupation || ""}
                //         onChange={handleChange}
                //         className="border w-full p-2 rounded"
                //       />
                //     ) : (
                //       <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                //         {formData.mother_occupation || 'Not specified'}
                //       </div>
                //     )}
                //   </div>
                //   <div>
                //     <label className="block font-semibold text-[#2c2f6f] mb-1">Father's Name</label>
                //     {isEditing ? (
                //       <input
                //         name="father_name"
                //         type="text"
                //         value={formData.father_name || ""}
                //         onChange={handleChange}
                //         className="border w-full p-2 rounded"
                //       />
                //     ) : (
                //       <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                //         {formData.father_name || 'Not specified'}
                //       </div>
                //     )}
                //   </div>
                //   <div>
                //     <label className="block font-semibold text-[#2c2f6f] mb-1">Father's Age</label>
                //     {isEditing ? (
                //       <input
                //         name="father_age"
                //         type="text"
                //         value={formData.father_age || ""}
                //         onChange={handleChange}
                //         className="border w-full p-2 rounded"
                //       />
                //     ) : (
                //       <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                //         {formData.father_age || 'Not specified'}
                //       </div>
                //     )}
                //   </div>
                //   <div>
                //     <label className="block font-semibold text-[#2c2f6f] mb-1">Father's Occupation</label>
                //     {isEditing ? (
                //       <input
                //         name="father_occupation"
                //         type="text"
                //         value={formData.father_occupation || ""}
                //         onChange={handleChange}
                //         className="border w-full p-2 rounded"
                //       />
                //     ) : (
                //       <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                //         {formData.father_occupation || 'Not specified'}
                //       </div>
                //     )}
                //   </div>
                // </div>
              )} */}

              {/* Class Schedule Selection for Student */}
              {formData.role === "Student" && (
                <div>
                  <label className="block font-semibold text-[#2c2f6f] mb-1">
                    Class Schedule
                  </label>
                  {isEditing ? (
                    <select
                      name="class_schedule"
                      value={formData.class_schedule || ""}
                      onChange={handleChange}
                      className="border w-full p-2 rounded"
                    >
                      <option value="">Select Class Schedule</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                    </select>
                  ) : (
                    <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                      {formData.class_schedule || 'Not assigned'}
                    </div>
                  )}
                </div>
              )}

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
              {isEditing && (
                <button 
                  onClick={handleSave}
                  className="px-6 py-2 bg-[#2c2f6f] text-white rounded-full text-sm font-medium hover:bg-[#1E2A79]"
                >
                  Save Changes
                </button>
              )}
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700"
                >
                  Edit User
                </button>
              )}
              <button
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
