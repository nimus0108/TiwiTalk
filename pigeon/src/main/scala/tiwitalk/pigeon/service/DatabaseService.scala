package tiwitalk.pigeon.service

import com.typesafe.config.Config
import java.util.UUID
import reactivemongo.api._
import reactivemongo.api.indexes.{ Index, IndexType }
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

  def idQuery(id: UUID) = BSONDocument("_id" -> id)

  def init(): Future[Unit] = {
    val emailUnique = userCol.indexesManager.ensure(
      new Index(Seq("email" -> IndexType.Ascending), unique = true))
    emailUnique map (_ => ())
  }

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

  /**
   * @param id The id of the user.
   * @return An [[scala.Option]] of the [[tiwitalk.pigeon.Chat.UserAccount]]
   * associated with the given ID.
   */
  def findUserAccount(id: UUID): Future[Option[UserAccount]] = {
    userCol.find(BSONDocument("_id" -> id)).one[UserAccount]
  }

  /**
   * @param email The email address of the user.
   * @return An [[scala.Option]] of the [[tiwitalk.pigeon.Chat.UserAccount]]
   * associated with the given email address.
   */
  def findUserAccountByEmail(email: String): Future[Option[UserAccount]] = {
    userCol.find(BSONDocument("email" -> email)).one[UserAccount]
  }

  def findUserProfile(id: UUID): Future[Option[UserProfile]] = {
    val fields = BSONDocument("profile" -> 1)
    userCol.find(idQuery(id), fields).one[BSONDocument].map { docOpt =>
      docOpt map { doc =>
        doc.getAs[UserProfile]("profile").get
      }
    }
  }

  def createUserAccount(a: UserAccount): Future[Unit] = {
    userCol.insert(a) map (_ => ())
  }

  import userCol.BatchCommands.FindAndModifyCommand.FindAndModifyResult
  def updateUserAccount(a: UserAccount): Future[FindAndModifyResult] = {
    userCol.findAndUpdate(idQuery(a.id), a, upsert = true)
  }

  def updateUserProfile(p: UserProfile): Future[Option[UserAccount]] = {
    val upd = BSONDocument("$set" -> BSONDocument("profile" -> p))
    val f = userCol.findAndUpdate(idQuery(p.id), upd, fetchNewObject = true)
    f.map(_.result[UserAccount])
  }

  def findRoom(id: UUID): Future[Option[Room]] = {
    roomCol.find(idQuery(id)).cursor[Room]().headOption
  }

  def addUsersToRoom(id: UUID, users: Seq[UUID]): Future[Room] = {
    val upd =
      BSONDocument("$addToSet" ->
        BSONDocument("users" ->
          BSONDocument("$each" -> users)))
    val res = roomCol.findAndUpdate(idQuery(id), upd, fetchNewObject = true)

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
    roomCol
      .findAndUpdate(idQuery(r.id), r, fetchNewObject = true, upsert = true)
      .map(_.result[Room])
      .collect { case Some(r) => r }
  }

  def findRoomsWithUser(id: UUID): Future[Seq[Room]] = {
    val query = BSONDocument("users" -> BSONDocument("$in" -> BSONArray(id)))
    roomCol.find(query).cursor[Room]().collect[Seq]()
  }

  def searchUsersByName(name: String): Future[Seq[UserAccount]] = {
    val query = BSONDocument("profile.name" -> BSONRegex(name, "i"))
    userCol.find(query).cursor[UserAccount]().collect[Seq]()
  }

  def modifyContacts(id: UUID, add: Seq[UUID],
                     remove: Seq[UUID]): Future[Option[UserAccount]] = {
    val query = idQuery(id)
    val addQuery =
      BSONDocument("$addToSet" ->
        BSONDocument("contacts" ->
          BSONDocument("$each" -> add)))
    val rmQuery = BSONDocument("$pullAll" -> BSONDocument("contacts" -> remove))
    for {
      _   <- userCol.update(query, rmQuery)
      res <- userCol.findAndUpdate(query, addQuery, fetchNewObject = true)
    } yield {
      res.result[UserAccount]
    }
  }

  def setUserStatus(id: UUID, status: String): Future[Option[UserAccount]] = {
    val upd = BSONDocument("$set" -> BSONDocument("profile.status" -> status))
    userCol.findAndUpdate(idQuery(id), upd, fetchNewObject = true) map { r =>
      r.result[UserAccount]
    }
  }
}
