import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  ExternalLink,
  LayoutGrid,
  LayoutList,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/format';
import { wishlistService } from '@/services/wishlistService';
import { categoryService } from '@/services/categoryService';
import type { Category, WishlistCreate, WishlistItem, WishlistUpdate } from '@/types';

type WishlistFormState = {
  item_name: string;
  price: string;
  url: string;
  notes: string;
};

type PurchaseFormState = {
  purchase_date: string;
  category: string;
};

const defaultWishlistForm: WishlistFormState = {
  item_name: '',
  price: '',
  url: '',
  notes: '',
};

const defaultPurchaseForm: PurchaseFormState = {
  purchase_date: '',
  category: '',
};

const formatUrlLabel = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch (error) {
    return url;
  }
};

const Wishlist: React.FC = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null);
  const [itemToPurchase, setItemToPurchase] = useState<WishlistItem | null>(null);
  const [newItem, setNewItem] = useState<WishlistFormState>(defaultWishlistForm);
  const [editItem, setEditItem] = useState<WishlistFormState>(defaultWishlistForm);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormState>(defaultPurchaseForm);
  const [isLoading, setIsLoading] = useState(true);

  const total = wishlistItems.reduce((sum, item) => sum + Number(item.price), 0);

  const loadWishlist = async () => {
    try {
      setIsLoading(true);
      const data = await wishlistService.getWishlistItems();
      setWishlistItems(data);
    } catch (error) {
      toast.error('Failed to load wishlist.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories.');
    }
  };

  useEffect(() => {
    loadWishlist();
    loadCategories();
  }, []);

  const handleAddItem = () => {
    setNewItem(defaultWishlistForm);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: WishlistItem) => {
    setEditingItem(item);
    setEditItem({
      item_name: item.item_name,
      price: item.price.toString(),
      url: item.url ?? '',
      notes: item.notes ?? '',
    });
  };

  const handleOpenPurchase = (item: WishlistItem) => {
    setItemToPurchase(item);
    setPurchaseForm({ purchase_date: '', category: 'Shopping' });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newItem.item_name.trim() || !newItem.price) {
      toast.error('Item name and price are required.');
      return;
    }

    const payload: WishlistCreate = {
      item_name: newItem.item_name.trim(),
      price: Number(newItem.price),
      url: newItem.url || undefined,
      notes: newItem.notes || undefined,
    };

    try {
      const created = await wishlistService.createWishlistItem(payload);
      setWishlistItems((prev) => [created, ...prev]);
      setIsModalOpen(false);
      toast.success('Wishlist item added.');
    } catch (error) {
      toast.error('Failed to add wishlist item.');
    }
  };

  const handleUpdateItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingItem) {
      return;
    }

    if (!editItem.item_name.trim() || !editItem.price) {
      toast.error('Item name and price are required.');
      return;
    }

    const payload: WishlistUpdate = {
      item_name: editItem.item_name.trim(),
      price: Number(editItem.price),
      url: editItem.url || undefined,
      notes: editItem.notes || undefined,
    };

    try {
      const updated = await wishlistService.updateWishlistItem(editingItem.id, payload);
      setWishlistItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingItem(null);
      toast.success('Wishlist item updated.');
    } catch (error) {
      toast.error('Failed to update wishlist item.');
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) {
      return;
    }

    try {
      await wishlistService.deleteWishlistItem(itemToDelete.id);
      setWishlistItems((prev) => prev.filter((item) => item.id !== itemToDelete.id));
      setItemToDelete(null);
      toast.success('Wishlist item deleted.');
    } catch (error) {
      toast.error('Failed to delete wishlist item.');
    }
  };

  const handleMarkPurchased = async () => {
    if (!itemToPurchase) {
      return;
    }

    try {
      await wishlistService.markAsPurchased(itemToPurchase.id, {
        purchase_date: purchaseForm.purchase_date || undefined,
        category: purchaseForm.category || undefined,
      });
      setWishlistItems((prev) => prev.filter((item) => item.id !== itemToPurchase.id));
      setItemToPurchase(null);
      toast.success('Marked as purchased and added to expenses.');
    } catch (error) {
      toast.error('Failed to mark as purchased.');
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wishlist</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Save items and move them to expenses when purchased</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                view === 'grid'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                view === 'list'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddItem}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </motion.button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total wishlist value</p>
          <h2 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{formatCurrency(total)}</h2>
          <div className="mt-4 flex items-center gap-2 text-sm text-pink-600 dark:text-pink-300">
            <Sparkles className="h-4 w-4" />
            <span>{wishlistItems.length} items saved</span>
          </div>
        </div>
        <div className="card-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Next goal</p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {wishlistItems[0]?.item_name || 'Add a wishlist item'}
              </h3>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Set a reminder to buy during the next sale.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
          Loading wishlist...
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
          No wishlist items yet. Add one to get started.
        </div>
      ) : (
        <div className={view === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
          {wishlistItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              className={`card-surface p-5 ${
                view === 'list' ? 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/15 to-blue-500/15 text-purple-600 dark:text-purple-300">
                  <ShoppingBag className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.item_name}</h3>
                  {item.notes ? <p className="text-sm text-gray-500 dark:text-gray-400">{item.notes}</p> : null}
                  {item.url ? (
                    <a
                      href={item.url}
                      className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
                      target="_blank"
                      rel="noreferrer"
                      title={item.url}
                    >
                      {formatUrlLabel(item.url)} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <span className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(item.price)}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenPurchase(item)}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-2 text-sm font-medium text-green-600 transition hover:bg-green-500/20 dark:text-green-300"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Purchased
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditItem(item)}
                    className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-purple-500 hover:text-purple-600 dark:border-gray-700 dark:text-gray-300"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemToDelete(item)}
                    className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-red-500 hover:text-red-500 dark:border-gray-700 dark:text-gray-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAddItem}
        className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl shadow-purple-500/30 lg:hidden"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Wishlist Item</h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                >
                  Close
                </button>
              </div>
              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  Item name
                  <input
                    type="text"
                    placeholder="e.g. Travel backpack"
                    value={newItem.item_name}
                    onChange={(event) => setNewItem((prev) => ({ ...prev, item_name: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    Price
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newItem.price}
                      onChange={(event) => setNewItem((prev) => ({ ...prev, price: event.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    Product URL
                    <input
                      type="url"
                      placeholder="https://"
                      value={newItem.url}
                      onChange={(event) => setNewItem((prev) => ({ ...prev, url: event.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                </div>
                <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  Notes
                  <input
                    type="text"
                    placeholder="Color, size, or reminder"
                    value={newItem.notes}
                    onChange={(event) => setNewItem((prev) => ({ ...prev, notes: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Save Item
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setEditingItem(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Wishlist Item</h2>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                >
                  Close
                </button>
              </div>
              <form className="mt-4 space-y-4" onSubmit={handleUpdateItem}>
                <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  Item name
                  <input
                    type="text"
                    value={editItem.item_name}
                    onChange={(event) => setEditItem((prev) => ({ ...prev, item_name: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    Price
                    <input
                      type="number"
                      step="0.01"
                      value={editItem.price}
                      onChange={(event) => setEditItem((prev) => ({ ...prev, price: event.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    Product URL
                    <input
                      type="url"
                      value={editItem.url}
                      onChange={(event) => setEditItem((prev) => ({ ...prev, url: event.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                </div>
                <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  Notes
                  <input
                    type="text"
                    value={editItem.notes}
                    onChange={(event) => setEditItem((prev) => ({ ...prev, notes: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {itemToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setItemToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete wishlist item?</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                This removes {itemToDelete.item_name} from your wishlist.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteItem}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {itemToPurchase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setItemToPurchase(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mark as purchased</h2>
                <button
                  type="button"
                  onClick={() => setItemToPurchase(null)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                >
                  Close
                </button>
              </div>
              <form
                className="mt-4 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleMarkPurchased();
                }}
              >
                <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  Purchase date
                  <input
                    type="date"
                    value={purchaseForm.purchase_date}
                    onChange={(event) => setPurchaseForm((prev) => ({ ...prev, purchase_date: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  Category
                  <select
                    value={purchaseForm.category}
                    onChange={(event) => setPurchaseForm((prev) => ({ ...prev, category: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setItemToPurchase(null)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Mark Purchased
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wishlist;
