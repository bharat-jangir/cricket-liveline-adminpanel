import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Article, ARTICLE_CATEGORIES, contentService, errorText } from '../../services/content.service';

const selectCls = 'h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-white';

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  archived: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

/** datetime-local <-> ISO helpers */
const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface FormState {
  title: string; summary: string; body: string; category: string; tags: string; coverImage: string;
  status: 'draft' | 'published' | 'archived'; publishedAt: string; isFeatured: boolean;
}
const EMPTY: FormState = { title: '', summary: '', body: '', category: 'general', tags: '', coverImage: '', status: 'draft', publishedAt: '', isFeatured: false };

export function NewsView() {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');

  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState(false);
  const [deleting, setDeleting] = useState<Article | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setTerm(search.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contentService.listArticles({ page, limit: 10, status: status || undefined, search: term || undefined });
      setItems(data.result);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (e) {
      toast.error(errorText(e, 'Failed to load articles'));
    } finally {
      setLoading(false);
    }
  }, [page, status, term]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(EMPTY); setEditing({ id: null }); };
  const openEdit = async (a: Article) => {
    setOpening(true);
    try {
      const full = await contentService.getArticle(a._id); // list omits the body
      setForm({
        title: full.title, summary: full.summary || '', body: full.body || '', category: full.category, tags: (full.tags || []).join(', '),
        coverImage: full.coverImage || '', status: full.status, publishedAt: toLocalInput(full.publishedAt), isFeatured: full.isFeatured,
      });
      setEditing({ id: a._id });
    } catch (e) {
      toast.error(errorText(e, 'Failed to open article'));
    } finally {
      setOpening(false);
    }
  };

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and body are required'); return; }
    setSaving(true);
    try {
      await contentService.saveArticle(editing!.id, {
        title: form.title.trim(),
        summary: form.summary.trim(),
        body: form.body,
        category: form.category,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        coverImage: form.coverImage.trim() || null,
        status: form.status,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
        isFeatured: form.isFeatured,
      });
      toast.success(editing!.id ? 'Article updated' : 'Article created');
      setEditing(null);
      load();
    } catch (e) {
      toast.error(errorText(e, 'Failed to save article'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      await contentService.deleteArticle(deleting._id);
      toast.success('Article deleted');
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(errorText(e, 'Failed to delete article'));
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
            <Input placeholder="Search articles…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700" />
          </div>
          <select aria-label="Status filter" className={selectCls} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option>
          </select>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="size-4 mr-2" />New article</Button>
      </div>

      <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 dark:border-slate-700">
              <TableHead className="text-slate-700 dark:text-slate-300">TITLE</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 w-32">CATEGORY</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 w-28 text-center">STATUS</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 w-44">PUBLISH DATE</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 w-20 text-center">VIEWS</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300 w-28 text-center">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-slate-500">No articles yet. Create the first one.</TableCell></TableRow>
            ) : items.map((a) => (
              <TableRow key={a._id} className="border-slate-200 dark:border-slate-700">
                <TableCell className="max-w-md"><p className="truncate font-medium text-slate-900 dark:text-white">{a.title}{a.isFeatured && <span className="ml-2 text-xs text-blue-600">★ featured</span>}</p><p className="text-xs text-slate-500">{a.authorName || '—'}</p></TableCell>
                <TableCell className="capitalize text-slate-700 dark:text-slate-300">{a.category.replace('-', ' ')}</TableCell>
                <TableCell className="text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status]}`}>{a.status}</span></TableCell>
                <TableCell className="text-sm text-slate-600 dark:text-slate-400">{a.publishedAt ? new Date(a.publishedAt).toLocaleString() : '—'}{a.publishedAt && new Date(a.publishedAt) > new Date() && <span className="ml-1 text-xs text-amber-600">(scheduled)</span>}</TableCell>
                <TableCell className="text-center text-slate-700 dark:text-slate-300">{a.views}</TableCell>
                <TableCell>
                  <div className="flex justify-center gap-1">
                    <Button variant="ghost" size="sm" aria-label={`Edit ${a.title}`} disabled={opening} onClick={() => openEdit(a)}><Edit className="size-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label={`Delete ${a.title}`} onClick={() => setDeleting(a)}><Trash2 className="size-4 text-red-500" /></Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit article' : 'New article'}</DialogTitle>
            <DialogDescription>Body is plain text: separate paragraphs with a blank line; start a line with “## ” for a heading.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="a-title">Title *</Label><Input id="a-title" maxLength={200} value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="a-sum">Summary</Label><Textarea id="a-sum" rows={2} maxLength={500} value={form.summary} onChange={(e) => set('summary', e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="a-body">Body *</Label><Textarea id="a-body" rows={12} value={form.body} onChange={(e) => set('body', e.target.value)} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="a-cat">Category</Label>
                <select id="a-cat" className={`${selectCls} w-full capitalize`} value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {ARTICLE_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('-', ' ')}</option>)}
                </select></div>
              <div className="space-y-1.5"><Label htmlFor="a-tags">Tags (comma separated)</Label><Input id="a-tags" value={form.tags} onChange={(e) => set('tags', e.target.value)} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="a-img">Cover image URL</Label><Input id="a-img" type="url" placeholder="https://…" value={form.coverImage} onChange={(e) => set('coverImage', e.target.value)} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="a-status">Status</Label>
                <select id="a-status" className={`${selectCls} w-full`} value={form.status} onChange={(e) => set('status', e.target.value as FormState['status'])}>
                  <option value="draft">Draft (not visible)</option><option value="published">Published</option><option value="archived">Archived</option>
                </select></div>
              <div className="space-y-1.5"><Label htmlFor="a-date">Publish date (optional, future = scheduled)</Label><Input id="a-date" type="datetime-local" value={form.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-3"><Switch id="a-feat" checked={form.isFeatured} onCheckedChange={(v) => set('isFeatured', v)} /><Label htmlFor="a-feat">Featured</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={saving} onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white">{saving ? <Loader2 className="size-4 animate-spin" /> : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete article?" description={deleting ? `“${deleting.title}” will be permanently removed.` : ''} confirmLabel="Delete" variant="destructive" onConfirm={remove} loading={busyDelete} />
    </div>
  );
}
