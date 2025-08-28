import React from "react";

export default function FeatureDashboard({ featureName }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8 border dark:border-slate-700 flex items-center gap-4">
      <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 flex items-center justify-center">
        <span className="text-2xl text-blue-600 dark:text-blue-300 font-bold">
          🏠
        </span>
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
          {featureName} Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Welcome to the {featureName} dashboard! Here you can view and manage
          all relevant information for this section.
        </p>
      </div>
    </div>
  );
}
