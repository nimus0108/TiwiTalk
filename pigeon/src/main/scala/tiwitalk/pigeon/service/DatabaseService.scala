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
  val roomCol = db.collection("rooms")

  def findUserProfile(id: UUID): Future[Option[UserProfile]] = {
    userCol.find(BSONDocument("_id" -> id)).one[UserProfile]
  }

  import userCol.BatchCommands.FindAndModifyCommand.FindAndModifyResult
  def updateUserProfile(p: UserProfile): Future[FindAndModifyResult] = {
    val query = BSONDocument("_id" -> p.id)
    userCol.findAndUpdate(query, p, upsert = true)
  }

  def findRoom(id: UUID): Future[Option[Room]] = {
    roomCol.find(BSONDocument("_id" -> id)).cursor[Room]().headOption
  }

  def addUsersToRoom(id: UUID, users: Seq[UUID]): Future[Room] = {
    val query = BSONDocument("_id" -> id)
    val upd =
      BSONDocument("$addToSet" ->
        BSONDocument("users" ->
          BSONDocument("$each" -> users)))
    val res = roomCol.findAndUpdate(query, upd, fetchNewObject = true)

    val usrQry = BSONDocument("_id" -> BSONDocument("$in" -> users))
    val usrUpd = BSONDocument("$addToSet" -> BSONDocument("rooms" -> id))
    val usrFut = userCol.update(usrQry, usrUpd, multi = true)
    val resFut = res.map(_.result[Room]).collect { case Some(r) => r }
    for {
      _ <- usrFut
      r <- resFut
    } yield r
  }
  
  def updateRoom(r: Room): Future[Room] = {
    val query = BSONDocument("_id" -> r.id)
    roomCol
      .findAndUpdate(query, r, fetchNewObject = true, upsert = true)
      .map(_.result[Room])
      .collect { case Some(r) => r }
  }

  def findRoomsWithUser(id: UUID): Future[Seq[Room]] = {
    val query = BSONDocument("users" -> BSONDocument("$in" -> BSONArray(id)))
    roomCol.find(query).cursor[Room]().collect[Seq]()
  }
}
