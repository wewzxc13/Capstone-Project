"use client";

import { useState } from "react";
import { FaPaperPlane, FaSearch, FaCog } from "react-icons/fa";

export default function AdminMessagesPage() {
  const [selectedChat, setSelectedChat] = useState("Rudgel Tagaan");
  const [messages, setMessages] = useState([
    { from: "Rudgel Tagaan", text: "Chat here", time: new Date() },
    { from: "Rudgel Tagaan", text: "Chat here", time: new Date() },
    { from: "You", text: "Chat here", time: new Date() },
    { from: "You", text: "wews", time: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const handleSend = () => {
    if (input.trim()) {
      setMessages([
        ...messages,
        {
          from: "You",
          text: input,
          time: new Date(),
        },
      ]);
      setInput("");
    }
  };

  const chatNames = [
    "Rudgel Tagaan",
    "Andrew Nerona",
    "Pia Balibagon",
    "Clarino Christian",
    "Snow B.",
    "Maria Cruz",
    "Juan Dela Cruz",
    "Anna Santos",
    "Mark Reyes",
    "Liza Soberano",
    "Carlos Mendoza"
  ];

  return (
    <div className="flex min-h-screen bg-[#f4f9ff]">
      <main className="flex-1 flex flex-col h-screen">
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDEBAR CHAT LIST */}
          <div className="w-[300px] flex flex-col bg-white border-r">
            {/* Search Header */}
            <div className="p-4">
              <h2 className="font-bold text-[#1E2A79] text-3xl mb-4">Messages</h2>
              <div className="relative mb-4">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  type="text"
                  placeholder="Search here"
                  className="w-full pl-12 pr-4 py-2 text-sm rounded-full border border-gray-300 focus:outline-none"
                />
              </div>
            </div>

            {/* Scrollable Chat List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
              {chatNames.map((name, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedChat(name)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition rounded-lg border hover:shadow-sm ${
                    selectedChat === name
                      ? "bg-[#e8eeff] border-blue-500"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-200" />
                    <div>
                      <p className="font-semibold text-[#1E2A79] text-sm">{name}</p>
                      <p className="text-xs text-gray-500 truncate w-[120px]">Lorem ipsum...</p>
                    </div>
                  </div>
                  <span className="text-xs bg-blue-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">2</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT CHAT SECTION */}
          <div className="flex flex-col flex-1 bg-[#f4f9ff]">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b bg-white flex items-center justify-between relative">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-200" />
                <p className="font-bold text-[#1E2A79] text-lg">{selectedChat}</p>
              </div>
              <div className="relative">
                <FaCog className="text-gray-500 text-2xl cursor-pointer" onClick={() => setShowSettings((prev) => !prev)} />
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-32 bg-white shadow-lg rounded-lg z-50">
                    <button className="block w-full px-4 py-2 text-left text-gray-600 hover:bg-gray-100 rounded-lg">
                      Settings
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.from === "You" ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex flex-col items-end">
                    <div
                      className={`max-w-md px-6 py-4 rounded-2xl text-base shadow-md mb-2 ${
                        msg.from === "You"
                          ? "bg-[#1E2A79] text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <p
                      className={`text-xs ${
                        msg.from === "You" ? "text-right" : "text-left"
                      } text-gray-400 ml-2 mr-2`}
                    >
                      {msg.time.toLocaleString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }).replace(",", "").replace(/(\d{2}):(\d{2})/, (match, h, m) => `${h}:${m}`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Fixed Input Bar */}
            <div className="px-6 py-4 border-t bg-white flex items-center space-x-4">
              <input
                type="text"
                placeholder="Write your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-4 py-2 rounded-full border border-gray-400 text-sm outline-none"
              />
              <button
                onClick={handleSend}
                className="bg-[#28316c] hover:bg-[#1f2656] text-white px-4 py-2 rounded-full flex items-center space-x-2"
              >
                <span className="text-sm">Send</span>
                <FaPaperPlane size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

