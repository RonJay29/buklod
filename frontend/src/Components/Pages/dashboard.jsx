import { useEffect, useRef } from "react";
import {
  Chart,
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Filler, Tooltip, Legend);

const pageDescriptions = {
  Dashboard:        "Track, and monitor your devices.",
  "Manage Devices": "Add, edit, and monitor your connected devices.",
  "Device's Data":  "View and export data from your devices.",
  Ledger:           "Full transaction and activity log.",
  Conversions:      "Monitor funnel and conversion performance.",
  "Real-time":      "Live activity across your platform.",
  Settings:         "Manage your account and preferences.",
};

const kpiData = [
  { label: "Total Devices",        value: "3"        },
  { label: "Total Data",           value: "21"       },
  { label: "Transactions",         value: "21"       },
  { label: "Certificate Validity", value: "730 Days" },
];

const weekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const weeklyData = {
  datasets: [
    {
      label: "Village I",
      data: [12, 9, 14, 11, 15, 8, 13],
      borderColor: "rgb(59, 130, 246)",
      backgroundColor: "rgba(59, 130, 246, 0.06)",
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    },
    {
      label: "Village II",
      data: [8, 13, 10, 16, 12, 14, 9],
      borderColor: "rgb(99, 102, 241)",
      backgroundColor: "rgba(99, 102, 241, 0.06)",
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    },
    {
      label: "Village III",
      data: [5, 7, 9, 8, 11, 6, 10],
      borderColor: "rgb(16, 185, 129)",
      backgroundColor: "rgba(16, 185, 129, 0.06)",
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    },
  ],
};

function WeeklyChart() {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: weekLabels,
        datasets: weeklyData.datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              font: { size: 11 },
              boxWidth: 10,
              boxHeight: 10,
              color: "#94a3b8",
              useBorderRadius: true,
              borderRadius: 2,
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: "#1e293b",
            titleColor: "#94a3b8",
            bodyColor: "#f1f5f9",
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} packets`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: "#94a3b8" },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: "#f1f5f9", lineWidth: 1 },
            ticks: {
              font: { size: 11 },
              color: "#94a3b8",
              stepSize: 4,
              callback: (v) => `${v}`,
            },
            border: { display: false },
          },
        },
      },
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "280px" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default function Dashboard({ activePage }) {
  const description = pageDescriptions[activePage] || "Welcome to Buklod Analytics.";

  return (
    <div className="flex flex-col gap-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-1 hover:shadow-md hover:shadow-blue-100 hover:border-blue-200 transition-all duration-200"
          >
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              {kpi.label}
            </span>
            <span className="text-2xl font-semibold text-slate-800 font-mono tracking-tight">
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* Main Panel */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-8 flex flex-col gap-4">

        {/* Panel header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-medium text-slate-800">Data Received This Week</h2>
            <p className="text-sm text-slate-400 mt-0.5">Data transmitted per device — weekly view</p>
          </div>
          <div className="flex gap-2">
            {["Week", "Month", "Quarter", "Year"].map((p, i) => (
              <button
                key={p}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  i === 0
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <WeeklyChart />
        </div>

        {/* Table */}
        <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-3 bg-slate-50 px-5 py-2.5 text-[11px] uppercase tracking-wider text-slate-400 font-medium border-b border-slate-200">
            <span>Device Name</span><span>Event</span><span>Received</span>
          </div>
          {["Village I Sensors","Village II Sensors","Village III Sensors","Village IV Sensors","Village V Sensors"].map((name, i) => (
            <div
              key={name}
              className="grid grid-cols-3 px-5 py-3 border-t border-slate-100 text-sm text-slate-700 hover:bg-blue-50/50 transition"
            >
              <span className="font-medium">{name}</span>
              <span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  Transmitted Data
                </span>
              </span>
              <span className="text-gray-700 text-xs">March {20 - i}, 2026</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}