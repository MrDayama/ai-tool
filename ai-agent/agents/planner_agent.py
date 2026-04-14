import json
from utils.llm import call_llm, system_message, user_message

class PlannerAgent:
    def __init__(self):
        self.role = "Planner Agent"
        self.prompt = (
            "あなたは戦略的なタスクプランナーです。あなたの目標は、複雑なリクエストを "
            "具体的で実行可能なサブタスクのリストに分解することです。各タスクは明確で、 "
            "何をすべきか正確に記述してください。思考と出力はすべて日本語で行ってください。 "
            "JSON形式で、'tasks'を文字列のリストとして出力してください。"
        )

    def plan(self, goal: str, history=None) -> list:
        content = f"User Goal: {goal}"
        if history:
            content += f"\n\nContext:\n{json.dumps(history, indent=2)}"
            
        messages = [
            system_message(self.prompt),
            user_message(content)
        ]
        
        response = call_llm(messages, response_format="json")
        try:
            data = json.loads(response)
            return data.get("tasks", [])
        except Exception as e:
            # Fallback if JSON is weird
            return [line.strip() for line in response.split('\n') if line.strip()]

    def refine_plan(self, goal: str, tasks: list, feedback: str) -> list:
        content = (
            f"Original Goal: {goal}\n"
            f"Current Tasks: {json.dumps(tasks, indent=2)}\n"
            f"Critic Feedback: {feedback}\n"
            "Please revise the task list to address the feedback. Output JSON 'tasks' list."
        )
        
        messages = [
            system_message(self.prompt),
            user_message(content)
        ]
        
        response = call_llm(messages, response_format="json")
        try:
            data = json.loads(response)
            return data.get("tasks", [])
        except:
            return tasks # Return original on failure
