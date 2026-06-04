"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetsService = void 0;
const axios_1 = __importDefault(require("axios"));
const index_1 = require("../index");
class GoogleSheetsService {
    static scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    /**
     * Sync a single importer to Google Sheets
     */
    static async syncImporter(importer) {
        if (!this.scriptUrl) {
            index_1.logger.warn('Google Script URL not configured, skipping sheet sync');
            return;
        }
        try {
            await axios_1.default.post(this.scriptUrl, {
                action: 'addImporter',
                data: {
                    id: importer.id,
                    companyName: importer.companyName,
                    website: importer.website,
                    email: importer.email,
                    phone: importer.phone,
                    country: importer.country,
                    status: importer.status,
                    leadScore: importer.leadScore,
                    createdAt: importer.createdAt
                }
            });
            index_1.logger.info(`Synced importer ${importer.companyName} to Google Sheets`);
        }
        catch (error) {
            index_1.logger.error('Google Sheets sync error:', error);
        }
    }
    /**
     * Bulk sync all data to Google Sheets
     */
    static async syncAll(data) {
        if (!this.scriptUrl) {
            index_1.logger.warn('Google Script URL not configured, skipping bulk sync');
            return;
        }
        try {
            await axios_1.default.post(this.scriptUrl, {
                action: 'syncAll',
                ...data
            });
            index_1.logger.info('Bulk sync to Google Sheets completed');
        }
        catch (error) {
            index_1.logger.error('Google Sheets bulk sync error:', error);
        }
    }
}
exports.GoogleSheetsService = GoogleSheetsService;
//# sourceMappingURL=google-sheets.service.js.map