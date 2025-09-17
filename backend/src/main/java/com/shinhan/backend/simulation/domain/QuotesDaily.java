package com.shinhan.backend.simulation.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Date;

@Getter
@Setter
public class QuotesDaily {
    private LocalDate date;      // PK
    private Double krwGOpen;
    private Double krwGClose;
    private Double usdOzOpen;
    private Double usdOzClose;
    private Double vix;
    private Double etfVolume;
    private Double fxRate;
}