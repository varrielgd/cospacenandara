import React, { useState, useEffect } from 'react';
import { Supplier } from '../types';
import { api } from '../utils/api';
import { Plus, Upload, Edit, Trash2, Coffee, Users, FileSpreadsheet } from 'lucide-react';

interface SupplierViewProps {
  // Add any props if needed later
}

const SupplierView: React.FC<SupplierViewProps> = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    email: '',
    phone: '',
    whatsapp: '',
    linkedin: '',
    country: '',
    city: '',
    address: '',
    coffeeType: '',
    certifications: '',
    minimumOrderQty: '',
    priceRange: '',
    notes: '',
  });

  const fetchSuppliers = async () => {
    try {
      const data = await api.get('/api/suppliers');
      setSuppliers(data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/api/suppliers/${editingSupplier.id}`, formData);
      } else {
        await api.post('/api/suppliers', formData);
      }
      fetchSuppliers();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving supplier:', err);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      companyName: supplier.companyName,
      website: supplier.website || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      whatsapp: supplier.whatsapp || '',
      linkedin: supplier.linkedin || '',
      country: supplier.country || '',
      city: supplier.city || '',
      address: supplier.address || '',
      coffeeType: supplier.coffeeType || '',
      certifications: supplier.certifications || '',
      minimumOrderQty: supplier.minimumOrderQty || '',
      priceRange: supplier.priceRange || '',
      notes: supplier.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        await api.delete(`/api/suppliers/${id}`);
        fetchSuppliers();
      } catch (err) {
        console.error('Error deleting supplier:', err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await api.post('/api/suppliers/import', formData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        alert('Suppliers imported successfully!');
        fetchSuppliers();
      } catch (err) {
        console.error('Error importing suppliers:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      website: '',
      email: '',
      phone: '',
      whatsapp: '',
      linkedin: '',
      country: '',
      city: '',
      address: '',
      coffeeType: '',
      certifications: '',
      minimumOrderQty: '',
      priceRange: '',
      notes: '',
    });
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Coffee className="w-8 h-8 text-[#C9A227]" />
          <div>
            <h3 className="text-xl font-serif italic text-primary">Supplier Management</h3>
            <p className="text-sm text-gray-500 font-mono tracking-widest uppercase">
              Manage your coffee bean suppliers and import from Excel
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md cursor-pointer hover:bg-primary/90 transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-sm uppercase tracking-widest">Import Excel</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A227] text-[#05190F] rounded-md hover:bg-[#D4AF37] transition-colors font-bold uppercase tracking-widest text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#05190F] text-white">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-mono uppercase tracking-wider text-gold">
                  Company Name
                </th>
                <th className="text-left py-3 px-4 text-xs font-mono uppercase tracking-wider text-gold">
                  Country
                </th>
                <th className="text-left py-3 px-4 text-xs font-mono uppercase tracking-wider text-gold">
                  Contact
                </th>
                <th className="text-left py-3 px-4 text-xs font-mono uppercase tracking-wider text-gold">
                  Coffee Type
                </th>
                <th className="text-left py-3 px-4 text-xs font-mono uppercase tracking-wider text-gold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-primary">{supplier.companyName}</div>
                    {supplier.website && (
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#C9A227] hover:underline"
                      >
                        {supplier.website}
                      </a>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {supplier.country || '-'}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {supplier.email && (
                      <div className="text-gray-600">{supplier.email}</div>
                    )}
                    {supplier.phone && (
                      <div className="text-gray-500 text-xs">{supplier.phone}</div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {supplier.coffeeType || '-'}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="p-2 text-[#C9A227] hover:bg-[#C9A227]/10 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-sm font-mono uppercase tracking-widest">No suppliers yet</p>
                      <p className="text-xs text-gray-400">Add a supplier or import from Excel</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-serif italic text-primary">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h4>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                    Coffee Type
                  </label>
                  <input
                    type="text"
                    name="coffeeType"
                    value={formData.coffeeType}
                    onChange={handleInputChange}
                    placeholder="Arabica, Robusta, etc."
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                    Certifications
                  </label>
                  <input
                    type="text"
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleInputChange}
                    placeholder="Organic, Fair Trade, etc."
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                    Minimum Order Qty
                  </label>
                  <input
                    type="text"
                    name="minimumOrderQty"
                    value={formData.minimumOrderQty}
                    onChange={handleInputChange}
                    placeholder="e.g., 1000kg"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                    Price Range
                  </label>
                  <input
                    type="text"
                    name="priceRange"
                    value={formData.priceRange}
                    onChange={handleInputChange}
                    placeholder="e.g., $3-5/kg"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-sm uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C9A227] text-[#05190F] rounded-md hover:bg-[#D4AF37] transition-colors font-bold uppercase tracking-widest text-sm"
                >
                  {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierView;
