package com.shinhan.backend.simulation.mapper;

import com.shinhan.backend.simulation.dto.QuoteRowDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface QuotesMapper {
    List<QuoteRowDto> selectQuotes(@Param("from") LocalDate from,
                                   @Param("to") LocalDate to);
}