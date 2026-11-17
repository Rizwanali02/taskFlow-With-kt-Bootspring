package taskflow.security

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.User
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.filter.OncePerRequestFilter
import taskflow.repository.UserRepository
import java.nio.charset.StandardCharsets
import java.util.Date
import javax.crypto.SecretKey

@Configuration
class SecurityConfiguration(private val jwtFilter: JwtAuthenticationFilter, private val objectMapper: ObjectMapper) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain = http
        .csrf { it.disable() }
        .cors { }
        .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
        .authorizeHttpRequests { it.requestMatchers("/api/auth/**", "/error").permitAll().anyRequest().authenticated() }
        .exceptionHandling { it.authenticationEntryPoint { _, response, _ ->
            response.status = HttpStatus.UNAUTHORIZED.value()
            response.contentType = MediaType.APPLICATION_JSON_VALUE
            objectMapper.writeValue(response.outputStream, taskflow.api.ErrorResponse("Authentication is required"))
        } }
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter::class.java)
        .build()

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun corsConfigurationSource(): org.springframework.web.cors.CorsConfigurationSource {
        val configuration = org.springframework.web.cors.CorsConfiguration().apply {
            allowedOrigins = listOf("http://localhost:5173")
            allowedMethods = listOf("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            allowedHeaders = listOf("Authorization", "Content-Type")
        }
        return org.springframework.web.cors.UrlBasedCorsConfigurationSource().also { it.registerCorsConfiguration("/**", configuration) }
    }

}

@Configuration
class JwtConfiguration(@Value("\${app.jwt.secret}") private val secret: String) {
    @Bean
    fun jwtSecretKey(): SecretKey = Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))
}

@org.springframework.stereotype.Component
class JwtService(
    private val jwtSecretKey: SecretKey,
    @Value("\${app.jwt.expiration-ms}") private val expirationMs: Long
) {
    fun createToken(email: String): String {
        val now = Date()
        return Jwts.builder().subject(email).issuedAt(now).expiration(Date(now.time + expirationMs)).signWith(jwtSecretKey).compact()
    }

    fun emailFrom(token: String): String = Jwts.parser().verifyWith(jwtSecretKey).build().parseSignedClaims(token).payload.subject
}

@org.springframework.stereotype.Component
class JwtAuthenticationFilter(private val jwtService: JwtService) : OncePerRequestFilter() {
    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, chain: FilterChain) {
        val header = request.getHeader("Authorization")
        if (header?.startsWith("Bearer ") == true && SecurityContextHolder.getContext().authentication == null) {
            runCatching {
                val email = jwtService.emailFrom(header.substringAfter("Bearer "))
                UsernamePasswordAuthenticationToken(email, null, emptyList())
            }.onSuccess { SecurityContextHolder.getContext().authentication = it }
        }
        chain.doFilter(request, response)
    }
}
