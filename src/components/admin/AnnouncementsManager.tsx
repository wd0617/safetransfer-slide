import { useEffect, useState } from 'react';
import { supabase, Announcement } from '../../lib/supabase';
import { Pencil, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { useBusiness } from '../../contexts/BusinessContext';
import { getTranslation } from '../../lib/translations';

interface AnnouncementsManagerProps {
  businessId?: string;
}

export default function AnnouncementsManager({ businessId = '' }: AnnouncementsManagerProps) {
  const { language } = useBusiness();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    is_active: true
  });

  useEffect(() => {
    loadAnnouncements();
  }, [businessId]);

  async function loadAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('business_id', businessId)
      .order('order_index');
    if (data) setAnnouncements(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingId) {
      await supabase
        .from('announcements')
        .update({
          title: formData.title,
          message: formData.message,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);
    } else {
      const maxOrder = announcements.length > 0 ? Math.max(...announcements.map(a => a.order_index)) : 0;
      await supabase
        .from('announcements')
        .insert({
          business_id: businessId,
          title: formData.title,
          message: formData.message,
          is_active: formData.is_active,
          order_index: maxOrder + 1
        });
    }

    resetForm();
    loadAnnouncements();
  }

  function resetForm() {
    setFormData({ title: '', message: '', is_active: true });
    setEditingId(null);
  }

  function editAnnouncement(announcement: Announcement) {
    setFormData({
      title: announcement.title,
      message: announcement.message,
      is_active: announcement.is_active
    });
    setEditingId(announcement.id);
  }

  async function deleteAnnouncement(id: string) {
    if (confirm(getTranslation(language, 'deleteAnnouncement'))) {
      await supabase.from('announcements').delete().eq('id', id);
      loadAnnouncements();
    }
  }

  async function toggleActive(id: string, currentState: boolean) {
    await supabase
      .from('announcements')
      .update({ is_active: !currentState })
      .eq('id', id);
    loadAnnouncements();
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          {editingId ? getTranslation(language, 'editAnnouncement') : getTranslation(language, 'addAnnouncementItem')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {getTranslation(language, 'titleOptional')}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
              placeholder={getTranslation(language, 'exampleTitle')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {getTranslation(language, 'message')}
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 min-h-24"
              placeholder={getTranslation(language, 'writeMessageHere')}
              required
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 text-blue-600"
              />
              <span className="text-sm font-medium text-slate-700">{getTranslation(language, 'active')}</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              {editingId ? getTranslation(language, 'update') : getTranslation(language, 'add')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 px-6 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500"
              >
                <X className="w-4 h-4" />
                {getTranslation(language, 'cancel')}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                {announcement.title && (
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{announcement.title}</h3>
                )}
                <p className="text-slate-700">{announcement.message}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ml-4 ${
                announcement.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {announcement.is_active ? getTranslation(language, 'active') : getTranslation(language, 'inactive')}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleActive(announcement.id, announcement.is_active)}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm"
              >
                {announcement.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {announcement.is_active ? getTranslation(language, 'deactivate') : getTranslation(language, 'activate')}
              </button>
              <button
                onClick={() => editAnnouncement(announcement)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm"
              >
                <Pencil className="w-4 h-4" />
                {getTranslation(language, 'edit')}
              </button>
              <button
                onClick={() => deleteAnnouncement(announcement.id)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm"
              >
                <Trash2 className="w-4 h-4" />
                {getTranslation(language, 'delete')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {announcements.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <p className="text-slate-500">{getTranslation(language, 'noAnnouncements')}</p>
        </div>
      )}
    </div>
  );
}
