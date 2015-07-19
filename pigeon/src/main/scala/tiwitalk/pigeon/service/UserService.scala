package tiwitalk.pigeon.service

import akka.actor.{ ActorRef, ActorSystem }
import akka.event.{ EventBus, LookupClassification }
import java.util.UUID
import scala.concurrent.Future
import scala.concurrent.duration._
import scalacache._
import tiwitalk.pigeon.Chat.{ UserAccount, UserProfile, UpdateUserAccount }

class UserService(db: DatabaseService)(implicit cache: ScalaCache,
    system: ActorSystem) extends EventBus with LookupClassification {

  import system.dispatcher

  def fetchUserAccount(id: UUID): Future[Option[UserAccount]] = {
    get[UserAccount]("USER-" + id) flatMap {
      case Some(u) => Future.successful(Some(u))
      case None =>
        db.findUserAccount(id) flatMap {
          case o @ Some(p) =>
            publish(UpdateUserAccount(p))
            put("USER-" + p.id)(p, ttl = Some(1.minute)) map (_ => o)
          case None => Future.successful(None)
        }
    }
  }

  def fetchUserProfile(id: UUID): Future[Option[UserProfile]] = {
    fetchUserAccount(id) map {
      case Some(u) => Some(u.profile)
      case None => None
    }
  }

  def fetchUserAccounts(ids: Seq[UUID]): Future[Seq[UserAccount]] = {
    // TODO: batch requests to DB
    Future.sequence(ids map fetchUserAccount) map { profs =>
      profs collect { case Some(x) => x }
    }
  }

  def fetchUserProfiles(ids: Seq[UUID]): Future[Seq[UserProfile]] = {
    Future.sequence(ids map fetchUserProfile) map { profs =>
      profs collect { case Some(x) => x }
    }
  }

  def updateUserAccount(newData: UserAccount): Future[Unit] = {
    val dbFut = db.updateUserAccount(newData)
    val cacheFut = put("USER-" + newData.id)(newData, ttl = Some(1.minute))
    for {
      _ <- dbFut
      _ <- cacheFut
    } yield publish(UpdateUserAccount(newData))
  }

  def updateUserProfile(newData: UserProfile): Future[Unit] = {
    for {
      account <- db.updateUserProfile(newData).collect { case Some(a) => a }
      _ <- put("USER-" + account.id)(account, ttl = Some(1.minute))
    } yield publish(UpdateUserAccount(account))
  }

  def uncacheUserAccount(id: UUID): Future[Unit] = {
    val f = remove("USER-" + id)
    f onFailure { case e => e.printStackTrace() }
    f
  }

  def fetchRef(id: UUID): Future[Option[ActorRef]] = {
    get[ActorRef]("REF-" + id)
  }

  def fetchRefs(ids: Seq[UUID]): Future[Seq[(UUID, ActorRef)]] = {
    val fut = ids map { id =>
      fetchRef(id) map (_ map (id -> _))
    }
    Future.sequence(fut) map { idkp =>
      idkp collect { case Some(x) => x}
    }
  }

  def updateRef(id: UUID, ref: ActorRef): Future[Unit] = put("REF-" + id)(ref)

  def removeRef(id: UUID): Future[Unit] = remove("REF-" + id)

  type Event = UpdateUserAccount
  type Subscriber = ActorRef
  type Classifier = UUID

  override protected def classify(event: Event) = event.data.id

  override protected def publish(event: Event, sub: Subscriber) = sub ! event

  override protected def compareSubscribers(a: Subscriber, b: Subscriber) = {
    a compareTo b
  }

  override protected def mapSize = 128
}
