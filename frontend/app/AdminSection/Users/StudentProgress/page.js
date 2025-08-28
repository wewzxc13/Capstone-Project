"use client";

import { useState } from "react";
import { Line } from "react-chartjs-2";
import { FaArrowLeft, FaUser } from "react-icons/fa";
import '../../../../lib/chart-config.js';
import ProtectedRoute from "../../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";

const chartData = {
  labels: [
    "Week 1",
    "Week 2",
    "Week 3",
    "Week 4",
    "Week 5",
    "Week 6",
    "Week 7",
    "Week 8",
    "Week 9",
    "Week 10",
    "Week 11",
  ],
  datasets: [
    {
      label: "Performance",
      data: [3, 4, 3, 2, 3, 2, 5, 4, 2, 3, 3],
      borderColor: "#2c2f6f",
      backgroundColor: "#2c2f6f",
      tension: 0.4,
      pointRadius: 5,
    },
  ],
};

const chartOptions = {
  scales: {
    y: {
      ticks: {
        callback: function (value) {
          return ["Need Help", "Fair", "Good", "Very Good", "Excellent"][
            value - 1
          ];
        },
        stepSize: 1,
        min: 1,
        max: 5,
      },
      grid: {
        color: "#e0e0e0",
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
};

export default function StudentProgress({ formData: initialFormData }) {
  const [activeTab, setActiveTab] = useState("Assessment");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const router = useRouter();

  // Mock student data - in real app this would come from props or API
  const student = {
    name: "Christian Ejay Clarino",
    age: 2,
    gender: "Male",
    handedness: "Right Handed",
    dob: "Jan 15, 2023",
    parent: "Kristopher Dichos",
    contact: "63+ 123-456-7890",
    email: "christian.clarino@example.com",
    progress: "Excellent",
    remarks: "Shows great improvement in class participation and assignments.",
  };

  const handleBack = () => {
    router.push("/AdminSection/Users");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsEditing(false);
    // Save logic here (UI only)
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this progress record?")) {
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

          <div className="bg-white rounded-xl shadow p-0 overflow-hidden">
            {/* Student Info Section */}
            <div className="bg-[#253B80] p-6 rounded-t-xl text-white flex flex-row w-full">
              <div className="w-[15%] flex items-start justify-start">
                <div className="w-14 h-14 bg-blue-200 rounded-full flex items-center justify-center">
                  <FaUser className="text-2xl text-blue-900" />
                </div>
              </div>
              <div className="flex flex-col justify-center items-start w-[25%]">
                <h2 className="font-bold text-lg leading-tight break-words text-left">{student.name}</h2>
              </div>
              <div className="flex flex-col justify-center w-[20%]">
                <div className="flex flex-row items-center gap-1">
                  <span className="text-base font-bold text-blue-200">Age:</span>
                  <span className="text-base">{student.age}</span>
                </div>
                <div className="flex flex-row items-center gap-1">
                  <span className="text-base font-bold text-blue-200">Sex:</span>
                  <span className="text-base">{student.gender}</span>
                </div>
              </div>
              <div className="flex flex-col justify-center w-[20%]">
                <div className="flex flex-row items-center gap-1">
                  <span className="text-base font-bold text-blue-200">Handedness:</span>
                  <span className="text-base">{student.handedness}</span>
                </div>
                <div className="flex flex-row items-center gap-1">
                  <span className="text-base font-bold text-blue-200">Date of Birth:</span>
                  <span className="text-base">{student.dob}</span>
                </div>
              </div>
              <div className="flex flex-col justify-center w-[20%]">
                <div className="flex flex-row items-center gap-1">
                  <span className="text-base font-bold text-blue-200">Parent:</span>
                  <span className="text-base">{student.parent}</span>
                </div>
                <div className="flex flex-row items-center gap-1">
                  <span className="text-base font-bold text-blue-200">Contact:</span>
                  <span className="text-base">{student.contact}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white px-8 pt-6">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab("Status")}
                  className={`text-[#2c2f6f] border-b-2 font-semibold pb-1 ${
                    activeTab === "Status" ? "border-[#2c2f6f]" : "border-transparent"
                  }`}
                >
                  Status
                </button>
                <button
                  onClick={() => setActiveTab("Assessment")}
                  className={`text-[#2c2f6f] border-b-2 font-semibold pb-1 ${
                    activeTab === "Assessment"
                      ? "border-[#2c2f6f]"
                      : "border-transparent"
                  }`}
                >
                  Assessment
                </button>
              </div>

              {activeTab === "Assessment" ? (
                <div className="grid grid-cols-5 gap-8">
                  {/* Progress Circles (left, 2 columns) */}
                  <div className="col-span-2 space-y-6">
                    {[
                      { label: "Socio Emotional", value: 70, color: "#f4b940" },
                      {
                        label: "Literacy/Language/English",
                        value: 65,
                        color: "#f57a7a",
                      },
                      { label: "Mathematical Skills", value: 80, color: "#3ec3ff" },
                      { label: "Physical Activities", value: 75, color: "#b59df0" },
                    ].map((subject, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="relative w-14 h-14">
                          <svg className="absolute top-0 left-0 w-full h-full">
                            <circle
                              cx="28"
                              cy="28"
                              r="25"
                              stroke="#e0e0e0"
                              strokeWidth="5"
                              fill="none"
                            />
                            <circle
                              cx="28"
                              cy="28"
                              r="25"
                              stroke={subject.color}
                              strokeWidth="5"
                              fill="none"
                              strokeDasharray={`${(2 * Math.PI * 25 * subject.value) / 100} ${2 * Math.PI * 25}`}
                              strokeLinecap="round"
                              transform="rotate(-90 28 28)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                            {subject.value}%
                          </div>
                        </div>
                        <span className="text-sm text-[#2c2f6f] font-medium">
                          {subject.label}
                        </span>
                      </div>
                    ))}
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-[#2c2f6f] mb-1">
                        Risk Status
                      </p>
                      <div className="flex items-center gap-2 text-sm text-[#2c2f6f]">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Low</span>
                      </div>
                    </div>
                  </div>
                  {/* Chart and Summary (right, 3 columns) */}
                  <div className="col-span-3 flex flex-col h-full">
                    <div className="h-64">
                      <Line data={chartData} options={chartOptions} />
                    </div>
                    <div className="mt-6 border-t pt-4 text-sm text-[#2c2f6f]">
                      <p className="font-semibold mb-1">Summary</p>
                      <p>
                        The student began Week 1 with a good performance, which
                        improved to very good in Week 2. In Week 3, the performance
                        slightly dipped back to good, followed by a further decline to
                        fair in Week 4. Week 5 showed improvement again with a return
                        to good, but Week 6 brought another drop to fair. In Week 7,
                        the student reached their peak performance with an excellent
                        rating, then slightly declined to very good in Week 8.
                        However, performance dropped again to fair in Week 9 and
                        remained at that level through Weeks 10 and 11, suggesting a
                        need for more consistent support toward the end of the term.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-8">
                  {/* Left: Quarterly Assessment and Attendance (3 columns) */}
                  <div className="col-span-3">
                    <p className="text-sm font-semibold text-[#2c2f6f] mb-2">Quarterly Assessment</p>
                    <table className="w-full border text-sm mb-6">
                      <thead>
                        <tr className="bg-green-200 text-[#2c2f6f]">
                          <th className="border px-2 py-1">Subjects</th>
                          <th className="border px-2 py-1">1st Qtr.</th>
                          <th className="border px-2 py-1">2nd Qtr.</th>
                          <th className="border px-2 py-1">3rd Qtr.</th>
                          <th className="border px-2 py-1">4th Qtr.</th>
                          <th className="border px-2 py-1">Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          "Physical Activities Milestone",
                          "Social-Emotional Milestone",
                          "Language Milestone",
                          "Mathematical Skills Milestone",
                          "Physical Activities Milestone",
                        ].map((subject, i) => (
                          <tr key={i} className="text-center">
                            <td className="border px-2 py-1 text-left">{subject}</td>
                            <td className="border px-2 py-1">🔷</td>
                            <td className="border px-2 py-1">❤️</td>
                            <td className="border px-2 py-1"></td>
                            <td className="border px-2 py-1"></td>
                            <td className="border px-2 py-1"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-6 text-sm font-semibold text-[#2c2f6f] mb-2">Record of Attendance</p>
                    <table className="w-full border text-sm">
                      <thead>
                        <tr className="bg-green-200 text-[#2c2f6f]">
                          <th className="border px-2 py-1"></th>
                          {[
                            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"
                          ].map((month) => (
                            <th key={month} className="border px-2 py-1">{month}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "Number of School days", values: [12, 12, 10, 9, 10] },
                          { label: "Number of days present", values: [12, 12, 10, 9, 9] },
                          { label: "Number of days absent", values: [0, 0, 0, 0, 1] },
                        ].map((row, i) => (
                          <tr key={i}>
                            <td className="border px-2 py-1">{row.label}</td>
                            {Array.from({ length: 10 }, (_, idx) => (
                              <td key={idx} className="border px-2 py-1 text-center">{row.values[idx] || ""}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Right: Legend and Comments (2 columns) */}
                  <div className="col-span-2 flex flex-col h-full">
                    <p className="text-sm font-semibold text-[#2c2f6f] mb-2">Quarterly Assessment Legend</p>
                    <table className="text-sm mb-6 w-full">
                      <thead>
                        <tr className="text-left">
                          <th>Shapes</th>
                          <th>Descriptions</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["❤️", "Excellent", "Passed"],
                          ["⭐", "Very Good", "Passed"],
                          ["🔷", "Good", "Passed"],
                          ["▲", "Need Help", "Passed"],
                          ["🟡", "Not Met", "Failed"],
                        ].map(([shape, desc, remark], idx) => (
                          <tr key={idx}>
                            <td className="pr-2">{shape}</td>
                            <td className="pr-4">- {desc}</td>
                            <td>- {remark}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-sm font-semibold text-[#2c2f6f] mb-2">Comment</p>
                    <textarea 
                      className="w-full border border-gray-300 rounded-md p-2 text-sm" 
                      rows={5} 
                      defaultValue={student.remarks}
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-center gap-4 pb-6">
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