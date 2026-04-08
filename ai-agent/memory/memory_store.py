import json
from datetime import datetime

class MemoryStore:
    def __init__(self, storage_path="memory.json"):
        self.storage_path = storage_path
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
