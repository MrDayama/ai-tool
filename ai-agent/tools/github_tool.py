import requests
import os

class GitHubTool:
    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN")
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github.v3+json"
        }

    def list_repositories(self) -> str:
        """ユーザーのリポジトリ一覧を取得します。"""
        if not self.token: return "エラー: GITHUB_TOKENが設定されていません。"
        url = f"{self.base_url}/user/repos"
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            repos = response.json()
            return "\n".join([r['full_name'] for r in repos])
        return f"エラー: {response.status_code} - {response.text}"

    def create_issue(self, repo: str, title: str, body: str = "") -> str:
        """指定したリポジトリにIssueを作成します。"""
        if not self.token: return "エラー: GITHUB_TOKENが設定されていません。"
        url = f"{self.base_url}/repos/{repo}/issues"
        data = {"title": title, "body": body}
        response = requests.post(url, headers=self.headers, json=data)
        if response.status_code == 201:
            return f"Issue作成成功: {response.json()['html_url']}"
        return f"エラー: {response.status_code} - {response.text}"

    def get_repo_contents(self, repo: str, path: str = "") -> str:
        """リポジト内のファイル構成を取得します。"""
        if not self.token: return "エラー: GITHUB_TOKENが設定されていません。"
        url = f"{self.base_url}/repos/{repo}/contents/{path}"
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            contents = response.json()
            if isinstance(contents, list):
                return "\n".join([f"{c['type']}: {c['path']}" for c in contents])
            return f"file: {contents['path']}"
        return f"エラー: {response.status_code} - {response.text}"

# インスタンス化してツールとして公開
github_tool = GitHubTool()

def list_repos():
    return github_tool.list_repositories()

def create_github_issue(repo, title, body=""):
    return github_tool.create_issue(repo, title, body)

def get_contents(repo, path=""):
    return github_tool.get_repo_contents(repo, path)
