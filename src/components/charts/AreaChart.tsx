"use client";

import React, { useEffect } from 'react';

interface AreaChartProps {
  className?: string;
  data?: Array<{ date: string; attendance: number; classes: number; present: number }>;
  title?: string;
  description?: string;
}

export function AreaChart({ className = '', data = [], title = "Attendance Trend", description = "Daily attendance percentage over time" }: AreaChartProps) {
  useEffect(() => {
    const renderChart = async () => {
      // Wait for DOM to be ready
      if (typeof window === 'undefined') return;

      const checkElement = () => document.getElementById("legend-chart");

      // Retry up to 5 times with increasing delay
      let attempts = 0;
      const maxAttempts = 5;

      const tryRender = async () => {
        attempts++;
        const chartElement = checkElement();

        if (!chartElement) {
          if (attempts < maxAttempts) {
            setTimeout(tryRender, attempts * 100); // Increasing delay
            return;
          } else {
            console.warn('Area chart element not found after', maxAttempts, 'attempts, skipping render');
            return;
          }
        }

        try {
          // Try to import ApexCharts
          let ApexCharts: any = null;
          try {
            ApexCharts = (await import('apexcharts')).default;
          } catch (e) {
            console.warn('ApexCharts not available, skipping chart render');
            return;
          }

          // Prepare data for ApexCharts
          const chartData = data.length > 0 ? data.map(item => item.attendance || 0) : [75, 82, 78, 85, 80, 88, 90];
          const categories = data.length > 0 ? data.map(item => item.date) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

          const options = {
            series: [
              {
                name: "Attendance %",
                data: chartData,
                color: "#3b82f6",
              },
            ],
            chart: {
              height: 120, // Fixed pixel height to fit container
              width: "100%",
              type: "area",
              fontFamily: "Inter, sans-serif",
              dropShadow: {
                enabled: false,
              },
              toolbar: {
                show: false,
              },
            },
            tooltip: {
              enabled: true,
              x: {
                show: true,
              },
            },
            legend: {
              show: false
            },
            fill: {
              type: "gradient",
              gradient: {
                opacityFrom: 0.55,
                opacityTo: 0.1,
                shade: "#3b82f6",
                gradientToColors: ["#3b82f6"],
              },
            },
            dataLabels: {
              enabled: false,
            },
            stroke: {
              width: 3,
            },
            grid: {
              show: true,
              strokeDashArray: 4,
              padding: {
                left: 2,
                right: 2,
                top: 0,
                bottom: 0
              },
            },
            xaxis: {
              categories: categories,
              labels: {
                show: true,
                style: {
                  colors: 'currentColor',
                  fontSize: '12px'
                }
              },
              axisBorder: {
                show: false,
              },
              axisTicks: {
                show: false,
              },
            },
            yaxis: {
              show: true,
              min: 0,
              max: 100,
              labels: {
                formatter: function (value: number) {
                  return value + '%';
                },
                style: {
                  colors: 'currentColor',
                  fontSize: '12px'
                }
              }
            },
          };

          const chart = new ApexCharts(document.getElementById("legend-chart"), options);
          chart.render();

          // Theme-aware cleanup - remove problematic DOM manipulation
          return () => {
            if (chart) {
              chart.destroy();
            }
          };
        } catch (error) {
          console.error('Error rendering area chart:', error);
        }
      };

      // Start the retry process
      tryRender();
    };

    renderChart();
  }, [data]);

  const averageAttendance = data.length > 0
    ? Math.round((data.reduce((sum, item) => sum + item.present, 0) / data.reduce((sum, item) => sum + item.classes, 0)) * 100)
    : 85;
  const trend = averageAttendance >= 80 ? 'up' : averageAttendance >= 70 ? 'stable' : 'down';

  return (
    <div className={`max-w-sm w-full bg-card rounded-lg shadow-sm border p-4 md:p-6 ${className}`}>
      <div className="flex justify-between mb-5">
        <div>
          <h5 className="leading-none text-3xl font-bold text-foreground pb-2">{averageAttendance}%</h5>
          <p className="text-base font-normal text-muted-foreground">{title}</p>
        </div>
        <div className={`flex items-center px-2.5 py-0.5 text-base font-semibold text-center ${
          trend === 'up' ? 'text-green-600 dark:text-green-500' :
          trend === 'stable' ? 'text-blue-600 dark:text-blue-500' :
          'text-red-600 dark:text-red-500'
        }`}>
          {trend === 'up' ? '+' : trend === 'stable' ? '~' : '-'}
          <svg className="w-3 h-3 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 14">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d={trend === 'up' ? "M5 13V1m0 0L1 5m4-4 4 4" : "M5 1v12m0 0l4-4m-4 4L1 9"}/>
          </svg>
        </div>
      </div>
      <div id="legend-chart" className="h-32 flex items-center justify-center bg-muted/20 rounded overflow-hidden">
        <div className="text-center text-muted-foreground">
          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          <p className="text-sm">{data.length > 0 ? 'Loading chart...' : 'No data available'}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 items-center border-border border-t justify-between mt-5">
        <div className="flex justify-between items-center pt-5">
          <button
            id="dropdownDefaultButton"
            data-dropdown-toggle="lastDaysdropdown"
            data-dropdown-placement="bottom"
            className="text-sm font-medium text-muted-foreground hover:text-foreground text-center inline-flex items-center"
            type="button">
            {data.length > 0 ? `${data.length} days` : 'Last 7 days'}
          </button>
        </div>
      </div>
    </div>
  );
}
