import { useContext } from "react";
import { TaskContext } from "../Context/TaskContext";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const Analytics = () => {
  const { tasks } = useContext(TaskContext);

  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;
  const total = tasks.length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const pieData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
  ];

  const priorityData = [
    { name: "High", value: tasks.filter(t => t.priority === "High").length },
    { name: "Medium", value: tasks.filter(t => t.priority === "Medium").length },
    { name: "Low", value: tasks.filter(t => t.priority === "Low").length },
  ];

  const categoryData = ["Work", "Personal", "College", "Health", "General"].map(cat => ({
    name: cat,
    value: tasks.filter(t => t.category === cat).length,
  })).filter(d => d.value > 0);

  const overdueCount = tasks.filter(t =>
    t.dueDate &&
    new Date(t.dueDate) < new Date(new Date().toDateString()) &&
    !t.completed
  ).length;

  const COLORS = ["#7c3aed", "#1e1e2e"];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Track your productivity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: total },
          { label: "Completed", value: completed },
          { label: "Pending", value: pending },
          { label: "Overdue", value: overdueCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-3xl font-semibold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Completion Rate */}
      <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-6">
        <p className="text-sm text-gray-400 mb-3">Completion Rate</p>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-[#1e1e1e] rounded-full h-2">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-sm text-white font-medium">{completionRate}%</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">

        {/* Pie Chart */}
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
            <span className="text-xs text-gray-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-600 inline-block"></span>Completed</span>
            <span className="text-xs text-gray-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1e1e2e] border border-gray-600 inline-block"></span>Pending</span>
          </div>
        </div>

        {/* Priority Chart */}
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

      {/* Category Breakdown */}
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