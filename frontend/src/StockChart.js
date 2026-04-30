import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-date">{label}</p>
        <p className="tooltip-price">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

function StockChart({ symbol, darkMode }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={symbol} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: darkMode ? "#9ba8c0" : "#4a5568" }}
          tickFormatter={(d) => {
            const date = new Date(d);
            return `${date.toLocaleString("default", { month: "short" })} ${date.getDate()}`;
          }}
          interval={4}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: darkMode ? "#9ba8c0" : "#4a5568" }}
          tickFormatter={(v) => `$${v.toFixed(0)}`}
          axisLine={false}
          tickLine={false}
          domain={["auto", "auto"]}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#6366f1"
          strokeWidth={2.5}
          fill="url(#priceGradient)"
          dot={false}
          activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default StockChart;