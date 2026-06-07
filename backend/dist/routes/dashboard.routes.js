"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController = __importStar(require("../controllers/dashboard.controller"));
const auth_1 = require("../middleware/auth");
const google_sheets_service_1 = require("../services/google-sheets.service");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/stats', dashboardController.getDashboardStats);
router.post('/sync-sheets', async (_req, res) => {
    try {
        const [importers, samples, quotations] = await Promise.all([
            prisma_1.prisma.importer.findMany(),
            prisma_1.prisma.sample.findMany(),
            prisma_1.prisma.quotation.findMany()
        ]);
        await google_sheets_service_1.GoogleSheetsService.syncAll({ importers, samples, quotations });
        res.json({ message: 'Sync to Google Sheets successful' });
    }
    catch (error) {
        res.status(500).json({ message: 'Sync failed' });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map