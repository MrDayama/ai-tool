import logging
from rich.logging import RichHandler
from rich.console import Console

console = Console()

def setup_logger(name="ai-agent"):
    logging.basicConfig(
        level=logging.INFO,
        format="%(message)s",
        datefmt="[%X]",
        handlers=[RichHandler(rich_tracebacks=True, console=console)]
    )
    return logging.getLogger(name)

logger = setup_logger()
def log_info(msg): logger.info(msg)
def log_warning(msg): logger.warning(msg)
def log_error(msg): logger.error(msg)
def log_debug(msg): logger.debug(msg)
