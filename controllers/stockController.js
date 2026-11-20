const db = require('../config/db');

// GET all stock records
async function getAllStock(req, res) {
    try {
        const [rows] = await db.execute(
            `SELECT
                s.StockID,
                s.FruitID,
                f.FruitName,
                s.PackagingSize,
                s.AvailableQuantity,
                s.SellingPrice
            FROM stock s
            JOIN fruits f ON s.FruitID = f.FruitID
            ORDER BY f.FruitName, s.PackagingSize`
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error('Get stock error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve stock.'
        });
    }
}


// GET stock by StockID
async function getStockById(req, res) {
    try {
        const stockID = req.params.id;

        const [rows] = await db.execute(
            `SELECT
                s.StockID,
                s.FruitID,
                f.FruitName,
                s.PackagingSize,
                s.AvailableQuantity,
                s.SellingPrice
            FROM stock s
            JOIN fruits f ON s.FruitID = f.FruitID
            WHERE s.StockID = ?`,
            [stockID]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Stock record not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error('Get stock by ID error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve stock record.'
        });
    }
}


// GET stock by FruitID
async function getStockByFruit(req, res) {
    try {
        const fruitID = req.params.fruitId;

        const [rows] = await db.execute(
            `SELECT
                s.StockID,
                s.FruitID,
                f.FruitName,
                s.PackagingSize,
                s.AvailableQuantity,
                s.SellingPrice
            FROM stock s
            JOIN fruits f ON s.FruitID = f.FruitID
            WHERE s.FruitID = ?
            ORDER BY FIELD(s.PackagingSize, 'SMALL', 'MEDIUM', 'LARGE')`,
            [fruitID]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No stock records found for this fruit.'
            });
        }

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error('Get stock by fruit error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve fruit stock.'
        });
    }
}


// GET low-stock records
async function getLowStock(req, res) {
    try {
        let threshold = 20;

        if (req.query.threshold !== undefined) {
            threshold = Number(req.query.threshold);
        }

        if (!Number.isInteger(threshold) || threshold < 0) {
            return res.status(400).json({
                success: false,
                message: 'Threshold must be a non-negative whole number.'
            });
        }

        const [rows] = await db.execute(
            `SELECT
                s.StockID,
                s.FruitID,
                f.FruitName,
                s.PackagingSize,
                s.AvailableQuantity,
                s.SellingPrice
            FROM stock s
            JOIN fruits f ON s.FruitID = f.FruitID
            WHERE s.AvailableQuantity < ?
            ORDER BY s.AvailableQuantity ASC, f.FruitName`,
            [threshold]
        );

        res.status(200).json({
            success: true,
            threshold: threshold,
            count: rows.length,
            message: rows.length > 0
                ? 'Low-stock records retrieved successfully.'
                : 'No stock records are below the specified threshold.',
            data: rows
        });

    } catch (error) {
        console.error('Get low stock error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve low-stock records.'
        });
    }
}


// CREATE a stock record
async function createStock(req, res) {
    try {
        const { FruitID, PackagingSize, SellingPrice } = req.body;

        if (!FruitID || !PackagingSize || SellingPrice === undefined) {
            return res.status(400).json({
                success: false,
                message: 'FruitID, PackagingSize and SellingPrice are required.'
            });
        }

        const validSizes = ['SMALL', 'MEDIUM', 'LARGE'];

        if (!validSizes.includes(PackagingSize)) {
            return res.status(400).json({
                success: false,
                message: 'PackagingSize must be SMALL, MEDIUM or LARGE.'
            });
        }

        if (
            !Number.isFinite(Number(SellingPrice)) ||
            Number(SellingPrice) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'SellingPrice must be a number greater than zero.'
            });
        }

        const [fruit] = await db.execute(
            'SELECT FruitID FROM fruits WHERE FruitID = ?',
            [FruitID]
        );

        if (fruit.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fruit not found.'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO stock
            (FruitID, PackagingSize, AvailableQuantity, SellingPrice)
            VALUES (?, ?, 0, ?)`,
            [FruitID, PackagingSize, SellingPrice]
        );

        res.status(201).json({
            success: true,
            message: 'Stock record created successfully.',
            StockID: result.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'A stock record already exists for this fruit and packaging size.'
            });
        }

        console.error('Create stock error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to create stock record.'
        });
    }
}


// UPDATE stock quantity and selling price
async function updateStock(req, res) {
    try {
        const stockID = req.params.id;

        const { AvailableQuantity, SellingPrice } = req.body;

        // Validate available quantity
        if (
            AvailableQuantity === undefined ||
            !Number.isInteger(Number(AvailableQuantity)) ||
            Number(AvailableQuantity) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'AvailableQuantity must be a whole number of zero or more.'
            });
        }

        // Validate selling price
        if (
            SellingPrice === undefined ||
            !Number.isFinite(Number(SellingPrice)) ||
            Number(SellingPrice) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'SellingPrice must be a number greater than zero.'
            });
        }

        // Check whether stock record exists
        const [existingStock] = await db.execute(
            'SELECT StockID FROM stock WHERE StockID = ?',
            [stockID]
        );

        if (existingStock.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Stock record not found.'
            });
        }

        // Update quantity and selling price
        await db.execute(
            `UPDATE stock
            SET AvailableQuantity = ?,
                SellingPrice = ?
            WHERE StockID = ?`,
            [
                Number(AvailableQuantity),
                Number(SellingPrice),
                stockID
            ]
        );

        res.status(200).json({
            success: true,
            message: 'Stock quantity and selling price updated successfully.'
        });

    } catch (error) {
        console.error('Update stock error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to update stock record.'
        });
    }
}


// DELETE a stock record
async function deleteStock(req, res) {
    try {
        const stockID = req.params.id;

        const [rows] = await db.execute(
            'SELECT AvailableQuantity FROM stock WHERE StockID = ?',
            [stockID]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Stock record not found.'
            });
        }

        if (rows[0].AvailableQuantity !== 0) {
            return res.status(409).json({
                success: false,
                message: 'Stock record cannot be deleted while available quantity is not zero.'
            });
        }

        await db.execute(
            'DELETE FROM stock WHERE StockID = ?',
            [stockID]
        );

        res.status(200).json({
            success: true,
            message: 'Stock record deleted successfully.'
        });

    } catch (error) {
        console.error('Delete stock error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to delete stock record.'
        });
    }
}


// Export controller functions
module.exports = {
    getAllStock,
    getStockById,
    getStockByFruit,
    getLowStock,
    createStock,
    updateStock,
    deleteStock
};