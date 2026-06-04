export declare class GoogleSheetsService {
    private static scriptUrl;
    /**
     * Sync a single importer to Google Sheets
     */
    static syncImporter(importer: any): Promise<void>;
    /**
     * Bulk sync all data to Google Sheets
     */
    static syncAll(data: {
        importers: any[];
        samples: any[];
        quotations: any[];
    }): Promise<void>;
}
//# sourceMappingURL=google-sheets.service.d.ts.map