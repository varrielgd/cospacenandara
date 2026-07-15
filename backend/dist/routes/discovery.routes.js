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
const discoveryController = __importStar(require("../controllers/discovery.controller"));
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.post('/start', auth_js_1.authenticate, discoveryController.startDiscovery);
router.get('/status/:sessionId', auth_js_1.authenticate, discoveryController.getDiscoveryStatus);
router.get('/recent', auth_js_1.authenticate, discoveryController.getRecentDiscoveries);
router.get('/market-recommendations', auth_js_1.authenticate, discoveryController.getMarketRecommendations);
router.get('/test-ai', auth_js_1.authenticate, async (req, res) => {
    try {
        const { AiService } = require('../services/ai.service');
        const response = await AiService.generateContent('Say "AI Connection OK" if you receive this.');
        res.json({ status: 'SUCCESS', response });
    }
    catch (error) {
        res.status(500).json({ status: 'FAILED', error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=discovery.routes.js.map