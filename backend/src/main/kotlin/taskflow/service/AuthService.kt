package taskflow.service

import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import taskflow.api.*
import taskflow.repository.UserRepository
import taskflow.security.JwtService
import taskflow.model.UserEntity

@Service
class AuthService(private val users: UserRepository, private val encoder: PasswordEncoder, private val jwt: JwtService) {
    fun register(request: RegisterRequest): AuthResponse {
        val email = request.email.trim().lowercase()
        if (users.existsByEmail(email)) throw ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered")
        val user = users.save(UserEntity(name = request.name.trim(), email = email, password = encoder.encode(request.password)))
        return AuthResponse(jwt.createToken(email), user.toDto())
    }

    fun login(request: LoginRequest): AuthResponse {
        val user = users.findByEmail(request.email.trim().lowercase())
        if (user == null || !encoder.matches(request.password, user.password)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect")
        }
        return AuthResponse(jwt.createToken(user.email), user.toDto())
    }
}
