"use client";

import React, { useEffect } from 'react';

interface ColumnChartProps {
  className?: string;
  data?: Array<{ subject: string; attendance: number; present: number; absent: number }>;
  title?: string;
  description?: string;
}

export function ColumnChart({ className = '', data = [], title = "Subject-wise Performance", description = "Attendance breakdown by subject" }: ColumnChartProps) {
  useEffect(() => {
    const renderChart = async () => {
      // Wait for DOM to be ready
      if (typeof window === 'undefined') return;

      const checkElement = () => document.getElementById("column-chart");

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
            console.warn('Column chart element not found after', maxAttempts, 'attempts, skipping render');
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
          const chartData = data.length > 0 ? data.map(item => Math.round(item.attendance)) : [85, 78, 92, 88, 76, 90, 82];
          const categories = data.length > 0 ? data.map(item => item.subject.substring(0, 10) + (item.subject.length > 10 ? '...' : '')) : ['CN', 'DBMS', 'OS', 'DSA', 'Math', 'Physics', 'Chem'];

          const options = {
            colors: ["#3b82f6"],
            series: [
              {
                name: "Attendance %",
                color: "#3b82f6",
                data: chartData,
              },
            ],
            chart: {
              type: "bar",
              height: 280, // Fixed pixel height to fit container
              width: "100%",
              fontFamily: "Inter, sans-serif",
              toolbar: {
                show: false,
              },
            },
            plotOptions: {
              bar: {
                horizontal: false,
                columnWidth: "70%",
                borderRadiusApplication: "end",
                borderRadius: 8,
              },
            },
            tooltip: {
              shared: true,
              intersect: false,
              style: {
                fontFamily: "Inter, sans-serif",
              },
            },
            states: {
              hover: {
                filter: {
                  type: "darken",
                  value: 1,
                },
              },
            },
            stroke: {
              show: true,
              width: 0,
              colors: ["transparent"],
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
            dataLabels: {
              enabled: false,
            },
            legend: {
              show: false,
            },
            xaxis: {
              floating: false,
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
            fill: {
              opacity: 1,
            },
          };

          const chart = new ApexCharts(document.getElementById("column-chart"), options);
          chart.render();

          // Theme-aware cleanup - remove problematic DOM manipulation
          return () => {
            if (chart) {
              chart.destroy();
            }
          };
        } catch (error) {
          console.error('Error loading ApexCharts:', error);
        }
      };

      // Start the retry process
      tryRender();
    };

    renderChart();
  }, [data]);

  const averageAttendance = data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.attendance, 0) / data.length) : 85;
  const totalLeads = data.length > 0 ? data.reduce((sum, item) => sum + item.present, 0) : 3420;

  return (
    <div className={`max-w-sm w-full bg-card rounded-lg shadow-sm border p-4 md:p-6 ${className}`}>
      <div className="flex justify-between pb-4 mb-4 border-b border-border">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center me-3">
            <svg className="w-6 h-6 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 19">
              <path d="M14.5 0A3.987 3.987 0 0 0 11 2.1a4.977 4.977 0 0 1 3.9 5.858A3.989 3.989 0 0 0 14.5 0ZM9 13h2a4 4 0 0 1 4 4v2H5v-2a4 4 0 0 1 4-4Z"/>
              <path d="M5 19h10v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2ZM5 7a5.008 5.008 0 0 1 4-4.9 3.988 3.988 0 1 0-3.9 5.859A4.974 4.974 0 0 1 5 7Zm5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5-1h-.424a5.016 5.016 0 0 1-1.942 2.232A6.007 6.007 0 0 1 17 17h2a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5ZM5.424 9H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h2a6.007 6.007 0 0 1 4.366-5.768A5.016 5.016 0 0 1 5.424 9Z"/>
            </svg>
          </div>
          <div>
            <h5 className="leading-none text-2xl font-bold text-foreground pb-1">{totalLeads}</h5>
            <p className="text-sm font-normal text-muted-foreground">Classes attended this week</p>
          </div>
        </div>
        <div>
          <span className="bg-green-100 text-green-800 text-xs font-medium inline-flex items-center px-2.5 py-1 rounded-md dark:bg-green-900 dark:text-green-300">
            <svg className="w-2.5 h-2.5 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13V1m0 0L1 5m4-4 4 4"/>
            </svg>
            {averageAttendance}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <dl className="flex items-center">
            <dt className="text-muted-foreground text-sm font-normal me-1">Avg Attendance:</dt>
            <dd className="text-foreground text-sm font-semibold">{averageAttendance}%</dd>
        </dl>
        <dl className="flex items-center justify-end">
            <dt className="text-muted-foreground text-sm font-normal me-1">Total Subjects:</dt>
            <dd className="text-foreground text-sm font-semibold">{data.length || 7}</dd>
        </dl>
      </div>

      <div id="column-chart" className="mt-4 overflow-hidden"></div>
        <div className="grid grid-cols-1 items-center border-border border-t justify-between mt-5">
          <div className="flex justify-between items-center pt-5">
            <button
              id="dropdownDefaultButton"
              data-dropdown-toggle="lastDaysdropdown"
              data-dropdown-placement="bottom"
              className="text-sm font-medium text-muted-foreground hover:text-foreground text-center inline-flex items-center"
              type="button">
              {data.length > 0 ? `${data.length} subjects` : 'This week'}
            </button>
            <a
              href="#"
              className="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-blue-600 hover:text-blue-700 dark:text-blue-500 hover:bg-muted px-3 py-2">
              Attendance Report
              <svg className="w-2.5 h-2.5 ms-1.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
            </a>
          </div>
        </div>
    </div>
  );
}
