import { useEffect, useState } from 'react';
import apiRequest from '../services/api';
import './Reports.css';

function Reports() {

    const [topFruits, setTopFruits] = useState([]);
    const [topVendors, setTopVendors] = useState([]);
    const [stockReport, setStockReport] = useState([]);
    const [outstandingReport, setOutstandingReport] = useState([]);

    const [revenueReport, setRevenueReport] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [loading, setLoading] = useState(true);
    const [revenueLoading, setRevenueLoading] = useState(false);

    const [error, setError] = useState('');
    const [revenueError, setRevenueError] = useState('');

    // FORMAT DATE FOR INPUT
    function getToday() {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        return year + '-' + month + '-' + day;
    }

    // FORMAT CURRENCY
    function formatMoney(amount) {
        return 'M ' + Number(amount || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // FORMAT DATE
    function formatDate(date) {
        if (!date) {
            return '-';
        }

        return String(date).split('T')[0].split(' ')[0];
    }

    // LOAD MAIN REPORTS
    async function loadMainReports() {

        try {

            setLoading(true);
            setError('');

            const results = await Promise.all([
                apiRequest('/reports/top-fruits', 'GET'),
                apiRequest('/reports/top-vendor', 'GET'),
                apiRequest('/reports/stock', 'GET'),
                apiRequest('/reports/outstanding', 'GET')
            ]);

            setTopFruits(results[0].data || []);
            setTopVendors(results[1].data || []);
            setStockReport(results[2].data || []);
            setOutstandingReport(results[3].data || []);

        } catch (error) {

            setError(error.message);

        } finally {

            setLoading(false);
        }
    }

    // LOAD REVENUE REPORT
    async function loadRevenueReport() {

        if (!startDate || !endDate) {
            setRevenueError('Please select both dates.');
            return;
        }

        if (startDate > endDate) {
            setRevenueError('Start date cannot be after end date.');
            return;
        }

        try {

            setRevenueLoading(true);
            setRevenueError('');

            const result = await apiRequest(
                '/reports/revenue?startDate=' +
                encodeURIComponent(startDate) +
                '&endDate=' +
                encodeURIComponent(endDate),
                'GET'
            );

            setRevenueReport(result.data || []);
            setTotalRevenue(Number(result.totalRevenue || 0));

        } catch (error) {

            setRevenueError(error.message);

        } finally {

            setRevenueLoading(false);
        }
    }

    // LOAD REPORTS WHEN PAGE OPENS
    useEffect(function() {

        const today = getToday();
        const firstDay = today.substring(0, 7) + '-01';

        setStartDate(firstDay);
        setEndDate(today);

        loadMainReports();

    }, []);

    // LOAD REVENUE WHEN DEFAULT DATES ARE SET
    useEffect(function() {

        if (startDate && endDate) {
            loadRevenueReport();
        }

    }, [startDate, endDate]);

    // CALCULATE TOTAL STOCK QUANTITY
    let totalStockQuantity = 0;
    let totalStockValue = 0;

    stockReport.forEach(function(item) {

        totalStockQuantity += Number(item.AvailableQuantity || 0);
        totalStockValue += Number(item.StockValue || 0);

    });

    // CALCULATE OUTSTANDING BALANCE
    let totalOutstanding = 0;

    outstandingReport.forEach(function(item) {

        totalOutstanding += Number(item.OutstandingBalance || 0);

    });

    return (

        <div className="reports-page">

            {/* REPORT PAGE INTRODUCTION */}
            <div className="reports-intro">

                <div>
                    <h2>Business Reports</h2>

                    <p>
                        Review sales performance, stock levels and
                        outstanding customer payments.
                    </p>
                </div>

                <button
                    type="button"
                    className="report-refresh-button"
                    onClick={loadMainReports}
                    disabled={loading}
                >
                    ↻ Refresh Reports
                </button>

            </div>

            {error && (

                <div className="report-error">
                    <strong>Unable to load reports.</strong>
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={loadMainReports}
                    >
                        Try Again
                    </button>
                </div>

            )}

            {/* SUMMARY CARDS */}
            <div className="report-summary-grid">

                <div className="report-summary-card">

                    <span>Total Stock Boxes</span>

                    <h2>
                        {totalStockQuantity.toLocaleString()}
                    </h2>

                    <p>Available boxes across all fruits</p>

                </div>

                <div className="report-summary-card">

                    <span>Stock Value</span>

                    <h2>
                        {formatMoney(totalStockValue)}
                    </h2>

                    <p>Value at current selling prices</p>

                </div>

                <div className="report-summary-card">

                    <span>Outstanding Payments</span>

                    <h2>
                        {formatMoney(totalOutstanding)}
                    </h2>

                    <p>Money still owed by vendors</p>

                </div>

                <div className="report-summary-card">

                    <span>Unsettled Sales</span>

                    <h2>
                        {outstandingReport.length}
                    </h2>

                    <p>Sales with outstanding balances</p>

                </div>

            </div>

            {/* LOADING */}
            {loading ? (

                <div className="report-loading">
                    Loading business reports...
                </div>

            ) : (

                <>

                    {/* TOP FIVE FRUITS */}
                    <div className="report-card">

                        <div className="report-card-heading">

                            <div>
                                <h3>Top Five Best-Selling Fruits</h3>

                                <p>
                                    Fruits ranked by total boxes sold.
                                </p>
                            </div>

                        </div>

                        <div className="report-table-container">

                            <table>

                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Fruit</th>
                                        <th>Boxes Sold</th>
                                        <th>Total Revenue</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {topFruits.length === 0 ? (

                                        <tr>
                                            <td colSpan="4" className="report-empty">
                                                No fruit sales records available.
                                            </td>
                                        </tr>

                                    ) : (

                                        topFruits.map(function(item, index) {

                                            return (

                                                <tr key={item.FruitID}>

                                                    <td>
                                                        #{index + 1}
                                                    </td>

                                                    <td>
                                                        <strong>{item.FruitName}</strong>
                                                    </td>

                                                    <td>
                                                        {Number(item.TotalBoxesSold).toLocaleString()}
                                                    </td>

                                                    <td>
                                                        {formatMoney(item.TotalRevenue)}
                                                    </td>

                                                </tr>

                                            );

                                        })

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                    {/* REVENUE REPORT */}
                    <div className="report-card">

                        <div className="report-card-heading">

                            <div>
                                <h3>Revenue by Date Range</h3>

                                <p>
                                    Analyse sales revenue over a selected period.
                                </p>
                            </div>

                        </div>

                        <div className="revenue-filter">

                            <div className="report-form-group">

                                <label>Start Date</label>

                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={function(event) {
                                        setStartDate(event.target.value);
                                    }}
                                />

                            </div>

                            <div className="report-form-group">

                                <label>End Date</label>

                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={function(event) {
                                        setEndDate(event.target.value);
                                    }}
                                />

                            </div>

                            <button
                                type="button"
                                className="generate-report-button"
                                onClick={loadRevenueReport}
                                disabled={revenueLoading}
                            >
                                {revenueLoading ? 'Generating...' : 'Generate Report'}
                            </button>

                        </div>

                        {revenueError && (

                            <div className="report-error">
                                {revenueError}
                            </div>

                        )}

                        <div className="revenue-total">

                            <span>Total Revenue</span>

                            <h2>
                                {formatMoney(totalRevenue)}
                            </h2>

                        </div>

                        <div className="report-table-container">

                            <table>

                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Number of Sales</th>
                                        <th>Revenue</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {revenueLoading ? (

                                        <tr>
                                            <td colSpan="3" className="report-empty">
                                                Generating revenue report...
                                            </td>
                                        </tr>

                                    ) : revenueReport.length === 0 ? (

                                        <tr>
                                            <td colSpan="3" className="report-empty">
                                                No sales recorded for this date range.
                                            </td>
                                        </tr>

                                    ) : (

                                        revenueReport.map(function(item, index) {

                                            return (

                                                <tr key={index}>

                                                    <td>
                                                        {formatDate(item.SaleDate)}
                                                    </td>

                                                    <td>
                                                        {item.NumberOfSales}
                                                    </td>

                                                    <td>
                                                        {formatMoney(item.TotalRevenue)}
                                                    </td>

                                                </tr>

                                            );

                                        })

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                    {/* TOP VENDOR */}
                    <div className="report-card">

                        <div className="report-card-heading">

                            <div>
                                <h3>Vendor with the Highest Boxes Sold</h3>

                                <p>
                                    Vendors ranked at the highest sales volume.
                                </p>
                            </div>

                        </div>

                        <div className="report-table-container">

                            <table>

                                <thead>
                                    <tr>
                                        <th>Vendor ID</th>
                                        <th>Vendor Name</th>
                                        <th>Total Boxes Sold</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {topVendors.length === 0 ? (

                                        <tr>
                                            <td colSpan="3" className="report-empty">
                                                No vendor sales records available.
                                            </td>
                                        </tr>

                                    ) : (

                                        topVendors.map(function(item) {

                                            return (

                                                <tr key={item.VendorID}>

                                                    <td>
                                                        #{item.VendorID}
                                                    </td>

                                                    <td>
                                                        <strong>{item.VendorName}</strong>
                                                    </td>

                                                    <td>
                                                        {Number(item.TotalBoxesSold).toLocaleString()}
                                                    </td>

                                                </tr>

                                            );

                                        })

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                    {/* CURRENT STOCK */}
                    <div className="report-card">

                        <div className="report-card-heading">

                            <div>
                                <h3>Current Stock Report</h3>

                                <p>
                                    Available quantities by fruit and packaging size.
                                </p>
                            </div>

                        </div>

                        <div className="report-table-container">

                            <table>

                                <thead>
                                    <tr>
                                        <th>Fruit</th>
                                        <th>Packaging</th>
                                        <th>Available Boxes</th>
                                        <th>Selling Price</th>
                                        <th>Stock Value</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {stockReport.length === 0 ? (

                                        <tr>
                                            <td colSpan="5" className="report-empty">
                                                No stock records available.
                                            </td>
                                        </tr>

                                    ) : (

                                        stockReport.map(function(item, index) {

                                            return (

                                                <tr key={index}>

                                                    <td>
                                                        {item.FruitName}
                                                    </td>

                                                    <td>
                                                        {item.PackagingSize}
                                                    </td>

                                                    <td>
                                                        {Number(item.AvailableQuantity).toLocaleString()}
                                                    </td>

                                                    <td>
                                                        {formatMoney(item.SellingPrice)}
                                                    </td>

                                                    <td>
                                                        {formatMoney(item.StockValue)}
                                                    </td>

                                                </tr>

                                            );

                                        })

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                    {/* OUTSTANDING PAYMENTS */}
                    <div className="report-card">

                        <div className="report-card-heading">

                            <div>
                                <h3>Outstanding Payments</h3>

                                <p>
                                    Sales where vendors still owe money.
                                </p>
                            </div>

                        </div>

                        <div className="report-table-container">

                            <table>

                                <thead>
                                    <tr>
                                        <th>Sale ID</th>
                                        <th>Vendor</th>
                                        <th>Sale Date</th>
                                        <th>Total Amount</th>
                                        <th>Amount Paid</th>
                                        <th>Outstanding</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {outstandingReport.length === 0 ? (

                                        <tr>
                                            <td colSpan="7" className="report-empty">
                                                There are no outstanding payments.
                                            </td>
                                        </tr>

                                    ) : (

                                        outstandingReport.map(function(item) {

                                            return (

                                                <tr key={item.SaleID}>

                                                    <td>
                                                        #{item.SaleID}
                                                    </td>

                                                    <td>
                                                        {item.VendorName}
                                                    </td>

                                                    <td>
                                                        {formatDate(item.SaleDate)}
                                                    </td>

                                                    <td>
                                                        {formatMoney(item.TotalAmount)}
                                                    </td>

                                                    <td>
                                                        {formatMoney(item.AmountPaid)}
                                                    </td>

                                                    <td className="outstanding-amount">
                                                        {formatMoney(item.OutstandingBalance)}
                                                    </td>

                                                    <td>

                                                        <span className={
                                                            'report-payment-status ' +
                                                            item.PaymentStatus.toLowerCase()
                                                        }>
                                                            {item.PaymentStatus}
                                                        </span>

                                                    </td>

                                                </tr>

                                            );

                                        })

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </>

            )}

        </div>

    );

}

export default Reports;