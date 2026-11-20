import React, { useState } from 'react';
import { Plus, Trash2, Edit3, DollarSign, Package, ShoppingCart, Users, CheckCircle2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CATEGORIES } from '../data/products';

export default function AdminDashboard() {
  const { products, addProduct, updateProduct, deleteProduct, orders, showToast } = useStore();
  const [activeTab, setActiveTab] = useState('products');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Add Product Form State
  const [newProd, setNewProd] = useState({
    title: '',
    slug: '',
    category: 'Reel Bundle',
    badge: '-90%',
    regularPrice: 1999,
    salePrice: 147,
    image: '/assets/febric/Sheru-Bhai-Viral-Reels-Bundle-1024x1024-1.webp',
    shortDescription: 'High-converting viral reels pack with instant cloud download access.',
    features: ['500+ HD Video Reels', '100% Monetizable', 'Bonus Growth Masterclass'],
    downloadUrl: 'https://drive.google.com/drive/folders/febric-new-pack'
  });

  const totalSalesRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newProd.title || !newProd.slug) {
      showToast('Please fill title and slug');
      return;
    }
    if (editingProduct) {
      updateProduct({ ...newProd, id: editingProduct.id });
      setEditingProduct(null);
    } else {
      addProduct(newProd);
    }
    setShowAddModal(false);
    setNewProd({
      title: '',
      slug: '',
      category: 'Reel Bundle',
      badge: '-90%',
      regularPrice: 1999,
      salePrice: 147,
      image: '/assets/febric/Sheru-Bhai-Viral-Reels-Bundle-1024x1024-1.webp',
      shortDescription: '',
      features: ['500+ HD Video Reels', 'Commercial Rights'],
      downloadUrl: ''
    });
  };

  const startEdit = (p) => {
    setEditingProduct(p);
    setNewProd({ ...p });
    setShowAddModal(true);
  };

  return (
    <div className="py-10 sm:py-16 bg-gray-50/70 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Store <span className="text-febric-coral">Administration</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Manage products, digital download files, orders, and sales performance
            </p>
          </div>

          <button
            onClick={() => {
              setEditingProduct(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 bg-febric-coral hover:bg-febric-pink text-white text-xs font-bold px-5 py-3 rounded-full shadow-lg shadow-febric-coral/20 transition-all self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add New Product Bundle</span>
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Sales</span>
              <div className="text-xl sm:text-2xl font-black text-gray-900">₹{totalSalesRevenue}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart size={24} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</span>
              <div className="text-xl sm:text-2xl font-black text-gray-900">{orders.length}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package size={24} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live Catalog</span>
              <div className="text-xl sm:text-2xl font-black text-gray-900">{products.length} Products</div>
            </div>
          </div>
        </div>

        {/* Tabs: Products vs Orders */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 px-6 pt-4 gap-6">
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'products' ? 'border-febric-coral text-febric-coral' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              Manage Catalog ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'orders' ? 'border-febric-coral text-febric-coral' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              Customer Orders ({orders.length})
            </button>
          </div>

          {activeTab === 'products' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-4 px-6">Product</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Regular</th>
                    <th className="py-4 px-4">Sale Price</th>
                    <th className="py-4 px-4">Discount</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                        <div>
                          <div className="font-bold text-gray-900 max-w-xs truncate">{p.title}</div>
                          <div className="text-[10px] text-gray-400 font-mono">/product/{p.slug}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 line-through text-gray-400">₹{p.regularPrice}</td>
                      <td className="py-4 px-4 font-black text-gray-900">₹{p.salePrice}</td>
                      <td className="py-4 px-4 font-bold text-emerald-600">{p.badge}</td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-febric-coral hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete product "${p.title}"?`)) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {orders.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-xs">
                  No orders recorded yet. Place a test order through the checkout flow!
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-4 px-6">Order ID</th>
                      <th className="py-4 px-4">Date</th>
                      <th className="py-4 px-4">Customer</th>
                      <th className="py-4 px-4">Items</th>
                      <th className="py-4 px-4">Total</th>
                      <th className="py-4 px-4">Payment</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((o) => (
                      <tr key={o.orderId} className="hover:bg-gray-50/50">
                        <td className="py-4 px-6 font-mono font-bold text-gray-900">#{o.orderId}</td>
                        <td className="py-4 px-4 text-gray-500">{new Date(o.date).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-gray-900">{o.customer?.name}</div>
                          <div className="text-[10px] text-gray-400">{o.customer?.phone}</div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-700">{o.items?.length || 0} product(s)</td>
                        <td className="py-4 px-4 font-black text-gray-900">₹{o.total}</td>
                        <td className="py-4 px-4 uppercase text-[10px] font-bold text-gray-500">{o.paymentMethod}</td>
                        <td className="py-4 px-6">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900">
                {editingProduct ? 'Edit Product Bundle' : 'Add New Digital Product'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500+ AI Hindi Podcast Reels Bundle by Sanskruti Store"
                  value={newProd.title}
                  onChange={(e) => setNewProd({ ...newProd, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-febric-coral"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Slug (URL) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ai-podcast-reels"
                    value={newProd.slug}
                    onChange={(e) => setNewProd({ ...newProd, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-febric-coral"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-febric-coral"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Regular Price (₹)</label>
                  <input
                    type="number"
                    value={newProd.regularPrice}
                    onChange={(e) => setNewProd({ ...newProd, regularPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Sale Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newProd.salePrice}
                    onChange={(e) => setNewProd({ ...newProd, salePrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none font-bold text-febric-coral"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Discount Badge</label>
                  <input
                    type="text"
                    value={newProd.badge}
                    onChange={(e) => setNewProd({ ...newProd, badge: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Thumbnail Image URL or Path</label>
                <input
                  type="text"
                  value={newProd.image}
                  onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Google Drive Download Folder URL</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={newProd.downloadUrl}
                  onChange={(e) => setNewProd({ ...newProd, downloadUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Short Description</label>
                <textarea
                  rows="2"
                  value={newProd.shortDescription}
                  onChange={(e) => setNewProd({ ...newProd, shortDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-full border border-gray-200 text-gray-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-febric-coral text-white font-bold"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
