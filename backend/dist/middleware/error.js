"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const index_1 = require("../index");
const errorHandler = (err, req, res, next) => {
    index_1.logger.error(`${err.message} - ${req.method} ${req.url} - ${req.ip}`);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({
        status: 'error',
        message,
        details: err.message, // Tampilkan detail error sementara untuk debugging di prod
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.js.map