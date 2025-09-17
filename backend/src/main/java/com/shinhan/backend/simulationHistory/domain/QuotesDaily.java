package com.shinhan.backend.simulationHistory.domain;

import lombok.Data;

import java.util.Date;

@Data
public class QuotesDaily {
    private Date date;     // PK
    private Double krwGOpen;
    private Double krwGClose;
    private Double usdOzOpen;
    private Double usdOzClose;
    private Double vix;
    private Double etfVolume;
    private Double fxRate;
}
