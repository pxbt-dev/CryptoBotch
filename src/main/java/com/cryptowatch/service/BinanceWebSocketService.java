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
import java.util.*;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Service
@RequiredArgsConstructor
public class BinanceWebSocketService extends TextWebSocketHandler {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final Set<String> activeSymbols = new CopyOnWriteArraySet<>();
    private volatile WebSocketSession binanceSession;
    private final AtomicInteger requestId = new AtomicInteger(1);
    private final ReentrantLock sendLock = new ReentrantLock();

    @PostConstruct
    public void connect() {
        try {
            StandardWebSocketClient client = new StandardWebSocketClient();
            log.info("Connecting to Binance WebSocket");
            client.execute(this, "wss://stream.binance.com:9443/stream");
        } catch (Exception e) {
            log.error("Failed to initiate Binance WebSocket connection: {}", e.getMessage());
        }
    }

    public void subscribe(String symbol) {
        String sym = symbol.toLowerCase();
        if (activeSymbols.add(sym)) {
            sendManagementMessage("SUBSCRIBE", sym);
        }
    }

    public void unsubscribe(String symbol) {
        String sym = symbol.toLowerCase();
        if (activeSymbols.remove(sym)) {
            sendManagementMessage("UNSUBSCRIBE", sym);
        }
    }

    public Set<String> getActiveSymbols() {
        return Collections.unmodifiableSet(activeSymbols);
    }

    private void sendManagementMessage(String method, String symbol) {
        if (binanceSession == null || !binanceSession.isOpen()) {
            log.warn("Binance session not open — will re-subscribe {} on reconnect", symbol);
            return;
        }
        sendLock.lock();
        try {
            List<String> params = List.of(
                symbol + "@kline_1m",
                symbol + "@depth20@100ms",
                symbol + "@trade"
            );
            Map<String, Object> msg = new LinkedHashMap<>();
            msg.put("method", method);
            msg.put("params", params);
            msg.put("id", requestId.getAndIncrement());
            binanceSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(msg)));
            log.info("{} Binance streams for {}", method, symbol);
        } catch (Exception e) {
            log.error("Error sending {} to Binance: {}", method, e.getMessage());
        } finally {
            sendLock.unlock();
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        this.binanceSession = session;
        log.info("Connected to Binance WebSocket");
        activeSymbols.forEach(sym -> sendManagementMessage("SUBSCRIBE", sym));
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("Binance WebSocket transport error: {}", exception.getMessage());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) {
        log.warn("Binance WebSocket closed: {}. Reconnecting in 5s...", status);
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
        messagingTemplate.convertAndSend("/topic/orderbook/" + symbol, node);
    }

    private void handleTrade(JsonNode node) {
        String symbol = node.get("s").asText().toLowerCase();
        messagingTemplate.convertAndSend("/topic/trades/" + symbol, node);
    }
}
