"use client";
import React, { useState } from "react";
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaSearch, FaArrowLeft, FaSave, FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";

const mockTeacher = {
  user_firstname: "Christine",
  user_middlename: "",
  user_lastname: "Bacsarsa",
  user_address: "Cagayan de Oro City, Philippines",
  user_contact_no: "+63 234 567 8901",
  user_email: "christine.bacsarsa@example.com",
  role: "Teacher"
};

export default function AssignedClassPage({ formData }) {
  const router = useRouter();
  formData = formData || mockTeacher;
  const [editData, setEditData] = useState({ ...formData });
  const [isEditing, setIsEditing] = useState(false);

  // Mock data for parents and students
  const parents = [
    { name: "Xena Doble" },
    { name: "Andrea Plamos" },
    { name: "Quennielyn Galarpe" },
    { name: "Jessa Decena" },
    { name: "Armie Timbal" },
    { name: "Pia Balibagon" },
  ];
  const students = [
    { name: "Xena Doble", class: "Class 1" },
    { name: "Andrea Plamos", class: "Class 1" },
    { name: "Quennielyn Galarpe", class: "Class 1" },
    { name: "Jessa Decena", class: "Class 1" },
    { name: "Armie Timbal", class: "Class 1" },
    { name: "Pia Balibagon", class: "Class 1" },
    { name: "Jessa Decena", class: "Class 1" },
  ];
  const [parentSearch, setParentSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setIsEditing(false);
    alert("Changes saved (mock)");
  };

  const handleDelete = () => {
    alert("Teacher deleted (mock)");
    router.push("/AdminSection/Users");
  };

  return (
    <div className="flex flex-col md:flex-row bg-[#f0f6ff] min-h-screen">
      <main className="flex-1 p-2 sm:p-4 md:p-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/AdminSection/Users")}
          className="flex items-center gap-2 text-[#2c2f6f] hover:text-[#1E2A79] mb-4"
        >
          <FaArrowLeft />
          <span className="text-sm font-medium">Back to Users</span>
        </button>
        {/* Profile Card with Editable Fields */}
        <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-6 mb-8">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-[#b3e5fc] flex items-center justify-center text-white text-5xl shadow-md border-4 border-white">
              <FaUser className="text-[#1E2A79]" />
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
              <div>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      name="user_firstname"
                      value={editData.user_firstname}
                      onChange={handleChange}
                      className="text-xl font-bold text-[#1E2A79] bg-gray-100 rounded px-2 py-1 mb-1"
                      placeholder="First Name"
                    />
                    <input
                      name="user_middlename"
                      value={editData.user_middlename}
                      onChange={handleChange}
                      className="text-xl font-bold text-[#1E2A79] bg-gray-100 rounded px-2 py-1 mb-1"
                      placeholder="Middle Name"
                    />
                    <input
                      name="user_lastname"
                      value={editData.user_lastname}
                      onChange={handleChange}
                      className="text-xl font-bold text-[#1E2A79] bg-gray-100 rounded px-2 py-1 mb-1"
                      placeholder="Last Name"
                    />
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-[#1E2A79]">
                    {editData.user_firstname} {editData.user_middlename} {editData.user_lastname}
                  </div>
                )}
                <div className="text-[#6b7280] font-medium">Teacher</div>
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <FaMapMarkerAlt className="text-[#2c2f6f]" />
                  {isEditing ? (
                    <input
                      name="user_address"
                      value={editData.user_address}
                      onChange={handleChange}
                      className="bg-gray-100 rounded px-2 py-1"
                      placeholder="Address"
                    />
                  ) : (
                    <span>{editData.user_address}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-4 md:mt-0">
                <div className="flex items-center gap-2 text-gray-600">
                  <FaPhone className="text-[#2c2f6f]" />
                  {isEditing ? (
                    <input
                      name="user_contact_no"
                      value={editData.user_contact_no}
                      onChange={handleChange}
                      className="bg-gray-100 rounded px-2 py-1"
                      placeholder="Contact Number"
                    />
                  ) : (
                    <span className="font-bold">{editData.user_contact_no}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FaEnvelope className="text-[#2c2f6f]" />
                  {isEditing ? (
                    <input
                      name="user_email"
                      value={editData.user_email}
                      onChange={handleChange}
                      className="bg-gray-100 rounded px-2 py-1"
                      placeholder="Email"
                    />
                  ) : (
                    <span>{editData.user_email}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Class Label Card */}
        <div className="w-full max-w-3xl mx-auto mb-4">
          <div className="w-full bg-white border border-gray-200 rounded-xl shadow p-4 flex items-center justify-center text-lg font-bold text-[#2c2f6f]">
            Class 1
          </div>
        </div>
        {/* Parents & Students Lists */}
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl mx-auto">
          {/* Parents Card */}
          <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col min-h-[350px] max-h-[500px]">
            <div className="font-semibold text-lg text-[#2c2f6f] mb-2">Parents</div>
            <div className="mb-2 flex items-center bg-[#f0f6ff] rounded-full px-3 py-2">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                value={parentSearch}
                onChange={e => setParentSearch(e.target.value)}
                placeholder="Search here..."
                className="bg-transparent outline-none flex-1 text-sm"
              />
            </div>
            <div className="overflow-y-auto flex-1 pr-1" style={{ maxHeight: 350 }}>
              {parents.filter(p => p.name.toLowerCase().includes(parentSearch.toLowerCase())).map((parent, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-[#f0f6ff] cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-[#b3e5fc] flex items-center justify-center text-white text-lg">
                    <FaUser className="text-[#1E2A79]" />
                  </div>
                  <span className="font-medium text-gray-700">{parent.name}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Students Card */}
          <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col min-h-[350px] max-h-[500px]">
            <div className="font-semibold text-lg text-[#2c2f6f] mb-2">Students</div>
            <div className="mb-2 flex items-center bg-[#f0f6ff] rounded-full px-3 py-2">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Search here..."
                className="bg-transparent outline-none flex-1 text-sm"
              />
            </div>
            <div className="overflow-y-auto flex-1 pr-1" style={{ maxHeight: 350 }}>
              {students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map((student, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-[#f0f6ff] cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-[#b3e5fc] flex items-center justify-center text-white text-lg">
                    <FaUser className="text-[#1E2A79]" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">{student.name}</div>
                    <div className="text-xs text-gray-400">{student.class}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
