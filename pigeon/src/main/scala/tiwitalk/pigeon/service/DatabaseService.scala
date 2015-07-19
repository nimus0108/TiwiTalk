package tiwitalk.pigeon.service

import com.typesafe.config.Config
import java.util.UUID
import reactivemongo.api._
import reactivemongo.bson._
import play.api.libs.iteratee.Iteratee
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
  implicit val userAccountHandler = Macros.handler[UserAccount]

  val driver = new MongoDriver
  val uri = MongoConnection.parseURI(config.getString("mongodbUri")).get
  val connection = driver.connection(uri)

  val db = connection("tiwitalk")
  
  val userCol = db.collection("users")
  val roomCol = db.collection("rooms")

  def watchOplog() {
    val localDb = connection("local")
    val oplog = localDb.collection("oplog.$main")

    oplog
      .find(BSONDocument())
      .options(QueryOpts().tailable.awaitData)
      .cursor[BSONDocument]()
      .enumerate()
      .apply(Iteratee.foreach { l =>
        val opt = l.getAs[BSONDocument]("o") filterNot (_ equals BSONDocument())
        opt foreach { doc =>
          val op = l.getAs[String]("op").get
          // o2 = find query
          // o  = insert/updated object; find query for remove
          println(s"type: $op: ${BSONDocument.pretty(doc)}")
        }
      })
  }

  // watchOplog()

  def findUserAccount(id: UUID): Future[Option[UserAccount]] = {
    userCol.find(BSONDocument("_id" -> id)).one[UserAccount]
  }

  def findUserProfile(id: UUID): Future[Option[UserProfile]] = {
    val query = BSONDocument("_id" -> id)
    val fields = BSONDocument("profile" -> 1)
    userCol.find(query, fields).one[BSONDocument].map { docOpt =>
      docOpt map { doc =>
        doc.getAs[UserProfile]("profile").get
      }
    }
  }

  import userCol.BatchCommands.FindAndModifyCommand.FindAndModifyResult
  def updateUserAccount(a: UserAccount): Future[FindAndModifyResult] = {
    val query = BSONDocument("_id" -> a.id)
    userCol.findAndUpdate(query, a, upsert = true)
  }

  def updateUserProfile(p: UserProfile): Future[Option[UserAccount]] = {
    val query = BSONDocument("_id" -> p.id)
    val upd = BSONDocument("$set" -> BSONDocument("profile" -> p))
    val f = userCol.findAndUpdate(query, upd, fetchNewObject = true)
    f.map(_.result[UserAccount])
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
