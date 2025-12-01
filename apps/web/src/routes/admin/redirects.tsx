import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient, Redirect, ApiError } from '../../lib/apiClient';

const redirectSchema = z.object({
  sourceSlug: z.string().min(1, 'Source slug is required').regex(/^\/[a-z0-9-/]+$/, 'Must start with / and contain only lowercase letters, numbers, and hyphens'),
  destinationUrl: z.string().min(1, 'Destination URL is required'),
  active: z.boolean(),
});

type RedirectFormData = z.infer<typeof redirectSchema>;

export default function AdminRedirects() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RedirectFormData>({
    resolver: zodResolver(redirectSchema),
    defaultValues: {
      sourceSlug: '/',
      destinationUrl: 'https://',
      active: true,
    },
  });

  const fetchRedirects = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getRedirects();
      setRedirects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch redirects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRedirects();
  }, []);

  const onSubmit = async (data: RedirectFormData) => {
    try {
      if (isEditing && editingId) {
        await apiClient.updateRedirect(editingId, data);
      } else {
        await apiClient.createRedirect(data);
      }
      await fetchRedirects();
      resetForm();
    } catch (err) {
      if (err instanceof ApiError && err.response?.validation) {
        // Handle validation errors from API if needed, though Zod handles client side
        setError('Validation failed: ' + JSON.stringify(err.response.validation));
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save redirect');
      }
    }
  };

  const handleEdit = (redirect: Redirect) => {
    setIsEditing(true);
    setEditingId(redirect.id);
    setValue('sourceSlug', redirect.sourceSlug);
    setValue('destinationUrl', redirect.destinationUrl);
    setValue('active', redirect.active);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this redirect?')) return;
    
    try {
      await apiClient.deleteRedirect(id);
      await fetchRedirects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete redirect');
    }
  };

  const handleToggleActive = async (redirect: Redirect) => {
    try {
      await apiClient.updateRedirect(redirect.id, { active: !redirect.active });
      await fetchRedirects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    reset({
      sourceSlug: '/',
      destinationUrl: 'https://',
      active: true,
    });
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Redirects Management
          </h2>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg mb-8 p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          {isEditing ? 'Edit Redirect' : 'Create New Redirect'}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="sourceSlug" className="block text-sm font-medium text-gray-700">
                Source Slug
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  {...register('sourceSlug')}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="/old-page"
                />
                {errors.sourceSlug && (
                  <p className="mt-2 text-sm text-red-600">{errors.sourceSlug.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="destinationUrl" className="block text-sm font-medium text-gray-700">
                Destination URL
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  {...register('destinationUrl')}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="https://example.com/new-page"
                />
                {errors.destinationUrl && (
                  <p className="mt-2 text-sm text-red-600">{errors.destinationUrl.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="active"
                    type="checkbox"
                    {...register('active')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="active" className="font-medium text-gray-700">
                    Active
                  </label>
                  <p className="text-gray-500">Enable or disable this redirect.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Redirect' : 'Create Redirect')}
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destination
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : redirects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No redirects found.
                      </td>
                    </tr>
                  ) : (
                    redirects.map((redirect) => (
                      <tr key={redirect.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {redirect.sourceSlug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <a href={redirect.destinationUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                            {redirect.destinationUrl}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleToggleActive(redirect)}
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              redirect.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {redirect.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(redirect)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(redirect.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
