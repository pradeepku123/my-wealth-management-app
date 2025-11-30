# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are
currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Use this section to tell people how to report a vulnerability.

Tell them where to go, how often they can expect to get an update on a
reported vulnerability, what to expect if the vulnerability is accepted or
rejected, etc.

## Security Scanning Framework

This project includes a security scanning framework to identify potential vulnerabilities in both the backend and frontend.

### Prerequisites

- Python 3.x
- Node.js & npm

### Running the Scan

To run the full security scan, execute the `security_scan.sh` script from the root directory:

```bash
./security_scan.sh
```

### Tools Used

- **Backend**:
  - [Bandit](https://github.com/PyCQA/bandit): A tool designed to find common security issues in Python code.
  - [Safety](https://github.com/pyupio/safety): Checks installed dependencies for known security vulnerabilities.

- **Frontend**:
  - `npm audit`: Scans your project for vulnerabilities in npm dependencies.

### Continuous Integration

This script is designed to be easily integrated into CI/CD pipelines (e.g., GitHub Actions, Jenkins) to ensure security checks are performed on every commit or pull request.
