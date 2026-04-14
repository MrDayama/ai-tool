import json
from utils.llm import call_llm, system_message, user_message
from agents.planner_agent import PlannerAgent
from agents.executor_agent import ExecutorAgent
from agents.critic_agent import CriticAgent
from memory.memory_store import MemoryStore
from utils.logger import log_info, log_error, log_warning
from rich.console import Console

console = Console()

class ManagerAgent:
    def __init__(self):
        self.role = "Manager Agent"
        self.planner = PlannerAgent()
        self.executor = ExecutorAgent()
        self.critic = CriticAgent()
        self.memory = MemoryStore()
        self.max_iterations = 10

    def start_goal(self, goal: str):
        """AIエージェントのメインループ。"""
        log_info(f"目標開始: {goal}")
        self.memory.set_goal(goal)
        
        # PLAN
        log_info("フェーズ 1: タスクの計画中...")
        tasks = self.planner.plan(goal)
        if not tasks:
            log_error("計画の生成に失敗しました。")
            return
        
        log_info(f"{len(tasks)} 個のタスクを作成しました。")
        for i, t in enumerate(tasks):
            self.memory.add_task({"id": i, "description": t, "status": "pending", "result": ""})
        
        # LOOP
        iteration = 0
        current_task_idx = 0
        
        while current_task_idx < len(self.memory.tasks) and iteration < self.max_iterations:
            task = self.memory.tasks[current_task_idx]
            task_desc = task["description"]
            
            log_info(f"\n--- [イテレーション {iteration+1}] タスク: {task_desc} ---")
            
            # EXECUTE
            log_info(f"フェーズ 2: タスクを実行中...")
            context = self.memory.get_full_context()
            execution_result = self.executor.execute(task_desc, goal, context)
            
            result_str = execution_result.get("result", execution_result.get("message", "結果なし。"))
            
            # CRITIC
            log_info("フェーズ 3: 結果をレビュー中...")
            critic_review = self.critic.review(task_desc, result_str, goal, context)
            
            if critic_review.get("status") == "success":
                log_info(f"✔ タスク成功: {task_desc[:50]}...")
                self.memory.update_task_status(current_task_idx, "success", result_str)
                current_task_idx += 1
            else:
                log_warning(f"✘ Criticが却下: {critic_review.get('feedback')}")
                # Optional: Refine the plan if needed
                log_info("フィードバックに基づいて計画を修正中...")
                remaining_tasks = [t["description"] for t in self.memory.tasks[current_task_idx:]]
                new_tasks_list = self.planner.refine_plan(goal, remaining_tasks, critic_review.get("feedback"))
                
                # Replace remaining tasks with new ones
                self.memory.tasks = self.memory.tasks[:current_task_idx]
                for i, t in enumerate(new_tasks_list):
                    self.memory.add_task({"id": current_task_idx + i, "description": t, "status": "pending", "result": ""})
                    
                log_info(f"タスクを更新しました。新しいタスク数: {len(self.memory.tasks)}")
            
            iteration += 1
            self.memory.save()
            
        if current_task_idx >= len(self.memory.tasks):
            log_info("\n🎉 すべてのタスクが正常に完了しました！")
            print(f"\n最終結果:\n{self.memory.tasks[-1].get('result')[:500]}...")
        else:
            log_error("\n⚠ 最大イテレーション数に達したか、目標が失敗しました。")
            
    def run_cli(self):
        """対話型CLIモード。"""
        console.print("[bold blue]AI自律型エージェントシステム[/bold blue]", justify="center")
        console.print("[italic gray]'exit' または 'quit' で終了します。[/italic gray]", justify="center")
        
        while True:
            try:
                goal = console.input("\n[bold green]何をしますか？ ?> [/bold green]")
                if goal.lower() in ["exit", "quit"]:
                    break
                if not goal.strip():
                    continue
                
                self.start_goal(goal)
            except KeyboardInterrupt:
                break
            except Exception as e:
                log_error(f"予期しないエラー: {str(e)}")
