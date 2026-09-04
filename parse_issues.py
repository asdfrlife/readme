import json
import sys

def main():
    try:
        with open('sonar-issues.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON: {e}")
        return

    issues = data.get('issues', [])
    print(f"Found {len(issues)} issues.")
    
    with open('parsed-issues.md', 'w', encoding='utf-8') as f:
        for i, issue in enumerate(issues):
            comp = issue.get('component', '').replace('asdfrlife_readme:', '')
            line = issue.get('line')
            msg = issue.get('message')
            rule = issue.get('rule')
            severity = issue.get('severity')
            f.write(f"### {i+1}. {comp} (Line {line})\n")
            f.write(f"- **Rule**: {rule} ({severity})\n")
            f.write(f"- **Message**: {msg}\n\n")

if __name__ == '__main__':
    main()
