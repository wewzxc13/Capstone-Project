"use client";

import { useState, useRef } from "react";
import { FaUser, FaArrowLeft, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import ProtectedRoute from "../../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";

const userTypes = ["Teacher", "Parent", "Student"];

function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export default function AddUserPage() {
  const [userType, setUserType] = useState("");
  const [formData, setFormData] = useState({
    enrollment_date: getTodayDateString(),
  });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);
  const router = useRouter();

  const handleBack = () => {
    router.push("/AdminSection/Users");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
  
    // Client-side validation
    const isStudent = userType === "Student";
    
    if (isStudent) {
      // Validate required student fields
      if (!formData.first_name || !formData.last_name || !formData.dob || !formData.gender || !formData.class_schedule) {
        setErrorMessage("Please fill in all required fields for student: First Name, Last Name, Date of Birth, Gender, and Class Schedule");
        return;
      }
    } else {
      // Validate required teacher/parent fields
      if (!formData.first_name || !formData.last_name || !formData.dob || !formData.email || !formData.barangay || !formData.city || !formData.province || !formData.country) {
        setErrorMessage("Please fill in all required fields: First Name, Last Name, Date of Birth, Email, Barangay, City, Province, and Country");
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setErrorMessage("Please enter a valid email address");
        return;
      }
    }
  
    const apiURL = isStudent
      ? "http://localhost/capstone-project/backend/Users/add_student.php"
      : "http://localhost/capstone-project/backend/Users/add_user.php";
    
    // Upload photo first if selected
    let uploadedPhotoUrl = "";
    if (selectedPhoto) {
      try {
        const form = new FormData();
        form.append("photo", selectedPhoto);
        const uploadRes = await fetch("http://localhost/capstone-project/backend/Users/upload_photo.php", {
          method: "POST",
          body: form,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || uploadJson.status !== "success") {
          setErrorMessage("Photo upload failed");
          return;
        }
        uploadedPhotoUrl = uploadJson.url;
      } catch (err) {
        setErrorMessage("Photo upload error: " + err.message);
        return;
      }
    }

    let dataToSend = {
      ...formData,
      user_photo: uploadedPhotoUrl || "",
    };
  
    if (!isStudent) {
      dataToSend.user_type = userType.toLowerCase();
    } else {
      // Remap for student
      dataToSend = {
        stud_firstname: formData.first_name,
        stud_middlename: formData.middle_name,
        stud_lastname: formData.last_name,
        stud_birthdate: formData.dob,
        stud_enrollment_date: formData.enrollment_date,
        stud_handedness: formData.handedness && formData.handedness.trim() !== '' ? formData.handedness : 'Not Yet Established',
        stud_gender: formData.gender,
        stud_schedule_class: formData.class_schedule,
        stud_photo: uploadedPhotoUrl || 'default_photo.jpg',
        stud_school_status: "Active"
      };
    }
  
    try {
      const res = await fetch(apiURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });
  
      const result = await res.json();
      if (res.ok) {
        setSuccessMessage(
          isStudent
            ? `Student added successfully! Assigned Class: ${result.level_id}`
            : `User added successfully! Default password: ${result.default_password}`
        );
        setTimeout(() => router.push("/AdminSection/Users"), 3000);
      } else {
        setErrorMessage("Failed to add user: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      setErrorMessage("Error submitting user: " + error.message);
    }
  };

  const renderTeacherParentFields = (isTeacher) => (
    <>
      <div className="bg-[#2c2f6f] text-white rounded-t-lg px-6 py-2 mb-6 font-semibold text-lg">
        {isTeacher ? "Teacher Details" : "Parent Details"}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">First Name <span className="text-red-500">*</span></label>
          <input 
            name="first_name" 
            type="text" 
            value={formData.first_name || ""} 
            onChange={handleChange} 
            required 
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Middle Name</label>
          <input 
            name="middle_name" 
            type="text" 
            value={formData.middle_name || ""} 
            onChange={handleChange} 
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Last Name <span className="text-red-500">*</span></label>
          <input 
            name="last_name" 
            type="text" 
            value={formData.last_name || ""} 
            onChange={handleChange} 
            required 
            className="border w-full p-2 rounded" 
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Date of Birth <span className="text-red-500">*</span></label>
          <input 
            name="dob" 
            type="date" 
            value={formData.dob || ""} 
            onChange={handleChange} 
            required 
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Email <span className="text-red-500">*</span></label>
          <input 
            name="email" 
            type="email" 
            value={formData.email || ""} 
            onChange={handleChange} 
            required 
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Contact Number</label>
          <input 
            name="contact" 
            type="text" 
            value={formData.contact || ""} 
            onChange={handleChange} 
            className="border w-full p-2 rounded" 
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Barangay <span className="text-red-500">*</span></label>
          <input 
            name="barangay" 
            type="text" 
            value={formData.barangay || ""} 
            onChange={handleChange} 
            required
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">City <span className="text-red-500">*</span></label>
          <input 
            name="city" 
            type="text" 
            value={formData.city || ""} 
            onChange={handleChange} 
            required
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Province <span className="text-red-500">*</span></label>
          <input 
            name="province" 
            type="text" 
            value={formData.province || ""} 
            onChange={handleChange} 
            required
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Country <span className="text-red-500">*</span></label>
          <input 
            name="country" 
            type="text" 
            value={formData.country || ""} 
            onChange={handleChange} 
            required
            className="border w-full p-2 rounded" 
          />
        </div>
      </div>
      {isTeacher && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div>
            <label className="block font-semibold text-[#2c2f6f] mb-1">TIN</label>
            <input 
              name="tin" 
              type="text" 
              value={formData.tin || ""} 
              onChange={handleChange} 
              className="border w-full p-2 rounded" 
            />
          </div>
          <div>
            <label className="block font-semibold text-[#2c2f6f] mb-1">SSS</label>
            <input 
              name="sss" 
              type="text" 
              value={formData.sss || ""} 
              onChange={handleChange} 
              className="border w-full p-2 rounded" 
            />
          </div>
          <div>
            <label className="block font-semibold text-[#2c2f6f] mb-1">Pag-ibig</label>
            <input 
              name="pagibig" 
              type="text" 
              value={formData.pagibig || ""} 
              onChange={handleChange} 
              className="border w-full p-2 rounded" 
            />
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Photo</label>
          <div
            className="border-dashed border-2 border-gray-300 rounded p-2 text-center text-xs text-gray-500 h-[40px] w-[100px] flex justify-center items-center cursor-pointer hover:border-gray-400"
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedPhoto ? selectedPhoto.name : "Drop or click to select file"}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setSelectedPhoto(e.target.files[0])}
          />
        </div>
        {isTeacher && (
          <div>
            <label className="block font-semibold text-[#2c2f6f] mb-1">Select Class to Handle</label>
            <select 
              name="class_to_handle" 
              value={formData.class_to_handle || ""} 
              onChange={handleChange} 
              className="border w-full p-2 rounded"
            >
              <option value="">Select Class</option>
              <option value="Class Age 2">Class Age 2</option>
              <option value="Class Age 3">Class Age 3</option>
              <option value="Class Age 4">Class Age 4</option>
            </select>
          </div>
        )}
      </div>
    </>
  );

  const renderStudentFields = () => (
    <>
      <div className="bg-[#2c2f6f] text-white rounded-t-lg px-6 py-2 mb-6 font-semibold text-lg">Student Details </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">First Name <span className="text-red-500">*</span></label>
          <input 
            name="first_name" 
            type="text" 
            value={formData.first_name || ""} 
            onChange={handleChange} 
            required 
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Middle Name</label>
          <input 
            name="middle_name" 
            type="text" 
            value={formData.middle_name || ""} 
            onChange={handleChange} 
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Last Name <span className="text-red-500">*</span></label>
          <input 
            name="last_name" 
            type="text" 
            value={formData.last_name || ""} 
            onChange={handleChange} 
            required 
            className="border w-full p-2 rounded" 
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Gender <span className="text-red-500">*</span></label>
          <select 
            name="gender" 
            value={formData.gender || ""} 
            onChange={handleChange} 
            required 
            className="border w-full p-2 rounded"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Date of Birth <span className="text-red-500">*</span></label>
          <input 
            name="dob" 
            type="date" 
            value={formData.dob || ""} 
            onChange={handleChange} 
            required 
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Enrollment Date</label>
          <input 
            name="enrollment_date" 
            type="date" 
            value={formData.enrollment_date || getTodayDateString()} 
            onChange={handleChange} 
            className="border w-full p-2 rounded" 
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Photo</label>
          <div
            className="border-dashed border-2 border-gray-300 rounded p-2 text-center text-xs text-gray-500 h-[40px] w-[100px] flex justify-center items-center cursor-pointer hover:border-gray-400"
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedPhoto ? selectedPhoto.name : "Drop or click to select file"}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setSelectedPhoto(e.target.files[0])}
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Handedness</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="handedness"
                value="Left"
                checked={formData.handedness === "Left"}
                onChange={handleChange}
              />
              Left
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="handedness"
                value="Right"
                checked={formData.handedness === "Right"}
                onChange={handleChange}
              />
              Right
            </label>
          </div>
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Class Schedule <span className="text-red-500">*</span></label>
          <select 
            name="class_schedule" 
            value={formData.class_schedule || ""} 
            onChange={handleChange} 
            required 
            className="border w-full p-2 rounded"
          >
            <option value="">Select</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
          </select>
        </div>
      </div>
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Father's Name</label>
          <input 
            name="father_name" 
            type="text" 
            value={formData.father_name || ""} 
            onChange={handleChange} 
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Age</label>
          <input 
            name="father_age" 
            type="number" 
            value={formData.father_age || ""} 
            onChange={handleChange} 
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Occupation</label>
          <input 
            name="father_occupation" 
            type="text" 
            value={formData.father_occupation || ""} 
            onChange={handleChange} 
            className="border w-full p-2 rounded" 
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Mother's Name</label>
          <input 
            name="mother_name" 
            type="text" 
            value={formData.mother_name || ""} 
            onChange={handleChange} 
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Age</label>
          <input 
            name="mother_age" 
            type="number" 
            value={formData.mother_age || ""} 
            onChange={handleChange} 
            className="border w-full p-2 rounded" 
          />
        </div>
        <div>
          <label className="block font-semibold text-[#2c2f6f] mb-1">Occupation</label>
          <input 
            name="mother_occupation" 
            type="text" 
            value={formData.mother_occupation || ""} 
            onChange={handleChange} 
            className="border w-full p-2 rounded" 
          />
        </div>
      </div> */}
    </>
  );

  return (
    <ProtectedRoute role="Admin">
      <div className="flex flex-col md:flex-row bg-[#f0f6ff] min-h-screen">
        <main className="flex-1 p-2 sm:p-4 md:p-6">
          <div className="flex items-center mb-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-[#2c2f6f] hover:text-[#1E2A79]"
            >
              <FaArrowLeft />
              <span className="text-sm font-medium">Back to Users</span>
            </button>
          </div>
          <div className="bg-white p-4 sm:p-8 rounded shadow-lg border">
            <div className="mb-6">
              <label className="block font-semibold text-[#2c2f6f] mb-2 text-lg">What user do you want to add?</label>
              <div className="flex gap-4">
                {userTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`px-6 py-2 rounded-full border text-base font-semibold transition-colors ${userType === type ? 'bg-[#2c2f6f] text-white border-[#2c2f6f]' : 'bg-white text-[#2c2f6f] border-[#2c2f6f]'}`}
                    onClick={() => setUserType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Success and Error Messages */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
                <FaCheckCircle />
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
                <FaExclamationCircle />
                {errorMessage}
              </div>
            )}
            
            {userType && (
              <form onSubmit={handleSubmit} className="mt-4 space-y-6 text-sm">
                {userType === "Teacher" && renderTeacherParentFields(true)}
                {userType === "Parent" && renderTeacherParentFields(false)}
                {userType === "Student" && renderStudentFields()}
                <div className="mt-8 flex justify-end gap-4">
                  <button
                    onClick={handleBack}
                    type="button"
                    className="px-6 py-2 border border-[#2c2f6f] text-[#2c2f6f] rounded-full text-sm font-medium hover:bg-[#2c2f6f] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#2c2f6f] text-white rounded-full text-sm font-medium hover:bg-[#1E2A79]"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
