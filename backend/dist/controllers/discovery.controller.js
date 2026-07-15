"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelDiscovery = exports.getRecentDiscoveries = exports.getMarketRecommendations = exports.deleteSession = exports.getDiscoveryStatus = exports.startDiscovery = void 0;
const discovery_service_1 = require("../services/discovery.service");
const market_data_service_1 = require("../services/market-data.service");
const ai_service_1 = require("../services/ai.service");
const prisma_js_1 = require("../prisma.js");
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.simple()
        })
    ]
});
const startDiscovery = async (req, res) => {
    try {
        let { query, country, targetCountry, region, importerType } = req.body;
        // Normalize country field (frontend sends targetCountry)
        const finalCountry = country || targetCountry || 'Global';
        // Auto-construct query if missing but parameters are present
        if (!query && (finalCountry || importerType)) {
            query = `${importerType || 'Coffee Importer'} in ${region ? `${region}, ` : ''}${finalCountry}`;
        }
        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }
        // Create a discovery session to track progress
        const session = await prisma_js_1.prisma.discoverySession.create({
            data: {
                userId: String(req.user.id),
                query,
                status: 'RUNNING',
                startedAt: new Date(),
                importerIds: '[]' // Initialize with empty array
            }
        });
        // Run discovery in background (don't await)
        discovery_service_1.DiscoveryService.discoverImporters(query, session.id, { country: finalCountry, region, importerType }).catch((error) => {
            logger.error('Background discovery error:', error);
            prisma_js_1.prisma.discoverySession.update({
                where: { id: session.id },
                data: { status: 'FAILED', error: String(error), completedAt: new Date() }
            }).catch(() => { });
        });
        return res.json({
            message: 'Discovery started',
            sessionId: session.id,
            status: 'RUNNING'
        });
    }
    catch (error) {
        logger.error('Discovery controller error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.startDiscovery = startDiscovery;
const getDiscoveryStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;
        // Prisma expects a scalar string id; normalize Express param typing (string|string[]).
        const normalizedSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;
        if (!normalizedSessionId) {
            return res.status(400).json({ message: 'Session ID is required' });
        }
        const session = await prisma_js_1.prisma.discoverySession.findUnique({
            where: { id: normalizedSessionId },
            include: {
                user: { select: { firstName: true, lastName: true } }
            }
        });
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        // Get the importers found in this session
        let importers = [];
        if (session.importerIds) {
            try {
                const importerIds = JSON.parse(session.importerIds);
                importers = await prisma_js_1.prisma.importer.findMany({
                    where: { id: { in: importerIds } }
                });
            }
            catch (e) {
                // Ignore JSON parse errors
            }
        }
        return res.json({
            id: session.id,
            query: session.query,
            status: session.status,
            totalFound: session.totalFound,
            totalProcessed: session.totalProcessed,
            importers,
            error: session.error,
            startedAt: session.startedAt,
            completedAt: session.completedAt
        });
    }
    catch (error) {
        logger.error('Get discovery status error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getDiscoveryStatus = getDiscoveryStatus;
const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_js_1.prisma.discoverySession.delete({
            where: { id: String(id), userId: String(req.user.id) }
        });
        return res.json({ message: 'Session deleted successfully' });
    }
    catch (error) {
        logger.error('Error deleting session:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteSession = deleteSession;
const getMarketRecommendations = async (req, res) => {
    try {
        const snap = await market_data_service_1.MarketDataService.getSnapshot();
        const marketContext = market_data_service_1.MarketDataService.formatAsRagContext(snap);
        // AI prompt for generating targets
        const prompt = `
You are a coffee market analyst for PT. Nandara Nusa Montierra.
Based on the following live market data, suggest 3 target countries/regions for our sales team to focus their Lead Discovery on today.
    
${marketContext}

Your response must be a valid JSON array of exactly 3 objects. 
Do not use markdown blocks, just raw JSON.
Format of each object:
{
  "targetCountry": "string (e.g. Germany)",
  "reason": "string (Short sentence explaining why, tying it to the market data if possible, or general specialty coffee demand)",
  "searchQuery": "string (Suggested query, e.g. Specialty coffee importers in Germany)"
}
    `;
        const aiResponse = await ai_service_1.AiService.generateContent(prompt);
        // Attempt to parse JSON
        let recommendations = [];
        try {
            const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            recommendations = JSON.parse(cleaned);
        }
        catch (e) {
            // Fallback
            recommendations = [
                { targetCountry: 'United States', reason: 'Consistent high demand for premium origins.', searchQuery: 'Premium coffee importers USA' },
                { targetCountry: 'Germany', reason: 'Largest European market for sustainable beans.', searchQuery: 'Green coffee buyers Germany' },
                { targetCountry: 'Japan', reason: 'High appreciation for specialty grade Arabica.', searchQuery: 'Specialty coffee roasters Japan' }
            ];
        }
        return res.json(recommendations);
    }
    catch (error) {
        logger.error('Error getting market recommendations:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMarketRecommendations = getMarketRecommendations;
const getRecentDiscoveries = async (req, res) => {
    try {
        const sessions = await prisma_js_1.prisma.discoverySession.findMany({
            where: { userId: String(req.user.id) },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return res.json(sessions);
    }
    catch (error) {
        logger.error('Get recent discoveries error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getRecentDiscoveries = getRecentDiscoveries;
const cancelDiscovery = async (req, res) => {
    try {
        const { sessionId } = req.params;
        await prisma_js_1.prisma.discoverySession.update({
            where: { id: sessionId },
            data: { status: 'FAILED', error: 'Cancelled by user', completedAt: new Date() }
        });
        return res.json({ message: 'Discovery cancelled' });
    }
    catch (error) {
        logger.error('Cancel discovery error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.cancelDiscovery = cancelDiscovery;
//# sourceMappingURL=discovery.controller.js.map