import { useContext } from "react";
import { TaskContext } from "../Context/TaskContext";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

export default function Analytics() {
  const { tasks } = useContext(TaskContext);

  // Today's date (local)
  const today = new Date().toDateString();

  // Tasks created today
  const createdToday = tasks.filter(
    task =>
      task.createdAt &&
      new Date(task.createdAt).toDateString() === today
  ).length;

  // Tasks completed today
  const completedToday = tasks.filter(
    task =>
      task.completedAt &&
      new Date(task.completedAt).toDateString() === today
  ).length;


  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const completionRate =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  const pieData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
  ];

  const barData = [
    { name: "Completed", tasks: completed },
    { name: "Pending", tasks: pending },
  ];

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return date.toDateString();
});

// Completed tasks for each of last 7 days
const weeklyCompletedData = last7Days.map((day) => {
  return {
    day: day.slice(0, 3), // Mon, Tue, etc
    completed: tasks.filter(
      (task) =>
        task.completedAt &&
        new Date(task.completedAt).toDateString() === day
    ).length,
  };
});




  return (
    <div className="p-6 space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10">
          <h3 className="text-sm text-gray-400">Total Tasks</h3>
          <p className="text-2xl font-bold mt-2">{total}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10">
          <h3 className="text-sm text-gray-400">Completed</h3>
          <p className="text-2xl font-bold mt-2">{completed}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10">
          <h3 className="text-sm text-gray-400">Pending</h3>
          <p className="text-2xl font-bold mt-2">{pending}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10">
          <h3 className="text-sm text-gray-400">Completion %</h3>
          <p className="text-2xl font-bold mt-2">{completionRate}%</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10">
          <h3 className="text-sm text-gray-400">Created Today</h3>
          <p className="text-2xl font-bold mt-2">{createdToday}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10">
          <h3 className="text-sm text-gray-400">Completed Today</h3>
          <p className="text-2xl font-bold mt-2">{completedToday}</p>
        </div>

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pie Chart */}
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
          <h2 className="text-lg font-semibold mb-4">Task Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  outerRadius={100}
                  label
                  isAnimationActive={true}
                  animationDuration={2000}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F43F5E" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
          <h2 className="text-lg font-semibold mb-4">Productivity Overview</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-6">
  <h2 className="text-lg font-semibold mb-4">
    Weekly Completed Tasks
  </h2>

  <div className="h-72">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={weeklyCompletedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="day" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip />
        <Bar
          dataKey="completed"
          fill="#22c55e"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>

    </div>
  );
}
