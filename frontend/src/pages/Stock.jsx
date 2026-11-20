import { useEffect, useState } from 'react';
import apiRequest from '../services/api';
import Modal from '../components/Modal';
import './Stock.css';

const emptyForm = {
    FruitID: '',
    PackagingSize: 'SMALL',
    AvailableQuantity: '',
    SellingPrice: ''
};

function Stock() {

    const [stock, setStock] = useState([]);
    const [fruits, setFruits] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingStock, setEditingStock] = useState(null);
    const [formData, setFormData] = useState(emptyForm);

    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    async function loadData() {
        try {
            setLoading(true);
            setError('');

            const results = await Promise.all([
                apiRequest('/stock', 'GET'),
                apiRequest('/fruits', 'GET')
            ]);

            setStock(results[0].data || []);
            setFruits(results[1].data || []);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(function() {
        loadData();
    }, []);

    function openAddModal() {
        setEditingStock(null);
        setFormData({ ...emptyForm });
        setFormError('');
        setShowModal(true);
    }

    function openEditModal(record) {
        setEditingStock(record);

        setFormData({
            FruitID: record.FruitID,
            PackagingSize: record.PackagingSize,
            AvailableQuantity: record.AvailableQuantity,
            SellingPrice: record.SellingPrice
        });

        setFormError('');
        setShowModal(true);
    }

    function closeModal() {
        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingStock(null);
        setFormData({ ...emptyForm });
        setFormError('');
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData(function(previousData) {
            return {
                ...previousData,
                [name]: value
            };
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (
            !formData.FruitID ||
            !formData.PackagingSize ||
            formData.AvailableQuantity === '' ||
            formData.SellingPrice === ''
        ) {
            setFormError('Please complete all required fields.');
            return;
        }

        const quantity = Number(formData.AvailableQuantity);
        const price = Number(formData.SellingPrice);

        if (!Number.isInteger(quantity) || quantity < 0) {
            setFormError('Available quantity must be a whole number of zero or more.');
            return;
        }

        if (!Number.isFinite(price) || price < 0) {
            setFormError('Selling price must be a valid amount of zero or more.');
            return;
        }

        const data = {
            FruitID: Number(formData.FruitID),
            PackagingSize: formData.PackagingSize,
            AvailableQuantity: quantity,
            SellingPrice: price
        };

        try {
            setSaving(true);
            setFormError('');
            setSuccess('');

            if (editingStock) {
                console.log('Updating stock:', editingStock.StockID, data);
              
                const result = await apiRequest(
                  '/stock/' + editingStock.StockID,
                  'PUT',
                  data
);

console.log('UPDATE RESPONSE:', result);

            } else {
                await apiRequest('/stock', 'POST', data);

                setSuccess('Stock record created successfully.');
            }

            setShowModal(false);
            setEditingStock(null);

            await loadData();

        } catch (error) {
            setFormError(error.message);
        } finally {
            setSaving(false);
        }
    }

    async function deleteStock(record) {
        const confirmed = window.confirm(
            'Are you sure you want to delete the ' +
            record.PackagingSize +
            ' stock record for ' +
            getFruitName(record.FruitID, record.FruitName) +
            '?'
        );

        if (!confirmed) {
            return;
        }

        try {
            setError('');
            setSuccess('');

            await apiRequest(
                '/stock/' + record.StockID,
                'DELETE'
            );

            setSuccess('Stock record deleted successfully.');

            await loadData();

        } catch (error) {
            setError(error.message);
        }
    }

    function getFruitName(fruitID, existingName) {
        if (existingName) {
            return existingName;
        }

        const fruit = fruits.find(function(item) {
            return Number(item.FruitID) === Number(fruitID);
        });

        return fruit ? fruit.FruitName : 'Unknown Fruit';
    }

    const filteredStock = stock.filter(function(record) {
        const search = searchTerm.toLowerCase();

        const fruitName = getFruitName(
            record.FruitID,
            record.FruitName
        ).toLowerCase();

        return (
            fruitName.includes(search) ||
            String(record.PackagingSize).toLowerCase().includes(search)
        );
    });

    const totalRecords = stock.length;

    const totalQuantity = stock.reduce(function(total, record) {
        return total + Number(record.AvailableQuantity || 0);
    }, 0);

    const totalStockValue = stock.reduce(function(total, record) {
        return total +
            (
                Number(record.AvailableQuantity || 0) *
                Number(record.SellingPrice || 0)
            );
    }, 0);

    const lowStockCount = stock.filter(function(record) {
        return Number(record.AvailableQuantity) <= 20;
    }).length;

    function formatMoney(amount) {
        return 'M ' + Number(amount || 0).toFixed(2);
    }

    return (
        <div className="stock-page">

            <div className="stock-header">
                <div>
                    <h1>Stock Management</h1>
                    <p>
                        Monitor fruit quantities, packaging sizes and selling prices.
                    </p>
                </div>

                <button
                    type="button"
                    className="stock-primary-button"
                    onClick={openAddModal}
                >
                    + Add Stock Record
                </button>
            </div>

            {success && (
                <div className="stock-success">
                    {success}
                </div>
            )}

            {error && (
                <div className="stock-error">
                    {error}
                </div>
            )}

            <div className="stock-summary">

                <div className="stock-summary-card">
                    <span>Stock Records</span>
                    <strong>{totalRecords}</strong>
                </div>

                <div className="stock-summary-card">
                    <span>Total Available Boxes</span>
                    <strong>{totalQuantity.toLocaleString()}</strong>
                </div>

                <div className="stock-summary-card">
                    <span>Low Stock Records</span>
                    <strong>{lowStockCount}</strong>
                </div>

                <div className="stock-summary-card">
                    <span>Stock Selling Value</span>
                    <strong>{formatMoney(totalStockValue)}</strong>
                </div>

            </div>

            <div className="stock-table-section">

                <div className="stock-table-heading">
                    <div>
                        <h2>Current Stock Records</h2>
                        <p>
                            Available quantities for each fruit and packaging size.
                        </p>
                    </div>

                    <input
                        type="text"
                        className="stock-search"
                        placeholder="Search fruit or packaging..."
                        value={searchTerm}
                        onChange={function(event) {
                            setSearchTerm(event.target.value);
                        }}
                    />
                </div>

                {loading ? (
                    <p className="stock-message">
                        Loading stock records...
                    </p>
                ) : filteredStock.length === 0 ? (
                    <p className="stock-message">
                        No stock records found.
                    </p>
                ) : (

                    <div className="stock-table-wrapper">
                        <table className="stock-table">

                            <thead>
                                <tr>
                                    <th>Stock ID</th>
                                    <th>Fruit</th>
                                    <th>Packaging Size</th>
                                    <th>Available Quantity</th>
                                    <th>Selling Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredStock.map(function(record) {
                                    return (
                                        <tr key={record.StockID}>

                                            <td>{record.StockID}</td>

                                            <td className="stock-fruit-name">
                                                {getFruitName(
                                                    record.FruitID,
                                                    record.FruitName
                                                )}
                                            </td>

                                            <td>
                                                <span className="stock-size-badge">
                                                    {record.PackagingSize}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={
                                                    Number(record.AvailableQuantity) <= 20
                                                        ? 'stock-quantity low'
                                                        : 'stock-quantity'
                                                }>
                                                    {record.AvailableQuantity}
                                                </span>
                                            </td>

                                            <td>
                                                {formatMoney(record.SellingPrice)}
                                            </td>

                                            <td>
                                                <div className="stock-actions">

                                                    <button
                                                        type="button"
                                                        className="stock-edit-button"
                                                        onClick={function() {
                                                            openEditModal(record);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="stock-delete-button"
                                                        onClick={function() {
                                                            deleteStock(record);
                                                        }}
                                                    >
                                                        Delete
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>

                        </table>
                    </div>
                )}

            </div>

            {showModal && (
                <Modal
                    title={
                        editingStock
                            ? 'Edit Stock Record'
                            : 'Add Stock Record'
                    }
                    onClose={closeModal}
                >

                    <form onSubmit={handleSubmit}>

                        {formError && (
                            <div className="stock-error">
                                {formError}
                            </div>
                        )}

                        <div className="stock-form-group">
                            <label>Fruit *</label>

                            <select
                                name="FruitID"
                                value={formData.FruitID}
                                onChange={handleChange}
                                disabled={Boolean(editingStock)}
                                required
                            >
                                <option value="">Select fruit</option>

                                {fruits.map(function(fruit) {
                                    return (
                                        <option
                                            key={fruit.FruitID}
                                            value={fruit.FruitID}
                                        >
                                            {fruit.FruitName}
                                        </option>
                                    );
                                })}
                            </select>

                            {editingStock && (
                                <small>
                                    The fruit linked to an existing stock record cannot be changed here.
                                </small>
                            )}
                        </div>

                        <div className="stock-form-group">
                            <label>Packaging Size *</label>

                            <select
                                name="PackagingSize"
                                value={formData.PackagingSize}
                                onChange={handleChange}
                                disabled={Boolean(editingStock)}
                                required
                            >
                                <option value="SMALL">SMALL</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="LARGE">LARGE</option>
                            </select>
                        </div>

                        <div className="stock-form-group">
                            <label>Available Quantity *</label>

                            <input
                                type="number"
                                name="AvailableQuantity"
                                value={formData.AvailableQuantity}
                                onChange={handleChange}
                                min="0"
                                step="1"
                                placeholder="Enter quantity"
                                required
                            />
                        </div>

                        <div className="stock-form-group">
                            <label>Selling Price (M) *</label>

                            <input
                                type="number"
                                name="SellingPrice"
                                value={formData.SellingPrice}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                placeholder="Enter selling price"
                                required
                            />
                        </div>

                        <div className="stock-form-actions">

                            <button
                                type="button"
                                className="stock-cancel-button"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="stock-primary-button"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Saving...'
                                    : editingStock
                                        ? 'Update Stock'
                                        : 'Add Stock'
                                }
                            </button>

                        </div>

                    </form>

                </Modal>
            )}

        </div>
    );
}

export default Stock;