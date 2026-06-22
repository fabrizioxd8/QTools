import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Printer, Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Filter, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppData } from '@/contexts/AppDataContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const formatDateInput = (date: Date) => date.toISOString().split('T')[0];

export default function Reports() {
  const { t } = useTranslation();
  const { tools, assignments } = useAppData();
  const [rangePreset, setRangePreset] = useState<'7' | '30' | '90' | 'custom'>('30');
  const [startDateStr, setStartDateStr] = useState(() => formatDateInput(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)));
  const [endDateStr, setEndDateStr] = useState(() => formatDateInput(new Date()));
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const activityLogRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 10;

  const today = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const parsed = new Date(startDateStr);
    if (Number.isNaN(parsed.getTime())) return new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
    // When parsing YYYY-MM-DD, it parses as UTC midnight.
    // We want the start of that day in UTC, so we can just use the parsed date as is for start,
    // or to be safe and match local time checkouts, we treat it as local.
    // The simplest robust way is to append T00:00:00
    return new Date(`${startDateStr}T00:00:00`);
  }, [startDateStr, today]);
  const endDate = useMemo(() => {
    const parsed = new Date(endDateStr);
    if (Number.isNaN(parsed.getTime())) return today;
    return new Date(`${endDateStr}T23:59:59.999`);
  }, [endDateStr, today]);

  const handlePresetChange = (value: '7' | '30' | '90' | 'custom') => {
    setRangePreset(value);
    if (value !== 'custom') {
      const days = Number(value);
      const start = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      setStartDateStr(formatDateInput(start));
      setEndDateStr(formatDateInput(today));
    }
  };

  const activityLog = useMemo(() => {
    const log: Array<{
      date: string;
      dateObj: Date;
      action: 'Checkout' | 'Check-in';
      worker: string;
      project: string;
      projectId: number;
      tool: string;
      model?: string;
      brand?: string;
      serie?: string;
      quantity: number;
      extraDetails: Record<string, string>;
      statusLabel?: string;
      // Per-condition pairs for split badge rendering
      conditionPairs: Array<{ cond: string; qty: number }>;
    }> = [];

    assignments.forEach(assignment => {
      assignment.tools.forEach(tool => {
        const quantity = tool.quantity || 1;
        const attributes = tool.customAttributes || {};
        const extraDetails = Object.fromEntries(
          Object.entries(attributes).filter(
            ([key]) => !['brand', 'model', 'serie'].includes(key),
          ).map(([key, value]) => [key, String(value)]),
        );

        log.push({
          date: assignment.checkoutDate,
          dateObj: new Date(assignment.checkoutDate),
          action: 'Checkout',
          worker: assignment.worker.name,
          project: assignment.project.name,
          projectId: assignment.project.id,
          tool: tool.name,
          model: attributes.model,
          brand: attributes.brand,
          serie: attributes.serie,
          quantity,
          extraDetails,
          statusLabel: quantity > 1 ? `Status: ${t('assignments.conditionGood')} (${quantity})` : `Status: ${t('assignments.conditionGood')}`,
          conditionPairs: [{ cond: 'good', qty: quantity }],
        });
      });

      if (assignment.checkinDate) {
        assignment.tools.forEach(tool => {
          const quantity = tool.quantity || 1;
          const attributes = tool.customAttributes || {};
          const extraDetails = Object.fromEntries(
            Object.entries(attributes).filter(
              ([key]) => !['brand', 'model', 'serie'].includes(key),
            ).map(([key, value]) => [key, String(value)]),
          );

          const condition = assignment.toolConditions?.[tool.id];

          // Build per-condition pairs
          let conditionPairs: Array<{ cond: string; qty: number }> = [];
          if (!condition) {
            conditionPairs = [{ cond: 'good', qty: quantity }];
          } else if (typeof condition === 'string') {
            conditionPairs = [{ cond: condition, qty: quantity }];
          } else {
            conditionPairs = Object.entries(condition)
              .filter(([, qty]) => Number(qty) > 0)
              .map(([cond, qty]) => ({ cond, qty: Number(qty) }));
            if (conditionPairs.length === 0) conditionPairs = [{ cond: 'good', qty: quantity }];
          }

          log.push({
            date: assignment.checkinDate!,
            dateObj: new Date(assignment.checkinDate!),
            action: 'Check-in',
            worker: assignment.worker.name,
            project: assignment.project.name,
            projectId: assignment.project.id,
            tool: tool.name,
            model: attributes.model,
            brand: attributes.brand,
            serie: attributes.serie,
            quantity,
            extraDetails,
            statusLabel: undefined,
            conditionPairs,
          });
        });
      }
    });

    return log.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [assignments, t]);

  const filteredActivityLog = useMemo(
    () => activityLog.filter(entry => entry.dateObj >= startDate && entry.dateObj <= endDate),
    [activityLog, startDate, endDate],
  );

  const paginatedLog = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredActivityLog.slice(start, end);
  }, [filteredActivityLog, currentPage]);
  const totalPages = Math.max(1, Math.ceil(filteredActivityLog.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (currentPage > 1 && activityLogRef.current) {
      activityLogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  const totalProjects = useMemo(
    () => new Set(filteredActivityLog.map(log => log.projectId)).size,
    [filteredActivityLog],
  );

  const toolsCheckedOut = useMemo(
    () => filteredActivityLog
      .filter(item => item.action === 'Checkout')
      .reduce((sum, item) => sum + item.quantity, 0),
    [filteredActivityLog],
  );

  const toolsReturned = useMemo(
    () => filteredActivityLog
      .filter(item => item.action === 'Check-in')
      .reduce((sum, item) => sum + item.quantity, 0),
    [filteredActivityLog],
  );

  const currentlyActive = useMemo(
    () => assignments
      .filter(a => a.status === 'active')
      .reduce((sum, assignment) => sum + assignment.tools.reduce((toolSum, tool) => toolSum + (tool.quantity || 1), 0), 0),
    [assignments],
  );

  const totalActivities = filteredActivityLog.length;

  const pdfDateRangeLabel = `${startDate.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  })} – ${endDate.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`;

  const formatToolDetails = (item: {
    tool: string;
    brand?: string;
    model?: string;
    serie?: string;
    extraDetails: Record<string, string>;
    statusLabel?: string;
    conditionPairs: Array<{ cond: string; qty: number }>;
    action: 'Checkout' | 'Check-in';
  }) => {
    // Build status string from conditionPairs
    const statusStr = item.conditionPairs.length > 0
      ? item.conditionPairs
        .map(({ cond, qty }) => `${cond.charAt(0).toUpperCase() + cond.slice(1)}: ${qty}`)
        .join(', ')
      : 'Good';

    const detailLines = [
      item.brand ? `Brand: ${item.brand}` : undefined,
      item.model ? `Model: ${item.model}` : undefined,
      item.serie ? `Serie: ${item.serie}` : undefined,
      `<strong>Status: ${statusStr}</strong>`,
      ...Object.entries(item.extraDetails).map(([key, value]) => `${key}: ${value}`),
    ].filter(Boolean);

    return [
      `<strong>${item.tool}</strong>`,
      ...detailLines,
    ].join('<br/>');
  };

  const dayLabels = useMemo(() => [
    t('common.mon', 'Mon'),
    t('common.tue', 'Tue'),
    t('common.wed', 'Wed'),
    t('common.thu', 'Thu'),
    t('common.fri', 'Fri'),
    t('common.sat', 'Sat')
  ], [t]);
  const weekdayIndex = (date: Date) => {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) return -1; // Skip Sunday
    return (dayOfWeek - 1) % 6;
  };

  const dailyMovements = useMemo(() => {
    const empty = dayLabels.map(() => ({ checkedOut: 0, checkedIn: 0 }));
    filteredActivityLog.forEach(item => {
      const index = weekdayIndex(item.dateObj);
      if (index >= 0) {
        if (item.action === 'Checkout') empty[index].checkedOut += item.quantity;
        else empty[index].checkedIn += item.quantity;
      }
    });
    return empty;
  }, [filteredActivityLog, dayLabels]);

  const brandPrimary = 'rgb(18,161,154)';
  const brandLighter = 'rgba(18,161,154,0.42)';
  const brandAccent = '#0f766e';

  const chartValues = [
    { label: t('reports.toolsCheckedOut'), value: toolsCheckedOut, color: brandPrimary },
    { label: t('reports.toolsReturned'), value: toolsReturned, color: brandLighter },
    { label: t('reports.currentlyActive'), value: currentlyActive, color: brandAccent },
  ];
  const totalChart = chartValues.reduce((sum, item) => sum + item.value, 0) || 1;
  const maxDaily = Math.max(...dailyMovements.slice(0, 6).map(day => day.checkedOut + day.checkedIn), 1);

  const handleExportPDF = () => {
    const summaryRows = [
      [t('reports.totalProjects'), String(totalProjects)],
      [t('reports.toolsCheckedOut'), String(toolsCheckedOut)],
      [t('reports.toolsReturned'), String(toolsReturned)],
      [t('reports.currentlyActive'), String(currentlyActive)],
    ];

    const detailsRows = filteredActivityLog.map(item => ({
      date: new Date(item.date).toLocaleString(),
      action: item.action === 'Checkout' ? t('reports.toolsCheckedOut') : t('reports.toolsReturned'),
      worker: item.worker,
      project: item.project,
      toolDetails: formatToolDetails(item),
      quantity: String(item.quantity),
    }));

    const barRows = dailyMovements.slice(0, 6).map((day, index) => ({
      label: dayLabels[index],
      checkedOut: day.checkedOut,
      checkedIn: day.checkedIn,
    }));

    const piePercentages = chartValues.map(item => ({
      ...item,
      percentage: Math.round((item.value / totalChart) * 100),
    }));

    const trendPoints = dailyMovements.slice(0, 6)
      .map((day, index) => {
        const y = 120 - Math.round(((day.checkedOut + day.checkedIn) / maxDaily) * 100);
        return `${50 + index * 120},${y}`;
      })
      .join(' ');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(t('reports.exportWindowError'));
      return;
    }

    const html = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${t('reports.title')}</title>
          <style>
            body { font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 24px; color: #0f172a; background: #ffffff; }
            .page { max-width: 1100px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; }
            .header-copy { max-width: 75%; }
            .logo { width: 120px; height: auto; }
            h1 { font-size: 34px; margin: 0 0 6px; letter-spacing: -0.03em; color: ${brandPrimary}; }
            .subtitle { margin: 0; font-size: 16px; color: #475569; }
            .section { margin-bottom: 28px; }
            .section-title { font-size: 18px; font-weight: 700; color: ${brandPrimary}; margin-bottom: 14px; border-bottom: 1px solid #dbeafe; padding-bottom: 8px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
            .summary-card { background: #ecfdf5; border: 1px solid #c7f0ea; border-radius: 12px; padding: 16px; }
            .summary-number { font-size: 24px; font-weight: 700; color: ${brandAccent}; margin-bottom: 6px; }
            .summary-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 14px 12px; border: 1px solid #e2e8f0; }
            th { background: #effafa; color: ${brandAccent}; font-weight: 700; font-size: 13px; }
            td { color: #334155; font-size: 13px; vertical-align: top; }
            tbody tr:nth-child(even) td { background: #f8fbfb; }
            .tool-details { line-height: 1.45; }
            .status-list { margin: 0; padding-left: 18px; color: #334155; }
            .chart-row { display: grid; grid-template-columns: 1fr 340px; gap: 18px; align-items: start; margin-top: 16px; }
            .bar-track { position: relative; width: 100%; height: 12px; background: #e2f5f1; border-radius: 999px; overflow: hidden; }
            .bar-fill { height: 100%; border-radius: 999px; }
            .bar-label { font-size: 12px; color: #475569; min-width: 42px; }
            .bar-stats { display: flex; justify-content: space-between; font-size: 11px; color: #475569; margin-top: 6px; }
            .pie-card { padding: 16px; border: 1px solid #d8f0ed; border-radius: 16px; background: #f8fdfc; }
            .pie-chart { width: 180px; height: 180px; margin: 0 auto 14px; border-radius: 50%; background: conic-gradient(${brandPrimary} 0% ${Math.max(1, Math.round((toolsCheckedOut / totalChart) * 100))}%, ${brandLighter} ${Math.max(1, Math.round((toolsCheckedOut / totalChart) * 100))}% ${Math.max(1, Math.round(((toolsCheckedOut + toolsReturned) / totalChart) * 100))}%, ${brandAccent} ${Math.max(1, Math.round(((toolsCheckedOut + toolsReturned) / totalChart) * 100))}% 100%); }
            .pie-legend { display: grid; gap: 10px; }
            .legend-item { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #475569; }
            .legend-swatch { width: 12px; height: 12px; border-radius: 3px; }
            .trend-card { margin-top: 24px; }
            .trend-chart { width: 100%; height: 160px; }
            .trend-line { fill: none; stroke: ${brandAccent}; stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }
            .trend-marker { fill: ${brandPrimary}; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="header-copy">
                <h1>${t('reports.title')}</h1>
                <p class="subtitle">${t("reports.forTheWeekOf")} ${pdfDateRangeLabel}</p>
              </div>
              <img class="logo" src="${window.location.origin}/brand.png" alt="Company logo" />
            </div>

            <section class="section">
              <div class="section-title">${t('reports.toolActivityDesc')}</div>
              <table>
                <thead>
                  <tr>
                    <th>${t('reports.dateTime')}</th>
                    <th>${t("reports.action")}</th>
                    <th>${t("reports.worker")}</th>
                    <th>${t("reports.project")}</th>
                    <th>${t('reports.tool') /* tool details */}</th>
                    <th>${t('common.quantity')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${detailsRows.map(row => `
                    <tr>
                      <td>${row.date}</td>
                      <td>${row.action}</td>
                      <td>${row.worker}</td>
                      <td>${row.project}</td>
                      <td><div class="tool-details">${row.toolDetails}</div></td>
                      <td>${row.quantity}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </section>

            <section class="section">
              <div class="section-title">${t('reports.usageBreakdown')}</div>
              <div class="summary-grid">
                ${summaryRows.map(([label, value]) => `
                  <div class="summary-card">
                    <div class="summary-number">${value}</div>
                    <div class="summary-label">${label}</div>
                  </div>
                `).join('')}
              </div>
            </section>

            <section class="section">
              <div class="section-title">${t('reports.toolInventoryStatus')}</div>
              <ul class="status-list">
                <li><strong>${t('reports.currentlyActive')}:</strong> ${currentlyActive}</li>
                <li><strong>${t('reports.toolsReturned')}:</strong> ${toolsReturned}</li>
                <li><strong>${t('reports.weeklyMovements')}:</strong> ${totalActivities}</li>
              </ul>
            </section>

            <section class="section">
              <div class="section-title">${t('reports.weeklyMovements')}</div>
              <div class="chart-row">
                <div>
                  <div style="font-size:14px; font-weight:600; color:#0f172a; margin-bottom:12px;">${t('reports.weeklyMovements')}</div>
                  ${barRows.map(row => `
                    <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:16px;">
                      <div class="bar-label">${row.label}</div>
                      <div style="flex:1;">
                        <div class="bar-track">
                          <div class="bar-fill" style="width:${Math.round((row.checkedOut / maxDaily) * 100)}%; background:${brandPrimary};"></div>
                        </div>
                        <div class="bar-track" style="margin-top:8px; background:#dbf6f3;">
                          <div class="bar-fill" style="width:${Math.round((row.checkedIn / maxDaily) * 100)}%; background:${brandLighter};"></div>
                        </div>
                        <div class="bar-stats"><span>${t('assignments.out')} ${row.checkedOut}</span><span>${t('assignments.in')} ${row.checkedIn}</span></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
                <div class="pie-card">
                  <div style="text-align:center; font-weight:700; margin-bottom:12px; color:#0f172a;">${t('reports.usageBreakdown')}</div>
                  <div class="pie-chart"></div>
                  <div class="pie-legend">
                    ${piePercentages.map(item => `
                      <div class="legend-item"><span class="legend-swatch" style="background:${item.color};"></span>${item.label} — ${item.value}</div>
                    `).join('')}
                  </div>
                </div>
              </div>
              <div class="trend-card">
                <div style="font-size:14px; font-weight:600; color:#0f172a; margin-bottom:10px;">${t('reports.weeklyTrend')}</div>
                <svg class="trend-chart" viewBox="0 0 700 160" preserveAspectRatio="none">
                  <polyline class="trend-line" points="${trendPoints}" />
                  ${dailyMovements.slice(0, 6).map((day, index) => {
      const x = 50 + index * 120;
      const y = 120 - Math.round(((day.checkedOut + day.checkedIn) / maxDaily) * 100);
      return '<circle class="trend-marker" cx="' + x + '" cy="' + y + '" r="5"/>';
    }).join('')}
                </svg>
                <div style="position:relative; width:100%; height:20px; margin-top:8px; font-size:11px; color:#64748b;">
                  ${dayLabels.map((label, index) => {
      const leftPercent = ((50 + index * 120) / 700) * 100;
      return `<div style="position:absolute; left:${leftPercent}%; transform:translateX(-50%);">${label}</div>`;
    }).join('')}
                </div>
              </div>
            </section>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
    };

    toast.success(t('reports.pdfGenerated'));
  };

  const categoryKeyMap: Record<string, string> = {
    'hand tools': 'handTools',
    'power tools': 'powerTools',
    'measurement instruments': 'measurementInstruments',
    'measurement': 'measurement',
    'safety equipment': 'safetyEquipment',
    'safety': 'safety',
    'electrical': 'electrical',
    'mechanical': 'mechanical',
    'cleaning and maintenance': 'cleaning',
    'workstation equipment': 'workstation',
    'accessories': 'accessories',
    'calibration equipment': 'calibrationEquipment',
    'consumables': 'consumables',
    'other': 'other',
  };

  const normalizeKey = (value: string) => value.trim().toLowerCase();

  const translateCategory = (category: string) => {
    const key = normalizeKey(category);
    return categoryKeyMap[key]
      ? t(`tools.categories.${categoryKeyMap[key]}`, { defaultValue: category })
      : category;
  };

  const categoryBreakdown = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = {
        available: 0,
        inUse: 0,
        damaged: 0,
        lost: 0,
        total: 0,
      };
    }
    acc[tool.category].total++;
    if (tool.status === 'Available') acc[tool.category].available++;
    else if (tool.status === 'In Use') acc[tool.category].inUse++;
    else if (tool.status === 'Damaged') acc[tool.category].damaged++;
    else if (tool.status === 'Lost') acc[tool.category].lost++;
    return acc;
  }, {} as Record<string, { available: number; inUse: number; damaged: number; lost: number; total: number }>);

  const handlePrint = () => {
    window.print();
    toast.success(t('reports.openingPrintDialog'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
          <p className="text-muted-foreground">{t('reports.subtitle')}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              {t('common.export')}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
              <Download className="mr-2 h-4 w-4" /> {t('reports.exportPdf')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrint} className="cursor-pointer">
              <Printer className="mr-2 h-4 w-4" /> {t('reports.printReport')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <div
          className="flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">{t("reports.advancedFilters")}</CardTitle>
          </div>
          {showFilters ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
        {showFilters && (
          <CardContent className="space-y-4 pt-2 border-t">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("reports.reportRange")}</p>
                  <p className="text-sm text-muted-foreground">{startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
                <Select value={rangePreset} onValueChange={(value) => handlePresetChange(value as '7' | '30' | '90' | 'custom')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">{t('reports.last7Days')}</SelectItem>
                    <SelectItem value="30">{t('reports.last30Days')}</SelectItem>
                    <SelectItem value="90">{t('reports.last90Days')}</SelectItem>
                    <SelectItem value="custom">{t('reports.customRange')}</SelectItem>
                  </SelectContent>
                </Select>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('reports.startDate')}</label>
                  <Input
                    type="date"
                    value={startDateStr}
                    onChange={(event) => {
                      setRangePreset('custom');
                      setStartDateStr(event.target.value);
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t('reports.endDate')}</label>
                  <Input
                    type="date"
                    value={endDateStr}
                    onChange={(event) => {
                      setRangePreset('custom');
                      setEndDateStr(event.target.value);
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.totalProjects")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Unique projects in the selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("reports.toolsCheckedOut")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-info">{toolsCheckedOut}</div>
            <p className="text-xs text-muted-foreground">Total tool quantity checked out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("reports.toolsReturned")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{toolsReturned}</div>
            <p className="text-xs text-muted-foreground">Returned during the selected range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("reports.currentlyActive")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{currentlyActive}</div>
            <p className="text-xs text-muted-foreground">Tools still in use now</p>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Visualizations */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>{t("reports.weeklyTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyMovements.slice(0, 6).map((d, i) => ({ name: dayLabels[i], checkedOut: d.checkedOut, checkedIn: d.checkedIn }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="checkedOut" name="Checked Out" stroke={brandPrimary} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="checkedIn" name="Checked In" stroke={brandLighter} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t("reports.usageBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartValues} nameKey="label" dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {chartValues.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card ref={activityLogRef} className="lg:col-span-3 min-w-0">
          <CardHeader>
            <CardTitle>{t("reports.weeklyMovements")}</CardTitle>
            <CardDescription>{t("reports.toolActivityDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {totalActivities === 0 ? (
              <p className="text-center text-muted-foreground py-10">{t("reports.noMovement")}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("reports.dateTime")}</TableHead>
                      <TableHead>{t("reports.action")}</TableHead>
                      <TableHead>{t("reports.worker")}</TableHead>
                      <TableHead>{t("reports.project")}</TableHead>
                      <TableHead>{t("reports.tool")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLog.map((log, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{log.dateObj.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              log.action === 'Checkout'
                                ? 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50'
                                : 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                            }
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${log.action === 'Checkout' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                            {log.action === 'Checkout' ? t('nav.checkout') : t('assignments.checkIn')}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.worker}</TableCell>
                        <TableCell>{log.project}</TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <p className="font-medium text-sm">{log.tool}</p>
                            {[log.brand, log.model, log.serie].filter(Boolean).length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {[log.brand, log.model, log.serie].filter(Boolean).join(' • ')}
                              </p>
                            )}
                            {log.conditionPairs.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {log.conditionPairs.map(({ cond, qty }, i) => {
                                  const lower = cond.toLowerCase();
                                  let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50';
                                  let dotClass = 'bg-emerald-500';
                                  if (lower === 'lost') {
                                    colorClass = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50';
                                    dotClass = 'bg-red-500';
                                  } else if (lower === 'damaged') {
                                    colorClass = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/50';
                                    dotClass = 'bg-orange-500';
                                  } else if (lower === 'missing') {
                                    colorClass = 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800/50';
                                    dotClass = 'bg-yellow-500';
                                  }
                                  const localizedCond = t(`assignments.condition${cond.charAt(0).toUpperCase() + cond.slice(1)}`, cond);
                                  const label = `${localizedCond}: ${qty}`;
                                  return (
                                    <span key={i} className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass}`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 pt-4 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("common.previous", "Previous")}
                </Button>
                <span className="text-sm">{t("reports.page", { current: currentPage, total: totalPages })}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  {t("common.next", "Next")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 min-w-0">
          <CardHeader>
            <CardTitle>{t("reports.toolInventoryStatus")}</CardTitle>
            <CardDescription>{t("reports.categoryBreakdown")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.category")}</TableHead>
                    <TableHead className="text-right px-2">{t("reports.avail")}</TableHead>
                    <TableHead className="text-right px-2">{t("reports.inUse")}</TableHead>
                    <TableHead className="text-right px-2">{t("reports.dmg")}</TableHead>
                    <TableHead className="text-right px-2">{t("reports.lost")}</TableHead>
                    <TableHead className="text-right px-2">{t("reports.total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(categoryBreakdown).map(([category, stats]) => (
                    <TableRow key={category}>
                      <TableCell className="font-medium px-2">{translateCategory(category)}</TableCell>
                      <TableCell className="text-right px-2">{stats.available}</TableCell>
                      <TableCell className="text-right px-2">{stats.inUse}</TableCell>
                      <TableCell className="text-right px-2">{stats.damaged}</TableCell>
                      <TableCell className="text-right px-2">{stats.lost}</TableCell>
                      <TableCell className="text-right px-2 font-semibold">{stats.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
