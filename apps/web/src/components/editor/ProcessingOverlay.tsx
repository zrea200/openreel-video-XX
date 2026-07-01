import React from "react";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Progress, ScrollArea } from "@openreel/ui";
import {
  useProcessingStore,
  PROCESSING_TYPE_LABELS,
  PROCESSING_STATUS_LABELS,
  type ProcessingTask,
} from "../../services/processing-manager";

const TaskItem: React.FC<{ task: ProcessingTask }> = ({ task }) => {
  const getIcon = () => {
    switch (task.status) {
      case "queued":
        return <Clock size={14} className="text-text-muted" />;
      case "processing":
        return <Loader2 size={14} className="text-blue-400 animate-spin" />;
      case "completed":
        return <CheckCircle size={14} className="text-green-400" />;
      case "failed":
        return <XCircle size={14} className="text-red-400" />;
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case "queued":
        return "text-text-muted";
      case "processing":
        return "text-blue-400";
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-black/20 rounded">
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-primary truncate">
            {PROCESSING_TYPE_LABELS[task.type]}
          </span>
          <span className={`text-[10px] ${getStatusColor()}`}>
            {task.status === "processing"
              ? `${task.progress}%`
              : PROCESSING_STATUS_LABELS[task.status]}
          </span>
        </div>
        {task.status === "processing" && (
          <div className="mt-1">
            <Progress value={task.progress} className="h-1 bg-black/30" />
            <p className="text-[9px] text-text-muted mt-0.5 truncate">
              {task.message}
            </p>
          </div>
        )}
        {task.status === "failed" && task.error && (
          <p className="text-[9px] text-red-400 mt-0.5 truncate">
            {task.error}
          </p>
        )}
      </div>
    </div>
  );
};

export const ProcessingOverlay: React.FC = () => {
  const { tasks, isProcessing, getOverallProgress } = useProcessingStore();
  const taskList = Array.from(tasks.values());
  const activeTasks = taskList.filter(
    (t) => t.status === "queued" || t.status === "processing",
  );

  if (!isProcessing || activeTasks.length === 0) {
    return null;
  }

  const { progress } = getOverallProgress();

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background-secondary/95 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Loader2 size={20} className="text-blue-400 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              正在处理效果
            </h3>
            <p className="text-xs text-text-muted">
              {activeTasks.length} 个任务进行中
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-secondary">
              总体进度
            </span>
            <span className="text-[10px] text-text-muted font-mono">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-black/30" />
        </div>

        <ScrollArea className="max-h-48">
          <div className="space-y-2">
            {activeTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </ScrollArea>

        <p className="text-[10px] text-text-muted text-center mt-4">
          请稍候，正在应用效果…
        </p>
      </div>
    </div>
  );
};

export default ProcessingOverlay;
