import { useState, useEffect, FormEvent } from 'react';
import { apiClient, Page } from '../../lib/apiClient';

export default function AdminPages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPage, setEditingPage] = useState<Page | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPages();
      setPages(data);
    } catch (err) {
      setError('Failed to load pages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPage) return;

    try {
      const updated = await apiClient.updatePage(editingPage.id, {
        title: editingPage.title,
        heroHeadline: editingPage.heroHeadline,
        heroSubhead: editingPage.heroSubhead,
        seoTitle: editingPage.seoTitle,
        seoDescription: editingPage.seoDescription,
      });
      
      setPages(pages.map(p => p.id === updated.id ? updated : p));
      setEditingPage(null);
    } catch (err) {
      setError('Failed to update page');
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pages Management</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      {editingPage ? (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Edit Page: {editingPage.slug}</h2>
            <button
              onClick={() => setEditingPage(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={editingPage.title}
                onChange={e => setEditingPage({ ...editingPage, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hero Headline</label>
              <input
                type="text"
                value={editingPage.heroHeadline || ''}
                onChange={e => setEditingPage({ ...editingPage, heroHeadline: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hero Subhead</label>
              <input
                type="text"
                value={editingPage.heroSubhead || ''}
                onChange={e => setEditingPage({ ...editingPage, heroSubhead: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">SEO Title</label>
              <input
                type="text"
                value={editingPage.seoTitle || ''}
                onChange={e => setEditingPage({ ...editingPage, seoTitle: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">SEO Description</label>
              <textarea
                value={editingPage.seoDescription || ''}
                onChange={e => setEditingPage({ ...editingPage, seoDescription: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {pages.map((page) => (
              <li key={page.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{page.title}</h3>
                  <p className="text-sm text-gray-500">/{page.slug}</p>
                </div>
                <button
                  onClick={() => handleEdit(page)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
