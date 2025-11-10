"use client";

import React, { useEffect, useRef } from 'react';

interface DonutChartProps {
  className?: string;
  data?: Array<{ name: string; value: number; present: number; total: number; color: string }>;
  title?: string;
  description?: string;
}

export function DonutChart({ className = '', data = [], title = "Top Subjects", description = "Attendance distribution by subject" }: DonutChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const renderChart = async () => {
      // Don't render if component is unmounted
      if (!mounted || !chartRef.current) return;

      try {
        // Destroy existing chart if it exists
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }

        // Try to import ApexCharts
        let ApexCharts: any = null;
        try {
          ApexCharts = (await import('apexcharts')).default;
        } catch (e) {
          console.warn('ApexCharts not available, skipping chart render');
          return;
        }

        // Prepare data for ApexCharts
        const chartData = data.length > 0 ? data.map(item => item.value) : [35.1, 23.5, 2.4, 5.4];
        const colors = data.length > 0 ? data.map(item => item.color) : ["#1C64F2", "#16BDCA", "#FDBA8C", "#E74694"];
        const labels = data.length > 0 ? data.map(item => item.name) : ["Direct", "Sponsor", "Affiliate", "Email marketing"];

        const getChartOptions = () => {
          return {
            series: chartData,
            colors: colors,
            chart: {
              height: 280,
              width: "100%",
              type: "donut",
            },
            stroke: {
              colors: ["transparent"],
              lineCap: "",
            },
            plotOptions: {
              pie: {
                donut: {
                  labels: {
                    show: true,
                    name: {
                      show: true,
                      fontFamily: "Inter, sans-serif",
                      offsetY: 20,
                    },
                    total: {
                      showAlways: true,
                      show: true,
                      label: "Average Attendance",
                      fontFamily: "Inter, sans-serif",
                      formatter: function (w: any) {
                        const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                        const avg = Math.round(total / w.globals.series.length);
                        return avg + '%';
                      },
                    },
                    value: {
                      show: true,
                      fontFamily: "Inter, sans-serif",
                      offsetY: -20,
                      formatter: function (value: number) {
                        return value + "%";
                      },
                    },
                  },
                  size: "80%",
                },
              },
            },
            grid: {
              padding: {
                top: -2,
              },
            },
            labels: labels,
            dataLabels: {
              enabled: false,
            },
            legend: {
              position: "bottom",
              fontFamily: "Inter, sans-serif",
              labels: {
                colors: 'currentColor',
              }
            },
            yaxis: {
              labels: {
                formatter: function (value: number) {
                  return value + "%";
                },
              },
            },
            xaxis: {
              labels: {
                formatter: function (value: number) {
                  return value + "%";
                },
              },
              axisTicks: {
                show: false,
              },
              axisBorder: {
                show: false,
              },
            },
          };
        };

        // Create new chart instance
        const chart = new ApexCharts(chartRef.current, getChartOptions());
        chartInstanceRef.current = chart;
        await chart.render();

      } catch (error) {
        console.error('Error loading ApexCharts:', error);
      }
    };

    renderChart();

    // Cleanup function
    return () => {
      mounted = false;
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [data]);

  const totalAttendance = data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length) : 67;

  return (
    <div className={`max-w-sm w-full bg-card rounded-lg shadow-sm border p-4 md:p-6 ${className}`}>

      <div className="flex justify-between mb-3">
          <div className="flex justify-center items-center">
              <h5 className="text-xl font-bold leading-none text-foreground pe-1">{title}</h5>
              <svg data-popover-target="chart-info" data-popover-placement="bottom" className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm0 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm1-5.034V12a1 1 0 0 1-2 0v-1.418a1 1 0 0 1 1.038-.999 1.436 1.436 0 0 0 1.488-1.441 1.501 1.501 0 1 0-3-.116.986.986 0 0 1-1.037.961 1 1 0 0 1-.96-1.037A3.5 3.5 0 1 1 11 11.466Z"/>
              </svg>
              <div data-popover id="chart-info" role="tooltip" className="absolute z-10 invisible inline-block text-sm text-muted-foreground transition-opacity duration-300 bg-background border border-border rounded-lg shadow-xs opacity-0 w-72">
                  <div className="p-3 space-y-2">
                      <h3 className="font-semibold text-foreground">Attendance Distribution</h3>
                      <p>Shows attendance percentage across your top performing subjects.</p>
                      <h3 className="font-semibold text-foreground">Calculation</h3>
                      <p>The donut chart displays the attendance percentage for each subject, helping you identify your strongest and weakest areas.</p>
                  </div>
                  <div data-popper-arrow></div>
              </div>
            </div>
            <div>
              <button type="button" data-tooltip-target="data-tooltip" data-tooltip-placement="bottom" className="hidden sm:inline-flex items-center justify-center text-muted-foreground w-8 h-8 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-muted rounded-lg text-sm"><svg className="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 18">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 1v11m0 0 4-4m-4 4L4 8m11 4v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3"/>
  </svg><span className="sr-only">Download data</span>
        </button>
        <div id="data-tooltip" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-foreground transition-opacity duration-300 bg-background border border-border rounded-lg shadow-xs opacity-0 tooltip">
            Download Attendance Data
            <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
      </div>
      </div>

      {/* Donut Chart */}
      <div className="py-6 overflow-hidden" ref={chartRef}></div>

      <div className="grid grid-cols-1 items-center border-border border-t justify-between">
        <div className="flex justify-between items-center pt-5">
          {/* Button */}
          <button
            id="dropdownDefaultButton"
            data-dropdown-toggle="lastDaysdropdown"
            data-dropdown-placement="bottom"
            className="text-sm font-medium text-muted-foreground hover:text-foreground text-center inline-flex items-center"
            type="button">
            {data.length > 0 ? `${data.length} subjects` : 'Top 5 subjects'}
          </button>
          <a
            href="#"
            className="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-blue-600 hover:text-blue-700 dark:text-blue-500 hover:bg-muted px-3 py-2">
            {description}
            <svg className="w-2.5 h-2.5 ms-1.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
