import json
import os
from datetime import datetime

class MemoryStore:
    def __init__(self, storage_path="memory.json"):
        self.storage_path = storage_path
        self.markdown_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', '03_AI', 'memory')
        self.history = []
        self.tasks = []
        self.goal = ""

    def set_goal(self, goal: str):
        self.goal = goal
        self.add_log(f"Goal set: {goal}")

    def add_log(self, message: str, role: str = "system"):
        timestamp = datetime.now().isoformat()
        self.history.append({"timestamp": timestamp, "role": role, "message": message})

    def add_task(self, task: dict):
        self.tasks.append(task)
        self.add_log(f"Task added: {task.get('description')}")

    def update_task_status(self, task_id: int, status: str, result: str = ""):
        if 0 <= task_id < len(self.tasks):
            self.tasks[task_id]["status"] = status
            self.tasks[task_id]["result"] = result
            self.add_log(f"Task {task_id} updated to {status}: {result[:100]}...")

    def get_full_context(self):
        return {
            "goal": self.goal,
            "tasks": self.tasks,
            "history": self.history[-20:]  # Last 20 logs for context
        }

    def save(self):
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump({
                "goal": self.goal,
                "tasks": self.tasks,
                "history": self.history
            }, f, indent=4, ensure_ascii=False)
        self.save_markdown()

    def save_markdown(self):
        if not os.path.exists(self.markdown_dir):
            os.makedirs(self.markdown_dir, exist_ok=True)
            
        timestamp_str = datetime.now().strftime("%Y-%m-%d_%H%M")
        filename = f"{timestamp_str}_session.md"
        filepath = os.path.join(self.markdown_dir, filename)
        
        status = "active"
        if self.tasks and all(t.get("status") == "completed" for t in self.tasks):
            status = "completed"
            
        lines = []
        lines.append("---")
        lines.append("type: log")
        lines.append("tags: [AI/memory, AI/agent]")
        lines.append(f"date: {datetime.now().strftime('%Y-%m-%d')}")
        lines.append(f"status: {status}")
        lines.append(f"goal: \"{self.goal}\"")
        lines.append("---")
        lines.append("")
        lines.append(f"# セッションログ: {self.goal}")
        lines.append("")
        lines.append("## 実行タスク")
        for i, t in enumerate(self.tasks):
            mark = "x" if t.get("status") in ["completed", "success"] else " "
            lines.append(f"{i+1}. [{mark}] {t.get('description', '')}")
            if t.get("result"):
                lines.append(f"   - 結果: {t.get('result')}")
        
        lines.append("")
        lines.append("## 直近のログ")
        for log in self.history[-20:]:
            lines.append(f"- **{log.get('role')}** ({log.get('timestamp')}): {log.get('message')}")
            
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("\\n".join(lines))
