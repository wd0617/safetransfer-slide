import { useEffect, useState } from 'react';
import { supabase, MediaItem } from '../../lib/supabase';
import { Pencil, Trash2, Eye, EyeOff, Save, X, Upload, Clock } from 'lucide-react';
import VideoPausesManager from './VideoPausesManager';
import { useBusiness } from '../../contexts/BusinessContext';
import { getTranslation } from '../../lib/translations';

interface MediaManagerProps {
  businessId?: string;
}

export default function MediaManager({ businessId = '' }: MediaManagerProps) {
  const { language } = useBusiness();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'image' as 'image' | 'video' | 'youtube',
    url: '',
    duration_seconds: '10',
    is_active: true
  });
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [managingPausesFor, setManagingPausesFor] = useState<MediaItem | null>(null);

  useEffect(() => {
    loadMediaItems();
  }, [businessId]);

  async function loadMediaItems() {
    const { data } = await supabase
      .from('media_items')
      .select('*')
      .eq('business_id', businessId)
      .order('order_index');
    if (data) setMediaItems(data);
  }

  async function handleFileUpload(file: File): Promise<string | null> {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('business-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(getTranslation(language, 'errorUploadingFile'));
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let finalUrl = formData.url;

    if (uploadMethod === 'file' && selectedFile && !editingId) {
      const uploadedUrl = await handleFileUpload(selectedFile);
      if (!uploadedUrl) return;
      finalUrl = uploadedUrl;
    }

    if (editingId) {
      await supabase
        .from('media_items')
        .update({
          type: formData.type,
          url: finalUrl,
          duration_seconds: parseInt(formData.duration_seconds),
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);
    } else {
      const maxOrder = mediaItems.length > 0 ? Math.max(...mediaItems.map(m => m.order_index)) : 0;
      await supabase
        .from('media_items')
        .insert({
          business_id: businessId,
          type: formData.type,
          url: finalUrl,
          duration_seconds: parseInt(formData.duration_seconds),
          is_active: formData.is_active,
          order_index: maxOrder + 1
        });
    }

    resetForm();
    loadMediaItems();
  }

  function resetForm() {
    setFormData({ type: 'image', url: '', duration_seconds: '10', is_active: true });
    setEditingId(null);
    setSelectedFile(null);
    setUploadMethod('url');
  }

  function editMediaItem(item: MediaItem) {
    setFormData({
      type: item.type,
      url: item.url,
      duration_seconds: item.duration_seconds.toString(),
      is_active: item.is_active
    });
    setEditingId(item.id);
  }

  async function deleteMediaItem(id: string) {
    if (confirm(getTranslation(language, 'deleteMedia'))) {
      await supabase.from('media_items').delete().eq('id', id);
      loadMediaItems();
    }
  }

  async function toggleActive(id: string, currentState: boolean) {
    await supabase
      .from('media_items')
      .update({ is_active: !currentState })
      .eq('id', id);
    loadMediaItems();
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          {editingId ? getTranslation(language, 'editMedia') : getTranslation(language, 'addMediaItem')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {getTranslation(language, 'mediaTypeLabel')}
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'image' | 'video' | 'youtube' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="image">{getTranslation(language, 'image')}</option>
                <option value="video">{getTranslation(language, 'video')}</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {getTranslation(language, 'durationSeconds')}
              </label>
              <input
                type="number"
                value={formData.duration_seconds}
                onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
                min="1"
                required
              />
            </div>
            {formData.type !== 'youtube' && !editingId && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {getTranslation(language, 'addMethod')}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="url"
                      checked={uploadMethod === 'url'}
                      onChange={(e) => {
                        setUploadMethod(e.target.value as 'url' | 'file');
                        setSelectedFile(null);
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">{getTranslation(language, 'urlMethod')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="file"
                      checked={uploadMethod === 'file'}
                      onChange={(e) => {
                        setUploadMethod(e.target.value as 'url' | 'file');
                        setFormData({ ...formData, url: '' });
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">{getTranslation(language, 'uploadFile')}</span>
                  </label>
                </div>
              </div>
            )}

            {formData.type === 'youtube' || uploadMethod === 'url' ? (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {formData.type === 'youtube' ? getTranslation(language, 'youtubeUrl') : getTranslation(language, 'imageOrVideoUrl')}
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
                  placeholder={formData.type === 'youtube'
                    ? 'https://www.youtube.com/watch?v=VIDEO_ID'
                    : 'https://example.com/image.jpg'
                  }
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.type === 'youtube'
                    ? getTranslation(language, 'pasteYoutubeUrl')
                    : getTranslation(language, 'usePexelsOrUnsplash')
                  }
                </p>
              </div>
            ) : (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {getTranslation(language, 'selectFile')}
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 transition-colors">
                      <Upload className="w-5 h-5 text-slate-600" />
                      <span className="text-sm text-slate-600">
                        {selectedFile ? selectedFile.name : getTranslation(language, 'clickToSelectFile')}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept={formData.type === 'image' ? 'image/*' : 'video/*'}
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      required
                    />
                  </label>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.type === 'image' ? getTranslation(language, 'supportedFormatsImage') : getTranslation(language, 'supportedFormatsVideo')}
                </p>
              </div>
            )}
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
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {getTranslation(language, 'uploadingFile')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingId ? getTranslation(language, 'update') : getTranslation(language, 'add')}
                </>
              )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="aspect-video bg-slate-200 relative">
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt="Media"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Error';
                  }}
                />
              ) : item.type === 'youtube' ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-2 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <p className="text-sm">{getTranslation(language, 'youtubeVideo')}</p>
                  </div>
                </div>
              ) : (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.poster = 'https://via.placeholder.com/400x300?text=Error';
                  }}
                />
              )}
              <div className="absolute top-2 right-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {item.is_active ? getTranslation(language, 'active') : getTranslation(language, 'inactive')}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700 capitalize">{item.type}</span>
                <span className="text-sm text-slate-500">{item.duration_seconds}s</span>
              </div>
              <p className="text-xs text-slate-500 truncate mb-3">{item.url}</p>
              <div className="flex gap-2">
                {item.type === 'video' && (
                  <button
                    onClick={() => setManagingPausesFor(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm"
                    title={getTranslation(language, 'configurePauses')}
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => toggleActive(item.id, item.is_active)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm"
                >
                  {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => editMediaItem(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMediaItem(item.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mediaItems.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <p className="text-slate-500">{getTranslation(language, 'noMediaItems')}</p>
        </div>
      )}

      {managingPausesFor && (
        <VideoPausesManager
          mediaItem={managingPausesFor}
          onClose={() => setManagingPausesFor(null)}
        />
      )}
    </div>
  );
}
