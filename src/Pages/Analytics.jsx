import { useContext } from "react";
import { TaskContext } from "../Context/taskContextObject";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const Analytics = () => {
  const { tasks } = useContext(TaskContext);
  const safeTasks = tasks || [];

  const completed = safeTasks.filter(t => t.completed).length;
  const pending = safeTasks.filter(t => !t.completed).length;
  const total = safeTasks.length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const overdueCount = safeTasks.filter(t =>
    t.dueDate &&
    new Date(t.dueDate) < new Date(new Date().toDateString()) &&
    !t.completed
  ).length;

  const pieData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
  ];

  const priorityData = [
    { name: "High", value: safeTasks.filter(t => t.priority === "High").length },
    { name: "Medium", value: safeTasks.filter(t => t.priority === "Medium").length },
    { name: "Low", value: safeTasks.filter(t => t.priority === "Low").length },
  ];

  const categoryData = ["Work", "Personal", "College", "Health", "General"].map(cat => ({
    name: cat,
    value: safeTasks.filter(t => t.category === cat).length,
  })).filter(d => d.value > 0);

  const COLORS = ["#7c3aed", "#1e1e2e"];

  const completionColor = completionRate >= 70 ? "text-green-400" :
    completionRate >= 30 ? "text-yellow-400" : "text-red-400";

  const completionBarColor = completionRate >= 70 ? "bg-green-500" :
    completionRate >= 30 ? "bg-yellow-500" : "bg-red-500";

  if (total === 0) return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Track your productivity</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-12 h-12 rounded-xl bg-[#1e1e1e] flex items-center justify-center text-2xl">📊</div>
        <p className="text-sm text-gray-400">No data yet</p>
        <p className="text-xs text-gray-600">Add some tasks to see your analytics</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Track your productivity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5">
          <p className="text-xs text-gray-500">Total Tasks</p>
          <p className="text-3xl font-semibold text-white mt-1">{total}</p>
        </div>
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-3xl font-semibold text-green-400 mt-1">{completed}</p>
        </div>
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-3xl font-semibold text-yellow-400 mt-1">{pending}</p>
        </div>
        <div className="bg-[#141414] border border-red-900/30 rounded-xl p-5">
          <p className="text-xs text-gray-500">Overdue</p>
          <p className="text-3xl font-semibold text-red-400 mt-1">{overdueCount}</p>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-400">Completion Rate</p>
          <span className={`text-sm font-semibold ${completionColor}`}>{completionRate}%</span>
        </div>
        <div className="flex-1 bg-[#1e1e1e] rounded-full h-2">
          <div
            className={`${completionBarColor} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {completionRate >= 70 ? "Great work! Keep it up 🎉" :
           completionRate >= 30 ? "Good progress, keep going 💪" :
           "You have a lot of pending tasks 📋"}
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-4">Tasks Overview</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#141414", border: "1px solid #1e1e1e", borderRadius: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-600 inline-block" />Completed
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#1e1e2e] border border-gray-600 inline-block" />Pending
            </span>
          </div>
        </div>

        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-4">Tasks by Priority</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData}>
              <XAxis dataKey="name" stroke="#4b5563" tick={{ fontSize: 12 }} />
              <YAxis stroke="#4b5563" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#141414", border: "1px solid #1e1e1e", borderRadius: "8px" }} />
              <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-4">Tasks by Category</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData}>
              <XAxis dataKey="name" stroke="#4b5563" tick={{ fontSize: 12 }} />
              <YAxis stroke="#4b5563" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#141414", border: "1px solid #1e1e1e", borderRadius: "8px" }} />
              <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
};
export default Analytics;