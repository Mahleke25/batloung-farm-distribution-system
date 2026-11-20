import { useEffect, useState } from 'react';
import apiRequest from '../services/api';
import Modal from '../components/Modal';
import './Sales.css';

function getCurrentDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
}

function formatDate(date) {
    if (!date) {
        return '-';
    }

    return new Date(date).toLocaleString();
}

function formatMoney(amount) {
    return 'M ' + Number(amount || 0).toFixed(2);
}

function Sales() {
    const [sales, setSales] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [fruits, setFruits] = useState([]);
    const [stock, setStock] = useState([]);
    const [saleDetails, setSaleDetails] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

    const [showSaleModal, setShowSaleModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const [selectedSale, setSelectedSale] = useState(null);

    const [saleForm, setSaleForm] = useState({
        VendorID: '',
        SaleDate: getCurrentDateTime(),
        PaymentMethod: 'CASH'
    });

    const [items, setItems] = useState([
        {
            FruitID: '',
            PackagingSize: 'SMALL',
            Quantity: 1
        }
    ]);

    const [paymentForm, setPaymentForm] = useState({
        VendorID: '',
        SaleDate: '',
        PaymentMethod: 'CASH',
        AmountPaid: 0
    });

    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(function() {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setError('');

            const results = await Promise.all([
                apiRequest('/sales', 'GET'),
                apiRequest('/vendors', 'GET'),
                apiRequest('/fruits', 'GET'),
                apiRequest('/stock', 'GET'),
                apiRequest('/sales-details', 'GET')
            ]);

            setSales(results[0].data);
            setVendors(results[1].data);
            setFruits(results[2].data);
            setStock(results[3].data);
            setSaleDetails(results[4].data);

        } catch (error) {
            setError(error.message || 'Failed to load sales information.');

        } finally {
            setLoading(false);
        }
    }

    function handleSaleFormChange(event) {
        const name = event.target.name;
        const value = event.target.value;

        setSaleForm(function(previous) {
            return {
                ...previous,
                [name]: value
            };
        });
    }

    function handleItemChange(index, event) {
        const name = event.target.name;
        const value = event.target.value;

        const updatedItems = items.map(function(item, itemIndex) {
            if (itemIndex === index) {
                return {
                    ...item,
                    [name]: value
                };
            }

            return item;
        });

        setItems(updatedItems);
    }

    function addItem() {
        setItems([
            ...items,
            {
                FruitID: '',
                PackagingSize: 'SMALL',
                Quantity: 1
            }
        ]);
    }

    function removeItem(index) {
        if (items.length === 1) {
            setFormError('A sale must contain at least one item.');
            return;
        }

        setItems(items.filter(function(item, itemIndex) {
            return itemIndex !== index;
        }));

        setFormError('');
    }

    function getStockRecord(fruitID, packagingSize) {
        return stock.find(function(record) {
            return (
                Number(record.FruitID) === Number(fruitID) &&
                record.PackagingSize === packagingSize
            );
        });
    }

    function getItemPrice(item) {
        const record = getStockRecord(
            item.FruitID,
            item.PackagingSize
        );

        return record ? Number(record.SellingPrice) : 0;
    }

    function getItemSubtotal(item) {
        return getItemPrice(item) * Number(item.Quantity || 0);
    }

    function getSaleTotal() {
        let total = 0;

        items.forEach(function(item) {
            total += getItemSubtotal(item);
        });

        return total;
    }

    function openNewSale() {
        setSaleForm({
            VendorID: '',
            SaleDate: getCurrentDateTime(),
            PaymentMethod: 'CASH'
        });

        setItems([
            {
                FruitID: '',
                PackagingSize: 'SMALL',
                Quantity: 1
            }
        ]);

        setFormError('');
        setShowSaleModal(true);
    }

    async function handleCreateSale(event) {
        event.preventDefault();

        setFormError('');
        setSuccess('');

        if (!saleForm.VendorID) {
            setFormError('Please select a vendor.');
            return;
        }

        if (!saleForm.SaleDate) {
            setFormError('Please select the sale date and time.');
            return;
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (!item.FruitID) {
                setFormError('Please select a fruit for every item.');
                return;
            }

            if (!Number.isInteger(Number(item.Quantity)) ||
                Number(item.Quantity) <= 0) {

                setFormError('Every item must have a valid quantity.');
                return;
            }

            const stockRecord = getStockRecord(
                item.FruitID,
                item.PackagingSize
            );

            if (!stockRecord) {
                setFormError(
                    'The selected fruit and packaging combination does not exist in stock.'
                );
                return;
            }

            if (Number(item.Quantity) > Number(stockRecord.AvailableQuantity)) {
                setFormError(
                    'Insufficient stock for ' +
                    stockRecord.FruitName +
                    ' (' + stockRecord.PackagingSize + '). Available: ' +
                    stockRecord.AvailableQuantity
                );
                return;
            }
        }

        try {
            setSaving(true);

            const saleDate = saleForm.SaleDate.replace('T', ' ') + ':00';

            const result = await apiRequest(
                '/sales-details/batch',
                'POST',
                {
                    VendorID: Number(saleForm.VendorID),
                    SaleDate: saleDate,
                    PaymentMethod: saleForm.PaymentMethod,
                    Items: items.map(function(item) {
                        return {
                            FruitID: Number(item.FruitID),
                            PackagingSize: item.PackagingSize,
                            Quantity: Number(item.Quantity)
                        };
                    })
                }
            );

            setSuccess(
                'Sale #' + result.SaleID +
                ' created successfully. Total: ' +
                formatMoney(result.TotalAmount)
            );

            setShowSaleModal(false);

            await loadData();

        } catch (error) {
            setFormError(error.message || 'Failed to create sale.');

        } finally {
            setSaving(false);
        }
    }

    function openDetails(sale) {
        setSelectedSale(sale);
        setShowDetailsModal(true);
    }

    function openPayment(sale) {
        setSelectedSale(sale);

        let saleDate = '';

        if (sale.SaleDate) {
            saleDate = String(sale.SaleDate)
                .replace(' ', 'T')
                .slice(0, 16);
        }

        setPaymentForm({
            VendorID: sale.VendorID,
            SaleDate: saleDate,
            PaymentMethod: sale.PaymentMethod,
            AmountPaid: Number(sale.AmountPaid)
        });

        setFormError('');
        setShowPaymentModal(true);
    }

    function handlePaymentChange(event) {
        const name = event.target.name;
        const value = event.target.value;

        setPaymentForm(function(previous) {
            return {
                ...previous,
                [name]: value
            };
        });
    }

    async function handleUpdatePayment(event) {
        event.preventDefault();

        setFormError('');

        if (!selectedSale) {
            return;
        }

        const amountPaid = Number(paymentForm.AmountPaid);

        if (!Number.isFinite(amountPaid) || amountPaid < 0) {
            setFormError('Enter a valid payment amount.');
            return;
        }

        if (amountPaid > Number(selectedSale.TotalAmount)) {
            setFormError('Payment cannot exceed the sale total.');
            return;
        }

        try {
            setSaving(true);

            const saleDate = paymentForm.SaleDate.replace('T', ' ') + ':00';

            await apiRequest(
                '/sales/' + selectedSale.SaleID,
                'PUT',
                {
                    VendorID: Number(paymentForm.VendorID),
                    SaleDate: saleDate,
                    PaymentMethod: paymentForm.PaymentMethod,
                    AmountPaid: amountPaid
                }
            );

            setSuccess(
                'Payment information for Sale #' +
                selectedSale.SaleID +
                ' updated successfully.'
            );

            setShowPaymentModal(false);

            await loadData();

        } catch (error) {
            setFormError(error.message || 'Failed to update payment.');

        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteSale(sale) {
        const confirmed = window.confirm(
            'Are you sure you want to delete Sale #' +
            sale.SaleID +
            '? This only works when the sale has no sale details.'
        );

        if (!confirmed) {
            return;
        }

        try {
            setError('');
            setSuccess('');

            await apiRequest(
                '/sales/' + sale.SaleID,
                'DELETE'
            );

            setSuccess('Sale deleted successfully.');

            await loadData();

        } catch (error) {
            setError(error.message || 'Failed to delete sale.');
        }
    }

    const filteredSales = sales.filter(function(sale) {
        const search = searchTerm.toLowerCase();

        return (
            String(sale.SaleID).includes(search) ||
            (sale.VendorName || '').toLowerCase().includes(search) ||
            (sale.PaymentStatus || '').toLowerCase().includes(search) ||
            (sale.PaymentMethod || '').toLowerCase().includes(search)
        );
    });

    const totalSales = sales.reduce(function(total, sale) {
        return total + Number(sale.TotalAmount);
    }, 0);

    const totalPaid = sales.reduce(function(total, sale) {
        return total + Number(sale.AmountPaid);
    }, 0);

    const totalOutstanding = sales.reduce(function(total, sale) {
        return total + Number(sale.OutstandingBalance);
    }, 0);

    const unpaidCount = sales.filter(function(sale) {
        return sale.PaymentStatus === 'UNPAID';
    }).length;

    const selectedDetails = saleDetails.filter(function(detail) {
        return selectedSale &&
            Number(detail.SaleID) === Number(selectedSale.SaleID);
    });

    if (loading) {
        return (
            <div className="sales-page">
                <p className="loading-message">Loading sales...</p>
            </div>
        );
    }

    return (
        <div className="sales-page">

            <div className="sales-heading">
                <div>
                    <h1>Sales Management</h1>
                    <p>Manage vendor sales, payments and outstanding balances.</p>
                </div>

                <button
                    className="sales-primary-button"
                    onClick={openNewSale}
                >
                    + New Sale
                </button>
            </div>

            {error && (
                <div className="sales-alert sales-error">
                    {error}
                    <button onClick={function() {
                        setError('');
                    }}>×</button>
                </div>
            )}

            {success && (
                <div className="sales-alert sales-success">
                    {success}
                    <button onClick={function() {
                        setSuccess('');
                    }}>×</button>
                </div>
            )}

            <div className="sales-summary">

                <div className="sales-summary-card">
                    <span>Total Sales</span>
                    <h2>{formatMoney(totalSales)}</h2>
                    <small>{sales.length} transactions</small>
                </div>

                <div className="sales-summary-card">
                    <span>Amount Collected</span>
                    <h2>{formatMoney(totalPaid)}</h2>
                    <small>Payments received</small>
                </div>

                <div className="sales-summary-card">
                    <span>Outstanding</span>
                    <h2>{formatMoney(totalOutstanding)}</h2>
                    <small>Money still owed</small>
                </div>

                <div className="sales-summary-card">
                    <span>Unpaid Sales</span>
                    <h2>{unpaidCount}</h2>
                    <small>Awaiting payment</small>
                </div>

            </div>

            <div className="sales-table-section">

                <div className="sales-table-heading">
                    <div>
                        <h2>Sales Records</h2>
                        <p>Sales transactions recorded in the system.</p>
                    </div>

                    <input
                        type="text"
                        placeholder="Search sale, vendor or payment..."
                        value={searchTerm}
                        onChange={function(event) {
                            setSearchTerm(event.target.value);
                        }}
                    />
                </div>

                <div className="sales-table-wrapper">

                    <table className="sales-table">
                        <thead>
                            <tr>
                                <th>Sale ID</th>
                                <th>Vendor</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Paid</th>
                                <th>Outstanding</th>
                                <th>Payment Method</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="sales-empty">
                                        No sales records found.
                                    </td>
                                </tr>
                            ) : (

                                filteredSales.map(function(sale) {
                                    return (
                                        <tr key={sale.SaleID}>
                                            <td>#{sale.SaleID}</td>

                                            <td>{sale.VendorName}</td>

                                            <td>{formatDate(sale.SaleDate)}</td>

                                            <td>{formatMoney(sale.TotalAmount)}</td>

                                            <td>{formatMoney(sale.AmountPaid)}</td>

                                            <td>{formatMoney(sale.OutstandingBalance)}</td>

                                            <td>
                                                {sale.PaymentMethod.replace('_', ' ')}
                                            </td>

                                            <td>
                                                <span className={
                                                    'sales-status ' +
                                                    sale.PaymentStatus.toLowerCase()
                                                }>
                                                    {sale.PaymentStatus.replace('_', ' ')}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="sales-actions">

                                                    <button
                                                        className="sales-view-button"
                                                        onClick={function() {
                                                            openDetails(sale);
                                                        }}
                                                    >
                                                        Details
                                                    </button>

                                                    <button
                                                        className="sales-payment-button"
                                                        onClick={function() {
                                                            openPayment(sale);
                                                        }}
                                                    >
                                                        Payment
                                                    </button>

                                                    <button
                                                        className="sales-delete-button"
                                                        onClick={function() {
                                                            handleDeleteSale(sale);
                                                        }}
                                                    >
                                                        Delete
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}

                        </tbody>
                    </table>

                </div>
            </div>


            {/* NEW SALE MODAL */}

            {showSaleModal && (
                <Modal
                    title="Create New Sale"
                    onClose={function() {
                        if (!saving) {
                            setShowSaleModal(false);
                        }
                    }}
                    size="large"
                >

                    <form onSubmit={handleCreateSale}>

                        {formError && (
                            <div className="sales-alert sales-error">
                                {formError}
                            </div>
                        )}

                        <div className="sales-form-grid">

                            <div className="sales-form-group">
                                <label>Vendor</label>

                                <select
                                    name="VendorID"
                                    value={saleForm.VendorID}
                                    onChange={handleSaleFormChange}
                                    required
                                >
                                    <option value="">Select vendor</option>

                                    {vendors.map(function(vendor) {
                                        return (
                                            <option
                                                key={vendor.VendorID}
                                                value={vendor.VendorID}
                                            >
                                                {vendor.VendorName}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="sales-form-group">
                                <label>Sale Date and Time</label>

                                <input
                                    type="datetime-local"
                                    name="SaleDate"
                                    value={saleForm.SaleDate}
                                    onChange={handleSaleFormChange}
                                    required
                                />
                            </div>

                            <div className="sales-form-group">
                                <label>Payment Method</label>

                                <select
                                    name="PaymentMethod"
                                    value={saleForm.PaymentMethod}
                                    onChange={handleSaleFormChange}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="MOBILE_MONEY">Mobile Money</option>
                                    <option value="CREDIT">Credit</option>
                                </select>
                            </div>

                        </div>

                        <div className="sales-items-heading">
                            <h3>Sale Items</h3>

                            <button
                                type="button"
                                className="sales-secondary-button"
                                onClick={addItem}
                            >
                                + Add Item
                            </button>
                        </div>

                        {items.map(function(item, index) {
                            const stockRecord = getStockRecord(
                                item.FruitID,
                                item.PackagingSize
                            );

                            return (
                                <div className="sales-item-row" key={index}>

                                    <div className="sales-form-group">
                                        <label>Fruit</label>

                                        <select
                                            name="FruitID"
                                            value={item.FruitID}
                                            onChange={function(event) {
                                                handleItemChange(index, event);
                                            }}
                                            required
                                        >
                                            <option value="">Select fruit</option>

                                            {fruits.map(function(fruit) {
                                                return (
                                                    <option
                                                        key={fruit.FruitID}
                                                        value={fruit.FruitID}
                                                        disabled={
                                                            fruit.Status !== 'AVAILABLE'
                                                        }
                                                    >
                                                        {fruit.FruitName}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div className="sales-form-group">
                                        <label>Packaging</label>

                                        <select
                                            name="PackagingSize"
                                            value={item.PackagingSize}
                                            onChange={function(event) {
                                                handleItemChange(index, event);
                                            }}
                                        >
                                            <option value="SMALL">Small</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="LARGE">Large</option>
                                        </select>
                                    </div>

                                    <div className="sales-form-group">
                                        <label>Quantity</label>

                                        <input
                                            type="number"
                                            name="Quantity"
                                            min="1"
                                            value={item.Quantity}
                                            onChange={function(event) {
                                                handleItemChange(index, event);
                                            }}
                                            required
                                        />
                                    </div>

                                    <div className="sales-item-price">
                                        <span>Unit Price</span>
                                        <strong>
                                            {formatMoney(getItemPrice(item))}
                                        </strong>

                                        <small>
                                            Available: {
                                                stockRecord
                                                    ? stockRecord.AvailableQuantity
                                                    : 0
                                            }
                                        </small>
                                    </div>

                                    <div className="sales-item-subtotal">
                                        <span>Subtotal</span>
                                        <strong>
                                            {formatMoney(getItemSubtotal(item))}
                                        </strong>
                                    </div>

                                    <button
                                        type="button"
                                        className="sales-remove-item"
                                        onClick={function() {
                                            removeItem(index);
                                        }}
                                        title="Remove item"
                                    >
                                        ×
                                    </button>

                                </div>
                            );
                        })}

                        <div className="sales-total-box">
                            <span>Estimated Sale Total</span>
                            <strong>{formatMoney(getSaleTotal())}</strong>
                        </div>

                        <p className="sales-note">
                            The actual selling prices are retrieved from stock
                            by the backend. New sales are initially recorded
                            as unpaid.
                        </p>

                        <div className="sales-modal-actions">
                            <button
                                type="button"
                                className="sales-cancel-button"
                                onClick={function() {
                                    setShowSaleModal(false);
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="sales-primary-button"
                                disabled={saving}
                            >
                                {saving ? 'Processing...' : 'Create Sale'}
                            </button>
                        </div>

                    </form>

                </Modal>
            )}


            {/* SALE DETAILS MODAL */}

            {showDetailsModal && selectedSale && (
                <Modal
                    title={'Sale Details — #' + selectedSale.SaleID}
                    onClose={function() {
                        setShowDetailsModal(false);
                    }}
                    size="large"
                >

                    <div className="sales-detail-information">

                        <div>
                            <span>Vendor</span>
                            <strong>{selectedSale.VendorName}</strong>
                        </div>

                        <div>
                            <span>Date</span>
                            <strong>{formatDate(selectedSale.SaleDate)}</strong>
                        </div>

                        <div>
                            <span>Payment Status</span>
                            <strong>{selectedSale.PaymentStatus}</strong>
                        </div>

                    </div>

                    <h3 className="sales-detail-title">Items Sold</h3>

                    <div className="sales-table-wrapper">
                        <table className="sales-table">
                            <thead>
                                <tr>
                                    <th>Fruit</th>
                                    <th>Packaging</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>

                            <tbody>

                                {selectedDetails.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="sales-empty">
                                            No items found for this sale.
                                        </td>
                                    </tr>
                                ) : (

                                    selectedDetails.map(function(detail) {
                                        return (
                                            <tr key={detail.SaleDetailID}>
                                                <td>{detail.FruitName}</td>
                                                <td>{detail.PackagingSize}</td>
                                                <td>{detail.Quantity}</td>
                                                <td>{formatMoney(detail.UnitPrice)}</td>
                                                <td>{formatMoney(detail.Subtotal)}</td>
                                            </tr>
                                        );
                                    })
                                )}

                            </tbody>
                        </table>
                    </div>

                    <div className="sales-total-box">
                        <span>Sale Total</span>
                        <strong>{formatMoney(selectedSale.TotalAmount)}</strong>
                    </div>

                    <div className="sales-detail-payment">
                        <p>
                            Amount Paid:
                            <strong>{formatMoney(selectedSale.AmountPaid)}</strong>
                        </p>

                        <p>
                            Outstanding:
                            <strong>
                                {formatMoney(selectedSale.OutstandingBalance)}
                            </strong>
                        </p>
                    </div>

                </Modal>
            )}


            {/* PAYMENT MODAL */}

            {showPaymentModal && selectedSale && (
                <Modal
                    title={'Update Payment — Sale #' + selectedSale.SaleID}
                    onClose={function() {
                        if (!saving) {
                            setShowPaymentModal(false);
                        }
                    }}
                >

                    <form onSubmit={handleUpdatePayment}>

                        {formError && (
                            <div className="sales-alert sales-error">
                                {formError}
                            </div>
                        )}

                        <div className="sales-payment-information">

                            <p>
                                Sale Total:
                                <strong>
                                    {formatMoney(selectedSale.TotalAmount)}
                                </strong>
                            </p>

                            <p>
                                Previously Paid:
                                <strong>
                                    {formatMoney(selectedSale.AmountPaid)}
                                </strong>
                            </p>

                            <p>
                                Outstanding:
                                <strong>
                                    {formatMoney(selectedSale.OutstandingBalance)}
                                </strong>
                            </p>

                        </div>

                        <div className="sales-form-group">
                            <label>Vendor</label>

                            <select
                                name="VendorID"
                                value={paymentForm.VendorID}
                                onChange={handlePaymentChange}
                                required
                            >
                                {vendors.map(function(vendor) {
                                    return (
                                        <option
                                            key={vendor.VendorID}
                                            value={vendor.VendorID}
                                        >
                                            {vendor.VendorName}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="sales-form-group">
                            <label>Sale Date and Time</label>

                            <input
                                type="datetime-local"
                                name="SaleDate"
                                value={paymentForm.SaleDate}
                                onChange={handlePaymentChange}
                                required
                            />
                        </div>

                        <div className="sales-form-group">
                            <label>Payment Method</label>

                            <select
                                name="PaymentMethod"
                                value={paymentForm.PaymentMethod}
                                onChange={handlePaymentChange}
                                required
                            >
                                <option value="CASH">Cash</option>
                                <option value="MOBILE_MONEY">Mobile Money</option>
                                <option value="CREDIT">Credit</option>
                            </select>
                        </div>

                        <div className="sales-form-group">
                            <label>Total Amount Paid</label>

                            <input
                                type="number"
                                name="AmountPaid"
                                min="0"
                                max={selectedSale.TotalAmount}
                                step="0.01"
                                value={paymentForm.AmountPaid}
                                onChange={handlePaymentChange}
                                required
                            />

                            <small>
                                Enter the cumulative amount paid, not just
                                the latest instalment.
                            </small>
                        </div>

                        <div className="sales-modal-actions">

                            <button
                                type="button"
                                className="sales-cancel-button"
                                onClick={function() {
                                    setShowPaymentModal(false);
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="sales-primary-button"
                                disabled={saving}
                            >
                                {saving ? 'Updating...' : 'Update Payment'}
                            </button>

                        </div>

                    </form>

                </Modal>
            )}

        </div>
    );
}

export default Sales;