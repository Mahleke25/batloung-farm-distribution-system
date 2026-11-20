import { useEffect, useState } from 'react';
import apiRequest from '../services/api';
import Modal from '../components/Modal';
import './Fruits.css';

const emptyForm = {
    FruitName: '',
    Description: '',
    Status: 'AVAILABLE'
};

function Fruits() {
    const [fruits, setFruits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingFruit, setEditingFruit] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    async function loadFruits() {
        try {
            setLoading(true);
            setError('');

            const result = await apiRequest('/fruits', 'GET');

            setFruits(result.data || []);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(function() {
        loadFruits();
    }, []);

    function openAddModal() {
        setEditingFruit(null);
        setFormData({ ...emptyForm });
        setFormError('');
        setShowModal(true);
    }

    function openEditModal(fruit) {
        setEditingFruit(fruit);

        setFormData({
            FruitName: fruit.FruitName || '',
            Description: fruit.Description || '',
            Status: fruit.Status || 'AVAILABLE'
        });

        setFormError('');
        setShowModal(true);
    }

    function closeModal() {
        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingFruit(null);
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

        if (!formData.FruitName.trim()) {
            setFormError('Please enter the fruit name.');
            return;
        }

        try {
            setSaving(true);
            setFormError('');
            setSuccess('');

            if (editingFruit) {
                await apiRequest(
                    '/fruits/' + editingFruit.FruitID,
                    'PUT',
                    formData
                );

                setSuccess('Fruit updated successfully.');

            } else {
                await apiRequest('/fruits', 'POST', formData);

                setSuccess('Fruit added successfully.');
            }

            setShowModal(false);
            setEditingFruit(null);
            setFormData({ ...emptyForm });

            await loadFruits();

        } catch (error) {
            setFormError(error.message);
        } finally {
            setSaving(false);
        }
    }

    async function deleteFruit(fruit) {
        const confirmed = window.confirm(
            'Are you sure you want to delete ' + fruit.FruitName + '?'
        );

        if (!confirmed) {
            return;
        }

        try {
            setError('');
            setSuccess('');

            await apiRequest(
                '/fruits/' + fruit.FruitID,
                'DELETE'
            );

            setSuccess('Fruit deleted successfully.');

            await loadFruits();

        } catch (error) {
            setError(error.message);
        }
    }

    const filteredFruits = fruits.filter(function(fruit) {
        const search = searchTerm.toLowerCase();

        return (
            fruit.FruitName.toLowerCase().includes(search) ||
            (fruit.Description || '').toLowerCase().includes(search) ||
            fruit.Status.toLowerCase().includes(search)
        );
    });

    const availableCount = fruits.filter(function(fruit) {
        return fruit.Status === 'AVAILABLE';
    }).length;

    const unavailableCount = fruits.filter(function(fruit) {
        return fruit.Status === 'UNAVAILABLE';
    }).length;

    return (
        <div className="fruits-page">

            <div className="fruits-header">
                <div>
                    <h1>Fruits</h1>
                    <p>Manage the fruits distributed by Batloung Farm.</p>
                </div>

                <button
                    type="button"
                    className="fruit-primary-button"
                    onClick={openAddModal}
                >
                    + Add Fruit
                </button>
            </div>

            {success && (
                <div className="fruit-success">
                    {success}
                </div>
            )}

            {error && (
                <div className="fruit-error">
                    {error}
                </div>
            )}

            <div className="fruit-summary">

                <div className="fruit-summary-card">
                    <span>Total Fruits</span>
                    <strong>{fruits.length}</strong>
                </div>

                <div className="fruit-summary-card">
                    <span>Available</span>
                    <strong>{availableCount}</strong>
                </div>

                <div className="fruit-summary-card">
                    <span>Unavailable</span>
                    <strong>{unavailableCount}</strong>
                </div>

            </div>

            <div className="fruit-table-section">

                <div className="fruit-table-heading">
                    <div>
                        <h2>Fruit Records</h2>
                        <p>View and manage registered fruits.</p>
                    </div>

                    <input
                        type="text"
                        placeholder="Search fruits..."
                        value={searchTerm}
                        onChange={function(event) {
                            setSearchTerm(event.target.value);
                        }}
                        className="fruit-search"
                    />
                </div>

                {loading ? (
                    <p className="fruit-message">Loading fruits...</p>
                ) : filteredFruits.length === 0 ? (
                    <p className="fruit-message">
                        No fruit records found.
                    </p>
                ) : (
                    <div className="fruit-table-wrapper">

                        <table className="fruit-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Fruit Name</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredFruits.map(function(fruit) {
                                    return (
                                        <tr key={fruit.FruitID}>
                                            <td>{fruit.FruitID}</td>

                                            <td className="fruit-name">
                                                {fruit.FruitName}
                                            </td>

                                            <td>
                                                {fruit.Description || '—'}
                                            </td>

                                            <td>
                                                <span className={
                                                    fruit.Status === 'AVAILABLE'
                                                        ? 'fruit-status available'
                                                        : 'fruit-status unavailable'
                                                }>
                                                    {fruit.Status}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="fruit-actions">

                                                    <button
                                                        type="button"
                                                        className="fruit-edit-button"
                                                        onClick={function() {
                                                            openEditModal(fruit);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="fruit-delete-button"
                                                        onClick={function() {
                                                            deleteFruit(fruit);
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
                    title={editingFruit ? 'Edit Fruit' : 'Add New Fruit'}
                    onClose={closeModal}
                >
                    <form onSubmit={handleSubmit}>

                        {formError && (
                            <div className="fruit-error">
                                {formError}
                            </div>
                        )}

                        <div className="fruit-form-group">
                            <label>Fruit Name *</label>

                            <input
                                type="text"
                                name="FruitName"
                                value={formData.FruitName}
                                onChange={handleChange}
                                placeholder="Enter fruit name"
                                required
                            />
                        </div>

                        <div className="fruit-form-group">
                            <label>Description</label>

                            <textarea
                                name="Description"
                                value={formData.Description}
                                onChange={handleChange}
                                placeholder="Enter a description"
                                rows="3"
                            />
                        </div>

                        <div className="fruit-form-group">
                            <label>Availability Status *</label>

                            <select
                                name="Status"
                                value={formData.Status}
                                onChange={handleChange}
                                required
                            >
                                <option value="AVAILABLE">Available</option>
                                <option value="UNAVAILABLE">Unavailable</option>
                            </select>
                        </div>

                        <div className="fruit-form-actions">

                            <button
                                type="button"
                                className="fruit-cancel-button"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="fruit-primary-button"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Saving...'
                                    : editingFruit
                                        ? 'Update Fruit'
                                        : 'Save Fruit'
                                }
                            </button>

                        </div>

                    </form>
                </Modal>
            )}

        </div>
    );
}

export default Fruits;