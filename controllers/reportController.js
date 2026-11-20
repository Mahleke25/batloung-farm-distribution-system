const db = require('../config/db');


// REPORT 1: Top five best-selling fruits
async function getTopFiveFruits(req, res) {

    try {

        const [rows] = await db.execute(
            `SELECT
                f.FruitID,
                f.FruitName,
                SUM(sd.Quantity) AS TotalBoxesSold,
                SUM(sd.Quantity * sd.UnitPrice) AS TotalRevenue
            FROM sales_details sd
            JOIN fruits f ON sd.FruitID = f.FruitID
            GROUP BY f.FruitID, f.FruitName
            ORDER BY TotalBoxesSold DESC
            LIMIT 5`
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            report: 'Top Five Best-Selling Fruits',
            data: rows
        });

    } catch (error) {

        console.error('Top five fruits report error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to generate top five fruits report.'
        });
    }
}


// REPORT 2: Revenue by date range
async function getRevenueByDateRange(req, res) {

    try {

        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        if (!startDate || !endDate) {

            return res.status(400).json({
                success: false,
                message: 'Please provide both startDate and endDate.'
            });
        }

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        if (!datePattern.test(startDate) || !datePattern.test(endDate)) {

            return res.status(400).json({
                success: false,
                message: 'Dates must use YYYY-MM-DD format.'
            });
        }

        function isValidDate(date) {

            const parsedDate = new Date(date + 'T00:00:00Z');

            return !isNaN(parsedDate.getTime()) &&
                parsedDate.toISOString().slice(0, 10) === date;
        }

        if (!isValidDate(startDate) || !isValidDate(endDate)) {

            return res.status(400).json({
                success: false,
                message: 'Please provide valid calendar dates.'
            });
        }

        if (startDate > endDate) {

            return res.status(400).json({
                success: false,
                message: 'Start date cannot be after end date.'
            });
        }

        const [rows] = await db.execute(
            `SELECT
                DATE(SaleDate) AS SaleDate,
                COUNT(SaleID) AS NumberOfSales,
                SUM(TotalAmount) AS TotalRevenue
            FROM sales
            WHERE SaleDate >= ?
            AND SaleDate < DATE_ADD(?, INTERVAL 1 DAY)
            GROUP BY DATE(SaleDate)
            ORDER BY SaleDate`,
            [startDate, endDate]
        );

        let totalRevenue = 0;

        for (let i = 0; i < rows.length; i++) {
            totalRevenue += Number(rows[i].TotalRevenue);
        }

        res.status(200).json({
            success: true,
            report: 'Revenue by Date Range',
            startDate: startDate,
            endDate: endDate,
            totalRevenue: totalRevenue.toFixed(2),
            count: rows.length,
            data: rows
        });

    } catch (error) {

        console.error('Revenue report error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to generate revenue report.'
        });
    }
}


// REPORT 3: Vendor with the highest number of boxes sold
async function getTopVendor(req, res) {

    try {

        const [rows] = await db.execute(
            `SELECT
                v.VendorID,
                v.VendorName,
                SUM(sd.Quantity) AS TotalBoxesSold
            FROM sales s
            JOIN vendors v ON s.VendorID = v.VendorID
            JOIN sales_details sd ON s.SaleID = sd.SaleID
            GROUP BY v.VendorID, v.VendorName
            HAVING SUM(sd.Quantity) = (
                SELECT MAX(VendorBoxes)
                FROM (
                    SELECT SUM(sd2.Quantity) AS VendorBoxes
                    FROM sales s2
                    JOIN sales_details sd2 ON s2.SaleID = sd2.SaleID
                    GROUP BY s2.VendorID
                ) AS VendorTotals
            )
            ORDER BY v.VendorName`
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            report: 'Vendor(s) with the Highest Number of Boxes Sold',
            data: rows
        });

    } catch (error) {

        console.error('Top vendor report error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to generate top vendor report.'
        });
    }
}


// REPORT 4: Current stock by fruit and packaging size
async function getCurrentStockReport(req, res) {

    try {

        const [rows] = await db.execute(
            `SELECT
                f.FruitID,
                f.FruitName,
                s.PackagingSize,
                s.AvailableQuantity,
                s.SellingPrice,
                (s.AvailableQuantity * s.SellingPrice) AS StockValue
            FROM stock s
            JOIN fruits f ON s.FruitID = f.FruitID
            ORDER BY
                f.FruitName,
                FIELD(s.PackagingSize, 'SMALL', 'MEDIUM', 'LARGE')`
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            report: 'Current Stock by Fruit and Packaging Size',
            data: rows
        });

    } catch (error) {

        console.error('Current stock report error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to generate current stock report.'
        });
    }
}


// REPORT 5: Outstanding payments
async function getOutstandingPayments(req, res) {

    try {

        const [rows] = await db.execute(
            `SELECT
                s.SaleID,
                v.VendorID,
                v.VendorName,
                s.SaleDate,
                s.TotalAmount,
                s.AmountPaid,
                (s.TotalAmount - s.AmountPaid) AS OutstandingBalance,
                s.PaymentStatus,
                s.PaymentMethod
            FROM sales s
            JOIN vendors v ON s.VendorID = v.VendorID
            WHERE s.TotalAmount > s.AmountPaid
            ORDER BY OutstandingBalance DESC`
        );

        // Calculate total outstanding balance
        let totalOutstanding = 0;

        for (let i = 0; i < rows.length; i++) {
            totalOutstanding += Number(rows[i].OutstandingBalance);
        }

        res.status(200).json({
            success: true,
            count: rows.length,
            report: 'Outstanding Payments',
            totalOutstanding: totalOutstanding.toFixed(2),
            data: rows
        });

    } catch (error) {

        console.error('Outstanding payments report error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to generate outstanding payments report.'
        });
    }
}


// Export report functions
module.exports = {
    getTopFiveFruits,
    getRevenueByDateRange,
    getTopVendor,
    getCurrentStockReport,
    getOutstandingPayments
};