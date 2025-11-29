import requests
import json

codes = ["120503"]

results = {}

for code in codes:
    try:
        response = requests.get(f"https://api.mfapi.in/mf/{code}")
        if response.status_code == 200:
            data = response.json()
            results[code] = {
                "meta_keys": list(data.get("meta", {}).keys()),
                "meta": data.get("meta", {}),
                "data_len": len(data.get("data", []))
            }
        else:
            results[code] = "Failed"
    except Exception as e:
        results[code] = str(e)

print(json.dumps(results, indent=2))
