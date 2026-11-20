import { useEffect, useState } from 'react';

import apiRequest from './services/api';

import Suppliers from './pages/Suppliers';
import Fruits from './pages/Fruits';
import Vendors from './pages/Vendors';
import Stock from './pages/Stock';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Reports from './pages/Reports';

import './App.css';

function App() {

    const [activePage, setActivePage] = useState('Dashboard');

    const [dashboardData, setDashboardData] = useState({
        suppliers: 0,
        vendors: 0,
        salesCount: 0,
        totalSales: 0,
        outstanding: 0,
        stockQuantity: 0,
        recentSales: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const menuItems = [
        { name: 'Dashboard', icon: '▦' },
        { name: 'Suppliers', icon: '♙' },
        { name: 'Fruits', icon: '●' },
        { name: 'Vendors', icon: '♧' },
        { name: 'Purchases', icon: '↓' },
        { name: 'Sales', icon: '↑' },
        { name: 'Stock', icon: '▤' },
        { name: 'Reports', icon: '▥' }
    ];

    // LOAD DASHBOARD DATA
    async function loadDashboard() {

        try {

            setLoading(true);
            setError('');

            const results = await Promise.all([
                apiRequest('/suppliers', 'GET'),
                apiRequest('/vendors', 'GET'),
                apiRequest('/sales', 'GET'),
                apiRequest('/reports/outstanding', 'GET'),
                apiRequest('/reports/stock', 'GET')
            ]);

            const supplierData = results[0];
            const vendorData = results[1];
            const salesData = results[2];
            const outstandingData = results[3];
            const stockData = results[4];

            const sales = salesData.data || [];
            const stock = stockData.data || [];

            let totalSales = 0;
            let stockQuantity = 0;

            sales.forEach(function(sale) {
                totalSales += Number(sale.TotalAmount || 0);
            });

            stock.forEach(function(item) {
                stockQuantity += Number(item.AvailableQuantity || 0);
            });

            setDashboardData({
                suppliers: supplierData.count ?? (supplierData.data || []).length,
                vendors: vendorData.count ?? (vendorData.data || []).length,
                salesCount: salesData.count ?? sales.length,
                totalSales: totalSales,
                outstanding: Number(outstandingData.totalOutstanding || 0),
                stockQuantity: stockQuantity,
                recentSales: sales.slice(0, 5)
            });

        } catch (error) {

            setError(error.message);

        } finally {

            setLoading(false);
        }
    }

    // LOAD DASHBOARD WHEN APPLICATION STARTS
    useEffect(function() {
        loadDashboard();
    }, []);

    // FORMAT CURRENCY
    function formatMoney(amount) {

        return 'M ' + Number(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // FORMAT DATE
    function formatDate(date) {

        if (!date) {
            return '-';
        }

        return new Date(date).toLocaleDateString();
    }

    return (

        <div className="app-container">

            {/* SIDEBAR */}
            <aside className="sidebar">

                <div className="brand">

                    <div className="brand-icon">B</div>

                    <div>
                        <h2>Batloung</h2>
                        <p>Farm Distribution</p>
                    </div>

                </div>

                <div className="menu-heading">
                    MAIN MENU
                </div>

                <nav className="sidebar-menu">

                    {menuItems.map(function(item) {

                        return (

                            <button
                                key={item.name}
                                className={
                                    activePage === item.name
                                        ? 'menu-item active'
                                        : 'menu-item'
                                }
                                onClick={function() {
                                    setActivePage(item.name);
                                }}
                            >

                                <span className="menu-icon">
                                    {item.icon}
                                </span>

                                <span>{item.name}</span>

                            </button>

                        );

                    })}

                </nav>

                <div className="sidebar-footer">

                    <div className="system-status">
                        <span className="status-dot"></span>
                        System Online
                    </div>

                    <p>Batloung Farm</p>
                    <small>Distribution Management</small>

                </div>

            </aside>

            {/* MAIN SECTION */}
            <main className="main-content">

                <header className="topbar">

                    <div>

                        <p className="breadcrumb">
                            Batloung Farm / {activePage}
                        </p>

                        <h1>{activePage}</h1>

                    </div>

                    <div className="topbar-right">

                        <span className="location-label">
                            Maseru, Lesotho
                        </span>

                        <div className="user-profile">

                            <div className="user-avatar">BF</div>

                            <div>
                                <strong>Administrator</strong>
                                <small>System Manager</small>
                            </div>

                        </div>

                    </div>

                </header>

                {/* PAGE CONTENT */}
                <section className="page-content">

                    {/* DASHBOARD */}
                    {activePage === 'Dashboard' ? (

                        <>

                            <div className="welcome-section">

                                <div>
                                    <h2>Business Overview</h2>

                                    <p>
                                        Monitor your distribution activities
                                        and business performance.
                                    </p>
                                </div>

                                <button
                                    className="refresh-button"
                                    onClick={loadDashboard}
                                    disabled={loading}
                                >
                                    ↻ Refresh Data
                                </button>

                            </div>

                            {loading ? (

                                <div className="loading-message">
                                    Loading business information...
                                </div>

                            ) : error ? (

                                <div className="error-message">

                                    <strong>
                                        Unable to load dashboard data.
                                    </strong>

                                    <p>{error}</p>

                                    <button
                                        className="refresh-button"
                                        onClick={loadDashboard}
                                    >
                                        Try Again
                                    </button>

                                </div>

                            ) : (

                                <>

                                    {/* DASHBOARD STATISTICS */}
                                    <div className="stats-grid">

                                        <div className="stat-card">

                                            <div className="stat-top">
                                                <span>Registered Suppliers</span>
                                                <span className="stat-icon green">♙</span>
                                            </div>

                                            <h2>{dashboardData.suppliers}</h2>

                                            <p>Suppliers in the system</p>

                                        </div>

                                        <div className="stat-card">

                                            <div className="stat-top">
                                                <span>Registered Vendors</span>
                                                <span className="stat-icon blue">♧</span>
                                            </div>

                                            <h2>{dashboardData.vendors}</h2>

                                            <p>Business customers</p>

                                        </div>

                                        <div className="stat-card">

                                            <div className="stat-top">
                                                <span>Total Sales</span>
                                                <span className="stat-icon orange">↑</span>
                                            </div>

                                            <h2>
                                                {formatMoney(dashboardData.totalSales)}
                                            </h2>

                                            <p>
                                                {dashboardData.salesCount} recorded sales
                                            </p>

                                        </div>

                                        <div className="stat-card">

                                            <div className="stat-top">
                                                <span>Outstanding Payments</span>
                                                <span className="stat-icon red">M</span>
                                            </div>

                                            <h2>
                                                {formatMoney(dashboardData.outstanding)}
                                            </h2>

                                            <p>Payments yet to be collected</p>

                                        </div>

                                        <div className="stat-card">

                                            <div className="stat-top">
                                                <span>Available Stock</span>
                                                <span className="stat-icon purple">▤</span>
                                            </div>

                                            <h2>
                                                {dashboardData.stockQuantity.toLocaleString()}
                                            </h2>

                                            <p>Total available boxes</p>

                                        </div>

                                    </div>

                                    {/* RECENT SALES */}
                                    <div className="content-card">

                                        <div className="section-heading">

                                            <div>
                                                <h2>Recent Sales</h2>
                                                <p>Latest recorded sales transactions</p>
                                            </div>

                                            <button
                                                className="text-button"
                                                onClick={function() {
                                                    setActivePage('Sales');
                                                }}
                                            >
                                                View Sales →
                                            </button>

                                        </div>

                                        <div className="table-container">

                                            <table>

                                                <thead>
                                                    <tr>
                                                        <th>Sale ID</th>
                                                        <th>Vendor</th>
                                                        <th>Date</th>
                                                        <th>Amount</th>
                                                        <th>Payment Status</th>
                                                    </tr>
                                                </thead>

                                                <tbody>

                                                    {dashboardData.recentSales.length === 0 ? (

                                                        <tr>
                                                            <td colSpan="5" className="empty-table">
                                                                No sales records available.
                                                            </td>
                                                        </tr>

                                                    ) : (

                                                        dashboardData.recentSales.map(function(sale) {

                                                            return (

                                                                <tr key={sale.SaleID}>

                                                                    <td>
                                                                        #{sale.SaleID}
                                                                    </td>

                                                                    <td>
                                                                        {sale.VendorName || 'Vendor #' + sale.VendorID}
                                                                    </td>

                                                                    <td>
                                                                        {formatDate(sale.SaleDate)}
                                                                    </td>

                                                                    <td>
                                                                        {formatMoney(sale.TotalAmount)}
                                                                    </td>

                                                                    <td>

                                                                        <span className={
                                                                            'payment-status ' +
                                                                            (sale.PaymentStatus || 'UNPAID').toLowerCase()
                                                                        }>
                                                                            {sale.PaymentStatus || 'UNPAID'}
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

                        </>

                    ) : activePage === 'Suppliers' ? (

                        <Suppliers />

                    ) : activePage === 'Fruits' ? (

                        <Fruits />

                    ) : activePage === 'Vendors' ? (

                        <Vendors />

                    ) : activePage === 'Stock' ? (

                        <Stock />

                    ) : activePage === 'Purchases' ? (

                        <Purchases />

                    ) : activePage === 'Sales' ? (

                        <Sales />

                    ) : activePage === 'Reports' ? (

                        <Reports />

                    ) : (

                        <div className="content-card module-placeholder">

                            <h2>{activePage}</h2>

                            <p>
                                The {activePage.toLowerCase()} module
                                is being developed.
                            </p>

                            <p>
                                This section will be connected to its
                                corresponding backend API.
                            </p>

                        </div>

                    )}

                </section>

                {/* FOOTER */}
                <footer className="app-footer">

                    Batloung Farm Distribution Management System

                    <span>© 2026</span>

                </footer>

            </main>

        </div>

    );

}

export default App;