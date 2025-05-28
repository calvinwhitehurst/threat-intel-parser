import argparse
import requests
import json
import csv
from datetime import datetime
from colorama import Fore, Style

def fetch_abuseipdb_blocklist():
    url = "https://raw.githubusercontent.com/stamparm/ipsum/master/ipsum.txt"
    print(f"{Fore.YELLOW}[+] Fetching blocklist from AbuseIPDB...{Style.RESET_ALL}")
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        ips = [line for line in response.text.strip().split('\n') if line and not line.startswith("#")]
        return ips
    except requests.RequestException as e:
        print(f"{Fore.RED}[-] Error fetching IP list: {e}{Style.RESET_ALL}")
        return []

def fetch_alienvault_pulses():
    print(f"{Fore.YELLOW}[+] Fetching sample IOCs from AlienVault OTX...{Style.RESET_ALL}")
    try:
        url = "https://raw.githubusercontent.com/AlienVault-OTX/OTX-Data/master/Pulse%20Samples/malware-sample-iocs.txt"
        response = requests.get(url)
        response.raise_for_status()
        iocs = [line for line in response.text.strip().split('\n') if line and not line.startswith("#")]
        return iocs
    except requests.RequestException as e:
        print(f"{Fore.RED}[-] Error fetching OTX data: {e}{Style.RESET_ALL}")
        return []

    
def save_to_json(iocs, filename, source, ioc_type="IPv4"):
    print(f"{Fore.GREEN}[+] Saving {len(iocs)} entries to {filename}{Style.RESET_ALL}")
    data = {
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "ioc_type": ioc_type,
        "source": source,
        "data": iocs
    }
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)
        
def save_to_csv(iocs, filename):
    print(f"{Fore.CYAN}[+] Also saving as CSV to {filename}{Style.RESET_ALL}")
    with open(filename, "w", newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["IOC"])
        for ioc in iocs:
            writer.writerow([ioc])
        

def main():
    parser = argparse.ArgumentParser(description="Cyber Threat Intel Parser CLI")
    parser.add_argument("--source", choices=["abuseipdb", "alienvault"], default="abuseipdb",
                        help="Choose the IOC source feed")
    parser.add_argument("--output", default="iocs.json", help="Output JSON file name")
    parser.add_argument("--csv", action="store_true", help="Also export IOCs to CSV")

    args = parser.parse_args()

    if args.source == "abuseipdb":
        iocs = fetch_abuseipdb_blocklist()
        source = "AbuseIPDB Ipsum Feed"
    elif args.source == "alienvault":
        iocs = fetch_alienvault_pulses()
        source = "AlienVault OTX Sample Pulse"

    if iocs:
        save_to_json(iocs, args.output, source)
        if args.csv:
            csv_filename = args.output.replace(".json", ".csv")
            save_to_csv(iocs, csv_filename)
    
if __name__ == "__main__":
    main()