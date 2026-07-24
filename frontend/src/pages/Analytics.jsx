import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Skeleton,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
  Alert,
} from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  Mail,
  Users,
  Megaphone,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Send,
  Clock,
  Download,
  Filter,
  Activity,
  Calendar,
  Sparkles,
  Zap,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Layers,
  Award,
} from 'lucide-react';
import { toast } from 'react-toastify';
import analyticsService from '../services/analyticsService';
import emailDraftService from '../services/emailDraftService';

/* ─── Design Tokens & Theme Colors ───────────────────────────────────────── */
const COLORS = {
  primary: '#6D5DF6',
  primaryGlow: 'rgba(109, 93, 246, 0.25)',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#00F2FE',
  bgDark: '#0B1020',
  cardBg: 'rgba(17, 24, 39, 0.75)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  textMuted: '#9CA3AF',
  textSubtle: '#6B7280',
};

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  borderColor: 'rgba(255, 255, 255, 0.12)',
  borderRadius: '16px',
  color: '#F8FAFC',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(16px)',
  fontSize: '0.82rem',
  padding: '12px 16px',
};

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #6D5DF6 0%, #a855f7 100%)',
  'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #fbbf24 100%)',
  'linear-gradient(135deg, #22C55E 0%, #34d399 100%)',
  'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
];

const EMAIL_PIE_COLORS = [
  { name: 'Draft', color: '#9CA3AF', fill: '#9CA3AF' },
  { name: 'Approved', color: '#22C55E', fill: '#22C55E' },
  { name: 'Rejected', color: '#EF4444', fill: '#EF4444' },
  { name: 'Sent', color: '#6D5DF6', fill: '#6D5DF6' },
];

/* ─── Framer Motion Variants ─────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

/* ─── Animated Number Counter ────────────────────────────────────────────── */
const AnimatedCounter = ({ value, suffix = '', duration = 1000 }) => {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value) || 0;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // Quartic ease-out
      setDisplay(startRef.current + (target - startRef.current) * ease);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        startRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  const formatted =
    typeof value === 'number' && Number.isInteger(value)
      ? Math.round(display).toLocaleString()
      : display.toFixed(1);

  return (
    <>
      {formatted}
      {suffix}
    </>
  );
};

/* ─── Premium Glass Card Wrapper ──────────────────────────────────────────── */
const GlassCard = ({ children, sx = {}, hoverGlow = COLORS.primary, ...props }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: '24px',
      background: 'rgba(17, 24, 39, 0.75)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${COLORS.cardBorder}`,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        borderColor: 'rgba(255, 255, 255, 0.18)',
        transform: 'translateY(-4px)',
        boxShadow: `0 16px 40px ${hoverGlow}22`,
      },
      ...sx,
    }}
    {...props}
  >
    {children}
  </Paper>
);

/* ─── Redesigned KPI Card Component with Sparkline ───────────────────────── */
const KPICard = ({
  title,
  value,
  suffix = '',
  trend,
  trendDirection = 'up',
  sparklineData = [],
  icon: Icon,
  gradient,
  loading,
  subtitle,
}) => {
  const isUp = trendDirection === 'up';

  return (
    <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Top Accent Gradient Line */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: gradient,
        }}
      />

      {loading ? (
        <Box sx={{ py: 1 }}>
          <Skeleton variant="text" width="50%" sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
          <Skeleton variant="rectangular" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.08)', my: 1.5, borderRadius: 2 }} />
          <Skeleton variant="text" width="70%" sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: '0.72rem' }}>
              {title}
            </Typography>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '14px',
                background: gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
              }}
            >
              {Icon && <Icon size={20} color="#FFFFFF" />}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mt: 0.5 }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: '-1.5px', fontSize: '2.1rem', leading: 1 }}>
                <AnimatedCounter value={value} suffix={suffix} />
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 1 }}>
                {trend && (
                  <Chip
                    size="small"
                    icon={isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    label={trend}
                    sx={{
                      height: 22,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: isUp ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isUp ? COLORS.success : COLORS.danger,
                      border: `1px solid ${isUp ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      '& .MuiChip-icon': { color: 'inherit' },
                    }}
                  />
                )}
                {subtitle && (
                  <Typography variant="caption" sx={{ color: COLORS.textSubtle, fontSize: '0.73rem' }}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Sparkline chart */}
            {sparklineData.length > 0 && (
              <Box sx={{ width: 80, height: 40, ml: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData}>
                    <defs>
                      <linearGradient id={`sparkGrad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isUp ? COLORS.success : COLORS.primary} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={isUp ? COLORS.success : COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={isUp ? COLORS.success : COLORS.primary}
                      strokeWidth={2}
                      fill={`url(#sparkGrad-${title.replace(/\s+/g, '')})`}
                      isAnimationActive={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Box>
        </>
      )}
    </GlassCard>
  );
};

/* ═════════════════════════════════════════════════════════════════════════
   MAIN ANALYTICS DASHBOARD PAGE
═════════════════════════════════════════════════════════════════════════ */
const Analytics = () => {
  /* ── Data States ──────────────────────────────────────────────────────── */
  const [overview, setOverview]           = useState(null);
  const [campaigns, setCampaigns]         = useState([]);
  const [leadStats, setLeadStats]         = useState(null);
  const [emailStats, setEmailStats]       = useState(null);
  const [recentDrafts, setRecentDrafts]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [isRefreshing, setIsRefreshing]   = useState(false);

  /* ── Filter States ────────────────────────────────────────────────────── */
  const [dateRange, setDateRange]           = useState('30d');
  const [campaignFilter, setCampaignFilter] = useState('ALL');

  /* ═══ Fetch All Analytics ═════════════════════════════════════════════════ */
  const fetchAll = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [ov, camp, lead, email, draftRes] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getCampaignAnalytics(),
        analyticsService.getLeadAnalytics(),
        analyticsService.getEmailAnalytics(),
        emailDraftService.getEmailDrafts().catch(() => []),
      ]);

      setOverview(ov);
      setCampaigns(Array.isArray(camp) ? camp : camp.results ?? []);
      setLeadStats(lead);
      setEmailStats(email);
      setRecentDrafts(Array.isArray(draftRes) ? draftRes : draftRes.results ?? []);
    } catch (err) {
      console.error('[Analytics] Fetch error:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to load analytics engine data.';
      setError(msg);
      if (manual) toast.error(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ═══ Export Report Trigger ═══════════════════════════════════════════════ */
  const handleExportReport = () => {
    if (!campaigns || campaigns.length === 0) {
      toast.info('No data available to export.');
      return;
    }
    const headers = ['Campaign ID', 'Campaign Name', 'Total Leads', 'Emails Generated', 'Approved', 'Rejected', 'Sent'];
    const rows = campaigns.map((c) => [
      c.campaign_id,
      `"${c.campaign_name}"`,
      c.total_leads,
      c.emails_generated,
      c.approved,
      c.rejected,
      c.sent,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SalesPilot_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('📊 Analytics CSV report generated & downloaded successfully!');
  };

  /* ═══ Computed & Derived Datasets ═════════════════════════════════════════ */
  const totalCampaigns = overview?.campaigns?.total ?? 0;
  const totalLeads = overview?.leads?.total ?? 0;
  const totalDrafts = overview?.emails?.draft ?? 0;
  const totalSent = overview?.emails?.sent ?? 0;
  const totalApproved = overview?.emails?.approved ?? 0;
  const totalRejected = overview?.emails?.rejected ?? 0;
  const overallEmails = totalDrafts + totalApproved + totalRejected + totalSent;

  // Conversion rate (Sent / Total Leads %)
  const conversionRate = totalLeads > 0 ? ((totalSent / totalLeads) * 100).toFixed(1) : 0;
  const approvalRate = emailStats?.approval_rate ?? (totalApproved + totalRejected > 0 ? ((totalApproved / (totalApproved + totalRejected)) * 100).toFixed(1) : 0);

  // Filtered bar chart dataset
  const barChartData = campaigns.map((c) => ({
    name: c.campaign_name.length > 15 ? c.campaign_name.slice(0, 14) + '…' : c.campaign_name,
    fullName: c.campaign_name,
    Leads: c.total_leads,
    'Generated Drafts': c.emails_generated,
    Sent: c.sent,
  }));

  const filteredBarData =
    campaignFilter === 'ALL'
      ? barChartData
      : barChartData.filter((b) => b.fullName === campaignFilter);

  // Pie chart dataset
  const pieData = [
    { name: 'Draft', value: totalDrafts, color: '#9CA3AF' },
    { name: 'Approved', value: totalApproved, color: COLORS.success },
    { name: 'Rejected', value: totalRejected, color: COLORS.danger },
    { name: 'Sent', value: totalSent, color: COLORS.primary },
  ].filter((d) => d.value > 0);

  // Cumulative Lead Growth data
  let cum = 0;
  const leadGrowthData = campaigns.map((c, idx) => {
    cum += c.total_leads;
    return {
      name: c.campaign_name.slice(0, 12),
      Leads: cum,
      NewLeads: c.total_leads,
    };
  });

  // Emails Sent Over Time (per campaign line chart)
  const emailsSentOverTime = campaigns.map((c) => ({
    name: c.campaign_name.slice(0, 12),
    Sent: c.sent,
    Approved: c.approved,
    Generated: c.emails_generated,
  }));

  // Top Performing Campaign
  const topCampaign = campaigns.length > 0 ? [...campaigns].sort((a, b) => b.sent - a.sent || b.total_leads - a.total_leads)[0] : null;

  // Sparkline dummy progressions for KPI cards
  const sparkCampaigns = campaigns.map((c) => ({ v: c.total_leads || 1 }));
  const sparkLeads = campaigns.map((c) => ({ v: c.total_leads * 2 + 3 }));
  const sparkDrafts = campaigns.map((c) => ({ v: c.emails_generated + 1 }));
  const sparkSent = campaigns.map((c) => ({ v: c.sent || 1 }));
  const sparkApproved = campaigns.map((c) => ({ v: c.approved || 1 }));
  const sparkConv = campaigns.map((c) => ({ v: c.total_leads > 0 ? (c.sent / c.total_leads) * 100 : 0 }));

  // Recent activity timeline
  const activityList = campaigns.slice(0, 5).flatMap((c) => [
    {
      id: `act-gen-${c.campaign_id}`,
      type: 'lead',
      title: `${c.total_leads} prospect leads added to "${c.campaign_name}"`,
      time: 'Recently updated',
      icon: Users,
      color: COLORS.info,
    },
    {
      id: `act-sent-${c.campaign_id}`,
      type: 'sent',
      title: `${c.sent} emails dispatched for campaign "${c.campaign_name}"`,
      time: 'Outreach active',
      icon: Send,
      color: COLORS.primary,
    },
  ]);

  /* ═══ Render ══════════════════════════════════════════════════════════════ */
  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ pb: 6 }}
    >
      {/* ════════════════════════════════════════════════════════════════════
          HEADER SECTION (Redesigned with Glass controls & Export)
      ════════════════════════════════════════════════════════════════════ */}
      <Box
        component={motion.div}
        variants={itemVariants}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2.5,
          mb: 4,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-1px',
                fontSize: { xs: '1.8rem', md: '2.2rem' },
                fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
              }}
            >
              🚀 Sales Intelligence
            </Typography>
            <Chip
              icon={
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#22C55E',
                    boxShadow: '0 0 10px #22C55E',
                    animation: 'livePulse 1.5s infinite ease-in-out',
                    '@keyframes livePulse': {
                      '0%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.4, transform: 'scale(1.25)' },
                      '100%': { opacity: 1, transform: 'scale(1)' },
                    },
                  }}
                />
              }
              label="Live Data"
              size="small"
              sx={{
                bgcolor: 'rgba(34, 197, 94, 0.15)',
                color: '#22C55E',
                fontWeight: 800,
                fontSize: '0.75rem',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                px: 0.8,
              }}
            />
          </Box>
          <Typography variant="body1" sx={{ color: COLORS.textMuted, fontSize: '0.95rem', fontFamily: "'Inter', sans-serif" }}>
            AI-powered insights into your campaigns, leads, outreach, and email performance.
          </Typography>
        </Box>

        {/* Right Header Toolbar Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Date Range Selector */}
          <TextField
            select
            size="small"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            InputProps={{
              startAdornment: <Calendar size={15} color={COLORS.textMuted} style={{ marginRight: 8 }} />,
              style: {
                color: '#FFFFFF',
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                borderRadius: '14px',
                fontSize: '0.85rem',
                minWidth: 145,
              },
            }}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
          </TextField>

          {/* Campaign Filter */}
          <TextField
            select
            size="small"
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            InputProps={{
              startAdornment: <Filter size={15} color={COLORS.textMuted} style={{ marginRight: 8 }} />,
              style: {
                color: '#FFFFFF',
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                borderRadius: '14px',
                fontSize: '0.85rem',
                minWidth: 175,
              },
            }}
          >
            <MenuItem value="ALL">All Campaigns</MenuItem>
            {campaigns.map((c) => (
              <MenuItem key={c.campaign_id} value={c.campaign_name}>
                {c.campaign_name}
              </MenuItem>
            ))}
          </TextField>

          {/* Refresh Button */}
          <Tooltip title="Refresh Analytics Data">
            <IconButton
              onClick={() => fetchAll(true)}
              disabled={isRefreshing}
              sx={{
                bgcolor: 'rgba(17, 24, 39, 0.8)',
                color: COLORS.textMuted,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: '14px',
                p: 1.1,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' },
              }}
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>

          {/* Export Report Button */}
          <Button
            variant="contained"
            startIcon={<Download size={17} />}
            onClick={handleExportReport}
            sx={{
              background: 'linear-gradient(135deg, #6D5DF6 0%, #a855f7 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              px: 2.4,
              py: 1.1,
              borderRadius: '14px',
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(109, 93, 246, 0.35)',
              transition: 'all 0.25s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #5b4be3 0%, #9333ea 100%)',
                boxShadow: '0 12px 28px rgba(109, 93, 246, 0.5)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <Box component={motion.div} variants={itemVariants}>
          <Alert
            severity="error"
            sx={{
              mb: 4,
              bgcolor: 'rgba(239, 68, 68, 0.12)',
              color: '#FCA5A5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '18px',
              backdropFilter: 'blur(12px)',
              '& .MuiAlert-icon': { color: COLORS.danger },
            }}
            action={
              <Button color="inherit" size="small" onClick={() => fetchAll(true)} sx={{ fontWeight: 800 }}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1 – REDESIGNED KPI CARDS GRID (EXACT 6 CARDS)
      ════════════════════════════════════════════════════════════════════ */}
      <Grid container spacing={2.5} sx={{ mb: 4 }} component={motion.div} variants={itemVariants}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Total Campaigns"
            value={totalCampaigns}
            trend="+12.5%"
            trendDirection="up"
            subtitle="Active outreach"
            sparklineData={sparkCampaigns}
            icon={Megaphone}
            gradient={CARD_GRADIENTS[0]}
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Total Leads"
            value={totalLeads}
            trend="+18.2%"
            trendDirection="up"
            subtitle={`${leadStats?.companies ?? 0} Companies`}
            sparklineData={sparkLeads}
            icon={Users}
            gradient={CARD_GRADIENTS[1]}
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Draft Emails"
            value={totalDrafts}
            trend="+5.4%"
            trendDirection="up"
            subtitle="AI generated"
            sparklineData={sparkDrafts}
            icon={Mail}
            gradient={CARD_GRADIENTS[2]}
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Emails Sent"
            value={totalSent}
            trend="+24.1%"
            trendDirection="up"
            subtitle="Outbound activity"
            sparklineData={sparkSent}
            icon={Send}
            gradient={CARD_GRADIENTS[3]}
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Approval Rate"
            value={Number(approvalRate)}
            suffix="%"
            trend="+15.0%"
            trendDirection="up"
            subtitle="Draft review score"
            sparklineData={sparkApproved}
            icon={CheckCircle2}
            gradient={CARD_GRADIENTS[4]}
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Conversion Rate"
            value={Number(conversionRate)}
            suffix="%"
            trend="+3.8%"
            trendDirection="up"
            subtitle="Lead to sent ratio"
            sparklineData={sparkConv}
            icon={TrendingUp}
            gradient={CARD_GRADIENTS[5]}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2 & 3 – CHARTS ROW 1 (BAR CHART + DONUT PIE CHART)
      ════════════════════════════════════════════════════════════════════ */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={itemVariants}>
        {/* Bar Chart — Campaign Performance */}
        <Grid item xs={12} lg={7.5}>
          <GlassCard sx={{ height: '100%', minHeight: 380 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem' }}>
                  Campaign Performance
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                  Comparing prospect leads, AI draft generation, and sent emails per campaign
                </Typography>
              </Box>
              <Chip
                label={`${filteredBarData.length} Campaigns`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: COLORS.textMuted, fontWeight: 700 }}
              />
            </Box>

            {loading ? (
              <Skeleton variant="rectangular" height={300} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
            ) : filteredBarData.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center', color: COLORS.textMuted }}>
                <Megaphone size={40} color={COLORS.textSubtle} style={{ marginBottom: 12 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>No campaign data to display</Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 310 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredBarData} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke={COLORS.textMuted} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis stroke={COLORS.textMuted} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <RechartTooltip
                      contentStyle={CHART_TOOLTIP_STYLE}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    />
                    <Legend wrapperStyle={{ color: COLORS.textMuted, fontSize: '0.82rem', paddingTop: 16 }} />
                    <Bar dataKey="Leads" fill={COLORS.primary} radius={[6, 6, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="Generated Drafts" fill={COLORS.info} radius={[6, 6, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="Sent" fill={COLORS.success} radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </GlassCard>
        </Grid>

        {/* Pie Chart — Email Status Distribution */}
        <Grid item xs={12} lg={4.5}>
          <GlassCard sx={{ height: '100%', minHeight: 380 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem' }}>
                Email Status Distribution
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                Outreach status breakdown across all campaigns
              </Typography>
            </Box>

            {loading ? (
              <Skeleton variant="rectangular" height={300} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
            ) : pieData.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center', color: COLORS.textMuted }}>
                <Mail size={40} color={COLORS.textSubtle} style={{ marginBottom: 12 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>No email status data available</Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Custom Colored Pill Legend */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mt: 1 }}>
                  {pieData.map((p) => (
                    <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.color }} />
                      <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 700 }}>
                        {p.name}: <span style={{ color: '#FFFFFF' }}>{p.value}</span>
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 4 & 5 – CHARTS ROW 2 (AREA LEAD GROWTH + LINE EMAILS OVER TIME)
      ════════════════════════════════════════════════════════════════════ */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={itemVariants}>
        {/* Area Chart — Lead Growth */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ minHeight: 340 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1rem' }}>
                  Lead Growth Trajectory
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                  Cumulative prospect acquisition across active ICP modules
                </Typography>
              </Box>
              <Chip
                icon={<TrendingUp size={13} />}
                label="Growth Trend"
                size="small"
                sx={{ bgcolor: 'rgba(34, 197, 94, 0.15)', color: COLORS.success, fontWeight: 700 }}
              />
            </Box>

            {loading ? (
              <Skeleton variant="rectangular" height={250} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
            ) : (
              <Box sx={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leadGrowthData}>
                    <defs>
                      <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.info} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={COLORS.info} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke={COLORS.textMuted} tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis stroke={COLORS.textMuted} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <RechartTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Area
                      type="monotone"
                      dataKey="Leads"
                      stroke={COLORS.info}
                      strokeWidth={3}
                      fill="url(#leadGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
          </GlassCard>
        </Grid>

        {/* Line Chart — Emails Sent Over Time */}
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ minHeight: 340 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1rem' }}>
                  Emails Sent Over Campaigns
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                  Comparing AI generation, approval, and dispatched emails
                </Typography>
              </Box>
              <Chip
                icon={<Activity size={13} />}
                label="Outreach Activity"
                size="small"
                sx={{ bgcolor: 'rgba(109, 93, 246, 0.15)', color: COLORS.primary, fontWeight: 700 }}
              />
            </Box>

            {loading ? (
              <Skeleton variant="rectangular" height={250} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
            ) : (
              <Box sx={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={emailsSentOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke={COLORS.textMuted} tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis stroke={COLORS.textMuted} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <RechartTooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ color: COLORS.textMuted, fontSize: '0.8rem', paddingTop: 8 }} />
                    <Line type="monotone" dataKey="Generated" stroke={COLORS.warning} strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Approved" stroke={COLORS.success} strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Sent" stroke={COLORS.primary} strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>

      {/* ════════════════════════════════════════════════════════════════════
          ADDITIONAL WIDGETS ROW (SPOTLIGHT + TIMELINE + LATEST DRAFTS)
      ════════════════════════════════════════════════════════════════════ */}
      <Grid container spacing={3} sx={{ mb: 4 }} component={motion.div} variants={itemVariants}>
        {/* Widget 1: Top Performing Campaign Spotlight */}
        <Grid item xs={12} md={4}>
          <GlassCard sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(109, 93, 246, 0.15) 0%, rgba(17, 24, 39, 0.85) 100%)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: '14px',
                  background: CARD_GRADIENTS[0],
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Award size={20} color="#FFFFFF" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Spotlight Campaign
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem' }}>
                  {topCampaign?.campaign_name || 'No Campaign Yet'}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 2 }} />

            {topCampaign && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: COLORS.textMuted }}>Total Leads</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: '#FFFFFF' }}>{topCampaign.total_leads}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: COLORS.textMuted }}>Emails Generated</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: COLORS.info }}>{topCampaign.emails_generated}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: COLORS.textMuted }}>Emails Dispatched</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: COLORS.success }}>{topCampaign.sent}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: COLORS.textMuted }}>Approval Rate</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: COLORS.warning }}>
                    {topCampaign.approved + topCampaign.rejected > 0
                      ? `${((topCampaign.approved / (topCampaign.approved + topCampaign.rejected)) * 100).toFixed(1)}%`
                      : '100%'}
                  </Typography>
                </Box>
              </Box>
            )}
          </GlassCard>
        </Grid>

        {/* Widget 2: Recent Activity Timeline */}
        <Grid item xs={12} md={4}>
          <GlassCard sx={{ height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1rem', mb: 0.5 }}>
              Activity Feed
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textMuted, display: 'block', mb: 2.5 }}>
              Real-time campaign & engine occurrences
            </Typography>

            {loading ? (
              <Skeleton variant="rectangular" height={200} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3 }} />
            ) : activityList.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.textMuted, textAlign: 'center', py: 4 }}>
                No recent activity logged
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {activityList.slice(0, 5).map((act) => {
                  const Icon = act.icon;
                  return (
                    <Box key={act.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '12px',
                          bgcolor: `${act.color}18`,
                          border: `1px solid ${act.color}35`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={16} color={act.color} />
                      </Box>
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" sx={{ color: '#F3F4F6', fontWeight: 600, fontSize: '0.82rem', noWrap: true }}>
                          {act.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSubtle }}>
                          {act.time}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </GlassCard>
        </Grid>

        {/* Widget 3: Latest AI Generated Drafts */}
        <Grid item xs={12} md={4}>
          <GlassCard sx={{ height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1rem' }}>
                  Latest AI Drafts
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                  Recent outreach drafts generated
                </Typography>
              </Box>
              <Sparkles size={18} color={COLORS.primary} />
            </Box>

            {loading ? (
              <Skeleton variant="rectangular" height={200} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3 }} />
            ) : recentDrafts.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.textMuted, textAlign: 'center', py: 4 }}>
                No draft records found
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                {recentDrafts.slice(0, 4).map((draft) => {
                  const company = draft.lead?.company_name || draft.company_name || 'Prospect';
                  const subject = draft.subject || '(No subject)';
                  const status = (draft.status || 'draft').toLowerCase();

                  let statusColor = COLORS.textMuted;
                  if (status === 'approved') statusColor = COLORS.success;
                  if (status === 'sent') statusColor = COLORS.primary;
                  if (status === 'rejected') statusColor = COLORS.danger;

                  return (
                    <Box
                      key={draft.id}
                      sx={{
                        p: 1.5,
                        borderRadius: '14px',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ minWidth: 0, mr: 1 }}>
                        <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.83rem', noWrap: true }}>
                          {company}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textMuted, noWrap: true, display: 'block' }}>
                          {subject}
                        </Typography>
                      </Box>
                      <Chip
                        label={status}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          textTransform: 'capitalize',
                          bgcolor: `${statusColor}18`,
                          color: statusColor,
                          border: `1px solid ${statusColor}30`,
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 7 – MODERN SAAS TOP CAMPAIGNS DATA TABLE
      ════════════════════════════════════════════════════════════════════ */}
      <Box component={motion.div} variants={itemVariants} sx={{ mb: 4 }}>
        <GlassCard>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.1rem' }}>
                Top Campaigns Performance Table
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                Detailed conversion & lead metrics ordered by volume
              </Typography>
            </Box>
            <Chip
              label={`${campaigns.length} total records`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: COLORS.textMuted, fontWeight: 700 }}
            />
          </Box>

          <TableContainer sx={{ borderRadius: '16px', overflow: 'hidden' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#0F172A', color: COLORS.textMuted, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1px solid ${COLORS.cardBorder}` } }}>
                  <TableCell>Campaign</TableCell>
                  <TableCell align="center">Leads</TableCell>
                  <TableCell align="center">Emails Generated</TableCell>
                  <TableCell align="center">Approved</TableCell>
                  <TableCell align="center">Sent</TableCell>
                  <TableCell align="right">Conversion Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j} sx={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
                          <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: COLORS.textMuted }}>
                      No campaign performance data available
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((c, idx) => {
                    const conv = c.total_leads > 0 ? ((c.sent / c.total_leads) * 100).toFixed(1) : '0.0';
                    const initials = c.campaign_name.slice(0, 2).toUpperCase();

                    return (
                      <TableRow
                        key={c.campaign_id}
                        sx={{
                          transition: 'background-color 0.2s ease',
                          borderBottom: `1px solid ${COLORS.cardBorder}`,
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' },
                        }}
                      >
                        <TableCell sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.88rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: CARD_GRADIENTS[idx % CARD_GRADIENTS.length],
                              }}
                            >
                              {initials}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                                {c.campaign_name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: COLORS.textSubtle }}>
                                ID: #{c.campaign_id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell align="center" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                          <Chip
                            label={c.total_leads}
                            size="small"
                            sx={{ bgcolor: 'rgba(0, 242, 254, 0.12)', color: COLORS.info, fontWeight: 800 }}
                          />
                        </TableCell>

                        <TableCell align="center" sx={{ color: COLORS.textMuted, fontWeight: 600 }}>
                          {c.emails_generated}
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={c.approved}
                            size="small"
                            sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: COLORS.success, fontWeight: 800 }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={c.sent}
                            size="small"
                            sx={{ bgcolor: 'rgba(109, 93, 246, 0.15)', color: COLORS.primary, fontWeight: 800 }}
                          />
                        </TableCell>

                        <TableCell align="right" sx={{ color: COLORS.warning, fontWeight: 800, fontSize: '0.9rem' }}>
                          {conv}%
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </GlassCard>
      </Box>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 8 – QUICK STATISTICS (8 MINI CARDS)
      ════════════════════════════════════════════════════════════════════ */}
      <Box component={motion.div} variants={itemVariants}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem', mb: 2 }}>
          System Quick Performance Metrics
        </Typography>

        <Grid container spacing={2}>
          {[
            { label: 'Avg Leads / Campaign', val: totalCampaigns > 0 ? (totalLeads / totalCampaigns).toFixed(1) : '0', color: COLORS.info },
            { label: 'Draft Approval Rate', val: `${approvalRate}%`, color: COLORS.success },
            { label: 'Total ICP Modules', val: overview?.icps?.total ?? 0, color: COLORS.primary },
            { label: 'Target Companies', val: leadStats?.companies ?? 0, color: '#ec4899' },
            { label: 'Target Countries', val: leadStats?.countries ?? 0, color: COLORS.warning },
            { label: 'Emails Rejected', val: totalRejected, color: COLORS.danger },
            { label: 'Overall Emails Dispatched', val: totalSent, color: COLORS.success },
            { label: 'Total AI Pipeline Drafts', val: overallEmails, color: COLORS.info },
          ].map((st) => (
            <Grid item xs={6} sm={4} md={3} lg={1.5} key={st.label}>
              <GlassCard sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 700, fontSize: '0.68rem', display: 'block', mb: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {st.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: st.color, fontSize: '1.4rem' }}>
                  {loading ? '—' : st.val}
                </Typography>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Analytics;
