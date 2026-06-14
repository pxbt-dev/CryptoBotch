package com.cryptowatch.service;

import com.cryptowatch.dto.MarketDataDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.math.BigDecimal;
import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class BinanceWebSocketService extends TextWebSocketHandler {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final List<String> symbols = Arrays.asList("btcusdt", "ethusdt", "solusdt", "bnbusdt", "adausdt");

    @PostConstruct
    public void connect() {
        try {
            StandardWebSocketClient client = new StandardWebSocketClient();
            String streams = symbols.stream()
                    .flatMap(s -> Stream.of(s + "@kline_1m", s + "@depth20@100ms", s + "@trade"))
                    .collect(Collectors.joining("/"));
            
            String url = "wss://stream.binance.com:9443/stream?streams=" + streams;
            log.info("Connecting to Binance WebSocket: {}", url);
            client.execute(this, url);
        } catch (Exception e) {
            log.error("Failed to initiate Binance WebSocket connection: {}", e.getMessage());
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("Connected to Binance WebSocket successfully");
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("Binance WebSocket transport error: {}", exception.getMessage());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) {
        log.warn("Binance WebSocket connection closed: {}. Reconnecting in 5s...", status);
        new Thread(() -> {
            try {
                Thread.sleep(5000);
                connect();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            JsonNode root = objectMapper.readTree(message.getPayload());
            String stream = root.has("stream") ? root.get("stream").asText() : "";
            JsonNode node = root.has("data") ? root.get("data") : root;
            
            if (log.isTraceEnabled()) {
                log.trace("Received message from stream: {}", stream);
            }

            if (stream.contains("@kline")) {
                handleKline(node);
            } else if (stream.contains("@depth")) {
                handleDepth(node, stream);
            } else if (stream.contains("@trade")) {
                handleTrade(node);
            }
        } catch (Exception e) {
            log.error("Error processing Binance WebSocket message: {}", e.getMessage());
        }
    }

    private void handleKline(JsonNode node) {
        if (node.has("k")) {
            JsonNode k = node.get("k");
            String symbol = node.get("s").asText().toLowerCase();
            MarketDataDto dto = MarketDataDto.builder()
                    .symbol(symbol.toUpperCase())
                    .timestamp(k.get("t").asLong())
                    .open(new BigDecimal(k.get("o").asText()))
                    .high(new BigDecimal(k.get("h").asText()))
                    .low(new BigDecimal(k.get("l").asText()))
                    .price(new BigDecimal(k.get("c").asText()))
                    .volume(new BigDecimal(k.get("v").asText()))
                    .build();

            messagingTemplate.convertAndSend("/topic/market/" + symbol, dto);
        }
    }

    private void handleDepth(JsonNode node, String stream) {
        String symbol = stream.split("@")[0].toLowerCase();
        if (log.isTraceEnabled()) {
            log.trace("Broadcasting depth update for /topic/orderbook/{}", symbol);
        }
        messagingTemplate.convertAndSend("/topic/orderbook/" + symbol, node);
    }

    private void handleTrade(JsonNode node) {
        String symbol = node.get("s").asText().toLowerCase();
        if (log.isTraceEnabled()) {
            log.trace("Broadcasting trade update for /topic/trades/{}", symbol);
        }
        messagingTemplate.convertAndSend("/topic/trades/" + symbol, node);
    }
}
