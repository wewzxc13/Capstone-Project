"use client";

import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { FaBell, FaCog } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState("Attendance Report");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();

  const chartData = {
    labels:
      selectedReport === "Milestone Report"
        ? [
            "Socio Emotional",
            "Literacy/English/Language",
            "Mathematical Skills",
            "Physical Activities",
            "Filipino",
          ]
        : ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
    datasets: [
      {
        label: "Age 2",
        data:
          selectedReport === "Milestone Report"
            ? [60, 55, 85, 90, 0]
            : [75, 80, 85, 95],
        backgroundColor: "#60a5fa",
      },
      {
        label: "Age 3",
        data:
          selectedReport === "Milestone Report"
            ? [90, 70, 90, 90, 0]
            : [90, 95, 90, 70],
        backgroundColor: "#facc15",
      },
      {
        label: "Age 4",
        data:
          selectedReport === "Milestone Report"
            ? [100, 95, 95, 95, 95]
            : [95, 90, 85, 80],
        backgroundColor: "#f87171",
      },
    ],
  };

  const reports = ["Attendance Report", "Progress Report", "Milestone Report"];

  const handleLogout = () => {
    localStorage.clear();
    router.push("/LoginSection");
  };

  return (
    <ProtectedRoute role="Admin">
      <div className="flex bg-[#eef5ff] min-h-screen">
        <main className="flex-1 p-6">
          <h2 className="text-base sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-4">
            {selectedReport}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="bg-white p-3 sm:p-6 rounded-xl shadow-md col-span-1 lg:col-span-2">
              <h3 className="text-xs sm:text-md font-semibold text-gray-800 mb-2 sm:mb-3">
                Insight Summary
              </h3>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 list-disc pl-4 sm:pl-5">
                {selectedReport === "Milestone Report" ? (
                  <>
                    <li>
                      Socio-Emotional skills improve with age. Age 2 scores
                      ~60%, Age 3 ~90%, Age 4 ~100%.
                    </li>
                    <li>
                      Literacy/English improves with age: Age 2 ~55%, Age 3
                      ~70%, Age 4 ~95%.
                    </li>
                    <li>
                      Math skills are strong across ages; Age 2 starts ~85%,
                      peaking at 95% by Age 4.
                    </li>
                    <li>Physical Activities remain high across all ages.</li>
                    <li>
                      Filipino appears only for Age 4, showing ~95% performance.
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      Age 2 - Progress starts lower in Q1 and rises steadily
                      each quarter showing good upward growth.
                    </li>
                    <li>
                      Age 3 - Begins with moderate progress, dips slightly in
                      Q2, then rises in Q3-Q4.
                    </li>
                    <li>
                      Age 4 - Consistently high with a peak in Q3 and slight dip
                      in Q4.
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div className="bg-white p-3 sm:p-6 rounded-xl shadow-md">
              {selectedReport === "Attendance Report" && (
                <>
                  <h3 className="text-xs sm:text-md font-semibold text-gray-800 mb-2 sm:mb-3">
                    Total of Student
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="text-xs sm:text-sm text-gray-700 w-full min-w-[340px]">
                      <thead className="border-b">
                        <tr>
                          <th></th>
                          <th className="text-center text-blue-500">Age 2</th>
                          <th className="text-center text-yellow-500">Age 3</th>
                          <th className="text-center text-red-500">Age 4</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-1">Male</td>
                          <td className="text-center">15</td>
                          <td className="text-center">15</td>
                          <td className="text-center">15</td>
                        </tr>
                        <tr>
                          <td className="py-1">Female</td>
                          <td className="text-center">15</td>
                          <td className="text-center">15</td>
                          <td className="text-center">15</td>
                        </tr>
                        <tr className="font-semibold">
                          <td className="py-1">Total</td>
                          <td className="text-center">30</td>
                          <td className="text-center">30</td>
                          <td className="text-center">30</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {selectedReport === "Progress Report" && (
                <>
                  <h3 className="text-xs sm:text-md font-semibold text-gray-800 mb-2 sm:mb-3">
                    Risk Level
                  </h3>
                  <table className="text-xs sm:text-sm text-gray-700 w-full">
                    <thead className="border-b">
                      <tr>
                        <th></th>
                        <th className="text-blue-500">Age 2</th>
                        <th className="text-yellow-500">Age 3</th>
                        <th className="text-red-500">Age 4</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>High</td>
                        <td>2</td>
                        <td>4</td>
                        <td>3</td>
                      </tr>
                      <tr>
                        <td>Moderate</td>
                        <td>5</td>
                        <td>6</td>
                        <td>7</td>
                      </tr>
                      <tr>
                        <td>Low</td>
                        <td>23</td>
                        <td>20</td>
                        <td>20</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
              {selectedReport === "Milestone Report" && (
                <>
                  <h3 className="text-xs sm:text-md font-semibold text-gray-800 mb-2 sm:mb-3">
                    Grading
                  </h3>
                  <table className="text-xs sm:text-sm text-gray-700 w-full">
                    <thead className="border-b">
                      <tr>
                        <th>Shapes</th>
                        <th>Descriptions</th>
                        <th>Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>❤️</td>
                        <td>- Excellent</td>
                        <td>1 - 1.79</td>
                      </tr>
                      <tr>
                        <td>⭐</td>
                        <td>- Very Good</td>
                        <td>1.8 - 2.59</td>
                      </tr>
                      <tr>
                        <td>🔺</td>
                        <td>- Good</td>
                        <td>2.6 - 3.39</td>
                      </tr>
                      <tr>
                        <td>🔼</td>
                        <td>- Need Help</td>
                        <td>3.4 - 4.19</td>
                      </tr>
                      <tr>
                        <td>🟡</td>
                        <td>- Not met</td>
                        <td>4.2 - 5</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-xl shadow-md">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "top",
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      stepSize: 25,
                    },
                    grid: {
                      color: "#e5e7eb",
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
