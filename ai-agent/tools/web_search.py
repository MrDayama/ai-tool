from duckduckgo_search import DDGS

def web_search(query: str, max_results: int = 5) -> str:
    """Perform a web search using DuckDuckGo."""
    results = []
    with DDGS() as ddgs:
        for r in ddgs.text(query, max_results=max_results):
            results.append(f"Title: {r['title']}\nLink: {r['href']}\nSnippet: {r['body']}")
    
    if not results:
        return "No results found."
    return "\n\n".join(results)
