"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSample = exports.updateSample = exports.createSample = exports.getAllSamples = void 0;
const index_1 = require("../index");
const getAllSamples = async (_req, res) => {
    try {
        const samples = await index_1.prisma.sample.findMany({
            include: { importer: { select: { companyName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(samples);
    }
    catch (error) {
        index_1.logger.error('Error fetching samples:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllSamples = getAllSamples;
const createSample = async (req, res) => {
    try {
        const sampleData = req.body;
        const sample = await index_1.prisma.sample.create({
            data: sampleData,
            include: { importer: { select: { companyName: true } } }
        });
        if (req.user) {
            await index_1.prisma.activity.create({
                data: {
                    userId: req.user.id,
                    importerId: sample.importerId,
                    type: 'SAMPLE',
                    description: `New sample process started for ${sample.importer.companyName} (${sample.product}). Current stage: ${sample.status}.`
                }
            });
        }
        return res.status(201).json(sample);
    }
    catch (error) {
        index_1.logger.error('Error creating sample:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createSample = createSample;
const updateSample = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        const sampleData = req.body;
        const oldSample = await index_1.prisma.sample.findUnique({ where: { id: id } });
        if (!oldSample)
            return res.status(404).json({ message: 'Sample not found' });
        const sample = await index_1.prisma.sample.update({
            where: { id: id },
            data: sampleData,
            include: { importer: { select: { companyName: true } } }
        });
        if (req.user && oldSample.status !== sample.status) {
            await index_1.prisma.activity.create({
                data: {
                    userId: req.user.id,
                    importerId: sample.importerId,
                    type: 'SAMPLE',
                    description: `Sample stage updated for ${sample.importer.companyName}: ${oldSample.status} -> ${sample.status}.`
                }
            });
        }
        return res.json(sample);
    }
    catch (error) {
        index_1.logger.error('Error updating sample:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateSample = updateSample;
const deleteSample = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        await index_1.prisma.sample.delete({ where: { id: id } });
        return res.status(204).send();
    }
    catch (error) {
        index_1.logger.error('Error deleting sample:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteSample = deleteSample;
//# sourceMappingURL=sample.controller.js.map