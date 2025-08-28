"use client";

import { useState } from "react";
import { FaArrowLeft, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import ProtectedRoute from "../../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";

export default function LinkedStudentPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const router = useRouter();

  // Mock parent data - in real app this would come from props or API
  const parent = {
    name: "Kristopher Dichos",
    email: "kristopher.dichos@example.com",
    contact: "63+ 123-456-7890",
    address: "Cagayan de Oro City, Philippines",
    children: [
      {
        name: "Christian Ejay Clarino",
        age: 2,
        gender: "Male",
        class: "Class 1",
        status: "Active"
      },
      {
        name: "Maria Clarino",
        age: 4,
        gender: "Female", 
        class: "Class 2",
        status: "Active"
      }
    ]
  };

  // Mock students for modal
  const students = [
    "Christian Ejay Clarino",
    "Clyde Parol",
    "Andrea Plamos",
    "Margareth Manongdo",
    "Rudgel Togoan",
    "Christian Clarino"
  ];

  const filteredStudents = students.filter(s => s.toLowerCase().includes(search.toLowerCase()));

  const handleBack = () => {
    router.push("/AdminSection/Users");
  };

  return (
    <ProtectedRoute role="Admin">
      <div className="flex flex-col md:flex-row bg-[#f0f6ff] min-h-screen">
        <main className="flex-1 p-2 sm:p-4 md:p-6">
          <div className="bg-white rounded-xl shadow p-0 overflow-hidden">
            {/* Parent Info Section */}
            <div className="bg-[#253B80] p-6 rounded-t-xl text-white flex flex-row w-full">
              <div className="w-[15%] flex items-start justify-start">
                <div className="w-14 h-14 bg-blue-200 rounded-full flex items-center justify-center">
                  <FaUser className="text-2xl text-blue-900" />
                </div>
              </div>
              <div className="flex flex-col justify-center items-start w-[30%]">
                <h2 className="font-bold text-lg leading-tight break-words text-left">{parent.name}</h2>
                <p className="text-blue-200 text-sm">Parent</p>
              </div>
              <div className="flex flex-col justify-center w-[25%]">
                <div className="flex flex-row items-center gap-2 mb-1">
                  <FaEnvelope className="text-blue-200" />
                  <span className="text-sm">{parent.email}</span>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <FaPhone className="text-blue-200" />
                  <span className="text-sm">{parent.contact}</span>
                </div>
              </div>
              <div className="flex flex-col justify-center w-[30%]">
                <div className="flex flex-row items-center gap-2">
                  <FaMapMarkerAlt className="text-blue-200" />
                  <span className="text-sm">{parent.address}</span>
                </div>
              </div>
            </div>
            {/* Link to Student Button */}
            <div className="flex justify-end px-8 pt-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#253B80] text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors text-sm"
              >
                Link to Student
              </button>
            </div>
            {/* Children Section */}
            <div className="bg-white px-8 pt-4 pb-6">
              <h3 className="text-lg font-semibold text-[#2c2f6f] mb-4">Children</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parent.children.map((child, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaUser className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#2c2f6f]">{child.name}</h4>
                        <p className="text-sm text-gray-600">Class {child.class}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Age:</span>
                        <span className="ml-1 font-medium">{child.age}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Gender:</span>
                        <span className="ml-1 font-medium">{child.gender}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Status:</span>
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          child.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {child.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Modal for Link to Student */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-auto relative">
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-bold text-[#253B80] mx-auto">Link to</h2>
                    <button
                      className="absolute right-4 top-4 text-2xl text-gray-400 hover:text-gray-700"
                      onClick={() => setIsModalOpen(false)}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="px-6 pt-4 pb-2">
                    <div className="relative mb-4">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 text-base" />
                      <input
                        type="text"
                        placeholder="Search here.."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-full bg-blue-100 placeholder-gray-500 text-sm outline-none"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y">
                      {filteredStudents.map((student, idx) => (
                        <div
                          key={student}
                          className={`flex items-center gap-3 py-3 cursor-pointer ${selectedStudent === student ? 'bg-blue-50' : ''}`}
                          onClick={() => setSelectedStudent(student)}
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaUser className="text-blue-400 text-lg" />
                          </div>
                          <span className="text-sm text-gray-700">{student}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <button
                      className="w-full py-2 rounded-full bg-[#253B80] text-white font-semibold text-base mt-2 disabled:opacity-50"
                      disabled={!selectedStudent}
                      onClick={() => setIsModalOpen(false)}
                    >
                      Link
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Back Button */}
            <div className="mt-6 flex justify-center pb-6">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 bg-[#253B80] text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
              >
                <FaArrowLeft className="text-xs" />
                Back
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
