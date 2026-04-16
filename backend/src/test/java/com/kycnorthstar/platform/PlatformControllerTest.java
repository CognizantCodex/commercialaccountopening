package com.kycnorthstar.platform;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class PlatformControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void snapshotEndpointReturnsSeededDashboardData() throws Exception {
    mockMvc.perform(get("/api/v1/platform/snapshot"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.clients[0].id").exists())
        .andExpect(jsonPath("$.cases[0].id").exists())
        .andExpect(jsonPath("$.timeline[0].type").value("document_uploaded"))
        .andExpect(jsonPath("$.alerts[0].title").exists())
        .andExpect(jsonPath("$.decisionLogs[0].reasoningChain[0]").exists());
  }

  @Test
  void resolveAliasMovesAuroraCaseIntoMonitoring() throws Exception {
    mockMvc.perform(post("/api/cases/case-aurora-001/resolve")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"action\":\"resolve\",\"caseId\":\"case-aurora-001\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("resolved"))
        .andExpect(jsonPath("$.stage").value("monitoring"));
  }

  @Test
  void governanceAliasCreatesExplainabilityRecord() throws Exception {
    mockMvc.perform(post("/api/governance/cases/case-aurora-001/decision")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"action\":\"open-governance\",\"caseId\":\"case-aurora-001\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.caseId").value("case-aurora-001"))
        .andExpect(jsonPath("$.reasoningChain[0]").exists());

    mockMvc.perform(get("/api/v1/cases/case-aurora-001/explainability"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.caseId").value("case-aurora-001"))
        .andExpect(jsonPath("$.decision.id").exists());
  }
}
