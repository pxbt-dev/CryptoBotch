package com.cryptowatch.service;

import com.cryptowatch.dto.MarketDataDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.ta4j.core.BarSeries;
import org.ta4j.core.BaseBarSeriesBuilder;
import org.ta4j.core.indicators.EMAIndicator;
import org.ta4j.core.indicators.MACDIndicator;
import org.ta4j.core.indicators.RSIIndicator;
import org.ta4j.core.indicators.SMAIndicator;
import org.ta4j.core.indicators.helpers.ClosePriceIndicator;
import org.ta4j.core.indicators.bollinger.BollingerBandsLowerIndicator;
import org.ta4j.core.indicators.bollinger.BollingerBandsMiddleIndicator;
import org.ta4j.core.indicators.bollinger.BollingerBandsUpperIndicator;
import org.ta4j.core.indicators.statistics.StandardDeviationIndicator;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class IndicatorService {

    public Map<String, Object> calculateIndicators(List<MarketDataDto> history) {
        Map<String, Object> results = new HashMap<>();
        
        try {
            BarSeries series = new BaseBarSeriesBuilder().withName("history").build();
            for (MarketDataDto dto : history) {
                try {
                    series.addBar(
                        ZonedDateTime.ofInstant(java.time.Instant.ofEpochMilli(dto.getTimestamp()), java.time.ZoneId.systemDefault()),
                        dto.getOpen(), dto.getHigh(), dto.getLow(), dto.getPrice(), dto.getVolume()
                    );
                } catch (Exception e) {
                    // Ignore duplicate/out-of-order bars
                }
            }

            if (series.getBarCount() < 20) { // Need at least 20 bars for EMA(20) and RSI
                log.warn("Insufficient data for indicators: {} bars", series.getBarCount());
                results.put("history", new ArrayList<>());
                return results;
            }

            ClosePriceIndicator close = new ClosePriceIndicator(series);
            EMAIndicator ema = new EMAIndicator(close, 20);
            SMAIndicator sma = new SMAIndicator(close, 20);
            SMAIndicator sma50 = new SMAIndicator(close, 50);
            SMAIndicator sma200 = new SMAIndicator(close, 200);
            RSIIndicator rsi = new RSIIndicator(close, 14);

            StandardDeviationIndicator sd = new StandardDeviationIndicator(close, 20);
            BollingerBandsMiddleIndicator bbMiddle = new BollingerBandsMiddleIndicator(new EMAIndicator(close, 20));
            BollingerBandsUpperIndicator bbUpper = new BollingerBandsUpperIndicator(bbMiddle, sd);
            BollingerBandsLowerIndicator bbLower = new BollingerBandsLowerIndicator(bbMiddle, sd);

            MACDIndicator macdLine = new MACDIndicator(close, 12, 26);
            EMAIndicator macdSignal = new EMAIndicator(macdLine, 9);

            List<Map<String, Object>> indicatorsHistory = new ArrayList<>();
            for (int i = 0; i < series.getBarCount(); i++) {
                Map<String, Object> point = new HashMap<>();
                point.put("timestamp", series.getBar(i).getEndTime().toInstant().toEpochMilli());
                point.put("ema", ema.getValue(i).doubleValue());
                point.put("sma", sma.getValue(i).doubleValue());
                point.put("sma50", sma50.getValue(i).doubleValue());
                point.put("sma200", sma200.getValue(i).doubleValue());
                point.put("rsi", rsi.getValue(i).doubleValue());
                point.put("bbUpper", bbUpper.getValue(i).doubleValue());
                point.put("bbMiddle", bbMiddle.getValue(i).doubleValue());
                point.put("bbLower", bbLower.getValue(i).doubleValue());
                double macd = macdLine.getValue(i).doubleValue();
                double signal = macdSignal.getValue(i).doubleValue();
                point.put("macd", macd);
                point.put("macdSignal", signal);
                point.put("macdHist", macd - signal);
                indicatorsHistory.add(point);
            }

            results.put("history", indicatorsHistory);
            results.put("latest", indicatorsHistory.get(indicatorsHistory.size() - 1));

        } catch (Exception e) {
            results.put("error", e.getMessage());
            results.put("history", new ArrayList<>());
        }
        
        return results;
    }
}
