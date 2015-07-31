package models

import java.util.UUID
import play.api.libs.json._

case class User(
    email: String,
    name: String,
    accessCode: UUID,
    referredBy: Option[String])

case class Token(email: String, token: UUID, created: Long)

object Models {
  implicit val userFormat = Json.format[User]
  implicit val tokenFormat = Json.format[Token]
}
