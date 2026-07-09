import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Tool, Assignment, ToolConditionMap } from '@/contexts/AppDataContext';
import { statusKeyMap } from '@/lib/exportTools';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InUseEntry = {
    projectName: string;
    qty: number;
    status: 'inUse' | 'missing' | 'damaged' | 'lost';
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function getStatusBadgeVariant(
    status: Tool['status'] | string,
): 'secondary' | 'default' | 'destructive' | 'outline' {
    switch (status) {
        case 'Available': return 'secondary';
        case 'In Use': return 'default';
        case 'Damaged':
        case 'Lost': return 'destructive';
        case 'Cal. Due': return 'secondary';
        default: return 'default';
    }
}

export function buildInUseEntries(toolId: number, assignments: Assignment[]): InUseEntry[] {
    const entries: InUseEntry[] = [];

    assignments.forEach(asg => {
        if (asg.status === 'active') {
            asg.tools.forEach(t => {
                if (t.id === toolId && (t.quantity || 1) > 0) {
                    entries.push({ projectName: asg.project.name, qty: t.quantity || 1, status: 'inUse' });
                }
            });
        }

        if (asg.status === 'completed' && asg.toolConditions) {
            const cond = asg.toolConditions[toolId];
            if (cond) {
                if (typeof cond === 'object') {
                    const missingQty = Number((cond as ToolConditionMap).missing) || 0;
                    if (missingQty > 0) entries.push({ projectName: asg.project.name, qty: missingQty, status: 'missing' });
                    const damagedQty = Number((cond as ToolConditionMap).damaged) || 0;
                    if (damagedQty > 0) entries.push({ projectName: asg.project.name, qty: damagedQty, status: 'damaged' });
                    const lostQty = Number((cond as ToolConditionMap).lost) || 0;
                    if (lostQty > 0) entries.push({ projectName: asg.project.name, qty: lostQty, status: 'lost' });
                } else {
                    const toolInAsg = asg.tools.find(t => t.id === toolId);
                    const qty = toolInAsg?.quantity || 1;
                    if (cond === 'missing') entries.push({ projectName: asg.project.name, qty, status: 'missing' });
                    else if (cond === 'damaged') entries.push({ projectName: asg.project.name, qty, status: 'damaged' });
                    else if (cond === 'lost') entries.push({ projectName: asg.project.name, qty, status: 'lost' });
                }
            }
        }
    });

    return entries;
}

// ─── Shared tooltip body ──────────────────────────────────────────────────────

function EntryTooltipContent({ entry }: { entry: InUseEntry | undefined }) {
    const { t } = useTranslation();
    if (!entry) return <p className="text-sm text-muted-foreground">{t('tools.noAssignmentData')}</p>;
    return <div className="text-sm"><strong>{entry.projectName}</strong>: {entry.qty}</div>;
}

// ─── InUseBadge ───────────────────────────────────────────────────────────────

interface InUseBadgeProps {
    toolId: number;
    assignments: Assignment[];
}

export function InUseBadge({ toolId, assignments }: InUseBadgeProps) {
    const { t } = useTranslation();
    const entries = buildInUseEntries(toolId, assignments);
    // Only show active in-use entries in this badge's tooltip
    const inUseEntries = entries.filter(e => e.status === 'inUse');
    const inUseTotal = inUseEntries.reduce((sum, e) => sum + e.qty, 0);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="cursor-help">
                    <Badge variant={getStatusBadgeVariant('In Use')}>
                        {t('tools.statusLabels.In Use')}
                        {inUseTotal > 0 ? `: ${inUseTotal}` : ''}
                    </Badge>
                </span>
            </TooltipTrigger>
            <TooltipContent>
                {inUseEntries.length > 0 ? (
                    <div className="space-y-1">
                        {inUseEntries.map((e, i) => (
                            <div key={i} className="text-sm"><strong>{e.projectName}</strong>: {e.qty}</div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">{t('tools.noAssignmentData')}</p>
                )}
            </TooltipContent>
        </Tooltip>
    );
}

// ─── ToolStatusBadges ─────────────────────────────────────────────────────────
// Renders all status badges for a tool card/row, handling both "All" and filtered views.

type ExtendedTool = Tool & {
    availableQuantity?: number;
    inUseQuantity?: number;
    damagedQuantity?: number;
    lostQuantity?: number;
    missingQuantity?: number;
};

interface ToolStatusBadgesProps {
    tool: ExtendedTool;
    assignments: Assignment[];
    statusFilter: string;
}

export function ToolStatusBadges({ tool, assignments, statusFilter }: ToolStatusBadgesProps) {
    const { t } = useTranslation();

    const completedEntries = buildInUseEntries(tool.id, assignments).filter(e => e.status !== 'inUse');

    // ── "All" view: show every non-zero quantity bucket ──────────────────────
    if (statusFilter === 'All') {
        const badges: React.JSX.Element[] = [];

        if ((tool.availableQuantity || 0) > 0) {
            badges.push(
                <Badge key="available" variant={getStatusBadgeVariant('Available')}>
                    {`${t('tools.statusLabels.Available')}: ${tool.availableQuantity}`}
                </Badge>,
            );
        }

        if ((tool.inUseQuantity || 0) > 0) {
            badges.push(<InUseBadge key="inUse" toolId={tool.id} assignments={assignments} />);
        }

        if ((tool.damagedQuantity || 0) > 0) {
            const entry = completedEntries.find(e => e.status === 'damaged');
            badges.push(
                <Tooltip key="damaged">
                    <TooltipTrigger asChild>
                        <span className="cursor-help">
                            <Badge variant={getStatusBadgeVariant('Damaged')}>
                                {`${t('tools.statusLabels.Damaged')}: ${tool.damagedQuantity}`}
                            </Badge>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent><EntryTooltipContent entry={entry} /></TooltipContent>
                </Tooltip>,
            );
        }

        if ((tool.lostQuantity || 0) > 0) {
            const entry = completedEntries.find(e => e.status === 'lost');
            badges.push(
                <Tooltip key="lost">
                    <TooltipTrigger asChild>
                        <span className="cursor-help">
                            <Badge variant={getStatusBadgeVariant('Lost')}>
                                {`${t('tools.statusLabels.Lost')}: ${tool.lostQuantity}`}
                            </Badge>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent><EntryTooltipContent entry={entry} /></TooltipContent>
                </Tooltip>,
            );
        }

        // Missing is always its own badge — separate from In Use
        if ((tool.missingQuantity || 0) > 0) {
            const entry = completedEntries.find(e => e.status === 'missing');
            badges.push(
                <Tooltip key="missing">
                    <TooltipTrigger asChild>
                        <span className="cursor-help">
                            <Badge variant="outline">
                                {`${t('tools.statusLabels.Missing')}: ${tool.missingQuantity}`}
                            </Badge>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent><EntryTooltipContent entry={entry} /></TooltipContent>
                </Tooltip>,
            );
        }

        if (badges.length === 0) {
            badges.push(
                <Badge key="default" variant={getStatusBadgeVariant(tool.status)}>
                    {t(`tools.statusLabels.${statusKeyMap[tool.status]}`, { defaultValue: tool.status })}
                </Badge>,
            );
        }

        return <>{badges}</>;
    }

    // ── Filtered view: single badge matching the active filter ───────────────
    let displayStatus = tool.status;
    let displayQty: number | undefined;

    switch (statusFilter) {
        case 'Damaged': displayStatus = 'Damaged'; displayQty = tool.damagedQuantity; break;
        case 'Lost': displayStatus = 'Lost'; displayQty = tool.lostQuantity; break;
        case 'Available': displayStatus = 'Available'; displayQty = tool.availableQuantity; break;
        case 'Missing': displayStatus = 'Missing'; displayQty = tool.missingQuantity; break;
        case 'In Use': displayStatus = 'In Use'; displayQty = tool.inUseQuantity; break;
        case 'Cal. Due': displayStatus = 'Cal. Due'; break;
    }

    if (displayStatus === 'In Use') {
        return <InUseBadge toolId={tool.id} assignments={assignments} />;
    }

    if (['Damaged', 'Lost', 'Missing'].includes(displayStatus)) {
        const entryStatus = displayStatus.toLowerCase() as 'damaged' | 'lost' | 'missing';
        const entry = buildInUseEntries(tool.id, assignments).find(e => e.status === entryStatus);
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="cursor-help">
                        <Badge variant={getStatusBadgeVariant(displayStatus as Tool['status'])}>
                            {t(`tools.statusLabels.${statusKeyMap[displayStatus]}`, { defaultValue: displayStatus })}
                            {displayQty != null ? `: ${displayQty}` : ''}
                        </Badge>
                    </span>
                </TooltipTrigger>
                <TooltipContent><EntryTooltipContent entry={entry} /></TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Badge variant={getStatusBadgeVariant(displayStatus as Tool['status'])}>
            {t(`tools.statusLabels.${statusKeyMap[displayStatus]}`, { defaultValue: displayStatus })}
            {displayQty != null ? `: ${displayQty}` : ''}
        </Badge>
    );
}
