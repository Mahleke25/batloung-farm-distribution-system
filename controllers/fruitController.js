const db = require('../config/db');

// GET all fruits
async function getAllFruits(req, res) {
    try {
        const [fruits] = await db.execute(
            'SELECT * FROM fruits ORDER BY FruitID DESC'
        );

        res.status(200).json({
            success: true,
            count: fruits.length,
            data: fruits
        });

    } catch (error) {
        console.error('Error retrieving fruits:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve fruits.'
        });
    }
}


// GET fruit by ID
async function getFruitById(req, res) {
    try {
        const fruitId = req.params.id;

        const [fruits] = await db.execute(
            'SELECT * FROM fruits WHERE FruitID = ?',
            [fruitId]
        );

        if (fruits.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fruit not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: fruits[0]
        });

    } catch (error) {
        console.error('Error retrieving fruit:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve fruit.'
        });
    }
}


// POST create a new fruit
async function createFruit(req, res) {
    try {
        const { FruitName, Description, Status } = req.body;

        if (!FruitName || !Status) {
            return res.status(400).json({
                success: false,
                message: 'Fruit name and status are required.'
            });
        }

        const allowedStatuses = ['AVAILABLE', 'UNAVAILABLE'];

        if (!allowedStatuses.includes(Status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid fruit status.'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO fruits
            (FruitName, Description, Status)
            VALUES (?, ?, ?)`,
            [FruitName, Description || null, Status]
        );

        res.status(201).json({
            success: true,
            message: 'Fruit created successfully.',
            FruitID: result.insertId
        });

    } catch (error) {
        console.error('Error creating fruit:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to create fruit.'
        });
    }
}


// PUT update a fruit
async function updateFruit(req, res) {
    try {
        const fruitId = req.params.id;

        const { FruitName, Description, Status } = req.body;

        if (!FruitName || !Status) {
            return res.status(400).json({
                success: false,
                message: 'Fruit name and status are required.'
            });
        }

        const allowedStatuses = ['AVAILABLE', 'UNAVAILABLE'];

        if (!allowedStatuses.includes(Status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid fruit status.'
            });
        }

        const [result] = await db.execute(
            `UPDATE fruits
            SET FruitName = ?,
                Description = ?,
                Status = ?
            WHERE FruitID = ?`,
            [FruitName, Description || null, Status, fruitId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fruit not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Fruit updated successfully.'
        });

    } catch (error) {
        console.error('Error updating fruit:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to update fruit.'
        });
    }
}


// DELETE a fruit
async function deleteFruit(req, res) {
    try {
        const fruitId = req.params.id;

        const [result] = await db.execute(
            'DELETE FROM fruits WHERE FruitID = ?',
            [fruitId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fruit not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Fruit deleted successfully.'
        });

    } catch (error) {
        console.error('Error deleting fruit:', error.message);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete this fruit because it is linked to purchases, sales or stock records.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete fruit.'
        });
    }
}


// Export all controller functions
module.exports = {
    getAllFruits,
    getFruitById,
    createFruit,
    updateFruit,
    deleteFruit
};