package com.cryptowatch.controller;

import com.cryptowatch.dto.MarketDataDto;
import com.cryptowatch.service.BinanceService;
import com.cryptowatch.service.IndicatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MarketController {

    private final BinanceService binanceService;
    private final IndicatorService indicatorService;

    @GetMapping("/history/{symbol}")
    public Mono<List<MarketDataDto>> getHistory(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "1m") String interval,
            @RequestParam(defaultValue = "100") int limit) {
        return binanceService.getHistoricalKlines(symbol, interval, limit);
    }

    @GetMapping("/indicators/{symbol}")
    public Mono<Map<String, Object>> getIndicators(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "1m") String interval,
            @RequestParam(defaultValue = "100") int limit) {
        return binanceService.getHistoricalKlines(symbol, interval, limit)
                .map(indicatorService::calculateIndicators);
    }
}
