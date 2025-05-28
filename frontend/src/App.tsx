import React, { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { debounce } from "./utils/debounce";

interface IOC {
  ip: string;
  score: number;
}

interface IOCResponse {
  fetched_at: string;
  ioc_type: string;
  source: string;
  data: IOC[];
}

const App: React.FC = () => {
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [filtered, setFiltered] = useState<IOC[]>([]);
  const [search, setSearch] = useState<string>("");
  const [source, setSource] = useState("abuseipdb");

  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/iocs?source=${source}`)
    .then((res) => res.json())
    .then((json: IOCResponse) => {
      setIocs(json.data);
      setFiltered(json.data);
    })
    .catch((err) => console.error("Failed to load data:", err));
  }, [source]);
  const handleSearch = debounce((value: string) => {
    const lower = value.toLowerCase();
    setFiltered(iocs.filter(ioc => ioc.ip.toLowerCase().includes(lower)));
  }, 300);

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">IOC Threat Intel Viewer</h1>
        <div className="mb-4">
          <label className="label font-bold">Select IOC Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="select select-bordered w-full max-w-xs"
          >
            <option value="abuseipdb">AbuseIPDB</option>
            <option value="alienvault">AlienVault (demo)</option>
          </select>
        </div>
      <input
        type="text"
        placeholder="Search IPs..."
        className="input input-bordered input-primary w-full mb-4"
        onChange={(e) => {
          setSearch(e.target.value);
          handleSearch(e.target.value);
        }}
        value={search}
      />

      <div
        ref={parentRef}
        className="h-[600px] overflow-auto border rounded-lg bg-base-100"
      >
        <table className="table table-zebra w-full">
          <thead className="sticky top-0 z-10 bg-base-200">
            <tr>
              <th>#</th>
              <th>IP Address</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const ioc = filtered[virtualRow.index];

              let severityClass = "";
              if (ioc.score >= 9) {
                severityClass = "bg-red-200";
              } else if (ioc.score >= 7) {
                severityClass = "bg-yellow-100";
              } else {
                severityClass = "bg-green-100";
              }

              return (
                <tr
                  key={virtualRow.key}
                  className={`${severityClass}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <td>{virtualRow.index + 1}</td>
                  <td>{ioc.ip}</td>
                  <td>{ioc.score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-gray-400">
        Showing {filtered.length} of {iocs.length} IOCs
      </p>
    </div>
  );
};

export default App;
