from pypdf import PdfReader
import re

def analyze_pdf(file_path):
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        print(f"Total characters: {len(text)}")
        print("-" * 20)
        # Print valid lines to see structure
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        # Look for return related sections
        print("--- SEARCHING FOR RETURNS ---")
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in ["return", "performance", "cagr", "rolling"]):
                print(f"Match at line {i}: {line}")
                # Print context
                for j in range(1, 6):
                    if i+j < len(lines):
                        print(f"  + {lines[i+j]}")
                print("-" * 10)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_pdf("sample.pdf")
