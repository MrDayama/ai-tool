import json
import logging
from utils.llm import call_llm, system_message, user_message
from tools.web_search import web_search
from tools.code_runner import run_python_code
from tools.file_tool import list_directory, read_file, write_file
from tools.shell_tool import run_shell
from tools.github_tool import list_repos, create_github_issue, get_contents

class ExecutorAgent:
    def __init__(self):
        self.role = "Executor Agent"
        self.tools = {
            "web_search": web_search,
            "run_python": run_python_code,
            "list_dir": list_directory,
            "read_file": read_file,
            "write_file": write_file,
            "run_shell": run_shell,
            "github_list_repos": list_repos,
            "github_create_issue": create_github_issue,
            "github_get_contents": get_contents
        }
        
        self.tool_descriptions = {
            "web_search": "クエリ文字列を使用してDuckDuckGoでWebを検索します。",
            "run_python": "Pythonコードを実行します。複雑な計算やデータ処理に使用してください。",
            "list_dir": "特定のディレクトリ（デフォルトは'.'）のファイルを一覧表示します。",
            "read_file": "指定されたパス의ファイルの内容を読み取ります。",
            "write_file": "文字列をファイルに書き込みます。'path'（パス）と'content'（内容）の引数が必要です。",
            "run_shell": "ローカルシステムでシェルコマンドを実行します。",
            "github_list_repos": "認証済みユーザーのGitHubリポジトリ一覧を取得します。",
            "github_create_issue": "指定されたリポジトリ('repo')にIssueを作成します。'title'（タイトル）と'body'（本文）が必要です。",
            "github_get_contents": "指定されたリポジトリ('repo')内のファイル構成やファイル内容を取得します。"
        }

    def execute(self, task: str, goal: str, context: dict) -> dict:
        """どのツールを使うか決定し、実行します。"""
        
        prompt = (
            f"あなたは {self.role} です。あなたの目標は、全体のユーザーゴールを達成するために、特定のサブタスクを実行することです。\n"
            f"ユーザーゴール: {goal}\n"
            f"具体的なタスク: {task}\n\n"
            "以下のツールにアクセスできます：\n"
            + "\n".join([f"- {name}: {desc}" for name, desc in self.tool_descriptions.items()]) + "\n\n"
            "最近のコンテキスト:\n" + json.dumps(context, indent=2, ensure_ascii=False) + "\n\n"
            "タスクを分析し、最初の手順を決定してください。思考と回答は常に日本語で行ってください。\n"
            "結果はJSON形式で、'tool_name'（ツール名）と 'arguments'（引数の辞書）を指定して出力してください。\n"
            "ツールが不要な場合や直接回答できる場合は、'tool_name' を 'none' に設定し、'answer' に回答を含めてください。"
        )

        messages = [
            system_message(prompt),
            user_message(f"Provide instructions for task: {task}")
        ]
        
        response_text = call_llm(messages, response_format="json")
        try:
            data = json.loads(response_text)
            tool_name = data.get("tool_name")
            args = data.get("arguments", {})
            
            if tool_name == "none":
                return {"status": "success", "result": data.get("answer", "No tool used."), "tool": "none"}
                
            if tool_name and tool_name in self.tools:
                print(f"[Executor] Calling tool '{tool_name}' with: {args}")
                result = self.tools[tool_name](**args)
                return {"status": "success", "result": result, "tool": tool_name}
            else:
                return {"status": "error", "message": f"Tool '{tool_name}' not found or execution failed.", "tool": tool_name}
                
        except Exception as e:
            return {"status": "error", "message": f"Failed to parse or execute: {str(e)}", "response": response_text}
