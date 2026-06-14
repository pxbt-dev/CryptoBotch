package com.cryptowatch.service;

import com.cryptowatch.dto.MarketDataDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class BinanceService {

    private final WebClient webClient;

    public BinanceService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://api.binance.com/api/v3").build();
    }

    public Mono<List<String>> getAvailableSymbols() {
        return webClient.get()
                .uri("/ticker/price")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(list -> list.stream()
                        .map(item -> (String) item.get("symbol"))
                        .sorted()
                        .collect(java.util.stream.Collectors.toList()))
                .doOnError(e -> log.error("Error fetching available symbols: {}", e.getMessage()))
                .onErrorResume(e -> Mono.just(List.of()));
    }

    public Mono<List<MarketDataDto>> getHistoricalKlines(String symbol, String interval, int limit) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/klines")
                        .queryParam("symbol", symbol.toUpperCase())
                        .queryParam("interval", interval)
                        .queryParam("limit", limit)
                        .build())
                .retrieve()
                .bodyToMono(List.class)
                .map(this::mapToMarketDataDtos)
                .doOnError(e -> log.error("Error fetching historical klines for {}: {}", symbol, e.getMessage()))
                .onErrorResume(e -> Mono.just(List.of()));
    }

    private List<MarketDataDto> mapToMarketDataDtos(List<?> rawKlines) {
        return rawKlines.stream()
                .map(item -> {
                    List<?> kline = (List<?>) item;
                    return MarketDataDto.builder()
                            .timestamp(((Number) kline.get(0)).longValue())
                            .open(new BigDecimal(kline.get(1).toString()))
                            .high(new BigDecimal(kline.get(2).toString()))
                            .low(new BigDecimal(kline.get(3).toString()))
                            .price(new BigDecimal(kline.get(4).toString()))
                            .volume(new BigDecimal(kline.get(5).toString()))
                            .build();
                })
                .toList();
    }
}
