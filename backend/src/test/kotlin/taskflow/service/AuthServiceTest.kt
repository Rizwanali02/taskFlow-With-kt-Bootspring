package taskflow.service

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.security.crypto.password.PasswordEncoder
import taskflow.api.LoginRequest
import taskflow.api.RegisterRequest
import taskflow.model.UserEntity
import taskflow.repository.UserRepository
import taskflow.security.JwtService

class AuthServiceTest {
    private val users = mockk<UserRepository>()
    private val encoder = mockk<PasswordEncoder>()
    private val jwt = mockk<JwtService>()
    private val service = AuthService(users, encoder, jwt)

    @Test
    fun `register normalizes email and stores only encoded password`() {
        val input = RegisterRequest("Asha", " ASHA@example.com ", "secret123")
        every { users.existsByEmail("asha@example.com") } returns false
        every { encoder.encode("secret123") } returns "hashed"
        every { users.save(any()) } answers { firstArg<UserEntity>().apply { id = 7 } }
        every { jwt.createToken("asha@example.com") } returns "token"

        val result = service.register(input)

        assertEquals("asha@example.com", result.user.email)
        assertEquals("token", result.token)
        verify { users.save(match { it.password == "hashed" && it.email == "asha@example.com" }) }
    }

    @Test
    fun `login returns a token for valid credentials`() {
        every { users.findByEmail("asha@example.com") } returns UserEntity(id = 7, name = "Asha", email = "asha@example.com", password = "hashed")
        every { encoder.matches("secret123", "hashed") } returns true
        every { jwt.createToken("asha@example.com") } returns "token"

        assertEquals("token", service.login(LoginRequest("asha@example.com", "secret123")).token)
    }
}
