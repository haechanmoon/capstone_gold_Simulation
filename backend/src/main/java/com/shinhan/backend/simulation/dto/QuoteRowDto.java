package com.shinhan.backend.simulation.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuoteRowDto {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    private Double fx_rate;
    private Double vix;
    private Double etf_volume;
    private Double gold_close;
    private Double pred_close;   // LSTM 예측 없으면 null
}