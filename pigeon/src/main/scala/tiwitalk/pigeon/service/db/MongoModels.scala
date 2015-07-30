package tiwitalk.pigeon.service.db

import java.util.UUID
import reactivemongo.bson._
import tiwitalk.pigeon.Chat._

object MongoModels {
  implicit object UUIDReader extends BSONHandler[BSONString, UUID] {
    def read(bson: BSONString): UUID =
      UUID.fromString(bson.as[String].toString)
    def write(id: UUID): BSONString = BSONString(id.toString)
  }

  implicit val userMessageHandler = Macros.handler[UserMessage]
  implicit val userProfileHandler = Macros.handler[UserProfile]
  implicit val userAccountHandler = Macros.handler[UserAccount]
  implicit val roomHandler = Macros.handler[Room]
}
