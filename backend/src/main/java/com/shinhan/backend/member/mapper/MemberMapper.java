// src/main/java/com/shinhan/backend/mapper/MemberMapper.java
package com.shinhan.backend.member.mapper;

import com.shinhan.backend.member.domain.Member;
import com.shinhan.backend.member.domain.MemberAuth;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface MemberMapper {
    int insertMember(Member m);
    int insertAuth(MemberAuth a);

    String findPasswordById(@Param("memberId") String memberId);
    Member findById(@Param("memberId") String memberId);
    List<MemberAuth> findAuthsByMemberId(@Param("memberId") String memberId);

    int updateLastLogin(@Param("memberId") String memberId);

    int checkId(@Param("memberId") String memberId);

    int checkEmail(@Param("memberEmail") String memberEmail);

    int forgotPassword(@Param("memberId") String memberId,
                       @Param("memberEmail") String memberEmail,
                       @Param("memberPwd") String memberPwd);

    String selectPassword(@Param("memberId") String memberId);

    int updatePassword(@Param("memberId") String memberId,
                       @Param("oldPwd") String oldPwd,
                       @Param("newPwd") String newPwd);


    int deleteMember(@Param("memberId") String memberId,
                     @Param("memberPwd") String memberPwd);
}
