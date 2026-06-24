"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelDiscovery = exports.getRecentDiscoveries = exports.getDiscoveryStatus = exports.startDiscovery = void 0;
const discovery_service_1 = require("../services/discovery.service");
const prisma_1 = require("../prisma");
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
        const session = await prisma_1.prisma.discoverySession.create({
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
            prisma_1.prisma.discoverySession.update({
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
        const session = await prisma_1.prisma.discoverySession.findUnique({
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
                importers = await prisma_1.prisma.importer.findMany({
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
const getRecentDiscoveries = async (req, res) => {
    try {
        const sessions = await prisma_1.prisma.discoverySession.findMany({
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
        await prisma_1.prisma.discoverySession.update({
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