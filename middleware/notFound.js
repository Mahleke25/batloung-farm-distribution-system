function notFound(req, res) {
    res.status(404).json({
        success: false,
        message: 'The requested API route does not exist.'
    });
}

module.exports = notFound;