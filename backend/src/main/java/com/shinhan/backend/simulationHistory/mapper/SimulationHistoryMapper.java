package com.shinhan.backend.simulationHistory.mapper;

import com.shinhan.backend.simulationHistory.domain.SimulationHistory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface SimulationHistoryMapper {

    List<SimulationHistory> selectHistory(
            @Param("memberNo") Long memberNo,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("type") String type,     // ADD
            @Param("sort") String sort,     // ADD
            @Param("offset") int offset,
            @Param("size") int size
    );

    long countHistory(
            @Param("memberNo") Long memberNo,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("type") String type      // ADD
    );

    // SimulationHistoryMapper.java
    Map<String,Object> selectHistoryStats(Map<String,Object> params);

    Map<String,Object> selectHistorySummary(Long memberNo);

}
