#!/usr/bin/env python3
"""
42Drive - Server Launcher
Builds and starts the Next.js production server, displaying the local URL.
"""

import subprocess
import sys
import os
import time
import signal
import socket

# ─── Configuration ────────────────────────────────────────────────────────────
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", 3000))
HOST = "0.0.0.0"

# Colors for terminal output
class C:
    BLUE    = "\033[94m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    RED     = "\033[91m"
    CYAN    = "\033[96m"
    BOLD    = "\033[1m"
    DIM     = "\033[2m"
    RESET   = "\033[0m"


def banner():
    print(f"""
{C.CYAN}{C.BOLD}
  ██╗  ██╗██████╗ ██████╗ ██████╗ ██╗██╗   ██╗███████╗
  ██║  ██║╚════██╗██╔══██╗██╔══██╗██║██║   ██║██╔════╝
  ███████║ █████╔╝██║  ██║██████╔╝██║██║   ██║█████╗
  ╚════██║██╔═══╝ ██║  ██║██╔══██╗██║╚██╗ ██╔╝██╔══╝
       ██║███████╗██████╔╝██║  ██║██║ ╚████╔╝ ███████╗
       ╚═╝╚══════╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝  ╚══════╝
{C.RESET}
{C.DIM}  Personal Cloud Storage — Powered by Azure{C.RESET}
""")


def get_local_ip():
    """Get the machine's local network IP."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def run(cmd: list[str], label: str) -> bool:
    """Run a subprocess command with a labeled status."""
    print(f"\n{C.YELLOW}⏳ {label}...{C.RESET}")
    result = subprocess.run(cmd, cwd=PROJECT_DIR, shell=(os.name == "nt"))
    if result.returncode != 0:
        print(f"{C.RED}✖  {label} failed (exit code {result.returncode}){C.RESET}")
        return False
    print(f"{C.GREEN}✔  {label} complete{C.RESET}")
    return True


def check_dependencies():
    """Ensure node_modules exists."""
    node_modules = os.path.join(PROJECT_DIR, "node_modules")
    if not os.path.isdir(node_modules):
        print(f"{C.YELLOW}📦 node_modules not found — installing dependencies...{C.RESET}")
        if not run(["npm", "install"], "Installing dependencies"):
            sys.exit(1)
    else:
        print(f"{C.GREEN}✔  Dependencies already installed{C.RESET}")


def build():
    """Build the Next.js production bundle."""
    if not run(["npm", "run", "build"], "Building production bundle"):
        sys.exit(1)


def start_server():
    """Start the Next.js production server."""
    local_ip = get_local_ip()

    print(f"""
{C.BOLD}{'─' * 56}{C.RESET}
{C.GREEN}{C.BOLD}  ✔  42Drive is ready!{C.RESET}

  {C.BOLD}Local:{C.RESET}     {C.CYAN}http://localhost:{PORT}{C.RESET}
  {C.BOLD}Network:{C.RESET}   {C.CYAN}http://{local_ip}:{PORT}{C.RESET}

{C.DIM}  Press Ctrl+C to stop the server{C.RESET}
{C.BOLD}{'─' * 56}{C.RESET}
""")

    env = os.environ.copy()
    env["PORT"] = str(PORT)
    env["HOSTNAME"] = HOST

    try:
        process = subprocess.Popen(
            ["npm", "run", "start"],
            cwd=PROJECT_DIR,
            env=env,
            shell=(os.name == "nt"),
        )

        def handle_signal(sig, frame):
            print(f"\n{C.YELLOW}⏹  Shutting down 42Drive...{C.RESET}")
            process.terminate()
            process.wait(timeout=10)
            print(f"{C.GREEN}✔  Server stopped.{C.RESET}")
            sys.exit(0)

        signal.signal(signal.SIGINT, handle_signal)
        signal.signal(signal.SIGTERM, handle_signal)

        process.wait()
    except Exception as e:
        print(f"{C.RED}✖  Server error: {e}{C.RESET}")
        sys.exit(1)


def main():
    banner()
    check_dependencies()
    build()
    start_server()


if __name__ == "__main__":
    main()
