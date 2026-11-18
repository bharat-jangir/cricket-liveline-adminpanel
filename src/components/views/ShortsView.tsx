import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Short, contentService, errorText } from '../../services/content.service';

const selectCls = 'h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white';
const STATUS_STYLE: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  archived: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

interface FormState { title: string; description: string; videoUrl: string; thumbnail: string; durationSec: string; tags: string; status: Short['status'] }
const EMPTY: FormState = { title: '', description: '', videoUrl: '', thumbnail: '', durationSec: '', tags: '', status: 'draft' };

export function ShortsView() {
  const [items, setItems] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Short | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setTerm(search.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contentService.listShorts({ page, limit: 10, status: status || undefined, search: term || undefined });
      setItems(data.result);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (e) {
      toast.error(errorText(e, 'Failed to load shorts'));
    } finally {
      setLoading(false);
    }
  }, [page, status, term]);
  useEffect(() => { load(); }, [load]);

  const openEdit = (s: Short) => {
    setForm({ title: s.title, description: s.description || '', videoUrl: s.videoUrl, thumbnail: s.thumbnail || '', durationSec: s.durationSec ? String(s.durationSec) : '', tags: (s.tags || []).join(', '), status: s.status });
    setEditing({ id: s._id });
  };

  const save = async () => {
    if (!form.title.trim() || !form.videoUrl.trim()) { toast.error('Title and video URL are required'); return; }
    setSaving(true);
    try {
      await contentService.saveShort(editing!.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        videoUrl: form.videoUrl.trim(),
        thumbnail: form.thumbnail.trim() || null,
        durationSec: form.durationSec ? Number(form.durationSec) : 0,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        status: form.status,
      });
      toast.success(editing!.id ? 'Short updated' : 'Short created');
      setEditing(null);
      load();
    } catch (e) {
      toast.error(errorText(e, 'Failed to save short'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      await contentService.deleteShort(deleting._id);
      toast.success('Short deleted');
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(errorText(e, 'Failed to delete short'));
    } finally {
      setBusyDelete(false);
    }
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <Input placeholder="Search shorts…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700" />
          </div>
          <select aria-label="Status filter" className={selectCls} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option>
          </select>
        </div>
        <Button onClick={() => { setForm(EMPTY); setEditing({ id: null }); }} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="size-4 mr-2" />New short</Button>
      </div>

      <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 dark:border-slate-700">
              <TableHead className="text-slate-700 dark:text-slate-300">TITLE</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 w-28 text-center">STATUS</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 w-20 text-center">VIEWS</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 w-20 text-center">LIKES</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 w-28 text-center">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-500">No shorts yet. Add the first one.</TableCell></TableRow>
            ) : items.map((s) => (
              <TableRow key={s._id} className="border-slate-200 dark:border-slate-700">
                <TableCell className="max-w-md"><p className="truncate font-medium text-slate-900 dark:text-white">{s.title}</p><p className="truncate text-xs text-slate-500">{s.videoUrl}</p></TableCell>
                <TableCell className="text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status]}`}>{s.status}</span></TableCell>
                <TableCell className="text-center text-slate-700 dark:text-slate-300">{s.views}</TableCell>
                <TableCell className="text-center text-slate-700 dark:text-slate-300">{s.likes}</TableCell>
                <TableCell>
                  <div className="flex justify-center gap-1">
                    <Button variant="ghost" size="sm" aria-label={`Edit ${s.title}`} onClick={() => openEdit(s)}><Edit className="size-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label={`Delete ${s.title}`} onClick={() => setDeleting(s)}><Trash2 className="size-4 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm text-slate-600 dark:text-slate-400">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="size-4" /></Button>
          Page {page} of {totalPages}
          <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}><ChevronRight className="size-4" /></Button>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && !saving && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit short' : 'New short'}</DialogTitle>
            <DialogDescription>Use a direct video file or HLS stream URL (.mp4 / .m3u8). Page links such as YouTube watch URLs will not play in the apps.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="s-title">Title *</Label><Input id="s-title" maxLength={150} value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="s-desc">Description</Label><Textarea id="s-desc" rows={3} maxLength={500} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="s-url">Video URL *</Label><Input id="s-url" type="url" placeholder="https://…/clip.mp4" value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="s-thumb">Thumbnail URL</Label><Input id="s-thumb" type="url" placeholder="https://…/poster.jpg" value={form.thumbnail} onChange={(e) => set('thumbnail', e.target.value)} /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5"><Label htmlFor="s-dur">Duration (sec)</Label><Input id="s-dur" type="number" min={0} max={3600} value={form.durationSec} onChange={(e) => set('durationSec', e.target.value)} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="s-tags">Tags (comma separated)</Label><Input id="s-tags" value={form.tags} onChange={(e) => set('tags', e.target.value)} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="s-status">Status</Label>
              <select id="s-status" className={`${selectCls} w-full`} value={form.status} onChange={(e) => set('status', e.target.value as Short['status'])}>
                <option value="draft">Draft (not visible)</option><option value="published">Published</option><option value="archived">Archived</option>
              </select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={saving} onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white">{saving ? <Loader2 className="size-4 animate-spin" /> : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete short?" description={deleting ? `“${deleting.title}” will be permanently removed.` : ''} confirmLabel="Delete" variant="destructive" onConfirm={remove} loading={busyDelete} />
    </div>
  );
}
