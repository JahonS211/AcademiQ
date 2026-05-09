import React from "react";
import { FiSearch, FiFilter, FiPlus } from "react-icons/fi";

export function ManagementBar({ onSearch, onFilter, onAdd }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
      <div className="flex-1 flex items-center gap-3 w-full">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-medium focus:ring-2 ring-indigo-500/20"
          />
        </div>
        <button
          onClick={onFilter}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors text-sm font-bold"
        >
          <FiFilter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>
      
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all font-bold text-sm w-full sm:w-auto justify-center"
        >
          <FiPlus className="w-4 h-4" />
          Add User
        </button>
      )}
    </div>
  );
}
