package taskflow

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.assertTrue
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
class TaskFlowIntegrationTest @Autowired constructor(private val mvc: MockMvc) {
    @Test
    fun `registration token creates a project and protects project listing`() {
        val unauthorized = mvc.perform(get("/api/projects"))
            .andExpect(status().isUnauthorized)
            .andReturn()
        assertTrue(unauthorized.response.contentAsString.contains("\"message\":\"Authentication is required\""))

        val registration = mvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""{"name":"Integration User","email":"integration@example.com","password":"password123"}"""))
            .andExpect(status().isCreated)
            .andReturn()
        val token = Regex("\"token\":\"([^\"]+)\"").find(registration.response.contentAsString)?.groupValues?.get(1)
            ?: error("Registration response did not contain a token")

        mvc.perform(post("/api/projects")
            .header("Authorization", "Bearer $token")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""{"name":"Integration project","description":"Created by an API test"}"""))
            .andExpect(status().isCreated)
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string(org.hamcrest.Matchers.containsString("Integration project")))

        mvc.perform(get("/api/projects").header("Authorization", "Bearer $token"))
            .andExpect(status().isOk)
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string(org.hamcrest.Matchers.containsString("Integration project")))
    }
}
