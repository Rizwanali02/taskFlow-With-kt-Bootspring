package taskflow.api

import jakarta.validation.ConstraintViolationException
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.server.ResponseStatusException

class FieldValidationException(val fieldErrors: Map<String, String>) : RuntimeException("Validation failed")

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun validation(exception: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val fields = exception.bindingResult.fieldErrors.associate { error -> error.field to (error.defaultMessage ?: "Invalid value") }
        return ResponseEntity.badRequest().body(ErrorResponse("Validation failed", fields))
    }

    @ExceptionHandler(FieldValidationException::class)
    fun fieldValidation(exception: FieldValidationException) = ResponseEntity.badRequest()
        .body(ErrorResponse("Validation failed", exception.fieldErrors))

    @ExceptionHandler(ResponseStatusException::class)
    fun status(exception: ResponseStatusException): ResponseEntity<ErrorResponse> {
        val status = HttpStatus.valueOf(exception.statusCode.value())
        return ResponseEntity.status(status).body(ErrorResponse(exception.reason ?: "Request failed"))
    }

    @ExceptionHandler(DataIntegrityViolationException::class)
    fun conflict(): ResponseEntity<ErrorResponse> = ResponseEntity.status(HttpStatus.CONFLICT)
        .body(ErrorResponse("A record with these details already exists"))

    @ExceptionHandler(HttpMessageNotReadableException::class, ConstraintViolationException::class)
    fun malformed(): ResponseEntity<ErrorResponse> = ResponseEntity.badRequest().body(ErrorResponse("Request contains an invalid value"))
}
