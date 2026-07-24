import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Alert,
  Tooltip,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import {
  Mail,
  Search,
  Trash2,
  Filter,
  RefreshCw,
  Sparkles,
  Eye,
  CheckCircle,
  XCircle,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import emailDraftService from '../services/emailDraftService';
import leadService from '../services/leadService';

/* ─── Status config ─────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  draft:    { label: 'Draft',    bgcolor: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  approved: { label: 'Approved', bgcolor: 'rgba(16,185,129,0.15)',  color: '#10b981' },
  rejected: { label: 'Rejected', bgcolor: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
  sent:     { label: 'Sent',     bgcolor: 'rgba(99,102,241,0.15)',  color: '#818cf8' },
};

const TONE_OPTIONS = ['Professional', 'Friendly', 'Casual', 'Formal'];

/* ─── Shared modal Paper sx ──────────────────────────────────────────────── */
const modalPaperSx = {
  bgcolor: '#111827',
  color: '#f3f4f6',
  borderRadius: 3,
  border: '1px solid #1f2937',
  p: 1,
};

/* ─── Label helper ───────────────────────────────────────────────────────── */
const FieldLabel = ({ children, required }) => (
  <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
    {children}
    {required && <span style={{ color: '#ef4444' }}> *</span>}
  </Typography>
);

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const EmailDrafts = () => {
  /* ── Data State ───────────────────────────────────────────────────────── */
  const [drafts, setDrafts]       = useState([]);
  const [leads, setLeads]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ── Toolbar Filters ──────────────────────────────────────────────────── */
  const [searchCompany, setSearchCompany]   = useState('');
  const [searchContact, setSearchContact]   = useState('');
  const [statusFilter, setStatusFilter]     = useState('ALL');

  /* ── Pagination ───────────────────────────────────────────────────────── */
  const [page, setPage]             = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* ── Generate Modal ───────────────────────────────────────────────────── */
  const [generateOpen, setGenerateOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  /* ── View Draft Modal ─────────────────────────────────────────────────── */
  const [viewDraft, setViewDraft] = useState(null);

  /* ── Delete Confirm ───────────────────────────────────────────────────── */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  /* ── Action loading per-row ───────────────────────────────────────────── */
  const [actionLoading, setActionLoading] = useState({});

  /* ── React Hook Form for Generate modal ───────────────────────────────── */
  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm({
    defaultValues: { lead_id: '', tone: 'Professional' },
  });

  /* ═══ Data fetch ══════════════════════════════════════════════════════════ */
  const fetchData = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    setError(null);
    try {
      const [draftData, leadData] = await Promise.all([
        emailDraftService.getEmailDrafts(),
        leadService.getLeads(),
      ]);
      setDrafts(Array.isArray(draftData) ? draftData : draftData.results ?? []);
      setLeads(Array.isArray(leadData)  ? leadData  : leadData.results  ?? []);
    } catch (err) {
      console.error('Failed to fetch email drafts:', err);
      const msg =
        err.response?.data?.detail || err.message || 'Failed to load email drafts.';
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ═══ Generate Draft ══════════════════════════════════════════════════════ */
  const handleOpenGenerate = () => {
    resetForm({ lead_id: leads.length > 0 ? leads[0].id : '', tone: 'Professional' });
    setGenerateOpen(true);
  };

  const onGenerateSubmit = async (values) => {
    setIsGenerating(true);
    try {
      await emailDraftService.generateDraft(values.lead_id, values.tone);
      toast.success('✅ AI draft generated successfully!');
      setGenerateOpen(false);
      fetchData();
    } catch (err) {
      console.error('Generate error:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to generate draft.';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  /* ═══ Per-row actions ═════════════════════════════════════════════════════ */
  const runAction = async (id, action, label) => {
    setActionLoading((prev) => ({ ...prev, [id]: action }));
    try {
      await emailDraftService[action](id);
      toast.success(`Draft ${label} successfully.`);
      // If view modal is open for this draft, close it
      if (viewDraft?.id === id) setViewDraft(null);
      fetchData();
    } catch (err) {
      console.error(`${action} error:`, err);
      const msg = err.response?.data?.error || err.response?.data?.detail || `Failed to ${label} draft.`;
      toast.error(msg);
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  /* ═══ Delete ══════════════════════════════════════════════════════════════ */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      // Use generic delete — wrap in service if backend adds DELETE endpoint
      await emailDraftService.rejectDraft(deleteTarget.id); // fallback: reject to mark invalid
      toast.info(`Draft #${deleteTarget.id} marked as rejected.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to remove draft.');
    } finally {
      setIsDeleting(false);
    }
  };

  /* ═══ Filtering & Pagination ══════════════════════════════════════════════ */
  const filteredDrafts = drafts.filter((d) => {
    const company      = (d.lead?.company_name || d.company_name || '').toLowerCase();
    const contact      = (d.lead?.contact_name || d.contact_name || '').toLowerCase();
    const matchCompany = company.includes(searchCompany.toLowerCase());
    const matchContact = contact.includes(searchContact.toLowerCase());
    // Normalise both sides to lowercase so backend UPPERCASE values match dropdown values
    const dStatusLower = (d.status || '').toLowerCase();
    const matchStatus  = statusFilter === 'ALL' || dStatusLower === statusFilter.toLowerCase();
    return matchCompany && matchContact && matchStatus;
  });

  const paginatedDrafts = filteredDrafts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  /* ═══ Helpers ════════════════════════════════════════════════════════════= */
  const getStatusConfig = (status) =>
    STATUS_CONFIG[status?.toLowerCase()] ?? {
      label: status,
      bgcolor: 'rgba(107,114,128,0.15)',
      color: '#9ca3af',
    };

  const getLeadLabel = (d) => {
    if (d.lead?.company_name) return d.lead.company_name;
    if (d.company_name)       return d.company_name;
    return `Lead #${d.lead ?? d.lead_id ?? '—'}`;
  };

  const getContactLabel = (d) => d.lead?.contact_name || d.contact_name || '—';
  const getEmailLabel   = (d) => d.lead?.contact_email || d.contact_email || '—';

  /* ── Button disabled logic ──────────────────────────────────────────────── */
  // Case-insensitive helpers — backend may return 'DRAFT', 'APPROVED', etc.
  const canApprove = (d) => (d.status || '').toLowerCase() === 'draft';
  const canReject  = (d) => (d.status || '').toLowerCase() === 'draft';
  const canSend    = (d) => (d.status || '').toLowerCase() === 'approved';

  /* ═════════════════════════════════════════════════════════════════════════
     RENDER
  ═════════════════════════════════════════════════════════════════════════ */
  return (
    <Box>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        title="AI Email Drafts"
        subtitle="Generate, review, approve, and send AI-crafted outreach emails to your leads"
      >
        {/* Refresh */}
        <Tooltip title="Refresh drafts">
          <IconButton
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            sx={{
              color: '#9ca3af',
              bgcolor: '#111827',
              border: '1px solid #1f2937',
              '&:hover': { bgcolor: '#1f2937', color: '#ffffff' },
            }}
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>

        {/* Generate Draft */}
        <Button
          variant="contained"
          startIcon={<Sparkles size={18} />}
          onClick={handleOpenGenerate}
          sx={{
            bgcolor: '#6366f1',
            color: '#ffffff',
            fontWeight: 700,
            px: 2.5,
            py: 1,
            borderRadius: 2.5,
            textTransform: 'none',
            boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
            '&:hover': { bgcolor: '#4f46e5' },
          }}
        >
          Generate Draft
        </Button>
      </PageHeader>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 4,
            bgcolor: 'rgba(239,68,68,0.1)',
            color: '#fca5a5',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 3,
            '& .MuiAlert-icon': { color: '#ef4444' },
          }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchData(true)} sx={{ fontWeight: 700 }}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          bgcolor: '#111827',
          border: '1px solid #1f2937',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, flexWrap: 'wrap' }}>
          {/* Search by Company */}
          <TextField
            placeholder="Search by company…"
            size="small"
            value={searchCompany}
            onChange={(e) => { setSearchCompany(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color="#6b7280" />
                </InputAdornment>
              ),
              style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px', minWidth: '210px' },
            }}
          />

          {/* Search by Contact */}
          <TextField
            placeholder="Search by contact…"
            size="small"
            value={searchContact}
            onChange={(e) => { setSearchContact(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color="#6b7280" />
                </InputAdornment>
              ),
              style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px', minWidth: '210px' },
            }}
          />

          {/* Filter by Status */}
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Filter size={15} color="#6b7280" />
                </InputAdornment>
              ),
              style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px', minWidth: '165px' },
            }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="sent">Sent</MenuItem>
          </TextField>
        </Box>

        <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {filteredDrafts.length} draft{filteredDrafts.length !== 1 ? 's' : ''}
        </Typography>
      </Paper>

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner message="Loading email drafts…" minHeight="350px" />
      ) : (
        <Paper
          elevation={0}
          sx={{ borderRadius: 3, bgcolor: '#111827', border: '1px solid #1f2937', overflow: 'hidden' }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ borderBottom: '1px solid #1f2937', bgcolor: '#0b0f17' }}>
                  {['Draft ID', 'Company', 'Contact', 'Email', 'Subject', 'Tone', 'Status', 'Created At', 'Actions'].map((h) => (
                    <TableCell
                      key={h}
                      align={h === 'Actions' ? 'right' : 'left'}
                      sx={{ color: '#9ca3af', fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedDrafts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#6b7280' }}>
                      <Mail size={36} color="#374151" style={{ marginBottom: 8 }} />
                      <Typography variant="body1" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                        No email drafts found
                      </Typography>
                      <Typography variant="caption">
                        Click "Generate Draft" to create an AI-powered outreach email.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDrafts.map((row) => {
                    const sc = getStatusConfig(row.status);
                    const busy = !!actionLoading[row.id];
                    return (
                      <TableRow
                        key={row.id}
                        sx={{
                          borderBottom: '1px solid #1f2937',
                          transition: 'background-color 0.15s',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                        }}
                      >
                        <TableCell sx={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          #{row.id}
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>
                          {getLeadLabel(row)}
                        </TableCell>
                        <TableCell sx={{ color: '#f3f4f6', fontWeight: 600 }}>
                          {getContactLabel(row)}
                        </TableCell>
                        <TableCell sx={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: '0.83rem' }}>
                          {getEmailLabel(row)}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: '#d1d5db',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Tooltip title={row.subject || '—'}>
                            <span>{row.subject || '—'}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ color: '#a5b4fc', fontSize: '0.82rem', fontWeight: 600 }}>
                          {row.tone || '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sc.label}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: '0.7rem', bgcolor: sc.bgcolor, color: sc.color }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#6b7280', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {row.created_at
                            ? new Date(row.created_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })
                            : '—'}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {/* View */}
                            <Tooltip title="View Draft">
                              <IconButton
                                size="small"
                                onClick={() => setViewDraft(row)}
                                sx={{ color: '#818cf8', '&:hover': { bgcolor: 'rgba(99,102,241,0.1)' } }}
                              >
                                <Eye size={16} />
                              </IconButton>
                            </Tooltip>

                            {/* Approve */}
                            <Tooltip title={canApprove(row) ? 'Approve' : 'Cannot approve'}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => runAction(row.id, 'approveDraft', 'approved')}
                                  disabled={!canApprove(row) || busy}
                                  sx={{
                                    color: canApprove(row) ? '#10b981' : '#374151',
                                    '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' },
                                    '&.Mui-disabled': { color: '#374151' },
                                  }}
                                >
                                  <CheckCircle size={16} />
                                </IconButton>
                              </span>
                            </Tooltip>

                            {/* Reject */}
                            <Tooltip title={canReject(row) ? 'Reject' : 'Cannot reject'}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => runAction(row.id, 'rejectDraft', 'rejected')}
                                  disabled={!canReject(row) || busy}
                                  sx={{
                                    color: canReject(row) ? '#ef4444' : '#374151',
                                    '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' },
                                    '&.Mui-disabled': { color: '#374151' },
                                  }}
                                >
                                  <XCircle size={16} />
                                </IconButton>
                              </span>
                            </Tooltip>

                            {/* Send */}
                            <Tooltip title={canSend(row) ? 'Send Email' : 'Must be Approved first'}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => runAction(row.id, 'sendDraft', 'sent')}
                                  disabled={!canSend(row) || busy}
                                  sx={{
                                    color: canSend(row) ? '#6366f1' : '#374151',
                                    '&:hover': { bgcolor: 'rgba(99,102,241,0.1)' },
                                    '&.Mui-disabled': { color: '#374151' },
                                  }}
                                >
                                  <Send size={16} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredDrafts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, np) => setPage(np)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            sx={{
              color: '#9ca3af',
              borderTop: '1px solid #1f2937',
              '& .MuiTablePagination-selectIcon': { color: '#9ca3af' },
            }}
          />
        </Paper>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          GENERATE DRAFT MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={generateOpen}
        onClose={() => !isGenerating && setGenerateOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: modalPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sparkles color="#818cf8" size={22} />
          Generate AI Email Draft
        </DialogTitle>

        <form onSubmit={handleSubmit(onGenerateSubmit)}>
          <DialogContent sx={{ py: 2 }}>
            <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
              Select a lead and tone. The AI will generate a personalised outreach email.
            </Typography>

            {/* Lead Dropdown */}
            <FieldLabel required>Lead</FieldLabel>
            <Controller
              name="lead_id"
              control={control}
              rules={{ required: 'Please select a lead' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  error={Boolean(errors.lead_id)}
                  helperText={errors.lead_id?.message}
                  sx={{ mb: 3 }}
                  InputProps={{
                    style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                  }}
                >
                  {leads.length === 0 ? (
                    <MenuItem value="" disabled>No leads available</MenuItem>
                  ) : (
                    leads.map((l) => (
                      <MenuItem key={l.id} value={l.id}>
                        {l.company_name || l.contact_name || `Lead #${l.id}`}
                        {l.contact_name && l.company_name ? ` — ${l.contact_name}` : ''}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              )}
            />

            {/* Tone Dropdown */}
            <FieldLabel required>Tone</FieldLabel>
            <Controller
              name="tone"
              control={control}
              rules={{ required: 'Tone is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  error={Boolean(errors.tone)}
                  helperText={errors.tone?.message}
                  InputProps={{
                    style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                  }}
                >
                  {TONE_OPTIONS.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setGenerateOpen(false)}
              disabled={isGenerating}
              sx={{ color: '#9ca3af', textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isGenerating}
              sx={{
                bgcolor: '#6366f1',
                color: '#ffffff',
                fontWeight: 700,
                px: 3,
                textTransform: 'none',
                '&:hover': { bgcolor: '#4f46e5' },
              }}
            >
              {isGenerating ? 'Generating…' : 'Generate'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          VIEW DRAFT MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(viewDraft)}
        onClose={() => setViewDraft(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: modalPaperSx }}
      >
        {viewDraft && (
          <>
            <DialogTitle
              sx={{
                fontWeight: 800,
                color: '#ffffff',
                borderBottom: '1px solid #1f2937',
                pb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Mail color="#818cf8" size={22} />
                Email Draft #{viewDraft.id}
              </Box>
              <Chip
                label={getStatusConfig(viewDraft.status).label}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  bgcolor: getStatusConfig(viewDraft.status).bgcolor,
                  color: getStatusConfig(viewDraft.status).color,
                }}
              />
            </DialogTitle>

            <DialogContent sx={{ py: 3 }}>
              {/* Meta row */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Lead / Company
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#f3f4f6', fontWeight: 600, mt: 0.5 }}>
                    {getLeadLabel(viewDraft)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Contact
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#f3f4f6', fontWeight: 600, mt: 0.5 }}>
                    {getContactLabel(viewDraft)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Tone
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a5b4fc', fontWeight: 600, mt: 0.5 }}>
                    {viewDraft.tone || '—'}
                  </Typography>
                </Box>
              </Stack>

              {/* Subject */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Subject
                </Typography>
                <Box
                  sx={{
                    mt: 0.8,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#0b0f17',
                    border: '1px solid #1f2937',
                  }}
                >
                  <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 700 }}>
                    {viewDraft.subject || '(No subject)'}
                  </Typography>
                </Box>
              </Box>

              {/* Body */}
              <Box>
                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Email Body
                </Typography>
                <Box
                  sx={{
                    mt: 0.8,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#0b0f17',
                    border: '1px solid #1f2937',
                    maxHeight: 340,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { width: 6 },
                    '&::-webkit-scrollbar-track': { bgcolor: '#111827' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: '#374151', borderRadius: 3 },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: '#d1d5db', whiteSpace: 'pre-wrap', lineHeight: 1.75 }}
                  >
                    {viewDraft.body || viewDraft.email_body || '(No body content)'}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>

            <Divider sx={{ borderColor: '#1f2937' }} />

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button
                onClick={() => setViewDraft(null)}
                sx={{ color: '#9ca3af', textTransform: 'none' }}
              >
                Close
              </Button>

              {canApprove(viewDraft) && (
                <Button
                  variant="outlined"
                  startIcon={<CheckCircle size={16} />}
                  onClick={() => runAction(viewDraft.id, 'approveDraft', 'approved')}
                  disabled={!!actionLoading[viewDraft.id]}
                  sx={{
                    borderColor: '#10b981',
                    color: '#10b981',
                    textTransform: 'none',
                    fontWeight: 700,
                    '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' },
                  }}
                >
                  Approve
                </Button>
              )}

              {canReject(viewDraft) && (
                <Button
                  variant="outlined"
                  startIcon={<XCircle size={16} />}
                  onClick={() => runAction(viewDraft.id, 'rejectDraft', 'rejected')}
                  disabled={!!actionLoading[viewDraft.id]}
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    textTransform: 'none',
                    fontWeight: 700,
                    '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' },
                  }}
                >
                  Reject
                </Button>
              )}

              {canSend(viewDraft) && (
                <Button
                  variant="contained"
                  startIcon={<Send size={16} />}
                  onClick={() => runAction(viewDraft.id, 'sendDraft', 'sent')}
                  disabled={!!actionLoading[viewDraft.id]}
                  sx={{
                    bgcolor: '#6366f1',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#4f46e5' },
                  }}
                >
                  Send Email
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          DELETE CONFIRM  (not exposed in toolbar — left as safety net)
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: modalPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertTriangle color="#f59e0b" size={22} />
          Confirm Action
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            Are you sure you want to reject Draft #{deleteTarget?.id}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting} sx={{ color: '#9ca3af', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            sx={{ bgcolor: '#ef4444', color: '#fff', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#dc2626' } }}
          >
            {isDeleting ? 'Removing…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailDrafts;
