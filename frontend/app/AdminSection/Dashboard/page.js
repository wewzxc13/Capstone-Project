"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaChevronLeft,
  FaChevronRight,
  FaEllipsisH,
  FaEllipsisV,
} from "react-icons/fa";
import { Line, Bar } from "react-chartjs-2";
import '../../../lib/chart-config.js';
import ProtectedRoute from "../../Context/ProtectedRoute";
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

export default function AdminDashboard() {
  const [visible, setVisible] = useState({ age2: true, age3: true, age4: true });
  const [showChartMenu, setShowChartMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const userRole = localStorage.getItem("userRole");
    if (!isAuthenticated || userRole !== "Admin") {
      localStorage.clear();
      router.replace("/LoginSection");
    }
  }, []);

  const stats = [
    {
      label: "Total Students",
      value: 75,
      color: "bg-blue-100 text-blue-700",
      iconBg: "bg-blue-200",
      icon: <FaUser className="text-blue-500 text-xl" />,
    },
    {
      label: "Total Teachers",
      value: 20,
      color: "bg-orange-100 text-orange-700",
      iconBg: "bg-orange-200",
      icon: <FaUser className="text-orange-500 text-xl" />,
    },
    {
      label: "Active Parents",
      value: 75,
      color: "bg-yellow-100 text-yellow-700",
      iconBg: "bg-yellow-200",
      icon: <FaUser className="text-yellow-500 text-xl" />,
    },
  ];

  const studentProgressData = {
    labels: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ],
    datasets: [
      visible.age2 ? {
        label: "Age 2",
        data: [5, 15, 20, 0, 10, 30, 45, 25, 20, 50, 60, 55],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      } : null,
      visible.age3 ? {
        label: "Age 3",
        data: [10, 25, 50, 5, 15, 35, 50, 20, 15, 60, 65, 50],
        borderColor: "#F59E0B",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        fill: true,
        tension: 0.4,
      } : null,
      visible.age4 ? {
        label: "Age 4",
        data: [20, 35, 80, 10, 20, 40, 60, 30, 10, 70, 80, 65],
        borderColor: "#EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: true,
        tension: 0.4,
      } : null,
    ].filter(Boolean),
  };

  const events = [
    {
      title: "Quarterly Parent-Teacher Consultation",
      date: "March 20, 2025",
      time: "09:00 - 10:00 AM",
      color: "border-l-4 border-purple-400",
    },
    {
      title: "Academic Performance and Behavior Discussion",
      date: "March 21, 2025",
      time: "09:00 - 10:00 AM",
      color: "border-l-4 border-orange-400",
    },
    {
      title: "Collaborative Meeting for Student Success",
      date: "March 22, 2025",
      time: "09:00 - 10:00 AM",
      color: "border-l-4 border-yellow-400",
    },
    {
      title: "Student Development and Learning Review",
      date: "March 23, 2025",
      time: "09:00 - 10:00 AM",
      color: "border-l-4 border-green-400",
    },
    {
      title: "Student Development and Learning Review",
      date: "March 26, 2025",
      time: "09:00 - 10:00 AM",
      color: "border-l-4 border-blue-400",
    },
  ];

  return (
    <ProtectedRoute role="Admin">
      <div className="flex bg-[#eef5ff] min-h-screen">
        <main className="flex-1 p-6">
          {/* Stat Boxes */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {stats.map((stat, i) => (
              <div key={i} className={`rounded-xl shadow-md p-4 flex items-center gap-4 ${stat.color}`}>
                <div className={`rounded-full p-3 ${stat.iconBg}`}>{stat.icon}</div>
                <div>
                  <p className="text-sm font-medium">{stat.label}</p>
                  <h2 className="text-2xl font-bold">{stat.value}</h2>
                </div>
              </div>
            ))}
          </section>

          {/* Chart + Events Side-by-Side */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="bg-white shadow-md rounded-xl p-6 col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[#2c2f6f] text-lg font-semibold">Progress of Students</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center px-6 py-2 gap-6 border-r border-gray-300 bg-white rounded-lg">
                    {["age2", "age3", "age4"].map((key, idx) => (
                      <span
                        key={key}
                        className={`flex items-center gap-2 text-sm select-none px-4 py-1 rounded ${visible[key]
                          ? "text-black font-semibold bg-gray-100"
                          : "text-gray-400"
                          } ${idx < 2 ? "border-r border-gray-200" : ""}`}
                        style={{ marginRight: idx < 2 ? '1.5rem' : 0, marginLeft: idx > 0 ? '1.5rem' : 0 }}
                        onClick={() => setVisible((prev) => ({ ...prev, [key]: !prev[key] }))}
                      >
                        <span
                          className="inline-block w-3 h-3 rounded-full mr-1"
                          style={{
                            backgroundColor:
                              key === "age2"
                                ? "#3B82F6"
                                : key === "age3"
                                  ? "#F59E0B"
                                  : "#EF4444",
                          }}
                        />
                        {key === "age2" ? "Age 2" : key === "age3" ? "Age 3" : "Age 4"}
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <FaEllipsisV
                      className="cursor-pointer text-gray-500"
                      onClick={() => setShowChartMenu(!showChartMenu)}
                    />
                    {showChartMenu && (
                      <div className="absolute right-0 mt-2 bg-white shadow rounded z-50 w-32 text-sm">
                        <button
                          onClick={() => setVisible({ age2: true, age3: true, age4: true })}
                          className="w-full px-4 py-2 hover:bg-gray-100 text-left"
                        >
                          View All
                        </button>
                        <button
                          onClick={() => setVisible({ age2: true, age3: false, age4: false })}
                          className="w-full px-4 py-2 hover:bg-gray-100 text-left"
                        >
                          View Age 2
                        </button>
                        <button
                          onClick={() => setVisible({ age2: false, age3: true, age4: false })}
                          className="w-full px-4 py-2 hover:bg-gray-100 text-left"
                        >
                          View Age 3
                        </button>
                        <button
                          onClick={() => setVisible({ age2: false, age3: false, age4: true })}
                          className="w-full px-4 py-2 hover:bg-gray-100 text-left"
                        >
                          View Age 4
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Line data={studentProgressData} options={{ plugins: { legend: { display: false } } }} />
            </div>

            {/* Events */}
            <div className="space-y-4">
              {events.map((event, idx) => (
                <div
                  key={idx}
                  className={`bg-white p-4 rounded shadow ${event.color}`}
                >
                  <h4 className="text-sm font-semibold text-[#2c2f6f]">
                    {event.title}
                  </h4>
                  <p className="text-xs text-gray-500">{event.date}</p>
                  <p className="text-xs text-gray-400">{event.time}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
