#!/bin/bash

REPORT_FILE="security_report.html"

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting Security Scan and generating HTML report...${NC}"

# Start HTML Report
cat <<EOF > "$REPORT_FILE"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Vulnerability Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; line-height: 1.6; color: #333; background-color: #f9f9f9; }
        .container { max-width: 1200px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-top: 0; }
        h2 { color: #34495e; margin-top: 40px; background: #f8f9fa; padding: 12px 15px; border-left: 5px solid #3498db; border-radius: 0 4px 4px 0; }
        h3 { color: #555; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        pre { background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 6px; overflow-x: auto; font-family: 'Consolas', 'Monaco', monospace; font-size: 14px; border: 1px solid #444; }
        .timestamp { color: #7f8c8d; font-size: 0.9em; margin-bottom: 30px; font-style: italic; }
        .status-pass { color: #27ae60; font-weight: bold; }
        .status-fail { color: #c0392b; font-weight: bold; }
        .toc { background: #e8f6f3; padding: 15px; border-radius: 5px; border: 1px solid #a2d9ce; margin-bottom: 30px; }
        .toc ul { margin: 0; padding-left: 20px; }
        .toc li { margin-bottom: 5px; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Security Vulnerability Report</h1>
        <div class="timestamp">Generated on: $(date)</div>

        <div class="toc">
            <h3>Table of Contents</h3>
            <ul>
                <li><a href="#backend">Backend Security Scan (Python)</a></li>
                <li><a href="#frontend">Frontend Security Scan (Angular/NPM)</a></li>
            </ul>
        </div>
EOF

# Backend Scan
echo -e "${GREEN}Running Backend Scan...${NC}"
echo "<h2 id='backend'>Backend Security Scan (Python)</h2>" >> "$REPORT_FILE"

if command -v python3 &> /dev/null; then
    # Setup venv
    python3 -m venv .security_venv
    source .security_venv/bin/activate
    pip install -r backend/requirements-security.txt > /dev/null 2>&1

    # Bandit
    echo "<h3>Bandit (Static Application Security Testing)</h3>" >> "$REPORT_FILE"
    echo "<p>Scans Python code for common security issues.</p>" >> "$REPORT_FILE"
    echo "<pre>" >> "$REPORT_FILE"
    bandit -r backend -x backend/tests,backend/venv,.security_venv -f txt >> "$REPORT_FILE" 2>&1
    echo "</pre>" >> "$REPORT_FILE"

    # Safety
    echo "<h3>Safety (Dependency Vulnerability Check)</h3>" >> "$REPORT_FILE"
    echo "<p>Checks installed dependencies for known security vulnerabilities.</p>" >> "$REPORT_FILE"
    echo "<pre>" >> "$REPORT_FILE"
    safety check -r backend/requirements.txt >> "$REPORT_FILE" 2>&1
    echo "</pre>" >> "$REPORT_FILE"

    deactivate
    rm -rf .security_venv
else
    echo "<p style='color:red'>Python3 not found. Skipped backend scan.</p>" >> "$REPORT_FILE"
fi

# Frontend Scan
echo -e "${GREEN}Running Frontend Scan...${NC}"
echo "<h2 id='frontend'>Frontend Security Scan (Angular/NPM)</h2>" >> "$REPORT_FILE"

if command -v npm &> /dev/null; then
    echo "<h3>NPM Audit</h3>" >> "$REPORT_FILE"
    echo "<p>Scans for vulnerabilities in npm dependencies.</p>" >> "$REPORT_FILE"
    echo "<pre>" >> "$REPORT_FILE"
    cd frontend/wealth-frontend
    npm audit >> "../../$REPORT_FILE" 2>&1
    cd ../..
    echo "</pre>" >> "$REPORT_FILE"
else
    echo "<p style='color:red'>npm not found. Skipped frontend scan.</p>" >> "$REPORT_FILE"
fi

# Close HTML
cat <<EOF >> "$REPORT_FILE"
    </div>
</body>
</html>
EOF

echo -e "${YELLOW}Report generated successfully: ${GREEN}$REPORT_FILE${NC}"
