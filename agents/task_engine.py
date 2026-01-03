import os, json
from rich import print
from datetime import datetime
from ai_writer import write_code_for_task

MEMORY_PATH = "memory_index.json"
LOG_PATH = f"agent_log_{datetime.now().strftime('%Y%m%d_%H%M')}.txt"

def load_memory():
    return json.load(open(MEMORY_PATH)) if os.path.exists(MEMORY_PATH) else {}

def scan_project():
    scanned = {}
    for root, dirs, files in os.walk("/var/www/html/gcz"):
        for file in files:
            if file.endswith((".ts", ".js", ".py", ".sql")):
                path = os.path.join(root, file)
                with open(path, 'r', errors='ignore') as f:
                    content = f.read()
                scanned[path] = {
                    "size": len(content),
                    "content": content[:400]
                }
    return scanned

def detect_issues(memory, scan):
    issues = []
    for path, data in scan.items():
        if "TODO" in data["content"] or "fixme" in data["content"].lower():
            issues.append((path, "TODO or fixme found"))
    return issues

def prompt_approval(issues):
    print(f"[bold cyan]\n🧠 Found {len(issues)} possible code tasks:\n[/bold cyan]")
    for i, (file, desc) in enumerate(issues):
        print(f"[{i+1}] {file} → {desc}")
    choice = input("\nApprove fixes? (a)ll / (s)ome / (n)one: ").lower()
    if choice == "a":
        return list(range(len(issues)))
    elif choice == "s":
        indexes = input("Enter task numbers (comma-separated): ")
        return [int(i)-1 for i in indexes.split(",") if i.strip().isdigit()]
    else:
        return []

def reload_pm2():
    services = ["gcz-api", "gcz-bot", "gcz-redirect", "gcz-drops", "gcz-discord", "gcz-watchdog"]
    print("\n[bold green]♻️ Reloading PM2 Services...[/bold green]")
    for svc in services:
        os.system(f"pm2 reload {svc}")

def run():
    memory = load_memory()
    scan = scan_project()
    issues = detect_issues(memory, scan)
    approved = prompt_approval(issues)

    if not approved:
        print("[yellow]⚠️ No actions approved.[/yellow]")
        return

    with open(LOG_PATH, "w") as log:
        for i in approved:
            file, desc = issues[i]
            print(f"✍️ Writing fix for: {file}...")
            result = write_code_for_task(file)
            log.write(f"{file} - {desc}\n{result}\n\n")
        print(f"[green]✅ Tasks complete. Log: {LOG_PATH}[/green]")

    reload_pm2()

if __name__ == "__main__":
    run()
