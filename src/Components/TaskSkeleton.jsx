const TaskSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="flex items-center gap-4 bg-[#141414] border border-[#1e1e1e] rounded-xl px-4 py-3 animate-pulse">
        <div className="w-4 h-4 rounded-full bg-[#2e2e2e]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-[#2e2e2e] rounded w-1/3" />
          <div className="h-2 bg-[#2e2e2e] rounded w-1/5" />
        </div>
        <div className="h-5 w-12 bg-[#2e2e2e] rounded-md" />
      </div>
    ))}
  </div>
);

export default TaskSkeleton;