import { Router } from 'express';
import * as MarketController from '../controllers/market/market.controller.js';

const router = Router();

router.get('/summary', MarketController.getSummary);
router.get('/trending', MarketController.getTrending);
router.get('/overview', MarketController.getOverview);
router.get('/apps/:slug', MarketController.getAppMarketData);
router.get('/top-charts', MarketController.getTopChartsData);
router.get('/trends/:slug', MarketController.getTrendsApiData);

export default router;
