package models

import play.api.libs.json._

case class User(email: String, name: String, referredBy: Option[String])

object Models {
  implicit val userFormat = Json.format[User]
}
