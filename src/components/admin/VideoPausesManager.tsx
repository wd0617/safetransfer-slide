import { useEffect, useState } from 'react';
import { supabase, VideoPause, MediaItem } from '../../lib/supabase';
import { Trash2, Save, X, Upload, Clock, Image } from 'lucide-react';
import { useBusiness } from '../../contexts/BusinessContext';
import { getTranslation } from '../../lib/translations';

interface VideoPausesManagerProps {
  mediaItem: MediaItem;
  onClose: () => void;
}

export default function VideoPausesManager({ mediaItem, onClose }: VideoPausesManagerProps) {
  const { language } = useBusiness();
  const [pauses, setPauses] = useState<VideoPause[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    pause_at_seconds: '0',
    display_duration_seconds: '5',
    overlay_type: 'image' as 'image' | 'media_item',
    overlay_image_url: '',
    is_active: true
  });
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    loadPauses();
    loadBusinessId();
  }, [mediaItem.id]);

  async function loadBusinessId() {
    const { data } = await supabase
      .from('media_items')
      .select('business_id')
      .eq('id', mediaItem.id)
      .maybeSingle();

    if (data) setBusinessId(data.business_id);
  }

  async function loadPauses() {
    const { data } = await supabase
      .from('video_pauses')
      .select('*')
      .eq('media_item_id', mediaItem.id)
      .order('pause_at_seconds');
    if (data) setPauses(data);
  }

  async function handleFileUpload(file: File): Promise<string | null> {
    if (!businessId) return null;

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

    let finalUrl = formData.overlay_image_url;

    if (uploadMethod === 'file' && selectedFile && !editingId) {
      const uploadedUrl = await handleFileUpload(selectedFile);
      if (!uploadedUrl) return;
      finalUrl = uploadedUrl;
    }

    if (editingId) {
      await supabase
        .from('video_pauses')
        .update({
          pause_at_seconds: parseInt(formData.pause_at_seconds),
          display_duration_seconds: parseInt(formData.display_duration_seconds),
          overlay_type: formData.overlay_type,
          overlay_image_url: finalUrl,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);
    } else {
      const maxOrder = pauses.length > 0 ? Math.max(...pauses.map(p => p.order_index)) : 0;
      await supabase
        .from('video_pauses')
        .insert({
          media_item_id: mediaItem.id,
          pause_at_seconds: parseInt(formData.pause_at_seconds),
          display_duration_seconds: parseInt(formData.display_duration_seconds),
          overlay_type: formData.overlay_type,
          overlay_image_url: finalUrl,
          is_active: formData.is_active,
          order_index: maxOrder + 1
        });
    }

    resetForm();
    loadPauses();
  }

  function resetForm() {
    setFormData({
      pause_at_seconds: '0',
      display_duration_seconds: '5',
      overlay_type: 'image',
      overlay_image_url: '',
      is_active: true
    });
    setEditingId(null);
    setSelectedFile(null);
    setUploadMethod('url');
  }

  function editPause(pause: VideoPause) {
    setFormData({
      pause_at_seconds: pause.pause_at_seconds.toString(),
      display_duration_seconds: pause.display_duration_seconds.toString(),
      overlay_type: pause.overlay_type,
      overlay_image_url: pause.overlay_image_url || '',
      is_active: pause.is_active
    });
    setEditingId(pause.id);
  }

  async function deletePause(id: string) {
    if (confirm(getTranslation(language, 'deletePause'))) {
      await supabase.from('video_pauses').delete().eq('id', id);
      loadPauses();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{getTranslation(language, 'scheduledPauses')}</h2>
            <p className="text-sm text-slate-600 mt-1">{getTranslation(language, 'videoLabel')}: {mediaItem.url}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {editingId ? getTranslation(language, 'editPause') : getTranslation(language, 'addPause')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {getTranslation(language, 'pauseAtSeconds')}
                  </label>
                  <input
                    type="number"
                    value={formData.pause_at_seconds}
                    onChange={(e) => setFormData({ ...formData, pause_at_seconds: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
                    min="0"
                    step="0.1"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {getTranslation(language, 'exactMomentToPause')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {getTranslation(language, 'imageDuration')}
                  </label>
                  <input
                    type="number"
                    value={formData.display_duration_seconds}
                    onChange={(e) => setFormData({ ...formData, display_duration_seconds: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
                    min="1"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {getTranslation(language, 'timeToShowImage')}
                  </p>
                </div>

                {!editingId && (
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
                            setFormData({ ...formData, overlay_image_url: '' });
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-700">{getTranslation(language, 'uploadFile')}</span>
                      </label>
                    </div>
                  </div>
                )}

                {uploadMethod === 'url' ? (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {getTranslation(language, 'imageUrl')}
                    </label>
                    <input
                      type="url"
                      value={formData.overlay_image_url}
                      onChange={(e) => setFormData({ ...formData, overlay_image_url: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
                      placeholder="https://example.com/image.jpg"
                      required
                    />
                  </div>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {getTranslation(language, 'selectImage')}
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 transition-colors">
                          <Upload className="w-5 h-5 text-slate-600" />
                          <span className="text-sm text-slate-600">
                            {selectedFile ? selectedFile.name : getTranslation(language, 'clickToSelectImage')}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
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

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800">{getTranslation(language, 'configuredPauses')}</h3>
            {pauses.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {getTranslation(language, 'noPausesConfigured')}
              </div>
            ) : (
              pauses.map((pause) => (
                <div
                  key={pause.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {getTranslation(language, 'pauseAt')} {pause.pause_at_seconds}s
                      </p>
                      <p className="text-sm text-slate-600">
                        {getTranslation(language, 'showImageFor')} {pause.display_duration_seconds}s
                      </p>
                      {pause.overlay_image_url && (
                        <div className="mt-2">
                          <img
                            src={pause.overlay_image_url}
                            alt="Overlay preview"
                            className="w-32 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                    {!pause.is_active && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                        {getTranslation(language, 'inactive')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editPause(pause)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Image className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deletePause(pause.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
