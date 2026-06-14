package com.cryptowatch.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarketDataDto {
    private String symbol;
    private BigDecimal price;
    private long timestamp;
    private BigDecimal volume;
    private BigDecimal high;
    private BigDecimal low;
    private BigDecimal open;
}
