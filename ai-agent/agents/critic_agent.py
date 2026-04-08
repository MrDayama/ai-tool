import json
from utils.llm import call_llm, system_message, user_message

class CriticAgent:
    def __init__(self):
        self.role = "Critic Agent"
        self.prompt = (
            "あなたは批判的な品質レビューアーです。あなたの仕事は、実行者が実行した特定のタスクの結果を評価することです。"
            "結果がタスクの要件と一致しており、全体の目標に対して十分であるかどうかを判断してください。\n"
            "思考と出力はすべて日本語で行ってください。\n"
            "JSON形式で、'status'（'success'または'fail'）と 'feedback'（詳細な説明）を出力してください。"
        )

    def review(self, task: str, result: str, goal: str, context: dict) -> dict:
        content = (
            f"User Goal: {goal}\n"
            f"Task: {task}\n"
            f"Executor Result: {result}\n\n"
            "Context from previous steps:\n" + json.dumps(context, indent=2) + "\n\n"
            "Please review this result. Does it meet the expected standard? Output 'success' or 'fail'."
        )
        
        messages = [
            system_message(self.prompt),
            user_message(content)
        ]
        
        response = call_llm(messages, response_format="json")
        try:
            return json.loads(response)
        except Exception as e:
            # Fallback
            return {"status": "fail", "feedback": f"Failed to parse critic feedback: {str(e)}", "original_response": response}
