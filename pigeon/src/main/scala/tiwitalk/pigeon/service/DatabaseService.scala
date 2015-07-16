package tiwitalk.pigeon.service

import com.typesafe.config.Config
import java.util.UUID
import reactivemongo.api._
import reactivemongo.bson._
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import tiwitalk.pigeon.Chat._


class DatabaseService(config: Config) {
  implicit object UUIDReader extends BSONHandler[BSONString, UUID] {
    def read(bson: BSONString): UUID =
      UUID.fromString(bson.as[String].toString)
    def write(id: UUID): BSONString = BSONString(id.toString)
  }

  implicit val roomHandler = Macros.handler[Room]
  implicit val userProfileHandler = Macros.handler[UserProfile]

  val driver = new MongoDriver
  val uri = MongoConnection.parseURI(config.getString("mongodbUri")).get
  val connection = driver.connection(uri)

  val db = connection("tiwitalk")
  
  val userCol = db.collection("users")

  def findUserProfile(id: UUID): Future[Option[UserProfile]] = {
    userCol.find(BSONDocument("_id" -> id.toString)).one[UserProfile]
  }

  import userCol.BatchCommands.FindAndModifyCommand.FindAndModifyResult
  def updateUserProfile(p: UserProfile): Future[FindAndModifyResult] = {
    val query = BSONDocument("_id" -> p.id.toString)
    userCol.findAndUpdate(query, p, upsert = true)
  }
}
