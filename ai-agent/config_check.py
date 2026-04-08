import os
import sys
from dotenv import load_dotenv
from openai import OpenAI
from rich.console import Console
from rich.panel import Panel

console = Console()

def check_env():
    load_dotenv()
    
    status = True
    
    # Check OpenAI API Key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        console.print("[red]✘ ERROR: OPENAI_API_KEY is not set in .env[/red]")
        status = False
    else:
        console.print("[green]✔ SUCCESS: OPENAI_API_KEY is configured[/green]")
        
    # Check Model Name
    model_name = os.getenv("MODEL_NAME", "gpt-4-turbo-preview")
    console.print(f"[blue]ℹ INFO: Using model '{model_name}'[/blue]")
    
    # Check Dependencies installed
    try:
        import openai
        import rich
        import dotenv
        import duckduckgo_search
        console.print("[green]✔ SUCCESS: Core dependencies are installed[/green]")
    except ImportError as e:
        console.print(f"[red]✘ ERROR: Missing dependency: {str(e)}[/red]")
        status = False
        
    return status

def test_api_connection():
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    model_name = os.getenv("MODEL_NAME", "gpt-4-turbo-preview")
    
    if not api_key:
        return
        
    client = OpenAI(api_key=api_key)
    console.print("[yellow]Testing API connection...[/yellow]")
    
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": "Hello, are you online?"}],
            max_tokens=10
        )
        console.print(f"[green]✔ SUCCESS: API connection verified. Response: {response.choices[0].message.content}[/green]")
    except Exception as e:
        console.print(f"[red]✘ ERROR: API connection failed: {str(e)}[/red]")
        return False
        
    return True

if __name__ == "__main__":
    console.print(Panel("[bold cyan]AI Agent Configuration Health Check[/bold cyan]"))
    
    env_ok = check_env()
    if env_ok:
        api_ok = test_api_connection()
        if api_ok:
            console.print("\n[bold green]Ready for takeoff! 🚀[/bold green]")
        else:
            console.print("\n[bold red]API issues found. Fix them before running main.py[/bold red]")
    else:
        console.print("\n[bold red]Environment issues found. Run 'python setup.py' first.[/bold red]")
