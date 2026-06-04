"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentDiscoveries = exports.getDiscoveryStatus = exports.startDiscovery = void 0;
const discovery_service_1 = require("../services/discovery.service");
const index_1 = require("../index");
const startDiscovery = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }
        // Create a discovery session to track progress
        const session = await index_1.prisma.discoverySession.create({
            data: {
                userId: String(req.user.id),
                query,
                status: 'RUNNING',
                startedAt: new Date(),
                importerIds: '[]' // Initialize with empty array
            }
        });
        // Run discovery in background (don't await)
        discovery_service_1.DiscoveryService.discoverImporters(query, session.id).catch((error) => {
            index_1.logger.error('Background discovery error:', error);
            index_1.prisma.discoverySession.update({
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
        index_1.logger.error('Discovery controller error:', error);
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
        const session = await index_1.prisma.discoverySession.findUnique({
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
                importers = await index_1.prisma.importer.findMany({
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
        index_1.logger.error('Get discovery status error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getDiscoveryStatus = getDiscoveryStatus;
const getRecentDiscoveries = async (req, res) => {
    try {
        const sessions = await index_1.prisma.discoverySession.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                user: { select: { firstName: true, lastName: true } }
            }
        });
        return res.json(sessions);
    }
    catch (error) {
        index_1.logger.error('Get recent discoveries error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getRecentDiscoveries = getRecentDiscoveries;
//# sourceMappingURL=discovery.controller.js.map