/* Draw a simple live comparison of today's and all-time earnings. */
window.renderEarningsChart = function(today, total) {
  const chart = document.getElementById("earningsChart");
  if (!chart) return;
  const values = [
    { label: "Today", value: Math.max(0, Number(today) || 0), className: "today" },
    { label: "All-time total", value: Math.max(0, Number(total) || 0), className: "total" }
  ];
  const max = Math.max(values[0].value, values[1].value, 1);
  chart.replaceChildren();
  values.forEach(item => {
    const column = document.createElement("div");
    column.className = "chart-column " + item.className;
    const value = document.createElement("div");
    value.className = "chart-value";
    value.textContent = item.value.toLocaleString(undefined, { maximumFractionDigits: 4 }) + " points";
    const wrap = document.createElement("div");
    wrap.className = "chart-bar-wrap";
    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.height = (item.value > 0 ? Math.max(5, item.value / max * 130) : 5) + "px";
    wrap.appendChild(bar);
    const label = document.createElement("div");
    label.className = "chart-label";
    label.textContent = item.label;
    column.append(value, wrap, label);
    chart.appendChild(column);
  });
};